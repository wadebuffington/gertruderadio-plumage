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
// `action` says what it does (see src/shaped/shaped.js). Prototype art: Eddie's
// cardinal concepts A and D, cut out by tools/shaped/cutout.py.

export const SHAPED_SKINS = [
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
      { type: "button", action: "stop", x: 322, y: 628, r: 15 },
      { type: "button", action: "rewind", x: 378, y: 640, r: 25 },
      { type: "button", action: "togglePlay", x: 445, y: 640, r: 33 },
      { type: "button", action: "forward", x: 512, y: 640, r: 25 },
      { type: "button", action: "open", x: 568, y: 628, r: 15 },
    ],
  },
  {
    id: "d",
    name: "Perched (concept D)",
    art: "./shaped/concept-d.webp",
    width: 798,
    height: 977,
    controls: [
      { type: "button", action: "previous", x: 260, y: 318, r: 22 },
      { type: "button", action: "shuffle", x: 313, y: 318, r: 22 },
      { type: "button", action: "next", x: 365, y: 318, r: 22 },
      { type: "button", action: "repeat", x: 418, y: 318, r: 22 },
      { type: "screen", kind: "nowplaying", x: 182, y: 362, w: 308, h: 238 },
      { type: "slider", action: "seek", x1: 196, y1: 628, x2: 478, y2: 628, w: 20 },
      { type: "button", action: "open", x: 537, y: 628, r: 19 },
      { type: "knob", action: "volume", x: 590, y: 492, r: 100, ring: 52 },
      { type: "button", action: "togglePlay", x: 590, y: 492, r: 46 },
      { type: "button", action: "rewind", x: 263, y: 688, r: 26 },
      { type: "button", action: "togglePlay", x: 338, y: 690, r: 33 },
      { type: "button", action: "forward", x: 412, y: 688, r: 26 },
      { type: "button", action: "stop", x: 475, y: 675, r: 18 },
    ],
  },
];
