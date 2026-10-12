# Plumage

A free, skinnable music player and visual engine for the browser — built on the
open Winamp/MilkDrop ecosystem (Webamp and Butterchurn), with an offline video
renderer and shaped, non-rectangular skins on the way.

**A Gertrude Radio app, made by Redbird.** Free. No paywall. No advertising. No account.

Status: Milestone 1, "It plays and it glows" — see [docs/ROADMAP.md](docs/ROADMAP.md).

## Run it on your computer

You need [Node.js](https://nodejs.org/) (version 20 or newer) installed once.
Then, in a terminal, inside this folder:

```sh
npm install      # first time only: downloads Webamp, Butterchurn and Vite
npm run dev      # starts Plumage at http://localhost:5173
```

Open <http://localhost:5173> in your browser. Stop it with Ctrl+C in the terminal.

To make the deployable version: `npm run build`. That writes a `dist/` folder of
plain static files you can upload to Cloudflare Pages (or any static host).
`npm run preview` serves that folder locally so you can check it first.

## Put it on the web (Cloudflare Pages)

Cloudflare builds Plumage from this GitHub repo — nothing to install on your computer.
In the Cloudflare dashboard: **Workers & Pages → Create → Pages → Connect to Git**,
pick `gertruderadio-plumage`, then use these settings:

| Setting | Value |
|---|---|
| Production branch | the branch with the latest work (today: `claude/epic-cannon-s65nrc`) |
| Framework preset | None (or Vite) |
| Build command | `npm run build` |
| Build output directory | `dist` |

Every new push to that branch updates the site automatically.

## Try it

1. Press **Open files…** and pick one or more MP3s (or drag them anywhere onto the
   page). They play from your own computer — nothing is uploaded.
2. Watch the **Visuals** panel react. Change the look with the preset menu or the
   ‹ › buttons; **Full screen** fills the screen (Esc to leave).
3. Put the mouse away and use **Tab** / **Shift+Tab**: every control has a visible
   focus ring. Space or Enter presses buttons; arrow keys move the position and
   volume sliders; the playlist is a real list of buttons.
4. The classic player on the right is the same player — press pause there and the
   Player panel follows, and the other way round.
5. **About** lists the credits.

If your computer is set to "reduce motion", the visuals start switched off
(MilkDrop flashes); turn them on with the **Visuals** button.

- [Project brief for Claude Code](CLAUDE.md)
- [Decisions brief](docs/PLUMAGE-BRIEF.md)
- [Roadmap](docs/ROADMAP.md)
- [First prompt](docs/FIRST-PROMPT.md)
- [Decisions log](docs/DECISIONS.md)

## Credits

Plumage builds on [Webamp](https://github.com/captbaritone/webamp) by Jordan Eldredge
and [Butterchurn](https://github.com/jberg/butterchurn) by Jordan Berg (both MIT),
which bring MilkDrop by Ryan Geiss to the web. MilkDrop presets by Flexi and many
other preset authors. Inspired by the work of Justin Frankel and Nullsoft.
Plumage is not Winamp and is not affiliated with Winamp or Nullsoft.
Full license notices: [public/THIRD-PARTY-LICENSES.txt](public/THIRD-PARTY-LICENSES.txt).
