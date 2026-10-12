# First prompt for Claude Code

Paste this into Claude Code with this repository open:

---

Hi — this is Plumage, my browser music player. Please read CLAUDE.md,
docs/PLUMAGE-BRIEF.md and docs/ROADMAP.md first.

Build **Milestone 1 only** ("It plays and it glows"). Specifically:

1. Set up the project as a small static web app (Vite is fine) with `npm run dev`
   and `npm run build`.
2. Get Webamp running in the page, with Butterchurn's MilkDrop visuals reacting to
   the music. Include a handful of presets and a way to change them.
3. Let me open audio files from my own computer — an "Open files…" button and
   drag-and-drop. Nothing gets uploaded.
4. Add the accessible control bar alongside Webamp: play/pause, previous, next, stop,
   seek, volume, current track name, and a real playlist list. Everything works from
   the keyboard and has proper screen-reader names, and it controls the same player
   as Webamp.
5. Wrap it in the Redbird look (crimson, gold, teal, serif headings), titled "Plumage",
   with an About dialog carrying the full attribution list from CLAUDE.md.
6. Run it, try it with a test audio file, fix what's broken, and commit.

Then tell me in plain language how to run it on my computer and what to try.
Don't start Milestone 2. If you hit a decision that's really mine, ask; otherwise
pick the simple option and write it down in docs/DECISIONS.md.
