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
- 2026-10-12 — Milestone 2 (Eddie chose option C: a working skin now, his art later):
  - **Redbird skin is drawn by a script** (`tools/redbird-skin/build.py`, Python + Pillow), pixel by
    pixel, so it is plainly original — no traced or recoloured skin assets. It writes
    `public/skins/redbird.wsz`; the site build only uses that file. Sprite positions come from
    Webamp's own sprite map. Palette after concepts A and D: gunmetal, crimson trim, orange LCD,
    gold labels.
  - **Contrast check lives in the generator**: every text/background pair is measured and the
    script refuses to build below 4.5:1. Inactive-window titles are deliberately dim (WCAG exempts
    inactive UI).
  - **Redbird is now the default skin**, so the "WINAMP" title bars no longer show by default. The
    picker still offers "Webamp default" (it ships inside the Webamp library, not as a file of ours)
    for comparison; Webamp's own Options → Skins menu lists both too.
  - **Loading a skin file** uses a local object URL — the file never leaves the device. Only `.wsz`
    / `.zip` are accepted. The choice isn't remembered between visits yet (simple first).
  - **Eddie's A and D concepts are shaped skins, not classic ones.** The classic format is a fixed
    rectangle with fixed button spots, so A/D belong to Milestone 4. Art checklist for them:
    `docs/design/SHAPED-SKIN-ART.md`.
