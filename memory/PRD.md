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

## Implemented (Oct 2026 — iteration 2)
- Razorpay webhook `POST /api/payments/razorpay/webhook`: HMAC-SHA256 verify (`RAZORPAY_WEBHOOK_SECRET`), events payment.captured / payment_link.paid / order.paid, matches payer by email (or notes.user_id), idempotent on payment id, underpaid/unmatched records; `extend_subscription` stacks 28 days. Unmatched payments claimable via `/api/subscription/activate` with pay_ id. `GET /api/payments/mine`.
- Real payment link set: `RAZORPAY_PAYMENT_LINK=https://rzp.io/rzp/TQzWjE4`; Pricing opens it with `?email=&name=` prefill and polls `/auth/me` every 5s (10 min) to auto-redirect on activation.
- Daily streak: `daily_tasks.completed` set on submit of daily test; `GET /api/streak` → current/longest/completed_today/week. `StreakCard` on Dashboard + Daily Task page.
- Mistake Notebook: wrong answers (not skipped) upserted into `mistakes` on submit; `GET/PATCH/DELETE /api/mistakes`; `/notebook` page with To revise / Revised tabs, subject chips, mark-as-revised toggle, remove. Result page banner + dashboard count.
- Share Score Card: canvas-drawn 1080x1080 PNG on Result page (download, WhatsApp wa.me link, copy text, native share).
- Tested: iteration_2 — all backend + frontend scenarios pass.

## Production setup notes
- In Razorpay dashboard → Webhooks: URL `https://<domain>/api/payments/razorpay/webhook`, events `payment.captured`, set secret and copy into `RAZORPAY_WEBHOOK_SECRET` (currently a dev placeholder).

## Backlog
- P1: Emergent Google Auth option
- P2: Daily streak reminder email/push
- P2: Full-length NEET/JEE Main 180-Q timed papers template
- P2: Question bookmarks (save correct-but-tricky Qs)
- P2: Referral tracking (attribute signups from shared score cards)
