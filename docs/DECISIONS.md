# Decisions log

Small decisions made during the build that the brief did not cover. Newest at the bottom.

- 2026-10-11 — Repo set up with brief, roadmap and first prompt.
- 2026-10-11 — Eddie: Plumage stays under Gertrude Radio. Branding and dark Gertrude Radio look replace the label-free Redbird plan.
- 2026-10-11 — Eddie picked cardinal concepts A ("Flight Form") and D as the direction for the shaped Redbird player. Concept sheet saved in docs/design/ as reference only.
- 2026-10-11 — Design direction from Eddie's favorite classic skins recorded in docs/design/README.md (multi-size skins, floating modules, analog meters, terminal look). Reference screenshots kept out of the repo.
- 2026-10-12 — Milestone 1 build choices:
  - **Whole Webamp player, our own visuals canvas.** Webamp (npm `webamp` 2.3.1, the
    standard bundle) is the audio engine and classic skin. Butterchurn 2.6.7 draws into
    a canvas we own, listening to Webamp's analyser (`webamp.media.getAnalyser()`),
    instead of Webamp's built-in MilkDrop window. That keeps the visuals big, and the
    canvas is ours for the offline renderer (M3) and for framing inside shaped skins (M4).
  - **One player, followed through Webamp's store.** The accessible bar reads Webamp's
    Redux store (`webamp.store`) and acts through Webamp's public methods, so the two
    surfaces can't drift apart. `src/player.js` is the only file that touches Webamp.
    The store's shape isn't a promised API — re-check it when upgrading Webamp.
  - **Ten presets, imported one by one** from `butterchurn-presets` and loaded only when
    picked. Each was checked to actually draw; one ("Living stained glass") stayed
    black and was swapped for "Spiral movement". Default: "Kaleidoscope" (it reads like
    a rose window).
  - **Visuals respect "reduce motion".** MilkDrop flashes, so if the operating system
    asks for reduced motion the visuals start off, with an on/off button always there.
  - **No single-key shortcuts yet.** Webamp's global hotkeys are off, and we added none
    of our own: one-letter shortcuts clash with screen readers (WCAG 2.1.4). Everything
    is reachable with Tab. Can revisit with a settings toggle.
  - **System fonts only.** Web fonts from a font service would be a third-party network
    call (hard rule 6). Character comes from a serif display stack plus monospace labels.
  - **Webamp's default skin, for now.** The roadmap calls for it in M1. It is Webamp's
    built-in copy of the classic base skin, so its title bars say "WINAMP". Milestone 2's
    Redbird skin replaces it as the default. (Flagged to Eddie.)
  - **License notices** for Webamp (whose npm package leaves out its LICENSE — copied
    from the upstream repo), Butterchurn and butterchurn-presets are in
    `public/THIRD-PARTY-LICENSES.txt`, shipped with the site and linked from About.
  - **Gertrude Radio mark.** A small original rose-window emblem (`public/favicon.svg`)
    in crimson/gold/teal, used as the icon and in the header. Placeholder until Eddie
    has a real Gertrude Radio mark he wants used.
- 2026-10-12 — Hosting: Cloudflare Pages connected to the GitHub repo (it runs
  `npm run build` and serves `dist/`), so Eddie never has to install Node. `.node-version`
  pins Node 22 for Cloudflare's build.
- 2026-10-12 — After Eddie's first try:
  - **Rewind / fast-forward added** (⏪ ⏩, 10 seconds). ⏮ ⏭ stay "previous/next track";
    ⏮ restarts the song if it's more than 3 seconds in (like a CD player). When a button
    can't do anything (one track only, last track), a short message says so on screen and
    to screen readers instead of silently doing nothing.
  - **Classic player starts at double size** when the window is at least 720px wide, so
    the 275px-wide pixel skins are readable; phones keep normal size, and it drops back to
    normal if the window gets too narrow. The playlist window is widened to match. Webamp's
    own Options → Double Size still works. (Webamp's playlist *text* doesn't double — that's
    Webamp; our own Playlist panel is the large, readable one.)
  - **Layout:** two independent columns so tall panels no longer leave gaps; the side
    column is 600px to hold the double-size player.
