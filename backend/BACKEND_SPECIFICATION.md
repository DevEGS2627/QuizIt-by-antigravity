# EGS Quizit! — Complete Backend & Architecture Specification

This document provides a complete technical reference for the **EGS Quizit! Inter-school Quiz Arena** backend, data models, state engine, database schema, audio engine, and API endpoints. Any frontend developer or AI agent can use this specification to build a custom user interface without modifying the core logic.

---

## 1. System Overview & Core Quiz Rules

**EGS Quizit!** is an auditorium quiz tournament system designed for a single operator laptop driving an auditorium projector.

### Key Rules
- **6 Rounds**:
  1. Round 1: *The Awakening* (General Knowledge & Current Affairs)
  2. Round 2: *Quantum Leap* (Science, Technology & Environment)
  3. Round 3: *Chronicles of Time* (History, Heritage & Civilizations)
  4. Round 4: *Renaissance* (Literature, Arts & World Culture)
  5. Round 5: *The Coliseum* (Sports, Gaming & Legends)
  6. Round 6: *The Gauntlet* (Buzzer, Rapid Fire & Decider Round)
- **6 Teams**: Each team has an assigned name, school, short code, and high-contrast color.
- **Turn Sequence**: The quiz cycles through teams in order (`team-1` -> `team-2` -> ... -> `team-6` -> `team-1`).
- **Question Selection**:
  1. **Physical Chit Mode**: Instant lookup by tagged chit (e.g. `R1-001` or `1`).
  2. **Fair Random Reel Draw**: Random selection from remaining available questions in the active round. Auto-recycles round questions if exhausted.
- **Scoring Engine**:
  - **Assigned Team Correct**: `+10` points (configurable).
  - **Assigned Team Wrong**: `0` points (configurable).
  - **Pounce Buzzer**: Non-assigned teams can register a pounce.
    - **Pounce Correct**: `+10` points.
    - **Pounce Incorrect**: `-5` points (penalty).
    - **Pounce Rule**: The assigned owner team of the active question **cannot** pounce on their own question.
  - **Duplicate Scoring Prevention**: A question cannot be scored multiple times for regular points; manual score corrections must record a reason and audit entry.
- **Timer**: 45 seconds default countdown with audio warning pulses under 10 seconds and buzzer on zero.

---

## 2. Data Models & TypeScript Contracts

