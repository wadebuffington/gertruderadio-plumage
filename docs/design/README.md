# Design references

## Redbird shaped-player concepts (October 2026)

![Four cardinal-shaped player concepts](redbird-player-concepts.jpg)

AI-generated concept sheet (Nano Banana Pro), made by Eddie. **Not final art.** As of
Milestone 4, concepts A and D are used *as prototype art* in the shaped-player experiment
(Eddie's call, Oct 2026), until Eddie redraws them. The generator's name on the sheet
is just its label, not part of our branding.

**Eddie's picks: Concept A ("Flight Form") and Concept D.**

- **Concept A — Flight Form.** Cardinal with wings spread; the player body sits on
  the chest — round time display in the center, transport row along the bottom,
  volume/balance sliders on the right, a knob on the left, a level meter below the
  display. Symmetrical, reads clearly at a glance. Likely the easier first shaped skin.
- **Concept D.** Cardinal perched to the right, one wing sweeping up and around a
  rectangular "Now Playing" screen with a spectrum display, track title and time,
  seek bar, transport row, and a large round play button set into the bird's side.
  Asymmetrical and more dramatic; the screen area is a natural home for the
  MilkDrop visuals.

### Notes for building from these

- They are **shaped surfaces** (the Sonique idea): the outline is the bird; the
  controls are the same Plumage controls in a new arrangement. See ROADMAP Milestone 4.
- All text on the real skin (times, track names, labels) is **live text drawn by the
  app**, not painted into the artwork. The garbled lettering in the concepts is a
  generator artifact.
- Likely construction: the bird artwork as image layers, the outline as a mask/hit
  shape, and real HTML controls positioned over it — so the skin stays clickable,
  keyboard-operable and screen-reader-labeled. The semantic control bar still exists
  underneath regardless of skin.
- Final artwork will need to be redrawn or cleaned up as original art at proper
  resolution (with layers for buttons' normal/hover/pressed/focus states).
- Check contrast of the orange-on-dark display text against AA.
- **Art checklist for preparing A and D:** [SHAPED-SKIN-ART.md](SHAPED-SKIN-ART.md).
- **Removing the metal plates from D (Eddie, Oct 2026).** Easiest in the generator that made it.
  Suggested Nano Banana edit prompt: *"Edit this image: remove the grey metal armour plates and
  rivets from the cardinal's neck and shoulder and replace them with natural red cardinal
  feathers that match the rest of the bird. Keep everything else exactly the same — same pose,
  size, position, framing, background and the whole music-player body and buttons."* Save it as
  `docs/design/concept-d.jpg` and re-run `python3 tools/shaped/cutout.py`; check the controls
  still line up (positions are in `src/shaped/skins.js`).

## Eddie's favorite classic skins — what to learn from them (October 2026)

Eddie shared screenshots of favorite Winamp and Sonique skins. **The images are not
kept in this repo** — they are other people's artwork (and several are tied to game
studios' trademarks). What follows is what makes them work, in our own words, as
direction for original Plumage skins.

- **Sonique's three sizes.** One player, three forms: a full "navigation console"
  with menus, a compact mid-size made of round linked orbs, and a tiny one-line
  strip. Plumage skins should be able to define more than one size/mode, and the
  player should move between them smoothly. (Strong candidate for the shaped-surface
  system's core idea: a skin is a family of shapes, not one shape.)
- **Round, organic modules.** Circular time displays, orbs, a chunky arrow/dial
  cluster, pieces that bulge out of the main body. Not a rectangle with decoration —
  the silhouette itself is the design.
- **Floating, detached pieces.** Some skins split the player into separate floating
  modules — round player, separate equalizer, separate playlist panel — each its own
  shape. Plumage should allow modules (player, EQ, playlist, visuals) to dock or float.
- **One loud accent on dark metal.** The strongest skins use charcoal or gunmetal with
  a single hot accent (orange, green, or blue glow). Matches the Gertrude Radio
  direction: near-black plus stained-glass accents.
- **Hardware fantasy.** Industrial chrome with pipes, rivets, gauges, indicator lights;
  gadget/handheld-device shapes. The player as an imaginary machine.
- **Analog meters.** Needle VU meters and segmented LED level meters, blue backlit
  glass. Worth building as a visualizer mode of our own alongside MilkDrop.
- **Phosphor terminal.** Monochrome green-on-black, scanline feel, everything in one
  glowing color — fits the hacker side of Gertrude Radio.
- **A whole world in a skin.** The game-themed classic skins put a full mood around
  the same standard controls (title bar, EQ sliders, playlist) — proof that function
  can stay constant while the world around it changes.

## Eddie's favorite cardinal image (October 2026)

Eddie shared a favorite photo-style cardinal **in flight**: seen from the side,
both wings raised high and fanned so every flight feather separates, tail spread
wide below, crest up, beak open, on plain white. Not kept in the repo (it is not
our artwork). Take from it: the raised, fanned wings and spread tail are the
silhouette Eddie loves — a strong match for Concept A ("Flight Form"), and a good
pose for a large Redbird skin or the app's animated "now playing" moments. Feather
separation means the outline is busy; a shaped skin will want a simplified hit shape.

Note: classic Winamp 2 skins (the rectangular ones) already load in Webamp. Users can
load their own from the Webamp skin museum — we link to it, we don't bundle them.
