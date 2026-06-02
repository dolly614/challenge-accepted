# Secure Exam System — Phased Build Plan

Bhai, full system ek shot me banane se quality kharab hogi aur test karna mushkil. Isliye **4 phases** me karenge. Har phase ke baad aap test karoge, phir next phase start.

---

## Phase 1 — Foundation (Lovable Cloud + Auth + Database)
**Goal:** Backend ready ho jaye, students sign up/login kar sake, admin role ho.

1. **Lovable Cloud enable** karna (database + auth + storage).
2. **Auth setup:** Email/Password + Google sign-in.
3. **Database tables:**
   - `profiles` (user info: name, class, school, photo)
   - `user_roles` (admin / student) — separate table, secure
   - `exams` (class, type mid/final, date, shift day/night, duration, marking scheme)
   - `questions` (exam_id, question text, 4 options, correct answer, order)
   - `exam_attempts` (student_id, exam_id, start_time, end_time, score, status, violations_count)
   - `attempt_answers` (attempt_id, question_id, selected_option, is_correct)
   - `violations_log` (attempt_id, type: tab_switch/blur/fullscreen_exit, timestamp)
4. **RLS policies:** Student sirf apna data dekhe, admin sab dekh sake.
5. **Login/Signup pages** with redirect logic.

**Test:** Sign up karke login/logout check karna.

---

## Phase 2 — Admin Panel (Exam + Questions Management)
**Goal:** Admin exam create kar sake, 200 questions add kar sake, schedule set kar sake.

1. **Admin dashboard** (only admin role access).
2. **Create Exam form:** class (1-12), type (mid/final), date, time, shift (day/night), duration, +1/-0.25 marking.
3. **Question manager:** add/edit/delete MCQs, bulk CSV import (200 questions), assign to exam.
4. **Schedule view:** upcoming exams calendar.
5. **Live monitoring page:** active attempts list with violation count.

**Test:** Admin se ek exam create karke 5-10 questions add karna.

---

## Phase 3 — Secure Exam Experience (Student Side)
**Goal:** Student exam de sake with all anti-cheat.

1. **Instructions screen** with mandatory checkbox ("I agree to rules").
2. **Pre-exam check:** exam window open hai ya nahi (date + shift time match).
3. **Single device login:** ek student ek time pe sirf ek device pe.
4. **Secure exam mode:**
   - Force fullscreen
   - Detect tab switch / window blur / fullscreen exit → warning
   - Disable copy/paste, right-click, text selection
   - Block F12, Ctrl+Shift+I, PrintScreen (best effort)
   - 3 violations = auto-submit
5. **Exam UI:**
   - Questions randomized per student
   - Timer countdown
   - Auto-save every 5 seconds to DB
   - Internet reconnect handling (resume from last saved)
   - Negative marking: +1 correct, -0.25 wrong
6. **Submit & lock:** ek baar submit hone ke baad dobara nahi de sakte.

**Test:** Student account se actual exam dena, violations trigger karke dekhna.

---

## Phase 4 — Results, Night Shift, Polish
**Goal:** Results, certificate, night shift fallback, final polish.

1. **Results page** with breakdown (correct/wrong/skipped, final score).
2. **Certificate generation** with score + rank.
3. **Night shift fallback:** day me na de paya to night me option milega.
4. **Leaderboard** (class-wise + overall).
5. **Admin reports:** export CSV of all attempts + violations.

---

## Honest Limitations (Browser Constraints)

Ye cheezein browser me **100% block nahi** hoti, sirf **detect** hoti hain:
- **Screenshot block:** PrintScreen key browser me intercept nahi hoti. Detect kar sakte hain agar focus loss ho.
- **Screen recording:** OS-level recording (OBS, mobile screen record) browser ko pata nahi chalti.
- **AI vision cheating detection:** Real AI face/eye tracking ke liye webcam stream + ML model chahiye — Phase 4+ me alag se kar sakte hain agar zaroorat ho.
- **Multi-device block:** Detect kar sakte hain via session, but VPN/incognito bypass possible.

Ye sab **deterrent** hain — most students cheat nahi kar payenge, but determined cheater ko 100% rokna client-side impossible hai. Server-side scoring + RLS + audit log strong protection dete hain.

---

## Aaj kya karu?

**Phase 1 start karu?** Lovable Cloud enable karke database + auth setup karta hu. Aap confirm karo to chalu kar deta hu.
