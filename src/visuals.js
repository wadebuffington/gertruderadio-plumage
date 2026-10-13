// The MilkDrop stage: Butterchurn drawing into our own canvas, listening to
// the same audio Webamp is playing. Keeping the canvas ours (rather than
// Webamp's small MilkDrop window) leaves room for later work: the offline
// renderer, and shaped skins that frame the visuals.
import butterchurnModule from "butterchurn";
import isSupportedModule from "butterchurn/lib/isSupported.min.js";
import { PRESETS } from "./presets.js";

const BLEND_SECONDS = 2.5;

// Butterchurn ships as an older UMD bundle; depending on the bundler its
// export arrives either directly or wrapped in `default`.
const unwrap = (m) => (m && m.default ? m.default : m);
const butterchurn = unwrap(butterchurnModule);
const isButterchurnSupported = unwrap(isSupportedModule);

export function createVisuals({ canvas, player, onPresetChange }) {
  let visualizer = null;
  let running = false;
  let frame = 0;
  let presetIndex = 0;

  const supported = isButterchurnSupported();

  function ensureVisualizer() {
    if (visualizer || !supported) return visualizer;
    const analyser = player.analyser();
    visualizer = butterchurn.createVisualizer(analyser.context, canvas, {
      width: canvas.width,
      height: canvas.height,
      pixelRatio: 1,
    });
    // An AnalyserNode passes audio straight through, so Butterchurn can tap it.
    visualizer.connectAudio(analyser);
    resize();
    loadPreset(presetIndex, 0);
    return visualizer;
  }

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(canvas.clientWidth * ratio));
    const h = Math.max(1, Math.round(canvas.clientHeight * ratio));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    visualizer?.setRendererSize(w, h);
  }
  new ResizeObserver(resize).observe(canvas);

  async function loadPreset(index, blend = BLEND_SECONDS) {
    presetIndex = (index + PRESETS.length) % PRESETS.length;
    const chosen = presetIndex;
    onPresetChange?.(chosen);
    if (!visualizer) return;
    const mod = await PRESETS[chosen].load();
    // A slow load must not overwrite a preset picked after it.
    if (chosen === presetIndex) visualizer.loadPreset(mod.default ?? mod, blend);
  }

  // Others (the shaped player's little screen) can copy each finished frame.
  // They must do it right here: a WebGL canvas may be blank once the browser
  // has shown the frame.
  const frameListeners = new Set();
  function loop() {
    visualizer.render();
    for (const fn of frameListeners) fn(canvas);
    frame = requestAnimationFrame(loop);
  }

  return {
    supported,
    /** Call `fn(canvas)` after every rendered frame; returns an unsubscribe function. */
    onFrame(fn) {
      frameListeners.add(fn);
      return () => frameListeners.delete(fn);
    },
    get running() {
      return running;
    },
    get presetIndex() {
      return presetIndex;
    },
    start() {
      if (running || !ensureVisualizer()) return;
      running = true;
      loop();
    },
    stop() {
      running = false;
      cancelAnimationFrame(frame);
    },
    setPreset: (i) => loadPreset(i),
    nextPreset: () => loadPreset(presetIndex + 1),
    previousPreset: () => loadPreset(presetIndex - 1),
  };
}
