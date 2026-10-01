"""Phase 2 backend tests: Razorpay webhook, streak, mistake notebook."""
import os
import time
import json
import hmac
import hashlib
import uuid
import requests
import pytest

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://study-vault-jee.preview.emergentagent.com').rstrip('/')
WEBHOOK_SECRET = "trackprep_dev_webhook_secret"


def _sign(body_bytes: bytes) -> str:
    return hmac.new(WEBHOOK_SECRET.encode(), body_bytes, hashlib.sha256).hexdigest()


def _webhook_body(payment_id: str, email: str, amount: int = 4900, event: str = "payment.captured"):
    return {
        "event": event,
        "payload": {"payment": {"entity": {
            "id": payment_id, "amount": amount, "currency": "INR",
            "email": email, "contact": "+919999999999", "order_id": "order_1", "notes": {},
        }}}
    }


def _register(email_prefix="webhook"):
    ts = int(time.time() * 1000)
    email = f"{email_prefix}_{ts}_{uuid.uuid4().hex[:6]}@test.io"
    r = requests.post(f"{BASE_URL}/api/auth/register", json={
        "email": email, "password": "password123", "name": "Phase2 Tester",
    }, timeout=20)
    assert r.status_code == 200, r.text
    return email, r.json()["token"]


def _me(token):
    return requests.get(f"{BASE_URL}/api/auth/me",
                        headers={"Authorization": f"Bearer {token}"}, timeout=20).json()["user"]


# ============ Razorpay Webhook ============
class TestRazorpayWebhook:
    def test_bad_signature_returns_400(self):
        body = json.dumps(_webhook_body(f"pay_{uuid.uuid4().hex[:10]}", "x@test.io")).encode()
        r = requests.post(f"{BASE_URL}/api/payments/razorpay/webhook",
                          data=body, headers={"X-Razorpay-Signature": "deadbeef",
                                              "Content-Type": "application/json"}, timeout=20)
        assert r.status_code == 400

    def test_unknown_event_ignored(self):
        body = json.dumps(_webhook_body(f"pay_{uuid.uuid4().hex[:10]}", "x@test.io",
                                        event="payment.failed")).encode()
        r = requests.post(f"{BASE_URL}/api/payments/razorpay/webhook",
                          data=body, headers={"X-Razorpay-Signature": _sign(body),
                                              "Content-Type": "application/json"}, timeout=20)
        assert r.status_code == 200
        assert r.json()["status"] == "ignored"

    def test_underpaid(self):
        body = json.dumps(_webhook_body(f"pay_{uuid.uuid4().hex[:10]}", "x@test.io",
                                        amount=100)).encode()
        r = requests.post(f"{BASE_URL}/api/payments/razorpay/webhook",
                          data=body, headers={"X-Razorpay-Signature": _sign(body),
                                              "Content-Type": "application/json"}, timeout=20)
        assert r.status_code == 200
        assert r.json()["status"] == "underpaid"

    def test_unknown_email_then_claim(self):
        # Unknown email -> unmatched
        pay_id = f"pay_unmatched_{uuid.uuid4().hex[:10]}"
        unknown_email = f"nobody_{uuid.uuid4().hex[:6]}@test.io"
        body = json.dumps(_webhook_body(pay_id, unknown_email)).encode()
        r = requests.post(f"{BASE_URL}/api/payments/razorpay/webhook",
                          data=body, headers={"X-Razorpay-Signature": _sign(body),
                                              "Content-Type": "application/json"}, timeout=20)
        assert r.status_code == 200
        assert r.json()["status"] == "unmatched"

        # Register a user and claim via activate
        email, token = _register("claimer")
        r2 = requests.post(f"{BASE_URL}/api/subscription/activate",
                           json={"payment_reference": pay_id},
                           headers={"Authorization": f"Bearer {token}"}, timeout=20)
        assert r2.status_code == 200, r2.text
        user = r2.json()["user"]
        assert user["is_subscribed"] is True
        # Verify payments list contains it
        pm = requests.get(f"{BASE_URL}/api/payments/mine",
                          headers={"Authorization": f"Bearer {token}"}, timeout=20).json()
        found = [p for p in pm["payments"] if p.get("razorpay_payment_id") == pay_id]
        assert found, f"claimed payment not in /payments/mine: {pm}"
        assert found[0]["status"] == "claimed"

    def test_activate_and_duplicate_and_extend(self):
        email, token = _register("activator")

        pay_id = f"pay_act_{uuid.uuid4().hex[:10]}"
        body = json.dumps(_webhook_body(pay_id, email)).encode()
        r = requests.post(f"{BASE_URL}/api/payments/razorpay/webhook",
                          data=body, headers={"X-Razorpay-Signature": _sign(body),
                                              "Content-Type": "application/json"}, timeout=20)
        assert r.status_code == 200, r.text
        assert r.json()["status"] == "activated"
        expires_1 = r.json()["expires_at"]

        me = _me(token)
        assert me["is_subscribed"] is True
        assert me["subscription_expires_at"] == expires_1

        # Duplicate same payment id -> no extension
        r_dup = requests.post(f"{BASE_URL}/api/payments/razorpay/webhook",
                              data=body, headers={"X-Razorpay-Signature": _sign(body),
                                                  "Content-Type": "application/json"}, timeout=20)
        assert r_dup.status_code == 200
        assert r_dup.json()["status"] == "duplicate"
        me2 = _me(token)
        assert me2["subscription_expires_at"] == expires_1

        # New payment id -> extends by another 28 days
        pay_id2 = f"pay_act2_{uuid.uuid4().hex[:10]}"
        body2 = json.dumps(_webhook_body(pay_id2, email)).encode()
        r_ext = requests.post(f"{BASE_URL}/api/payments/razorpay/webhook",
                              data=body2, headers={"X-Razorpay-Signature": _sign(body2),
                                                   "Content-Type": "application/json"}, timeout=20)
        assert r_ext.status_code == 200
        expires_2 = r_ext.json()["expires_at"]
        assert expires_2 > expires_1  # extended

        # payments/mine returns records
        pm = requests.get(f"{BASE_URL}/api/payments/mine",
                          headers={"Authorization": f"Bearer {token}"}, timeout=20).json()
        ids = {p["razorpay_payment_id"] for p in pm["payments"]}
        assert pay_id in ids and pay_id2 in ids


