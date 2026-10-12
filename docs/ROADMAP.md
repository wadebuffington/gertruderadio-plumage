# Plumage — Roadmap

One milestone at a time. Each one works, gets tried by Eddie, and gets committed
before the next begins.

## Milestone 1 — "It plays and it glows" (DONE)

The proof of concept. Give the idea some life; don't build the cathedral.

- [x] Project scaffold: static site, small Vite setup (or no-build if simpler), `npm run dev` and `npm run build`.
- [x] Webamp running in the page with its default skin.
- [x] Butterchurn MilkDrop visuals running and reacting to the playing audio, with a handful of presets and a way to change preset.
- [x] **Open local files**: "Open files…" button and drag-and-drop. Audio stays on the device; nothing uploaded.
- [x] **Semantic control bar** (the accessible surface): Play/Pause, Previous, Next, Stop, seek slider, volume slider, current track name, and a real playlist list — all keyboard-operable with screen-reader names, wired to the same player state as Webamp.
- [x] Live-region announcement when the track changes.
- [x] Gertrude Radio page shell: title "Plumage — by Gertrude Radio", dark look with crimson/gold/teal accents, works at phone width.
- [x] **About dialog** with full attribution (see CLAUDE.md) and the line "Free. No paywall. No advertising. No account."
- [x] Short README section: how to run it locally and how to try it.
- [x] Deployable `dist/` folder that runs as plain static files.

**Done when:** Eddie can open the page, drop in an MP3 from his own computer, hear it,
watch the visuals move, operate everything from the keyboard, and read the About credits.

*Built 2026-10-12; waiting on Eddie to try it before Milestone 2 starts.*

## Milestone 2 — A Redbird skin (DONE)

- [x] One original Redbird classic skin (our own artwork, no copied assets). *First version drawn in code
      (`tools/redbird-skin/build.py`); Eddie's artwork can replace it later.*
- [x] Skin switcher (default ↔ Redbird) plus "load a skin file" from the user's device.
- [x] Link out to the Webamp skin museum.
- [x] Contrast check on our skin (built into the skin generator; the build stops if a pair fails AA).
- [x] Eddie tries it and signs off on the look.

## Milestone 3 — Offline renderer (first cut) (CURRENT)

- [x] Render one track + visuals to a video file, frame-perfect, no screen capture (WebCodecs, Chromium first).
      *MP4 (H.264 + AAC) where the browser can encode it — Chrome/Edge on Mac and Windows — otherwise WebM.*
- [x] Choose aspect ratio (16:9 / 9:16 / 1:1), at 720p or 1080p.
- [x] Progress display and cancel.
- [ ] Eddie renders one of his own tracks and checks it plays (and uploads) where he wants it.

## Milestone 4 — Shaped surface (experiment)

- [ ] Prototype a non-rectangular player outline driving the same controls, starting from Eddie's chosen cardinal concepts A ("Flight Form") and D — see `docs/design/README.md`.
- [ ] Answer the "how is a shape defined?" open question with something that works.

## Later

Render recipes, batch rendering, loudness-aware reactivity, skin contrast auditor,
typographic visualizer mode, installable web app, Gertrude Console file format.
