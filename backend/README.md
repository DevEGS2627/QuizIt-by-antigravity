# EGS Quizit! — Backend & Game Engine Package

Welcome to the headless backend package for **EGS Quizit! Inter-school Quiz Arena**.

This package contains **only backend and architecture logic** — free of frontend styling or layout constraints — structured specifically so you can hand it off to any other AI (Claude, ChatGPT, v0.dev, Cursor) or frontend developer to build an original UI.

---

## 📁 Package Contents

```
egs-quizit-backend/
├── README.md                      # This quick start guide
├── BACKEND_SPECIFICATION.md       # Full API contracts, state models & database rules
├── AI_PROMPT_FRONTEND_REDESIGN.md # Ready prompt to give another AI to design the UI
├── .env.example                   # Supabase environment variables template
│
├── engine/                        # Pure JavaScript Headless Rules Engine
│   ├── QuizEngine.js              # State machine (scoring, pounce rules, duplicate prevention, timers)
│   └── types.d.ts                 # Full TypeScript definitions
│
├── services/                      # Audio, Speech, CSV, and Supabase Services
│   ├── audioService.js            # Offline Web Audio API sound synthesizer
│   ├── speechService.js           # Browser SpeechSynthesis question reader
│   ├── csvService.js              # Question bank CSV parser & exporter
│   └── supabaseClient.js          # Supabase client with realtime syncing
│
├── database/                      # PostgreSQL / Supabase Schema & Seed Data
│   ├── supabase_schema.sql        # Tables, RLS policies, indexes & realtime publication
│   └── seed_data.sql              # SQL seed script (60 questions, 6 teams, settings)
│
├── data/                          # Data files & templates
│   ├── questions_bank.json        # 60 curated questions across 6 rounds
│   ├── initial_teams.json         # 6 participating teams data structure
│   ├── rounds_metadata.json       # Metadata for all 6 tournament rounds
│   ├── default_rules.json         # Default scoring rules & timer durations
│   └── sample_questions_template.csv # Official CSV import template
│
└── server/                        # Zero-Dependency Local Mock API Server
    ├── server.js                  # Node.js REST API & SSE Realtime server
    └── package.json               # Start scripts
```

---

## 🚀 How to Use

### Option 1: Hand it to an AI (Claude, ChatGPT, v0, Cursor)
1. Open [AI_PROMPT_FRONTEND_REDESIGN.md](file:///C:/Users/TEJASH/.gemini/antigravity-ide/scratch/egs-quizit-backend/AI_PROMPT_FRONTEND_REDESIGN.md).
2. Copy the prompt block.
3. Attach this ZIP or paste the prompt into your AI chat to generate a brand new frontend.

### Option 2: Run Client-Only with `QuizEngine.js`
Import the headless engine directly into any React, Vue, Svelte, or Vanilla JavaScript app:
```javascript
import { QuizEngine } from './engine/QuizEngine.js';
import initialTeams from './data/initial_teams.json';
import questions from './data/questions_bank.json';

const arena = new QuizEngine({ teams: initialTeams, questions });
arena.subscribe(state => console.log('Live state:', state));
```

### Option 3: Run the Local Mock REST & SSE Server
If you want standard HTTP REST endpoints on `http://localhost:4000`:
```bash
cd server
npm start
```

### Option 4: Deploy to Supabase
1. In your Supabase SQL Editor, run [database/supabase_schema.sql](file:///C:/Users/TEJASH/.gemini/antigravity-ide/scratch/egs-quizit-backend/database/supabase_schema.sql).
2. Run [database/seed_data.sql](file:///C:/Users/TEJASH/.gemini/antigravity-ide/scratch/egs-quizit-backend/database/seed_data.sql).
3. Copy `.env.example` to `.env` in your frontend with your Supabase URL and Anon Key.
