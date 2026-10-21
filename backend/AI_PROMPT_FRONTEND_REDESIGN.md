# AI Prompt: Build a Frontend UI for EGS Quizit!

> **How to use this file:**  
> Copy the prompt below and paste it into **Claude, ChatGPT, v0.dev, Cursor, or your favorite AI coding assistant** along with the files from this backend package.

---

### 📋 COPY-PASTE PROMPT STARTS BELOW THIS LINE:

```markdown
I have an existing, fully functioning backend, database schema, data models, audio engine, and business rules engine for **EGS Quizit! — Inter-school Quiz Arena**.

I want you to design and build a state-of-the-art, visually stunning, and responsive frontend interface that connects to this backend.

### Project Context & Purpose
- **Application Name**: EGS Quizit! Inter-school Quiz Arena
- **Target Use Case**: High-stakes live school quiz championship. An operator sits with a laptop duplicated onto a large auditorium projector screen.
- **Audience**: School students, teachers, and audience sitting 10–30 meters away from the projector screen.

---

### Visual Design & Aesthetics Requirements
1. **The 60-30-10 Color System**:
   - 60% dominant background: Deep obsidian / midnight luxury dark base (e.g. `#080c14` or deep slate).
   - 30% structural layer: Rich navy / royal slate containers, glassmorphism cards, subtle borders (`rgba(255,255,255,0.08)`).
   - 10% accent color: Luminous gold / electric cyan / vivid amber used for active turn indicators, score pops, and timers.
2. **Typography**:
   - Primary: Clean modern geometric sans-serif (e.g., `Plus Jakarta Sans`, `Outfit`, or `Inter`).
   - Monospace for tags & timers: High-legibility tabular numerals (e.g., `JetBrains Mono` or `Space Grotesk`).
   - Dynamic scaling so long questions never overflow or clip.
3. **Motion & Feedback**:
   - Dramatic 1.2s slot-reel animation when drawing questions randomly.
   - Distinct countdown timer with pulsating urgency ring when under 10 seconds.
   - Tactile auction-style paddles or floating action controllers for scoring.
   - Confetti bursts on correct answers.

---

### The 4 Required Views
1. **Presentation / Auditorium View (Projector Stage)**:
   - Fullscreen zero-scroll view.
   - ~70% of screen allocated to the active question stage (tag, round category, large legible question, optional media/image, and answer reveal).
   - ~30% allocated to live team leaderboard with distinct position badges (1st, 2nd, 3rd podium indicators).
   - All 6 team cards must be visible without scrolling on both 1366x768 and 1920x1080 screens.
   - Docked discreet bottom operator strip (round picker, chit lookup, draw button, timer toggle, paddle drawer).

2. **Operator Desk / Live Quiz Workspace**:
   - High-efficiency mission control layout for the quizmaster.
   - Quick chit entry input with auto-formatting (`R1-001`).
   - Direct score buttons for the active team (`+10 Correct`, `0 Wrong`).
   - Pounce Monitor: Grid of teams with buzzer toggles showing who buzzed first with millisecond timestamps.
   - Timer controls (`Start`, `Pause`, `+5s`, `-5s`, `Reset`).
   - Turn cycle button (`Next Team`).

3. **Stats & Analytics Dashboard**:
   - Current podium rankings with score deltas.
   - Round-by-round breakdown table showing each team's score per round.
   - Full question draw history and scoring audit trail.
   - CSV export for final results.

4. **Admin & Configuration Desk**:
   - Team manager (edit team names, schools, colors, icons).
   - Scoring rules editor (configure correct points, wrong points, pounce points, default timer).
   - Question Bank Manager (search by tag/round, filter available vs drawn, bulk CSV import/export).

---

### Backend Integration
You have access to:
1. `engine/QuizEngine.js`: Headless state machine with `subscribe(state => ...)`, `drawRandomQuestion()`, `revealByChitTag(tag)`, `awardRegularScore(teamId, type)`, `toggleTeamPounce(teamId)`, `startTimer()`, etc.
2. `services/audioService.js`: Zero-dependency Web Audio API sound synthesizer with `playTick()`, `playUrgentTick()`, `playTimeUpBuzzer()`, `playCorrect()`, `playWrong()`, `playPounce()`, `playPaddle()`.
3. `services/speechService.js`: Text-to-Speech `speak(text)` browser integration.
4. `database/supabase_schema.sql` & `database/seed_data.sql`: PostgreSQL tables with Supabase Realtime synchronization.
5. `data/`: JSON banks of 60 questions, 6 teams, round metadata, and CSV templates.

Please build the frontend using React (or your chosen modern framework), Vanilla CSS or Tailwind, and Lucide icons.
```
