# NGDC House Draft & Bidding System

A real-time Game Jam Candidate Draft & Bidding Web Application for the NUST Game Development Club (NGDC) Orientation.

## Features

- **Projector View** (`/projector`) - Full-screen stage display with:
  - Live candidate showcase with media preview (video/image/PDF)
  - Massive monochrome bid display
  - Synced countdown clock (driven by Admin)
  - Synced identity reveal overlay
  - Synced confetti celebrations
  - House standings bar

- **Admin Panel** (`/admin`) - Moderator dashboard with:
  - Candidate queue navigation
  - Quick bid controls with house selection
  - Timer controls (Start/Pause/Reset)
  - Sold/Pass actions
  - House budget adjustments
  - Keyboard shortcuts

- **Real-time Sync** - Two layers powered by Supabase:
  1. **Database Realtime** — `candidates`, `houses`, `bids_log` tables sync automatically
  2. **Broadcast Events** — ephemeral UI events (`reveal_identity`, `trigger_confetti`, `start_timer`, `pause_timer`, `reset_timer`, `advance_candidate`, `prev_candidate`) are pushed from Admin to Projector over a shared `ngdc-events` broadcast channel

- **Audio Effects** - Web Audio API synthesized sounds
- **Confetti** - Celebration animations on draft confirmation (synced to projector)
- **SOLD! Takeover** - Full-screen animated "SOLD" slam card on the projector (impact flash, speed-line burst, screen shake, bid counter → house banner)
- **Snake Draft** - Distributes leftover/passed members across houses (fewest-credits-first, free), shuffled for fairness
- **House Reveal (Phase 2)** - Football-style final lineups per house with avatars, real names and roles

## Tech Stack

- **Frontend**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS v4 + Lucide Icons
- **Animations**: Framer Motion
- **Backend**: Supabase (PostgreSQL + Realtime)
- **Confetti**: Canvas Confetti

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a free Supabase project at https://supabase.com
2. Go to **SQL Editor** and run the full script in **`supabase_setup.sql`** (includes tables, RLS policies, realtime, and seed data).
3. It creates 4 tables:
   - `houses` — the 5 executive houses + credits
   - `candidates` — participants (creates first-listed, references houses)
   - `bids_log` — every bid (realtime feed)
   - `settings` — persisted UI state (currently the active `phase`)

> The tables must be created in dependency order (`houses` → `candidates` → `bids_log`), which the script already handles.

### 3. Configure Environment Variables

Create `.env.local` in the root directory:

```env
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Get these from: **Supabase Dashboard > Project Settings > API**

### 4. Run the Development Server

```bash
npm run dev
```

Open http://localhost:5173

## Usage

### Projector View (`/projector`)

- Full-screen display for stage projection
- Shows current candidate with media preview
- Live bidding updates with neon animations
- House standings at bottom
- **Keyboard**: Press `Space` to reveal candidate identity

### Admin Panel (`/admin`)

- **Navigation**: `1-5` to select house, `←`/`→` for candidates
- **Bidding**: Select house, then click `+1/+2/+5` or enter custom amount
- **Timer**: `Space` to start/pause
- **Confirm**: `Enter` to confirm bid (SOLD)
- **Pass**: Click `PASS` to skip candidate
- **Adjust Credits**: Use `+1`/`-1` buttons per house

## Design System

| Color | Hex | Usage |
|-------|-----|-------|
| Background | `#0B0F17` | Primary bg |
| Background Light | `#0F172A` | Secondary bg |
| Neon Cyan | `#00F0FF` | Programmer bids, primary accent |
| Neon Amber | `#FFB800` | Winning bid, timer warning |
| Neon Emerald | `#10B981` | Confirmation, drafts |
| Neon Crimson | `#EF4444` | Error, pass action |
| Blue | `#3B82F6` | Programmer track |
| Purple | `#A855F7` | 2D Artist track |
| Cyan | `#06B6D4` | 3D Artist track |
| Amber | `#F59E0B` | Designer track |

## Project Structure

```
src/
├── components/       # Reusable components
├── pages/
│   ├── LandingPage.tsx    # Home/Navigation page
│   ├── ProjectorView.tsx  # Stage projection view
│   └── AdminView.tsx      # Moderator control panel
├── hooks/
│   ├── useSupabaseRealtime.ts  # Real-time data sync
│   ├── useTimer.ts             # Timer logic
│   └── useAudio.ts             # Sound effects
├── lib/
│   └── supabase.ts         # Supabase client
├── types/
│   ├── database.ts         # TypeScript types
│   └── supabase.ts         # Database schema types
├── data/
│   └── placeholder.ts      # Test data
├── App.tsx                 # Main router
└── main.tsx                # Entry point
```

## Deployment

Build for production:

```bash
npm run build
```

The `dist/` folder can be deployed to:
- Vercel
- Netlify
- GitHub Pages
- Any static host

### Important: Supabase CORS

For production, add your domain to **Supabase Dashboard > Authentication > URL Configuration > CORS Allowed Origins**.

## License

MIT License - Built for NGDC Orientation 2026