See [engine/types.d.ts](file:///C:/Users/TEJASH/.gemini/antigravity-ide/scratch/egs-quizit-backend/engine/types.d.ts) for full TypeScript interfaces.

### Team Object
```json
{
  "id": "team-1",
  "name": "Phoenix Vanguard",
  "school": "St. Jude's Academy",
  "shortName": "PHX",
  "color": "#ff2d55",
  "scoresByRound": [0, 0, 0, 0, 0, 0],
  "totalScore": 0,
  "hasPounced": false,
  "pounceTimestamp": null
}
```

### Question Object
```json
{
  "id": "q-101",
  "tag": "R1-001",
  "round": 1,
  "question": "Which international organization, founded in 1945 in San Francisco...",
  "answer": "The United Nations (UN)",
  "source": "UN Charter Archives",
  "mediaType": null,
  "mediaUrl": null,
  "status": "available"
}
```

### Live Quiz State Object
```json
{
  "activeRound": 1,
  "activeTeamId": "team-1",
  "currentQuestion": { ... },
  "isAnswerRevealed": false,
  "hasBeenScored": false,
  "isTimerRunning": false,
  "timerSeconds": 45,
  "teams": [ ... ],
  "rules": {
    "correctPoints": 10,
    "wrongPoints": 0,
    "pounceCorrectPoints": 10,
    "pounceIncorrectPoints": -5,
    "defaultTimerDuration": 45,
    "warningTimerThreshold": 10,
    "soundEnabled": true
  }
}
```

---

## 3. Database Layer (Supabase PostgreSQL)

Located in `database/supabase_schema.sql` and `database/seed_data.sql`.

### Tables:
1. `public.quiz_settings`: Holds system point values, default timer, active theme.
2. `public.teams`: Holds team identities, round scores array, total score, pounce state.
3. `public.questions`: Question bank indexed by round and status (`available`, `drawn`).
4. `public.live_quiz_state`: Single-row live broadcast state synchronized across devices.
5. `public.question_draws`: Audit record of all drawn questions, timestamp, and method.
6. `public.score_events`: Immutable audit trail of every score change and correction.

### Realtime Replication:
Enabled for `live_quiz_state`, `teams`, and `score_events` via Supabase Realtime publication.

---

## 4. Headless State Engine (`engine/QuizEngine.js`)

A pure JavaScript headless state machine. You can import this directly in any frontend framework:

```javascript
import { QuizEngine } from './engine/QuizEngine.js';
import initialTeams from './data/initial_teams.json';
import questionsBank from './data/questions_bank.json';

const engine = new QuizEngine({
  teams: initialTeams,
  questions: questionsBank
});

// Subscribe to state updates
const unsubscribe = engine.subscribe((state) => {
  console.log("Current state:", state);
});

// Operations:
engine.startTimer();
engine.pauseTimer();
engine.drawRandomQuestion();
engine.revealByChitTag("R1-004");
engine.toggleAnswerReveal();
engine.awardRegularScore("team-1", "correct");
engine.toggleTeamPounce("team-2");
engine.awardPounceScore("team-2", "pounce_correct");
engine.nextTeamSequence();
```

---

## 5. Standalone REST & SSE Server (`server/server.js`)

If you prefer building a frontend using standard HTTP `fetch` or EventSource without Supabase:

Run:
```bash
cd server
npm start
# Server listens on http://localhost:4000
```

### REST Endpoints:
- `GET /api/state` — Full arena state.
- `GET /api/events` — Server-Sent Events (SSE) stream for realtime updates.
- `GET /api/teams` — List of teams and scores.
- `GET /api/questions` — Full question bank.
- `POST /api/timer/start` — Start timer countdown.
- `POST /api/timer/pause` — Pause timer.
- `POST /api/timer/reset` — Reset timer to default.
- `POST /api/questions/draw` — Trigger animated random draw.
- `POST /api/questions/chit` — Body: `{ "tag": "R1-002" }`.
- `POST /api/questions/reveal` — Toggle answer reveal.
- `POST /api/teams/next` — Cycle active team turn.
- `POST /api/pounce` — Body: `{ "teamId": "team-3" }`.
- `POST /api/score/regular` — Body: `{ "teamId": "team-1", "type": "correct"|"wrong" }`.
- `POST /api/score/pounce` — Body: `{ "teamId": "team-2", "type": "pounce_correct"|"pounce_incorrect" }`.
- `POST /api/score/correct` — Body: `{ "teamId": "team-1", "round": 1, "pointsDelta": 5, "reason": "Judge adjustment" }`.

---

## 6. Audio Synthesizer Engine (`services/audioService.js`)

Zero-dependency Web Audio API synthesizer. Works offline in all modern browsers without loading external MP3 files:

- `audioService.playTick()` — Standard 1-second countdown tick.
- `audioService.playUrgentTick()` — Urgent heartbeat pulse when remaining time <= 10s.
- `audioService.playTimeUpBuzzer()` — Descending sawtooth time expired buzzer.
- `audioService.playReelTick()` — Dynamic random draw slot tick.
- `audioService.playDrawSelected()` — Fanfare chords when question locks in.
- `audioService.playCorrect()` — Rising harmonic victory chime.
- `audioService.playWrong()` — Low pitch bonk sound.
- `audioService.playPounce()` — High-urgency dual-frequency buzzer.
- `audioService.playPaddle()` — Tactile physical paddle click.
