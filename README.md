# Dino Ventures - Video Player Application

Mobile-first video player experience inspired by YouTube mobile UX, built for the Dino Ventures Frontend Engineer assignment.

## Assignment Coverage

| Requirement | Status | Implementation |
| --- | --- | --- |
| Home feed grouped by category | Done | Category sections with video cards |
| Video card metadata | Done | Thumbnail, title, duration, category badge |
| Full-page player autoplay | Done | Auto-play on open for MP4 and YouTube |
| Custom controls | Done | Play/pause, +/-10s, seek, time, volume, fullscreen |
| In-player related list (same category) | Done | Swipe/scroll/toggle reveal + instant switch |
| Drag-to-minimize mini-player | Done | Drag down to dock, restore on tap, persistent mini-player |
| Mini-player controls | Done | Play/pause + close + title |
| Bonus: auto-play next | Done | 2-second countdown with cancel |

## Key Notes

- YouTube default mode is **Custom** (IFrame API control mode).
- YouTube native iframe mode remains available as a fallback via toggle.
- MP4 uses native HTML5 video with full custom controls.
- UI and interactions are optimized for mobile first, with desktop support.

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Lucide React
- YouTube IFrame API

## Local Development

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
npm install
```

### Run

```bash
npm run dev
```

Open `http://localhost:3000`.

### Quality Checks

```bash
npm run lint
npm run build
```

## Project Structure

```text
src/
  app/                 # App Router pages
  components/          # Feed cards, player components, drag/minimize UI
  context/             # Global video/player state
  data/                # Assignment dataset (videos.json)
  types/               # Shared TypeScript types
  utils/               # Utility helpers
```

## Deployment (Vercel)

1. Push this repository to GitHub.
2. Import the repo in Vercel.
3. Use defaults (Next.js auto-detected):
   - Build command: `npm run build`
   - Install command: `npm install`
4. Deploy and copy the production URL.

## Interviewer-Ready Submission Checklist

- [ ] Public GitHub repository link is available.
- [ ] Live deployed URL is available and reachable.
- [ ] README reflects final implemented behavior.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] Feed open -> full player transition verified.
- [ ] MP4 controls verified (play/pause, seek, skip, time, volume, fullscreen).
- [ ] YouTube custom mode verified (play/pause, seek, skip, time sync).
- [ ] Related list filtering and switching verified.
- [ ] Drag-to-minimize and restore verified on mobile and desktop.
- [ ] Auto-play next countdown verified with cancel action.
- [ ] Optional demo recording captured.