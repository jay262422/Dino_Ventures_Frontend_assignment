# Dino Ventures - Video Player Application

A mobile-first video player application with a YouTube-like experience. Built with **Next.js**, **React**, **TypeScript**, and **Tailwind CSS**.

## Features

### Core Requirements
- **Home Page – Video Feed**: Scrollable list of videos grouped by category (Social Media AI, AI Income, AI Essentials)
- **Video Cards**: Thumbnail, title, duration, category badge
- **Full-Page Video Player**: Auto-play, custom controls (play/pause, ±10s skip, seekable progress bar, time display)
- **In-Player Video List**: Swipe up or tap to reveal related videos (same category); click to switch
- **Drag-to-Minimize**: Drag the player down to dock into a mini-player at the bottom; persists while browsing; tap to restore

### Bonus
- **Auto-play Next**: 2-second countdown with cancel option when current video ends
- **Skip Button Feedback**: Visual animation on +10 / -10 skip
- **Responsive**: Mobile-first, works on desktop and mobile

## Tech Stack

- **Next.js 16** – React framework
- **TypeScript** – Type safety
- **Tailwind CSS** – Styling
- **Lucide React** – Icons
- **YouTube IFrame API** – Custom controls over embedded videos

## Getting Started

### Prerequisites
- Node.js 18+

### Install and Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build for Production

```bash
npm run build
npm start
```

## Deploy

Deploy to Vercel (recommended):

```bash
vercel
```

Or connect your GitHub repo to [Vercel](https://vercel.com) for automatic deploys.

## Project Structure

```
src/
├── app/           # Next.js App Router
├── components/    # VideoCard, YouTubePlayer, UnifiedPlayer, DraggablePlayer
├── context/       # VideoContext (state management)
├── data/          # videos.json (dataset)
└── types/         # TypeScript types
```

## Dataset

Videos are loaded from `src/data/videos.json` (provided dataset). All videos are YouTube embeds. The player uses the YouTube IFrame API for custom controls.

## Notes

- **MP4 Support**: The player architecture supports MP4 via the native `<video>` element; the provided dataset uses YouTube embeds.
- **PiP API**: Browser Picture-in-Picture works with native video elements. YouTube embeds use an iframe, so true PiP is limited by browser support for iframe PiP.
