# Plumage — Roadmap

One milestone at a time. Each one works, gets tried by Eddie, and gets committed
before the next begins.

## Milestone 1 — "It plays and it glows" (CURRENT)

The proof of concept. Give the idea some life; don't build the cathedral.

- [ ] Project scaffold: static site, small Vite setup (or no-build if simpler), `npm run dev` and `npm run build`.
- [ ] Webamp running in the page with its default skin.
- [ ] Butterchurn MilkDrop visuals running and reacting to the playing audio, with a handful of presets and a way to change preset.
- [ ] **Open local files**: "Open files…" button and drag-and-drop. Audio stays on the device; nothing uploaded.
- [ ] **Semantic control bar** (the accessible surface): Play/Pause, Previous, Next, Stop, seek slider, volume slider, current track name, and a real playlist list — all keyboard-operable with screen-reader names, wired to the same player state as Webamp.
- [ ] Live-region announcement when the track changes.
- [ ] Gertrude Radio page shell: title "Plumage — by Gertrude Radio", dark look with crimson/gold/teal accents, works at phone width.
- [ ] **About dialog** with full attribution (see CLAUDE.md) and the line "Free. No paywall. No advertising. No account."
- [ ] Short README section: how to run it locally and how to try it.
- [ ] Deployable `dist/` folder that runs as plain static files.

**Done when:** Eddie can open the page, drop in an MP3 from his own computer, hear it,
watch the visuals move, operate everything from the keyboard, and read the About credits.

## Milestone 2 — A Redbird skin

- [ ] One original Redbird classic skin (our own artwork, no copied assets).
- [ ] Skin switcher (default ↔ Redbird) plus "load a skin file" from the user's device.
- [ ] Link out to the Webamp skin museum.
- [ ] Contrast check on our skin.

## Milestone 3 — Offline renderer (first cut)

- [ ] Render one track + visuals to a video file, frame-perfect, no screen capture (WebCodecs, Chromium first).
- [ ] Choose aspect ratio (16:9 / 9:16 / 1:1).
- [ ] Progress display and cancel.

## Milestone 4 — Shaped surface (experiment)

- [ ] Prototype a non-rectangular player outline driving the same controls.
- [ ] Answer the "how is a shape defined?" open question with something that works.

## Later

Render recipes, batch rendering, loudness-aware reactivity, skin contrast auditor,
typographic visualizer mode, installable web app, Gertrude Console file format.
