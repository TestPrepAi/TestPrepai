from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import re
import json
import logging
import uuid
import jwt
import bcrypt
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Literal, Dict, Any
from datetime import datetime, timezone, timedelta

from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
JWT_SECRET = os.environ['JWT_SECRET']
EMERGENT_LLM_KEY = os.environ['EMERGENT_LLM_KEY']
RAZORPAY_PAYMENT_LINK = os.environ.get('RAZORPAY_PAYMENT_LINK', 'https://rzp.io/l/testprep-ai')

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="JEE/NEET Mock Test AI")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

FREE_QUESTION_LIMIT = 5
SUBSCRIPTION_DAYS = 28

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)


# ============ Models ============
class RegisterInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=1)


class LoginInput(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    token: str
    user: Dict[str, Any]


class UserPublic(BaseModel):
    id: str
    email: str
    name: str
    questions_used: int
    subscription_expires_at: Optional[str] = None
    is_subscribed: bool


class GenerateTestInput(BaseModel):
    exam: Literal["jee_main", "jee_advanced", "neet"]
    subjects: List[Literal["physics", "chemistry", "mathematics", "biology"]]
    difficulty: Literal["easy", "medium", "hard", "mixed"] = "mixed"
    num_questions: int = Field(ge=1, le=30, default=10)
    topics: Optional[str] = None


class QuestionModel(BaseModel):
    id: str
    subject: str
    text: str
    options: List[str]  # length 4
    correct_index: int
    explanation: str
    difficulty: str


class TestOut(BaseModel):
    id: str
    exam: str
    subjects: List[str]
    difficulty: str
    duration_seconds: int
    questions: List[Dict[str, Any]]  # options + text (no answer)
    created_at: str


class SubmitAnswer(BaseModel):
    question_id: str
    selected_index: Optional[int] = None  # None = skipped
    time_spent_seconds: int = 0


class SubmitInput(BaseModel):
    test_id: str
    answers: List[SubmitAnswer]
    total_time_seconds: int = 0


class ActivateSubInput(BaseModel):
    payment_reference: str = Field(min_length=3)


class OnboardingInput(BaseModel):
    coaching_enrolled: bool
    coaching_name: Optional[str] = None
    target_exam: Literal["jee_main", "jee_advanced", "neet"]
    target_exam_date: str  # ISO date YYYY-MM-DD


class DailyTaskInput(BaseModel):
    topic: str = Field(min_length=2, max_length=200)
    subject: Literal["physics", "chemistry", "mathematics", "biology"]
    num_questions: int = Field(ge=3, le=10, default=5)


# ============ Helpers ============
def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def iso(dt: datetime) -> str:
    return dt.isoformat()


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def create_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "iat": int(now_utc().timestamp()),
        "exp": int((now_utc() + timedelta(days=30)).timestamp()),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


async def get_current_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    if creds is None:
        raise HTTPException(401, "Missing token")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=["HS256"])
        user_id = payload["sub"]
    except Exception:
        raise HTTPException(401, "Invalid token")
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(401, "User not found")
    return user


def user_is_subscribed(user: dict) -> bool:
    exp = user.get("subscription_expires_at")
    if not exp:
        return False
    try:
        return datetime.fromisoformat(exp) > now_utc()
    except Exception:
        return False


def user_public(user: dict) -> dict:
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "questions_used": user.get("questions_used", 0),
        "subscription_expires_at": user.get("subscription_expires_at"),
        "is_subscribed": user_is_subscribed(user),
        "onboarded": user.get("onboarded", False),
        "coaching_enrolled": user.get("coaching_enrolled"),
        "coaching_name": user.get("coaching_name"),
        "target_exam": user.get("target_exam"),
        "target_exam_date": user.get("target_exam_date"),
    }


