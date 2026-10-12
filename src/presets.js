// A small, hand-picked set of MilkDrop presets from the butterchurn-presets
// package (MIT). Each one loads only when chosen, so the page stays light.
// `label` is the friendly name we show; `name` is the original preset title,
// kept so the authors stay credited.

export const PRESETS = [
  {
    label: "Kaleidoscope",
    name: "Aderrasi + Geiss - Airhandler (Kali Mix) - Painterly Kaleidoscope 2",
    load: () => import("butterchurn-presets/presets/converted/Aderrasi + Geiss - Airhandler (Kali Mix) - Painterly Kaleidoscope 2.json"),
  },
  {
    label: "Mindblob",
    name: "Flexi - mindblob [shiny mix]",
    load: () => import("butterchurn-presets/presets/converted/Flexi - mindblob [shiny mix].json"),
  },
  {
    label: "Cauldron",
    name: "Geiss - Cauldron - painterly 2 (saturation remix)",
    load: () => import("butterchurn-presets/presets/converted/Geiss - Cauldron - painterly 2 (saturation remix).json"),
  },
  {
    label: "Fractal drop",
    name: "Rovastar + Loadus + Geiss - FractalDrop (Triple Mix)",
    load: () => import("butterchurn-presets/presets/converted/Rovastar + Loadus + Geiss - FractalDrop (Triple Mix).json"),
  },
  {
    label: "Mandelbox explorer",
    name: "martin - mandelbox explorer - high speed demo version",
    load: () => import("butterchurn-presets/presets/converted/martin - mandelbox explorer - high speed demo version.json"),
  },
  {
    label: "Star ornament",
    name: "Zylot - Star Ornament",
    load: () => import("butterchurn-presets/presets/converted/Zylot - Star Ornament.json"),
  },
  {
    label: "Predator–prey spirals",
    name: "Flexi - predator-prey-spirals",
    load: () => import("butterchurn-presets/presets/converted/Flexi - predator-prey-spirals.json"),
  },
  {
    label: "Cube trace",
    name: "Eo.S. + Phat - cubetrace - v2",
    load: () => import("butterchurn-presets/presets/converted/Eo.S. + Phat - cubetrace - v2.json"),
  },
  {
    label: "Sherwin maxawow",
    name: "Flexi, martin + geiss - dedicated to the sherwin maxawow",
    load: () => import("butterchurn-presets/presets/converted/Flexi, martin + geiss - dedicated to the sherwin maxawow.json"),
  },
  {
    label: "Spiral movement",
    name: "Krash + Illusion - Spiral Movement",
    load: () => import("butterchurn-presets/presets/converted/Krash + Illusion - Spiral Movement.json"),
  },
];
