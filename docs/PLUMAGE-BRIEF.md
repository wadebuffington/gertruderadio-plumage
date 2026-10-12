# Plumage — Decisions Brief

Distilled from *Plumage — A Working Document* (Redbird / Epiphany Press, August 2026),
which grew out of the design paper *The Gertrude Suite*. This is the developer-facing
summary. Nothing here was built when it was written.

## What Plumage is

A free, browser-based music player and visual engine. Load your own audio files,
see MilkDrop-style visuals react to them, dress the player in skins — and,
later, render frame-perfect music videos offline without screen capture.

## Settled decisions

- **Built first, built alone.** Plumage was originally half of *The Gertrude Suite*,
  alongside Gertrude Console (a release-pipeline workbench). Console is deferred.
  The future connection between them is a **documented file format**, not an
  integration, so Plumage doesn't need to know Console exists.
- **A Gertrude Radio app.** (Updated Oct 2026 — this reverses the August plan to keep
  it label-free.) Plumage carries Gertrude Radio branding, with Redbird credited as
  maker. Still no advertising, and nothing stamped onto exported video unless the
  user chooses it.
- **Browser-based and cross-platform.** Runs in a modern browser on desktop and mobile.
  Video export (later) works best in Chromium browsers.
- **Installable later as a web app** (manifest + icons + service worker). Native
  packaging only if it ever genuinely outgrows the browser.

## What we build on

| Piece | Author | License | Role |
|---|---|---|---|
| Webamp | Jordan Eldredge | MIT | Classic skin engine, transport, playlist, 10-band EQ |
| Butterchurn | Jordan Berg | MIT | MilkDrop 2 visuals in WebGL |
| butterchurn-presets | (preset collection) | see package | Visual presets |

Butterchurn has already been integrated with Webamp by its authors — trodden ground.
Webamp is a monorepo with some pieces published separately, so we can take parts
rather than the whole (open question below).

Skins: the Webamp skin museum holds a very large corpus of classic skins with
unstated per-skin terms. **Link to it; never bundle it.**

## The three surfaces (architecture)

1. **Semantic surface** — real, accessible HTML controls. Always present. Source of truth
   for state. Screen readers and keyboards drive this. (Correction to the original paper:
   classic bitmap skins cannot be the accessible surface.)
2. **Classic skin surface** — Webamp rendering classic skins, for the look and the nostalgia.
3. **Shaped surface** (later) — the Sonique lineage: *the outline is arbitrary, the function
   is constant.* A cardinal-shaped player is one skin among many, not the concept.

All three drive the same underlying player state.

## Forward features (not for the first milestone)

- **Offline renderer** — frame-perfect video of a track + visuals, no screen capture.
  This is the key differentiator over subscription services.
- **Render recipes** — saved settings (preset sequence, aspect, title cards) for repeatable renders.
- **Multi-aspect export** — 16:9, 9:16, 1:1 from one render pass where possible.
- **Loudness-aware reactivity** — visuals respond to perceived loudness, not just raw amplitude.
- **Skin contrast auditor** — flags skins whose text/controls fail contrast.
- **Typographic visualizer mode** — lyrics or titles as the visual.
- **Batch rendering** — queue several tracks.
- OpenGloss work may fold in eventually. The player comes first.

## Open questions (Eddie's call unless noted)

- How is a shape defined in the shaped-surface system — vector outline, mask image, or a
  small declarative description? Decides whether outside skinners can ever participate.
  *(Prototype answer, Oct 2026: a picture with a transparent background, whose edge is the
  outline, plus a short declarative list of controls. See src/shaped/skins.js.)*
- Does the shaped surface reuse the classic skin format (compatibility, but inherits the
  rectangle) or get its own?
- Where do render recipes live, and are they the same file Console will one day read?
- How much of Webamp do we take — the whole player, or engine pieces inside our own shell?
  *(Milestone 1 may use the whole player as the fastest path; revisit after.)*
- Should Plumage ever leave the browser? An installable web app gives it its own window
  and dock icon, but only a small native wrapper (e.g. Tauri) can give a truly
  free-floating, see-through, bird-shaped window on the desktop like Sonique. Decide
  before the shaped-surface milestone. *(Raised by Eddie, Oct 2026.)*
- Does the name "Plumage" stay? (Current answer: yes, unless Eddie says otherwise.)