# ============ LLM Question Generation ============
async def generate_questions_with_llm(inp: GenerateTestInput) -> List[dict]:
    exam_label = {
        "jee_main": "JEE Main (Indian engineering entrance)",
        "jee_advanced": "JEE Advanced (IIT entrance, harder conceptual)",
        "neet": "NEET (Indian medical entrance)",
    }[inp.exam]
    subjects_str = ", ".join(s.capitalize() for s in inp.subjects)
    topic_hint = f"Focus on topics: {inp.topics}." if inp.topics else "Mix across common syllabus topics."

    system = (
        "You are an expert Indian competitive exam question setter for JEE and NEET. "
        "You create high-quality, syllabus-accurate multiple-choice questions with 4 options and "
        "clear step-by-step explanations. Output STRICT JSON only, no markdown, no prose."
    )
    prompt = f"""Generate exactly {inp.num_questions} multiple-choice questions for {exam_label}.
Subjects to cover (distribute roughly evenly): {subjects_str}.
Difficulty: {inp.difficulty}.
{topic_hint}

Return a JSON object with this exact schema:
{{
  "questions": [
    {{
      "subject": "physics|chemistry|mathematics|biology",
      "text": "Question stem (use plain text; you may use LaTeX-like $...$ for formulas)",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_index": 0,
      "explanation": "Step-by-step solution explaining why the correct option is right",
      "difficulty": "easy|medium|hard"
    }}
  ]
}}

Rules:
- Exactly 4 options per question.
- correct_index is 0-3.
- Do NOT include the answer letter inside the option text.
- Do NOT wrap the JSON in markdown fences.
"""

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"gen-{uuid.uuid4()}",
        system_message=system,
    ).with_model("openai", "gpt-5.6-terra")

    resp = await chat.send_message(UserMessage(text=prompt))
    raw = resp if isinstance(resp, str) else str(resp)

    # strip markdown fences if any
    raw = raw.strip()
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?", "", raw).strip()
        if raw.endswith("```"):
            raw = raw[:-3].strip()

    try:
        parsed = json.loads(raw)
    except Exception as e:
        logger.error(f"LLM JSON parse failed: {e}\nRaw: {raw[:500]}")
        raise HTTPException(502, "Failed to parse AI response. Please retry.")

    qs = parsed.get("questions", [])
    if not qs:
        raise HTTPException(502, "AI returned no questions.")

    out = []
    for q in qs:
        opts = q.get("options", [])
        if len(opts) != 4:
            continue
        ci = int(q.get("correct_index", 0))
        if ci < 0 or ci > 3:
            ci = 0
        out.append({
            "id": str(uuid.uuid4()),
            "subject": q.get("subject", inp.subjects[0]),
            "text": q.get("text", "").strip(),
            "options": opts,
            "correct_index": ci,
            "explanation": q.get("explanation", "").strip(),
            "difficulty": q.get("difficulty", inp.difficulty if inp.difficulty != "mixed" else "medium"),
        })
    if not out:
        raise HTTPException(502, "AI response had no valid questions.")
    return out


# ============ Routes ============
@api_router.get("/")
async def root():
    return {"message": "JEE/NEET Mock Test API", "razorpay_link": RAZORPAY_PAYMENT_LINK}


@api_router.post("/auth/register", response_model=TokenOut)
async def register(inp: RegisterInput):
    existing = await db.users.find_one({"email": inp.email.lower()})
    if existing:
        raise HTTPException(400, "Email already registered")
    user = {
        "id": str(uuid.uuid4()),
        "email": inp.email.lower(),
        "name": inp.name.strip(),
        "password_hash": hash_password(inp.password),
        "questions_used": 0,
        "subscription_expires_at": None,
        "created_at": iso(now_utc()),
    }
    await db.users.insert_one(user)
    token = create_token(user["id"])
    return {"token": token, "user": user_public(user)}


@api_router.post("/auth/login", response_model=TokenOut)
async def login(inp: LoginInput):
    user = await db.users.find_one({"email": inp.email.lower()}, {"_id": 0})
    if not user or not verify_password(inp.password, user["password_hash"]):
        raise HTTPException(401, "Invalid credentials")
    token = create_token(user["id"])
    return {"token": token, "user": user_public(user)}


