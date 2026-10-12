# Preparing art for the shaped Redbird players (concepts A and D)

For Eddie. These are the bird-shaped players for Milestone 4. Making them is easiest if the
art comes in the pieces below. Nothing here is urgent. Use it as a checklist while you rework
concepts A and D.

## The big idea

The bird is the **frame**. Everything that moves or changes is **separate**, so the app can
light it up, press it and read it out loud. So the art should be the bird and the metal
body *without* the readouts and buttons painted in.

## What to make

1. **The body.** The whole bird and player housing as one image, on a **transparent
   background** (PNG). Leave the screens, buttons and sliders **empty**: blank wells,
   recesses or plain plates where they go.
2. **Each button, separately.** Play, pause, stop, previous, next, rewind, fast-forward,
   shuffle, repeat, open files, and anything else you want. Draw each one in four looks:
   - **normal**
   - **hover** (mouse over it)
   - **pressed**
   - **focused** (selected with the Tab key; a clear glowing ring or edge so it's easy to
     see with limited vision)
3. **Sliders.** For the seek bar and volume, draw the empty **track** and the **knob** as
   separate pieces.
4. **Screens.** Leave the "Now Playing" window (D) and the round clock (A) **empty**. The
   app draws the song name, the time and the spectrum bars there as live text. Also say
   whether the MilkDrop visuals should show inside D's screen. It's a natural home for them.

## Sizes

- Make the body big: about **2000 pixels across** or more. The app scales it down.
- Keep each button the same scale as the body, so the pieces line up.
- If you can, export from a layered file (Photoshop, Procreate, Affinity, Figma) with each
  piece on its own layer. Named layers like `play-normal` and `play-pressed` are perfect.

## Readability (limited vision)

- Put text on plain, dark, even areas, not on busy feathers.
- Bright orange or gold on near-black works well. Avoid orange on red.
- Every button's symbol should read clearly at small sizes. Test by viewing it shrunk to
  the size of a postage stamp.

## The outline

- The app needs to know where the bird's edge is (for clicks, and later for a
  see-through window on the desktop). The transparent background gives us that, so clean
  edges help. Feathers can stay detailed; we'll simplify the click area ourselves.

## About AI-generated art

The concept sheet came from an image generator. Before the final art ships:
- Redraw or clean it up as **your own** artwork, and keep the source files.
- Remove all generator lettering. The app supplies every word.
- Check the generator's terms allow you to use the images in a free app you publish.