- 2026-10-12 — With an empty playlist Webamp's display says "Winamp 2.91". We now show
  "Plumage - by Gertrude Radio" there instead (via Webamp's user-message slot), cleared as soon
  as music loads. Also: Cloudflare's first Milestone 2 deploy failed with an internal error on
  their side (build passed); "Retry deployment" fixed it.
- 2026-10-12 — Milestone 3 (offline renderer):
  - **How it works:** the whole track is decoded in the browser, then for each video frame
    (30 per second) a private Butterchurn is handed exactly the 1024 audio samples ending at
    that moment and a fixed 1/30 s time step, and its picture is encoded. No screen capture, so
    frames are never dropped (tested: 15 s → exactly 450 frames). Live visuals pause during a
    render to leave the graphics card to it, and resume after.
  - **Video files are written by Mediabunny** (Vanilagy, MPL-2.0, used unmodified; notice in
    THIRD-PARTY-LICENSES.txt and About). It's the maintained successor to mp4-muxer.
  - **Format:** MP4 with H.264 + AAC when the browser can encode them (Chrome/Edge on Mac and
    Windows), falling back to Opus audio, then to WebM (VP9 + Opus) — e.g. open-source Chromium
    builds. Quality "high" preset; 30 fps; 720p (default, faster) or 1080p.
  - **Uses the current track and the current preset.** Changing presets during a video, title
    cards, and saved settings are Milestone "Later" (render recipes).
  - **The finished file is held in memory** until saved (about 1 MB per second of 720p video).
    Fine for songs; very long mixes may need streaming straight to disk later (Chrome can).
  - Nothing is stamped on the video (hard rule 1).
- 2026-10-12 — Milestone 4 (shaped player prototype). Eddie: build it from the concept pictures
  as they are; he'll redraw after trying it. He's fine with it being on the live site.
  - **A shape = artwork + a list of controls.** The transparent edge of the picture is the outline;
    `src/shaped/skins.js` lists buttons (circles), sliders (straight tracks), knobs (turned), screens
    (drawn live) and lights, in the art's own pixel coordinates. Simple enough for outside artists.
  - **Cut-outs are made by script** (`tools/shaped/cutout.py`: dark blue-grey background flooded
    away from the edges; the cardinal's neutral-black mask is kept). Sources: `docs/design/concept-a.jpg`
    and `concept-d.jpg` (Eddie's crops of the concept sheet).
  - **Every painted control is a real control laid over it**: `<button>`s, or `role="slider"`
    elements with arrow/Page/Home/End keys and dragging. Names and states for screen readers; gold focus
    ring; toggles show a teal ring *and* a dot (not colour alone); hit areas never under 26px.
  - **Painted readouts are covered by live screens** (time, status, scrolling title, spectrum, level
    meter), so the generator's garbled lettering never shows. They're `aria-hidden`; the Player panel says
    the same things in words.
  - Mapping chosen for the prototype: A — flower = next visual, knob = choose visual, left sliders =
    volume and balance; D — big button = play/pause, its outer ring = volume dial. Easy to change.
  - The page now carries `<meta name="robots" content="noindex">`, asking search engines not to list it
    while it's experimental. Remove it when Plumage is ready to be found.
  - The chosen bird (A or D) is remembered in the browser (localStorage); nothing leaves the device.
- 2026-10-12 — Eddie tried both birds; **Perched (D) is the default** (A stays in the picker).
  His notes, and what changed:
  - **Hover labels** on every shaped control (also shown on keyboard focus, with the value for
    sliders/dials). Big text, dismissed with Escape, stays while hovered (WCAG 1.4.13). Touch
    screens don't hover; screen readers already get the names.
  - **Play buttons show the real state**: a live cap over each painted play/pause face shows ▶ or ❚❚.
  - **Volume ring = backlit slots in the metal** (21 slots round the dark band, lit up to the volume,
    flickering slightly with the music) instead of a wide orange band. The art's four fixed lit
    slots are painted over so every slot is live.
  - **Light colours**: Amber (default), Green (terminal), Blue, White, or "your own" (colour
    picker). Screens, spectrum, sliders, lights and the volume slots all follow; non-amber
    themes get matching dark glass.
  - **Bird colour**: Natural red, Match the lights, or your own. Done by turning the art's hue (CSS
    hue-rotate); pale picks give a silver bird. The painted icons turn with it — fine for the
    prototype; separate button art (see SHAPED-SKIN-ART.md) will fix that in the redraw.
  - Choices are remembered in this browser only.
- 2026-10-13 — Eddie's second round on Perched (D):
  - **Stop is a plain square** (industry standard): a live cap over the painted button.
  - **The screen fits its glass exactly.** The glass outline is traced from the art
    (`tools/shaped/cutout.py` → `public/shaped/concept-d-screen.png`) and used as a mask, so the
    live screen fills the curved left edge and no longer spills onto the bird's chest.
  - **Red bird only.** Bird recolouring removed; the screen & light colour choice stays.
  - **Screen pages** with small ‹ › arrows on the screen: Now playing (spectrum) → Track info →
    Up next → Visuals. Visuals shows the live MilkDrop picture inside the glass, with ‹ › to change
    visual and a full-screen button (uses the big visuals stage). Opening that page switches the
    visuals on if they were off. Arrow labels say where they go ("Next page: Up next").
  - **Cyborg plates: not removed by code.** A recolour attempt just made red armour; painting
    real feathers needs an artist or an image generator. Suggested to Eddie: edit the concept in
    Nano Banana (prompt in docs/design/README.md), then re-run the cut-out script.
- 2026-10-13 — **New Perched (D) art from Eddie**: his Nano Banana edit with the metal plates removed
  (natural red feathers), at about 2x resolution. Image alignment showed it's the original at 1.958x
  with identical framing, so every control position still holds. The cut-out is pinned to the old
  frame and written at 2x for sharpness on high-density screens (`FRAMES` in tools/shaped/cutout.py).
  Its near-black face mask has a hint of blue, so very dark pixels are kept in the bird (`min_lum`).
- 2026-10-13 — **First finished button art from Eddie**: the glowing "open files" button
  (`docs/design/button-open.jpg`) now sits on D's open button. Button pictures are cut to a round
  image by `tools/shaped/buttons.py` and placed with a skin control's `face.image`. Being a picture,
  it keeps its own amber glow whatever screen colour is chosen.
- 2026-10-13 — **Eddie's button set** (`docs/design/buttons-set-1.jpg`: stop, rewind, play,
  fast-forward, volume, previous, pause, next, repeat, shuffle). `tools/shaped/buttons.py` finds the
  ten discs automatically and cuts each to a round image. On D they now replace the painted
  previous / shuffle / next / repeat (top row) and rewind / play-pause / fast-forward / stop (bottom
  row); the play button switches between Eddie's play and pause pictures (`face.images`). The big
  centre button keeps its red dome with a live icon. The volume button is cut and ready for a future
  mute control.
- 2026-10-13 — Re-measured every D button on the new (plate-free) art at 4x zoom: the bottom row had
  shifted ~6 units right and the top row a few units, which made the dark rims look uneven. Faces now
  sized to fill each painted socket. The big centre play button is now a **glass dome** (see-through
  red, top shine, a glint, warm under-glow) with a larger icon; Eddie likes it.
- 2026-10-13 — **The Aviary**: Eddie's raven, barn owl, mockingbird and phoenix (`docs/design/bird-*.jpg`)
  share concept D's player at the same framing (0.972x, offset -7/+30 px), so they reuse the "Perched"
  control map. Cut-outs read each backdrop colour from the corners; pale backdrops get a 3px edge trim
  (no white fringe); the phoenix also has interior black pockets cleared, with the player area protected.
  The bird picker is now built from `SHAPED_SKINS`. Concept D is labelled "Cardinal", concept A
  "Flight Form (cardinal, wings up)".
- **Mute button** (Eddie's speaker picture) left of rewind on the Perched layout: toggles volume to 0 and
  back to the previous level; shows a teal ring + a slash when muted; drawn socket since the art has none.