@api_router.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return {"user": user_public(user)}


@api_router.get("/subscription/status")
async def sub_status(user=Depends(get_current_user)):
    return {
        "is_subscribed": user_is_subscribed(user),
        "expires_at": user.get("subscription_expires_at"),
        "questions_used": user.get("questions_used", 0),
        "free_limit": FREE_QUESTION_LIMIT,
        "razorpay_link": RAZORPAY_PAYMENT_LINK,
    }


@api_router.post("/subscription/activate")
async def activate_sub(inp: ActivateSubInput, user=Depends(get_current_user)):
    # For MVP with static Razorpay link: user submits their payment reference/ID after paying.
    # In production, verify via Razorpay webhook. Here we accept and record it.
    expires = now_utc() + timedelta(days=SUBSCRIPTION_DAYS)
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"subscription_expires_at": iso(expires)}},
    )
    await db.payments.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "reference": inp.payment_reference.strip(),
        "amount_inr": 49,
        "days": SUBSCRIPTION_DAYS,
        "created_at": iso(now_utc()),
    })
    fresh = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    return {"user": user_public(fresh)}


@api_router.post("/tests/generate", response_model=TestOut)
async def generate_test(inp: GenerateTestInput, user=Depends(get_current_user)):
    # Enforce free question limit
    is_sub = user_is_subscribed(user)
    used = user.get("questions_used", 0)
    if not is_sub:
        remaining = FREE_QUESTION_LIMIT - used
        if remaining <= 0:
            raise HTTPException(402, "Free question limit reached. Please subscribe.")
        # Cap questions to remaining free
        if inp.num_questions > remaining:
            inp.num_questions = remaining

    questions = await generate_questions_with_llm(inp)

    # Duration heuristic: 90s per question
    duration = len(questions) * 90

    test_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "exam": inp.exam,
        "subjects": inp.subjects,
        "difficulty": inp.difficulty,
        "duration_seconds": duration,
        "questions": questions,  # includes answers (stored server-side)
        "created_at": iso(now_utc()),
    }
    await db.tests.insert_one(test_doc)

    # Increment questions_used if free
    if not is_sub:
        await db.users.update_one(
            {"id": user["id"]},
            {"$inc": {"questions_used": len(questions)}},
        )

    # Strip answers for client
    client_qs = [
        {"id": q["id"], "subject": q["subject"], "text": q["text"],
         "options": q["options"], "difficulty": q["difficulty"]}
        for q in questions
    ]
    return TestOut(
        id=test_doc["id"],
        exam=inp.exam,
        subjects=inp.subjects,
        difficulty=inp.difficulty,
        duration_seconds=duration,
        questions=client_qs,
        created_at=test_doc["created_at"],
    )


@api_router.get("/tests/{test_id}")
async def get_test(test_id: str, user=Depends(get_current_user)):
    t = await db.tests.find_one({"id": test_id, "user_id": user["id"]}, {"_id": 0})
    if not t:
        raise HTTPException(404, "Test not found")
    client_qs = [
        {"id": q["id"], "subject": q["subject"], "text": q["text"],
         "options": q["options"], "difficulty": q["difficulty"]}
        for q in t["questions"]
    ]
    return {
        "id": t["id"], "exam": t["exam"], "subjects": t["subjects"],
        "difficulty": t["difficulty"], "duration_seconds": t["duration_seconds"],
        "questions": client_qs, "created_at": t["created_at"],
    }


