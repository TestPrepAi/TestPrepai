# TrackPrep AI - PRD

## Original problem statement
Build a web for JEE/NEET students to give mock tests. ChatGPT integration for mock test generation with explanations. First 5 questions free, then ₹49 for 28 days (Razorpay static payment link). JEE has 2 stages (Main + Advanced). Students should check their preparation.

## Add-on (iteration 2)
Reskin UI to TrackPrep-style light theme (sidebar nav, bento Study Tools, exam countdown, right rail). Onboarding: ask if enrolled in coaching. Daily task: ask what was taught today and generate questions on that topic.

## User choices
- AI: GPT-5.6-terra via emergentintegrations (EMERGENT_LLM_KEY)
- Auth: JWT email/password
- Scope: JEE Main + Advanced + NEET (Physics, Chemistry, Math, Biology)
- Payments: Static Razorpay link + manual payment-reference activation
- No external question bank; AI-only

## Core requirements
- Register/login with JWT
- Onboarding (coaching Y/N + target exam + exam date)
- Dashboard: countdown, donut, Study Tools bento, Daily Task banner, recent attempts
- Daily task: enter today's topic → generate quiz on that topic
- Custom test flow: exam + subject(s) + difficulty + # Qs + topics
- NTA-style simulator: timer, palette, mark-for-review, submit
- Result: subject stats + per-Q solutions + AI explanation
- Analytics: bar/line charts, exam & subject breakdown
- 5 free Qs lifetime quota; after that 402 unless subscribed
- Subscription: 28 days via /api/subscription/activate (payment_reference)

## Implemented (Feb 2026)
- Backend: FastAPI + MongoDB + JWT + GPT-5.6-terra (`emergentintegrations`); endpoints under `/api/auth/*`, `/api/tests/*`, `/api/attempts/*`, `/api/subscription/*`, `/api/analytics/summary`, `/api/user/onboarding`, `/api/daily/today`, `/api/daily/generate`
- Frontend: React + Tailwind + shadcn; routes `/`, `/login`, `/register`, `/pricing`, `/dashboard`, `/daily-task`, `/create-test`, `/test/:id`, `/result/:id`, `/analytics`, `/history`
- All critical interactive elements carry data-testid
- Backend tested 100% pass (iteration_1)

## Backlog
- P1: Razorpay webhook (auto-activate on payment)
- P1: Emergent Google Auth option
- P2: Streak tracking + daily reminder email
- P2: Full-length NEET/JEE Main 180-Q timed papers template
- P2: Question bookmarks and mistake notebook
