# Plumage — project brief for Claude Code

Plumage is a free, skinnable music player and visual engine that runs in the
browser. It is built on the open Winamp/MilkDrop ecosystem (Webamp + Butterchurn),
is a **Gertrude Radio** app, and will eventually grow an offline video
renderer and a surface system that is not required to be a rectangle.

Author: Eddie (Redbird), released under the Gertrude Radio label. Free. No paywall. No advertising. No account.

Read `docs/PLUMAGE-BRIEF.md` for the full set of decisions and `docs/ROADMAP.md`
for milestone order. **Only work on the current milestone** (see ROADMAP).

## Hard rules

1. **Branding.** Plumage is a Gertrude Radio app: "Plumage — by Gertrude Radio".
   Gertrude Radio branding is welcome in the UI, About screen and page title, with
   Redbird credited as the maker. Keep it tasteful — no ads, no pop-ups, nothing
   stamped over the user's own music or exported video unless they choose it.
2. **Never call it Winamp.** Do not use the Winamp name, logo, or Nullsoft sample
   audio. Webamp's code is MIT; the Winamp name and interface design remain
   Nullsoft's. Describe Plumage as "built on Webamp and Butterchurn."
3. **Attribution.** Preserve every upstream license notice. The About screen credits:
   - Jordan Eldredge — Webamp (MIT)
   - Jordan Berg — Butterchurn (MIT)
   - Ryan Geiss — MilkDrop
   - Flexi and the MilkDrop preset authors — presets
   - Justin Frankel / Nullsoft — inspiration only (not a code dependency)
   Re-check the licenses in `node_modules`/the repos before shipping; licensing is
   the one thing that can change without warning.
4. **No bundled third-party skins.** Ship only skins we make. Link out to the
   Webamp skin museum; do not copy skins into the repo.
5. **Accessibility is non-negotiable (Section 508 / WCAG 2.1 AA).** Classic bitmap
   skins cannot be the accessible surface. Plumage always has a separate semantic
   control layer — real `<button>`s, labeled sliders, a real list for the playlist,
   full keyboard operation, visible focus, screen-reader names, and live-region
   announcements for track changes. The skinned surface is presentation; the
   semantic layer is the source of truth. Any external link: keyboard-reachable,
   real accessible name, `rel="noopener"`.
6. **Local files stay local.** The user picks audio files from their own device;
   nothing is uploaded anywhere. No analytics, no trackers, no network calls except
   loading our own static assets.
7. **Static site.** No backend. The build output must deploy as plain static files
   (target: Cloudflare Pages). A small Vite setup is fine; keep dependencies few.

## Look (Gertrude Radio)

- Dark-first: modern, inviting to people into tech and music — hacker / futuristic
  "underground cathedral" mood, with stained-glass moments of color. Not churchy,
  not the light Epiphany Press booklet style.
- Accent palette (the stained glass): crimson `#9B1B30`, gold `#B8860B`, teal `#1F6E6E`,
  on deep near-black backgrounds. Brighten accents as needed for contrast on dark.
- Headings can carry a bit of character; controls stay clean and legible.
- Text/background contrast must meet AA. Eddie has limited vision — generous sizes,
  strong focus outlines, nothing that relies on color alone.

## Working style

- Small, testable steps. Get something playing before polishing.
- Run the dev server and actually try it (load a local MP3, confirm visuals react)
  before calling a step done.
- Commit with plain-English messages. Update `docs/ROADMAP.md` checkboxes as work completes.
- When a decision isn't covered here or in the brief, pick the simple option, note it
  in `docs/DECISIONS.md`, and keep going. Ask Eddie only for things that are genuinely his call.
- Eddie is not a full-time programmer. When reporting back, explain what changed and
  how to try it in plain language.