@api_router.post("/tests/submit")
async def submit_test(inp: SubmitInput, user=Depends(get_current_user)):
    t = await db.tests.find_one({"id": inp.test_id, "user_id": user["id"]}, {"_id": 0})
    if not t:
        raise HTTPException(404, "Test not found")

    q_map = {q["id"]: q for q in t["questions"]}
    ans_map = {a.question_id: a for a in inp.answers}

    details = []
    correct = 0
    attempted = 0
    subject_stats: Dict[str, Dict[str, int]] = {}

    for q in t["questions"]:
        a = ans_map.get(q["id"])
        selected = a.selected_index if a else None
        time_spent = a.time_spent_seconds if a else 0
        is_correct = selected is not None and selected == q["correct_index"]
        if selected is not None:
            attempted += 1
        if is_correct:
            correct += 1
        subj = q["subject"]
        s = subject_stats.setdefault(subj, {"total": 0, "correct": 0, "attempted": 0, "time": 0})
        s["total"] += 1
        s["correct"] += 1 if is_correct else 0
        s["attempted"] += 1 if selected is not None else 0
        s["time"] += time_spent
        details.append({
            "question_id": q["id"],
            "subject": subj,
            "text": q["text"],
            "options": q["options"],
            "correct_index": q["correct_index"],
            "selected_index": selected,
            "is_correct": is_correct,
            "explanation": q["explanation"],
            "time_spent_seconds": time_spent,
            "difficulty": q["difficulty"],
        })

    total = len(t["questions"])
    score_pct = round((correct / total) * 100, 2) if total else 0

    attempt = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "test_id": t["id"],
        "exam": t["exam"],
        "subjects": t["subjects"],
        "total": total,
        "correct": correct,
        "attempted": attempted,
        "score_pct": score_pct,
        "total_time_seconds": inp.total_time_seconds,
        "subject_stats": subject_stats,
        "details": details,
        "created_at": iso(now_utc()),
    }
    await db.attempts.insert_one(attempt)
    return {
        "id": attempt["id"],
        "total": total, "correct": correct, "attempted": attempted,
        "score_pct": score_pct, "subject_stats": subject_stats,
        "details": details, "exam": t["exam"], "created_at": attempt["created_at"],
    }


@api_router.get("/attempts/{attempt_id}")
async def get_attempt(attempt_id: str, user=Depends(get_current_user)):
    a = await db.attempts.find_one({"id": attempt_id, "user_id": user["id"]}, {"_id": 0})
    if not a:
        raise HTTPException(404, "Attempt not found")
    return a


@api_router.get("/attempts")
async def list_attempts(user=Depends(get_current_user)):
    cursor = db.attempts.find(
        {"user_id": user["id"]},
        {"_id": 0, "details": 0}
    ).sort("created_at", -1).limit(50)
    return {"attempts": await cursor.to_list(50)}


@api_router.get("/analytics/summary")
async def analytics(user=Depends(get_current_user)):
    cursor = db.attempts.find({"user_id": user["id"]}, {"_id": 0, "details": 0})
    attempts = await cursor.to_list(500)
    if not attempts:
        return {
            "total_attempts": 0, "avg_score": 0, "total_questions": 0,
            "total_correct": 0, "subject_breakdown": [], "trend": [],
            "exam_breakdown": [],
        }
    total_q = sum(a["total"] for a in attempts)
    total_c = sum(a["correct"] for a in attempts)
    avg = round(sum(a["score_pct"] for a in attempts) / len(attempts), 2)

    subj_agg: Dict[str, Dict[str, int]] = {}
    for a in attempts:
        for subj, s in (a.get("subject_stats") or {}).items():
            agg = subj_agg.setdefault(subj, {"total": 0, "correct": 0, "attempted": 0})
            agg["total"] += s["total"]
            agg["correct"] += s["correct"]
            agg["attempted"] += s["attempted"]
    subj_break = [
        {"subject": k, **v, "accuracy": round((v["correct"] / v["total"]) * 100, 1) if v["total"] else 0}
        for k, v in subj_agg.items()
    ]

    exam_agg: Dict[str, Dict[str, Any]] = {}
    for a in attempts:
        e = exam_agg.setdefault(a["exam"], {"count": 0, "score_sum": 0.0})
        e["count"] += 1
        e["score_sum"] += a["score_pct"]
    exam_break = [
        {"exam": k, "count": v["count"], "avg_score": round(v["score_sum"] / v["count"], 1)}
        for k, v in exam_agg.items()
    ]

    trend = sorted(
        [{"date": a["created_at"][:10], "score": a["score_pct"], "exam": a["exam"]} for a in attempts],
        key=lambda x: x["date"],
    )[-20:]

    return {
        "total_attempts": len(attempts),
        "avg_score": avg,
        "total_questions": total_q,
        "total_correct": total_c,
        "subject_breakdown": subj_break,
        "exam_breakdown": exam_break,
        "trend": trend,
    }


