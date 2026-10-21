# EGS Quizit! — Inter-school Quiz Arena

**EGS Quizit!** is a premium, production-ready web application engineered for inter-school quiz championships. Designed specifically for a single operator laptop duplicated onto an auditorium projector screen, it delivers clarity from a distance, high-energy animations, and strict scoring integrity under pressure.

---

## 🌟 Key Features & Capabilities

### 1. Dual Viewports: Operator Mission Control & Projector Presentation Mode
- **70/30 Projector View**: Fullscreen zero-scroll auditorium view allocating ~70% visual attention to the active question stage and ~30% to live standings.
- **Guaranteed Zero-Clipping**: All six participating team cards are continuously visible near the top of usable space on both `1366×768` and `1920×1080` screen resolutions.
- **Compact Operator Strip**: Docked along the bottom with physical chit lookup, fair animated random draw reel, turn advance, and a "More" menu for round switches or control locking.

### 2. Multi-Mode Cinematic Question Reveal Animations
- **✨ Word Cascade & Focus (Default)**: Apple keynote-style staggered cascade where words flow into place with a subtle 3D translation (`translateY(12px)` to `0`), a neon blur that snaps into razor-sharp clarity, and a glowing cyan accent wave.
- **⚡ Cyber Laser Sweep**: A radiant laser blade sweeps smoothly across the card with trailing ionization sparks, illuminating the text.
- **🚀 3D Horizon Unfold**: A 3D perspective unfold (`rotateX(38deg)` to `0deg`) with natural spring easing.
- **👾 Quantum Matrix Decrypt**: Scrambled cyber glyphs rapidly decrypt character-by-character into the actual question.
- **🌟 Soft Glow Fade**: Smooth fade-in with a gentle glowing pulse.
- **Sleek 3-Dot (⋮) Menu**: Easily switch animation styles on the fly from the stage toolbar without cluttering the screen.

### 3. Transparent Question Selection & Auto-Turn Rotation
- **Physical Chit Mode**: Instant lookup by tagged chit (e.g. `R1-004` or simply `4`).
- **Fair Random Draw Mode**: Dramatic animated reel sequence with tick sounds and locked duplicate prevention.
- **⚡ Automatic Team Turn Advancement**: Automatically queues and advances the "Question For" pointer to the next team in round-robin rotation (`(i + 1) % teams.length`), with an instant `Auto-Turn: ON/OFF` toggle in the top navbar and manual quick-advance button.
- **Architected for 1,000+ Questions per Round**: Preloaded with comprehensive questions across 6 rounds with drag-and-drop CSV bulk import and export.

### 4. Auction-Style Visual Score Paddles
Five tactile visual paddles with turned wooden handles floating along the bottom:
1. **CORRECT (+10)** — Direct award to active question owner with celebratory confetti.
2. **WRONG (0)** — Deducts or assigns wrong answer marks to active owner.
3. **POUNCES (Register)** — Buzzer monitoring which non-assigned teams buzzed to pounce.
4. **POUNCE + (+10)** — Awards pounce bonus strictly to a team with a recorded pounce.
5. **POUNCE - (-5)** — Deducts penalty from an incorrect pounce attempt.
- Includes smooth spring reload physics and full marks correction audit log.

### 5. Web Audio API & Accessibility
- **Synthesized Audio**: Offline, zero-dependency sound effects for clock ticks, hurry urgency heartbeat (<10s), time-up buzzer, reel spin, and paddles.
- **Clean Silent Reveal**: Question reveals are completely silent and distraction-free.
- **Browser Text-To-Speech**: Instant "Read Aloud" button using `window.speechSynthesis` with speech rate and voice controls.
- **High Contrast & Responsive**: Fluid typography auto-scales long questions so text never overflows.

### 6. Curated High-Voltage Modern Color Palettes
1. **Cyber Neon (Default)**: Deep Obsidian base (`#060814`) with glowing Electric Cyan (`#00f5ff`) and Neon Magenta (`#ff007f`).
2. **Solar Flare**: Deep Noir with blazing Coral Crimson (`#ff2a5f`) & Solar Gold (`#ffb703`).
3. **Aurora Mint**: Arctic Void with Hyper Mint (`#00ff9d`) & Ice Electric Blue (`#00e5ff`).
4. **Cosmic Violet**: Deep space with Luminescent Amethyst (`#c084fc`) & Neon Orchid (`#f43f5e`).
5. **Toxic Matrix**: Radioactive Neon Lime (`#39ff14`) & Emerald (`#00ff88`).
6. **Synthwave Sunset**: Retro Tangerine (`#ff6b35`) & Electric Hot Pink (`#ff1361`).
7. **Electric Cobalt**: Laser Azure (`#38bdf8`) & High-Voltage Blue (`#2563eb`).
8. **Champagne Luxe**: Ultra-premium 24K Champagne Gold (`#f6d365`) on Obsidian.

### 7. Standalone Headless Backend Engine (`/backend`)
- Pure zero-frontend Node.js / JavaScript engine located in `/backend` for running custom client UIs, mobile apps, or headless simulation.

---

## 🚀 Quick Start & Local Setup

### Prerequisites
- Node.js (v18 or newer)
- npm (v9 or newer)

### Installation
```bash
# Navigate to the project directory
cd egs-quizit

# Install dependencies (already installed if cloning this repo)
npm install

# Run the development server
npm run dev
```

Open `http://localhost:5173/` in your browser.

---

## ☁️ Supabase Cloud Setup (Optional)

EGS Quizit! features a **resilient local-first engine**. It runs 100% out of the box with `localStorage` persistence and mock auth even without Supabase. To enable multi-device realtime synchronization across operator laptops and remote audience displays:

1. Create a project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard and run the contents of [`supabase_schema.sql`](./supabase_schema.sql).
3. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
4. Enter your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
5. Alternatively, operators can configure the Supabase URL and Key directly in the **Admin Controls → Supabase Sync** tab in the running app!

### Demo Operator Credentials (Offline Mode)
- **Email:** `admin@egs.edu`
- **Password:** `admin123`

---

## 📂 CSV Question Bank Format

You can import thousands of questions using the built-in CSV bulk import.

### Header Specification:
```csv
Tag,Round,Question,Answer,Source,Media_URL
R1-001,1,"Which international organization was founded in 1945?","The United Nations","UN Archives",""
R2-004,2,"Which organelle produces cellular ATP?","Mitochondria","Cell Biology","https://example.com/cell.jpg"
```

A pre-formatted template is available at [`sample_questions_template.csv`](./sample_questions_template.csv) or can be downloaded directly from the Admin panel.

---

## 🚢 Deployment Guide

### Deploying to Vercel
1. Install the Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the project directory.
3. Set Build Command: `npm run build` and Output Directory: `dist`.
4. (Optional) Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under Environment Variables.

### Deploying to Netlify
1. Connect your repository to Netlify or use the Netlify CLI: `npx netlify deploy --prod`
2. Build command: `npm run build`
3. Publish directory: `dist`

### Deploying to GitHub Pages
1. In `vite.config.js`, set `base: './'`.
2. Run `npm run build`.
3. Push the contents of the `dist/` directory to your `gh-pages` branch.

---

## 🛡️ License

Built for **EGS Inter-school Quiz Arena**. Clean, open, and extensible architecture.
