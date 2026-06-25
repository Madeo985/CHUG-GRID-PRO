# CHUG-GRID PRO

Playable polymetric riff generator for modern metal guitarists.

CHUG-GRID PRO is a browser-based rhythm lab for sketching heavy guitar patterns, visualizing bar realignment, and exporting ideas for further production work.

## Live App

https://chug-grid-pro.vercel.app

## Features

- Interactive chug grid with chugs, upstrokes, ghost notes, and accents
- Orbit view for pulse, bar position, and riff cycle visualization
- Meter support for 3/4, 4/4, 5/4, 6/8, 7/8, and 9/8
- Random riff engine with density and complexity controls
- Style generators for Target, Meshuggah, Vildhjarta, and Car Bomb-inspired patterns
- Local preset save/load
- Shareable riff links
- MIDI and MusicXML export

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Production Build

```bash
npm run build
npm run start
```

## Tech Stack

- Next.js
- React
- TypeScript
- Web Audio API