# ============ Mistake Notebook & Streak ============
class TestNotebookAndStreak:
    def test_daily_test_user_mistakes_and_streak(self):
        # Login seeded user
        r = requests.post(f"{BASE_URL}/api/auth/login",
                          json={"email": "daily_test_user@test.io", "password": "password123"}, timeout=20)
        assert r.status_code == 200, r.text
        token = r.json()["token"]
        H = {"Authorization": f"Bearer {token}"}

        # Mistakes list open=2
        m = requests.get(f"{BASE_URL}/api/mistakes?status_filter=open",
                         headers=H, timeout=20).json()
        assert m["counts"]["open"] >= 2
        for item in m["mistakes"]:
            assert item["mastered"] is False
            assert "correct_index" in item and "selected_index" in item
            assert item["selected_index"] is not None  # skipped must not be added

        # Streak
        s = requests.get(f"{BASE_URL}/api/streak", headers=H, timeout=20).json()
        assert "current" in s and "longest" in s and "week" in s
        assert len(s["week"]) == 7
        assert s["completed_today"] is True
        assert s["current"] >= 1

    def test_mistake_patch_delete_and_isolation(self):
        # Fresh user to safely create/mutate mistakes
        email, token = _register("mistaker")
        H = {"Authorization": f"Bearer {token}"}

        # Activate subscription (bypass 5Q limit)
        pay_id = f"pay_sub_{uuid.uuid4().hex[:10]}"
        body = json.dumps(_webhook_body(pay_id, email)).encode()
        requests.post(f"{BASE_URL}/api/payments/razorpay/webhook",
                      data=body, headers={"X-Razorpay-Signature": _sign(body),
                                          "Content-Type": "application/json"}, timeout=20)

        # Generate a small test
        gen = requests.post(f"{BASE_URL}/api/tests/generate", headers=H,
                            json={"exam": "jee_main", "subjects": ["physics"],
                                  "difficulty": "mixed", "num_questions": 3}, timeout=120)
        assert gen.status_code == 200, gen.text
        test = gen.json()
        # Submit: pick wrong index for all, use selected_index that won't match correct
        # we don't know correct_index; use 0 for all - some may happen to be correct
        answers = [{"question_id": q["id"], "selected_index": 0, "time_spent_seconds": 1}
                   for q in test["questions"]]
        # Also submit one as None (skipped) to verify it's NOT added
        answers[0]["selected_index"] = None
        sub = requests.post(f"{BASE_URL}/api/tests/submit", headers=H,
                            json={"test_id": test["id"], "answers": answers,
                                  "total_time_seconds": 10}, timeout=30).json()
        assert "mistakes_added" in sub and "is_daily" in sub
        assert sub["is_daily"] is False
        # mistakes_added should equal number of wrong (selected != correct and selected not None)
        wrong_count = sum(1 for d in sub["details"]
                          if d["selected_index"] is not None and not d["is_correct"])
        assert sub["mistakes_added"] == wrong_count

        # Fetch open mistakes - skipped question must not appear
        mlist = requests.get(f"{BASE_URL}/api/mistakes?status_filter=open", headers=H, timeout=20).json()
        q_ids = {m["question_id"] for m in mlist["mistakes"]}
        assert test["questions"][0]["id"] not in q_ids  # skipped excluded

        if not mlist["mistakes"]:
            pytest.skip("No wrong answers happened to be generated; skipping patch/delete")

        mid = mlist["mistakes"][0]["id"]

        # PATCH mastered=True
        r = requests.patch(f"{BASE_URL}/api/mistakes/{mid}", headers=H,
                           json={"mastered": True}, timeout=20)
        assert r.status_code == 200
        assert r.json()["mistake"]["mastered"] is True

        # Appears in mastered filter
        mm = requests.get(f"{BASE_URL}/api/mistakes?status_filter=mastered", headers=H, timeout=20).json()
        assert any(x["id"] == mid for x in mm["mistakes"])

        # PATCH back
        r = requests.patch(f"{BASE_URL}/api/mistakes/{mid}", headers=H,
                           json={"mastered": False}, timeout=20)
        assert r.status_code == 200
        assert r.json()["mistake"]["mastered"] is False

        # Resubmit same test -> no duplicate mistake entries (upsert dedupe)
        before = len(requests.get(f"{BASE_URL}/api/mistakes?status_filter=open",
                                  headers=H, timeout=20).json()["mistakes"])
        requests.post(f"{BASE_URL}/api/tests/submit", headers=H,
                      json={"test_id": test["id"], "answers": answers,
                            "total_time_seconds": 10}, timeout=30)
        after = len(requests.get(f"{BASE_URL}/api/mistakes?status_filter=open",
                                 headers=H, timeout=20).json()["mistakes"])
        assert after == before, f"Dedupe failed: before={before} after={after}"

        # Another user can't access
        _, token2 = _register("other")
        r_other = requests.patch(f"{BASE_URL}/api/mistakes/{mid}",
                                 headers={"Authorization": f"Bearer {token2}"},
                                 json={"mastered": True}, timeout=20)
        assert r_other.status_code == 404

        # DELETE
        r = requests.delete(f"{BASE_URL}/api/mistakes/{mid}", headers=H, timeout=20)
        assert r.status_code == 200
        r404 = requests.delete(f"{BASE_URL}/api/mistakes/{mid}", headers=H, timeout=20)
        assert r404.status_code == 404

    def test_streak_increments_after_daily(self):
        # Register fresh user; onboard to NEET so biology works too; use jee_main default
        email, token = _register("streaker")
        H = {"Authorization": f"Bearer {token}"}

        # Streak initial
        s0 = requests.get(f"{BASE_URL}/api/streak", headers=H, timeout=20).json()
        assert s0["current"] == 0 and s0["completed_today"] is False

        # Daily generate (3 Qs, physics for jee_main)
        g = requests.post(f"{BASE_URL}/api/daily/generate", headers=H,
                         json={"subject": "physics", "num_questions": 3, "topic": "kinematics"},
                         timeout=120)
        assert g.status_code == 200, g.text
        test = g.json()
        answers = [{"question_id": q["id"], "selected_index": 0, "time_spent_seconds": 1}
                   for q in test["questions"]]
        sub = requests.post(f"{BASE_URL}/api/tests/submit", headers=H,
                            json={"test_id": test["id"], "answers": answers,
                                  "total_time_seconds": 10}, timeout=30).json()
        assert sub["is_daily"] is True

        s1 = requests.get(f"{BASE_URL}/api/streak", headers=H, timeout=20).json()
        assert s1["completed_today"] is True
        assert s1["current"] >= 1
