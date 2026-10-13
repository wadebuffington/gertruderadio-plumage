// Shaped skins: the outline is the art's transparent edge; the controls are
// listed here, in the art's own pixel coordinates. This is Plumage's answer
// to "how is a shape defined?" — artwork + a small description — so other
// artists could make one with nothing but a picture and a list like this.
//
// Control types
//   button  {x, y, r}              round hit area centred on (x, y)
//   slider  {x1, y1, x2, y2, w}    a straight track from 1 → 2, w px thick
//   knob    {x, y, r}              turn it; drag around, or arrow keys
//   screen  {x, y, w, h} | {x, y, r}   live text/graphics drawn by the app
//   led     {x, y, r}              a light that glows for a state
//
// Extras: a button's `face` {r, from, to, icon} lays a live cap over the
// painted face, so its icon can change (play ↔ pause) or be redrawn (stop ■);
// `face.image` uses a finished button picture instead (tools/shaped/buttons.py).
// A button with `page` only shows on that page of a paged screen. A screen's
// `mask` is its glass outline (traced from the art by tools/shaped/cutout.py). A knob's `slots` paints a ring
// of backlit slots between radii `inner` and `outer`, lit up to its value;
// `ring` is the radius inside which the knob ignores the pointer (another
// control sits there).
//
// `action` says what it does (see src/shaped/shaped.js). Prototype art: Eddie's
// cardinal concepts A and D, cut out by tools/shaped/cutout.py.

export const SHAPED_SKINS = [
  {
    id: "d",
    name: "Perched (concept D)",
    art: "./shaped/concept-d.webp",
    width: 798,
    height: 978,
    controls: [
      { type: "button", action: "previous", x: 259, y: 315, r: 22, face: { r: 18.5, image: "./shaped/button-previous.webp" } },
      { type: "button", action: "shuffle", x: 314, y: 315, r: 22, face: { r: 18.5, image: "./shaped/button-shuffle.webp" } },
      { type: "button", action: "next", x: 368, y: 315, r: 22, face: { r: 18.5, image: "./shaped/button-next.webp" } },
      { type: "button", action: "repeat", x: 421, y: 315, r: 22, face: { r: 18.5, image: "./shaped/button-repeat.webp" } },
      { type: "screen", kind: "pages", x: 168.5, y: 361.5, w: 334, h: 243.5, mask: "./shaped/concept-d-screen.png" },
      { type: "button", action: "screenPrev", x: 192, y: 386, r: 12, face: { r: 11, icon: "left", from: "#2a0a0b", to: "#0e0304" } },
      { type: "button", action: "screenNext", x: 428, y: 386, r: 12, face: { r: 11, icon: "right", from: "#2a0a0b", to: "#0e0304" } },
      { type: "button", action: "visualPrev", page: "visuals", x: 192, y: 582, r: 12, face: { r: 11, icon: "left", from: "#2a0a0b", to: "#0e0304" } },
      { type: "button", action: "visualNext", page: "visuals", x: 430, y: 582, r: 12, face: { r: 11, icon: "right", from: "#2a0a0b", to: "#0e0304" } },
      { type: "button", action: "fullscreen", page: "visuals", x: 472, y: 582, r: 12, face: { r: 11, icon: "full", from: "#2a0a0b", to: "#0e0304" } },
      { type: "slider", action: "seek", x1: 196, y1: 628, x2: 478, y2: 628, w: 20 },
      { type: "button", action: "open", x: 537, y: 628, r: 19, face: { r: 15, image: "./shaped/button-open.webp" } },
      {
        type: "knob", action: "volume", x: 592, y: 490, r: 100, ring: 66,
        slots: { inner: 69, outer: 91, r: 80, count: 21, len: 12, width: 4.5 },
      },
      { type: "button", action: "togglePlay", x: 592, y: 490, r: 46, face: { r: 38, glass: true, from: "#d23a34", to: "#4e0a10" } },
      { type: "button", action: "rewind", x: 269, y: 685.5, r: 26, face: { r: 21, image: "./shaped/button-rewind.webp" } },
      {
        type: "button", action: "togglePlay", x: 344, y: 692, r: 33,
        face: { r: 30.5, images: { play: "./shaped/button-play.webp", pause: "./shaped/button-pause.webp" } },
      },
      { type: "button", action: "forward", x: 418, y: 688.5, r: 26, face: { r: 21, image: "./shaped/button-forward.webp" } },
      { type: "button", action: "stop", x: 481, y: 677, r: 18, face: { r: 15, image: "./shaped/button-stop.webp" } },
    ],
  },
  {
    id: "a",
    name: "Flight Form (concept A)",
    art: "./shaped/concept-a.webp",
    width: 888,
    height: 977,
    controls: [
      { type: "button", action: "nextPreset", x: 365, y: 278, r: 22 },
      { type: "led", state: "playing", x: 415, y: 277, r: 8 },
      { type: "button", action: "shuffle", x: 265, y: 318, r: 19 },
      { type: "button", action: "repeat", x: 310, y: 330, r: 19 },
      { type: "knob", action: "preset", x: 245, y: 415, r: 46 },
      { type: "button", action: "previous", x: 250, y: 515, r: 19 },
      { type: "button", action: "next", x: 300, y: 502, r: 19 },
      { type: "screen", kind: "round", x: 440, y: 419, r: 84 },
      { type: "slider", action: "volume", x1: 605, y1: 498, x2: 605, y2: 350, w: 22 },
      { type: "slider", action: "balance", x1: 656, y1: 505, x2: 656, y2: 368, w: 22 },
      { type: "screen", kind: "meter", x: 312, y: 560, w: 268, h: 30 },
      { type: "button", action: "stop", x: 322, y: 628, r: 15, face: { r: 12, icon: "stop", from: "#4a1416", to: "#250809" } },
      { type: "button", action: "rewind", x: 378, y: 640, r: 25 },
      { type: "button", action: "togglePlay", x: 445, y: 640, r: 33, face: { r: 24, from: "#6e2024", to: "#3a0e10" } },
      { type: "button", action: "forward", x: 512, y: 640, r: 25 },
      { type: "button", action: "open", x: 568, y: 628, r: 15 },
    ],
  },
];