@api_router.post("/user/onboarding")
async def onboarding(inp: OnboardingInput, user=Depends(get_current_user)):
    update = {
        "onboarded": True,
        "coaching_enrolled": inp.coaching_enrolled,
        "coaching_name": (inp.coaching_name or "").strip() or None,
        "target_exam": inp.target_exam,
        "target_exam_date": inp.target_exam_date,
    }
    await db.users.update_one({"id": user["id"]}, {"$set": update})
    fresh = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    return {"user": user_public(fresh)}


@api_router.get("/daily/today")
async def daily_today(user=Depends(get_current_user)):
    today = now_utc().date().isoformat()
    doc = await db.daily_tasks.find_one(
        {"user_id": user["id"], "date": today}, {"_id": 0}
    )
    return {"task": doc}


@api_router.post("/daily/generate", response_model=TestOut)
async def daily_generate(inp: DailyTaskInput, user=Depends(get_current_user)):
    # Validate subject vs user's target exam
    target = user.get("target_exam") or "jee_main"
    allowed = {
        "jee_main": {"physics", "chemistry", "mathematics"},
        "jee_advanced": {"physics", "chemistry", "mathematics"},
        "neet": {"physics", "chemistry", "biology"},
    }[target]
    if inp.subject not in allowed:
        raise HTTPException(400, f"Subject '{inp.subject}' not valid for {target}")

    # Reuse generation logic
    is_sub = user_is_subscribed(user)
    used = user.get("questions_used", 0)
    num = inp.num_questions
    if not is_sub:
        remaining = FREE_QUESTION_LIMIT - used
        if remaining <= 0:
            raise HTTPException(402, "Free question limit reached. Please subscribe.")
        if num > remaining:
            num = remaining

    gen_input = GenerateTestInput(
        exam=target,  # type: ignore
        subjects=[inp.subject],
        difficulty="mixed",
        num_questions=num,
        topics=inp.topic,
    )
    questions = await generate_questions_with_llm(gen_input)
    duration = len(questions) * 90

    test_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "exam": target,
        "subjects": [inp.subject],
        "difficulty": "mixed",
        "duration_seconds": duration,
        "questions": questions,
        "created_at": iso(now_utc()),
        "source": "daily",
        "topic": inp.topic,
    }
    await db.tests.insert_one(test_doc)

    today = now_utc().date().isoformat()
    await db.daily_tasks.update_one(
        {"user_id": user["id"], "date": today},
        {"$set": {
            "user_id": user["id"],
            "date": today,
            "topic": inp.topic,
            "subject": inp.subject,
            "test_id": test_doc["id"],
            "created_at": iso(now_utc()),
        }},
        upsert=True,
    )

    if not is_sub:
        await db.users.update_one(
            {"id": user["id"]},
            {"$inc": {"questions_used": len(questions)}},
        )

    client_qs = [
        {"id": q["id"], "subject": q["subject"], "text": q["text"],
         "options": q["options"], "difficulty": q["difficulty"]}
        for q in questions
    ]
    return TestOut(
        id=test_doc["id"],
        exam=target,
        subjects=[inp.subject],
        difficulty="mixed",
        duration_seconds=duration,
        questions=client_qs,
        created_at=test_doc["created_at"],
    )


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
