// Shaped player: a skin whose outline is the artwork itself (see skins.js).
// Every interactive part is a real control laid over the painted one — a
// <button>, or an element with role="slider" — so it works with the keyboard
// and is named for screen readers. The painted readouts are covered by live
// screens the app draws. It drives the same player as everything else.
import { formatTime } from "../controls.js";

const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

// ------------------------------------------------------------ light colours
const hexRgb = (h) => {
  const n = parseInt(h.replace("#", "").padEnd(6, "0").slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const css = ([r, g, b], a = 1) => (a === 1 ? `rgb(${r} ${g} ${b})` : `rgb(${r} ${g} ${b} / ${a})`);

/** Everything the screens and lights draw with, derived from one light colour. */
export function lightPalette(hex) {
  const c = hexRgb(hex);
  const amber = hex.toLowerCase() === "#ffa53a";
  return {
    hex,
    lcd: css(c),
    dim: css(c, 0.16),
    line: css(c, 0.35),
    hot: css(mix(c, [255, 255, 255], 0.45)),
    // Amber keeps the red glass of Eddie's art; other colours get their own dark glass.
    glassTop: amber ? "#3b0c0d" : css(mix(c, [0, 0, 0], 0.82)),
    glassMid: amber ? "#4a1112" : css(mix(c, [0, 0, 0], 0.76)),
    glassBottom: amber ? "#170405" : css(mix(c, [0, 0, 0], 0.93)),
  };
}

/** What each action does, and how its control describes itself. */
function actions({ player, visuals, presets, openFiles, say, screen, fullscreen }) {
  const tell = (msg) => msg && say(msg);
  const needsTracks = (s) => s.tracks.length > 0;
  return {
    togglePlay: { label: (s) => (s.status === "PLAYING" ? "Pause" : "Play"), run: () => player.togglePlay(), enabled: needsTracks },
    stop: { label: () => "Stop", run: () => player.stop(), enabled: needsTracks },
    previous: { label: () => "Previous track", run: () => tell(player.previous()), enabled: needsTracks },
    next: { label: () => "Next track", run: () => tell(player.next()), enabled: needsTracks },
    rewind: { label: () => "Rewind 10 seconds", run: () => player.skip(-10), enabled: needsTracks },
    forward: { label: () => "Fast-forward 10 seconds", run: () => player.skip(10), enabled: needsTracks },
    shuffle: { label: () => "Shuffle", pressed: (s) => s.shuffle, run: () => player.toggleShuffle() },
    repeat: { label: () => "Repeat", pressed: (s) => s.repeat, run: () => player.toggleRepeat() },
    open: { label: () => "Open files…", run: () => openFiles() },
    nextPreset: { label: () => "Next visual preset", run: () => visuals.nextPreset() },
    // Say where the arrow goes, e.g. "Next page: Up next".
    screenPrev: { label: () => `Previous page: ${screen.pageName(-1)}`, run: () => screen.turn(-1) },
    screenNext: { label: () => `Next page: ${screen.pageName(1)}`, run: () => screen.turn(1) },
    visualPrev: { label: () => "Previous visual", run: () => visuals.previousPreset() },
    visualNext: { label: () => "Next visual", run: () => visuals.nextPreset() },
    fullscreen: { label: () => "Show visuals full screen", run: () => fullscreen() },

    // Sliders and knobs: a range, a current value, and how to say it.
    volume: {
      label: () => "Volume", min: 0, max: 100, step: 5,
      get: (s) => s.volume, set: (v) => player.setVolume(v), text: (v) => `${Math.round(v)} percent`,
    },
    balance: {
      label: () => "Balance", min: -100, max: 100, step: 10,
      get: (s) => s.balance, set: (v) => player.setBalance(v),
      text: (v) => (Math.abs(v) < 1 ? "Centre" : `${Math.abs(Math.round(v))} percent ${v < 0 ? "left" : "right"}`),
    },
    seek: {
      label: () => "Position in track", min: 0, max: (s) => Math.max(1, Math.floor(s.duration || 0)), step: 5,
      get: (s) => s.timeElapsed, set: (v) => player.seek(v), commitOnRelease: true, enabled: (s) => !!s.current,
      text: (v, s) => (s.current ? `${formatTime(v)} of ${formatTime(s.duration)}` : "No track loaded"),
    },
    preset: {
      label: () => "Visual preset", min: 0, max: presets.length - 1, step: 1,
      get: () => visuals.presetIndex, set: (v) => visuals.setPreset(Math.round(v)), text: (v) => presets[Math.round(v)].label,
    },
  };
}

const ICONS = {
  play: '<svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><rect x="6.5" y="5.5" width="4" height="13" rx="1"/><rect x="13.5" y="5.5" width="4" height="13" rx="1"/></svg>',
  stop: '<svg viewBox="0 0 24 24"><rect x="6.5" y="6.5" width="11" height="11" rx="1.2"/></svg>',
  left: '<svg viewBox="0 0 24 24"><path d="M15 5.5 8.5 12l6.5 6.5z"/></svg>',
  right: '<svg viewBox="0 0 24 24"><path d="M9 5.5 15.5 12 9 18.5z"/></svg>',
  full: '<svg viewBox="0 0 24 24"><path d="M5 5h5v2H7v3H5zm9 0h5v5h-2V7h-3zM5 14h2v3h3v2H5zm12 0h2v5h-5v-2h3z"/></svg>',
};

/** Pages the little screen can show, in order. */
const PAGES = [
  { id: "nowplaying", title: "NOW PLAYING", name: "Now playing" },
  { id: "info", title: "TRACK INFO", name: "Track info" },
  { id: "upnext", title: "UP NEXT", name: "Up next" },
  { id: "visuals", title: "VISUALS", name: "Visuals" },
];

const ACTION_NAMES = {
  togglePlay: "play-pause", nextPreset: "visual", previous: "prev", next: "next",
};

export function createShapedPlayer({ root, player, visuals, presets, openFiles, say, fullscreen, startVisuals }) {
  // The little screen's pages.
  let page = 0;
  let stopCopy = null; // unsubscribe from visual frames while on the Visuals page
  const snap = document.createElement("canvas"); // latest visual frame, copied as it's drawn
  const screen = {
    pageName: (offset = 0) => PAGES[(page + offset + PAGES.length) % PAGES.length].name,
    turn(step) {
      page = (page + step + PAGES.length) % PAGES.length;
      say(`Screen: ${PAGES[page].name}.`);
      watchVisuals();
      updateAll(player.state);
    },
  };
  function watchVisuals() {
    const want = PAGES[page].id === "visuals";
    if (want && !stopCopy) {
      startVisuals?.();
      stopCopy = visuals.onFrame((cv) => {
        if (snap.width !== cv.width || snap.height !== cv.height) {
          snap.width = cv.width;
          snap.height = cv.height;
        }
        snap.getContext("2d").drawImage(cv, 0, 0);
        snap.dataset.fresh = String(performance.now());
      });
    } else if (!want && stopCopy) {
      stopCopy();
      stopCopy = null;
    }
  }
  const ACT = actions({ player, visuals, presets, openFiles, say, screen, fullscreen });
  let P = lightPalette("#ffa53a");
  let skin = null;
  let parts = []; // { el, control, act, update(state) }
  let screens = [];
  let leds = [];
  let visible = false;
  let raf = 0;

  // Audio data for the screens, read from the same analyser the visuals use.
  let freq = null;
  let wave = null;
  const bars = new Float32Array(10);
  let level = 0;

  const pct = (v, total) => `${(v / total) * 100}%`;

  function placeCircle(el, c, r = c.r) {
    el.style.left = pct(c.x, skin.width);
    el.style.top = pct(c.y, skin.height);
    // Never smaller than 26px across, so small painted buttons stay easy to hit.
    el.style.width = `max(26px, ${pct(r * 2, skin.width)})`;
  }

  function makeButton(c) {
    const act = ACT[c.action];
    const el = document.createElement("button");
    el.type = "button";
    el.className = `sh-ctl sh-btn sh-${ACTION_NAMES[c.action] ?? c.action}`;
    placeCircle(el, c);
    el.addEventListener("click", () => act.run());
    // A live cap over the painted button face, so the icon can change (▶ / ❚❚).
    let face = null;
    let faceImg = null;
    if (c.face) {
      face = el.appendChild(document.createElement("span"));
      face.className = "sh-face";
      face.setAttribute("aria-hidden", "true");
      face.style.width = `${(c.face.r / c.r) * 100}%`;
      if (c.face.image || c.face.images) {
        // A finished button picture (Eddie's art) instead of a drawn cap + icon.
        // `images` gives one per state, e.g. {play, pause} for the play button.
        face.classList.add("is-image");
        faceImg = face.appendChild(document.createElement("img"));
        faceImg.src = c.face.image ?? Object.values(c.face.images)[0];
        faceImg.alt = "";
        faceImg.draggable = false;
      } else {
        if (c.face.glass) face.classList.add("is-glass");
        face.style.setProperty("--face-from", c.face.from);
        face.style.setProperty("--face-to", c.face.to);
      }
    }
    return {
      el,
      update(s) {
        if (c.page) el.hidden = PAGES[page].id !== c.page;
        if (faceImg && c.face.images) {
          const state = c.action === "togglePlay" ? (s.status === "PLAYING" ? "pause" : "play") : null;
          const src = c.face.images[state];
          if (src && faceImg.getAttribute("src") !== src) faceImg.src = src;
        } else if (face && !faceImg) {
          const icon = c.action === "togglePlay" ? (s.status === "PLAYING" ? "pause" : "play") : c.face.icon;
          if (face.dataset.icon !== icon) {
            face.dataset.icon = icon;
            face.innerHTML = ICONS[icon] ?? "";
          }
        }
        el.setAttribute("aria-label", act.label(s));
        if (act.pressed) el.setAttribute("aria-pressed", String(!!act.pressed(s)));
        if (act.enabled) el.disabled = !act.enabled(s);
      },
    };
  }

  // A slider (straight track) or knob (turned): role="slider" with full
  // keyboard support — arrows, Page Up/Down, Home/End — and pointer dragging.
  function makeRange(c, kind) {
    const act = ACT[c.action];
    const el = document.createElement("div");
    el.tabIndex = 0;
    el.setAttribute("role", "slider");
    el.className = `sh-ctl sh-${kind} sh-${c.action}`;
    const max = (s) => (typeof act.max === "function" ? act.max(s) : act.max);
    let preview = null; // value while dragging a commit-on-release slider
    let dragging = false;

    let fill, thumb, dot, ringCanvas;
    if (kind === "slider") {
      const dx = c.x2 - c.x1;
      const dy = c.y2 - c.y1;
      const vertical = Math.abs(dy) > Math.abs(dx);
      el.classList.add(vertical ? "is-vertical" : "is-horizontal");
      if (vertical) el.setAttribute("aria-orientation", "vertical");
      const len = Math.hypot(dx, dy);
      const left = Math.min(c.x1, c.x2) - (vertical ? c.w / 2 : 0);
      const top = Math.min(c.y1, c.y2) - (vertical ? 0 : c.w / 2);
      el.style.left = pct(left, skin.width);
      el.style.top = pct(top, skin.height);
      el.style.width = pct(vertical ? c.w : len, skin.width);
      el.style.height = pct(vertical ? len : c.w, skin.height);
      fill = el.appendChild(document.createElement("span"));
      fill.className = "sh-fill";
      thumb = el.appendChild(document.createElement("span"));
      thumb.className = "sh-thumb";
    } else {
      placeCircle(el, c);
      if (c.slots) {
        // Backlit slots cut into the metal ring: they light up to the volume
        // and flicker a little with the music.
        el.classList.add("is-ring");
        ringCanvas = el.appendChild(document.createElement("canvas"));
        ringCanvas.className = "sh-ring-slots";
        ringCanvas.setAttribute("aria-hidden", "true");
      } else {
        dot = el.appendChild(document.createElement("span"));
        dot.className = "sh-knob-dot";
      }
    }

    const fraction = (v, s) => {
      const lo = act.min;
      const hi = max(s);
      return hi > lo ? (v - lo) / (hi - lo) : 0;
    };
    const valueAt = (f, s) => act.min + Math.max(0, Math.min(1, f)) * (max(s) - act.min);

    function draw(v, s) {
      const f = Math.max(0, Math.min(1, fraction(v, s)));
      if (kind === "slider") {
        const vertical = el.classList.contains("is-vertical");
        // Track runs from point 1 to point 2; for our vertical sliders that's bottom → top.
        const reversed = vertical ? c.y2 < c.y1 : c.x2 < c.x1;
        const along = reversed ? 1 - f : f;
        if (vertical) {
          fill.style.height = `${f * 100}%`;
          fill.style[reversed ? "bottom" : "top"] = "0";
          thumb.style.top = `${along * 100}%`;
        } else {
          fill.style.width = `${f * 100}%`;
          fill.style[reversed ? "right" : "left"] = "0";
          thumb.style.left = `${along * 100}%`;
        }
      } else if (ringCanvas) {
        drawSlots(ringCanvas, c, f);
      } else {
        // Knob sweep: 270°, from 7:30 round to 4:30, like a hi-fi dial.
        el.style.setProperty("--turn", `${-135 + f * 270}deg`);
      }
    }

    // While dragging a commit-on-release slider (seek), show where it will go
    // but only jump there when the pointer lets go.
    function setFrom(v, commit) {
      const s = player.state;
      const clamped = Math.max(act.min, Math.min(max(s), v));
      if (act.commitOnRelease && !commit) {
        preview = clamped;
        update(s);
        return;
      }
      preview = null;
      act.set(clamped);
    }

    el.addEventListener("keydown", (e) => {
      const s = player.state;
      if (act.enabled && !act.enabled(s)) return;
      const v = act.get(s);
      const big = (max(s) - act.min) / 5;
      const moves = {
        ArrowUp: act.step, ArrowRight: act.step, ArrowDown: -act.step, ArrowLeft: -act.step,
        PageUp: big, PageDown: -big,
      };
      if (e.key in moves) setFrom(v + moves[e.key], true);
      else if (e.key === "Home") setFrom(act.min, true);
      else if (e.key === "End") setFrom(max(s), true);
      else return;
      e.preventDefault();
    });

    function pointerValue(e) {
      const s = player.state;
      const box = el.getBoundingClientRect();
      if (kind === "slider") {
        const vertical = el.classList.contains("is-vertical");
        let f = vertical ? (box.bottom - e.clientY) / box.height : (e.clientX - box.left) / box.width;
        const reversed = vertical ? c.y2 > c.y1 : c.x2 < c.x1;
        if (reversed) f = 1 - f;
        return valueAt(f, s);
      }
      const cx = box.left + box.width / 2;
      const cy = box.top + box.height / 2;
      // Angle from straight up, clockwise; map −135°…135° onto the range.
      const deg = (Math.atan2(e.clientX - cx, cy - e.clientY) * 180) / Math.PI;
      return valueAt((Math.max(-135, Math.min(135, deg)) + 135) / 270, s);
    }
    el.addEventListener("pointerdown", (e) => {
      if (act.enabled && !act.enabled(player.state)) return;
      if (c.ring) {
        // Only the ring of a ring knob turns it; the middle belongs to the button there.
        const box = el.getBoundingClientRect();
        const rr = Math.hypot(e.clientX - (box.left + box.width / 2), e.clientY - (box.top + box.height / 2));
        if (rr < (c.ring / c.r) * (box.width / 2)) return;
      }
      dragging = true;
      el.setPointerCapture(e.pointerId);
      el.focus();
      setFrom(pointerValue(e), false);
      e.preventDefault();
    });
    el.addEventListener("pointermove", (e) => dragging && setFrom(pointerValue(e), false));
    const end = (e) => {
      if (!dragging) return;
      dragging = false;
      setFrom(preview ?? pointerValue(e), true);
    };
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);

    function update(s) {
      const v = preview ?? act.get(s);
      el.setAttribute("aria-label", act.label(s));
      el.setAttribute("aria-valuemin", String(act.min));
      el.setAttribute("aria-valuemax", String(max(s)));
      el.setAttribute("aria-valuenow", String(Math.round(v)));
      el.setAttribute("aria-valuetext", act.text(v, s));
      if (act.enabled) {
        const on = act.enabled(s);
        el.setAttribute("aria-disabled", String(!on));
        el.tabIndex = on ? 0 : -1;
      }
      draw(v, s);
    }
    return { el, update };
  }

  /** Paint the dark band of the ring, then the slots: lit up to `f`, the rest dark holes. */
  function drawSlots(cv, c, f) {
    const { w } = sizeCanvas(cv);
    const ctx = cv.getContext("2d");
    const k = w / (c.r * 2); // canvas px per art px
    const cx = w / 2;
    const { inner, outer, r, count, len, width } = c.slots;
    ctx.clearRect(0, 0, w, w);
    // Fresh metal band over the painted one (which had four fixed lights).
    const band = ctx.createRadialGradient(cx, cx, inner * k, cx, cx, outer * k);
    band.addColorStop(0, "#1a1a1e");
    band.addColorStop(0.5, "#2c2c31");
    band.addColorStop(1, "#151518");
    ctx.beginPath();
    ctx.arc(cx, cx, outer * k, 0, Math.PI * 2);
    ctx.arc(cx, cx, inner * k, 0, Math.PI * 2, true);
    ctx.fillStyle = band;
    ctx.fill();
    const lit = Math.round(f * count);
    const pulse = 0.7 + 0.3 * level;
    ctx.lineCap = "round";
    for (let i = 0; i < count; i++) {
      const a = ((-135 + (i / (count - 1)) * 270 - 90) * Math.PI) / 180;
      const x1 = cx + Math.cos(a) * (r - len / 2) * k;
      const y1 = cx + Math.sin(a) * (r - len / 2) * k;
      const x2 = cx + Math.cos(a) * (r + len / 2) * k;
      const y2 = cx + Math.sin(a) * (r + len / 2) * k;
      ctx.lineWidth = width * k;
      if (i < lit) {
        ctx.globalAlpha = pulse;
        ctx.strokeStyle = P.lcd;
        ctx.shadowColor = P.lcd;
        ctx.shadowBlur = width * k * 2.2;
      } else {
        ctx.globalAlpha = 1;
        ctx.strokeStyle = "#08080a"; // an unlit hole
        ctx.shadowBlur = 0;
      }
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  function makeScreen(c) {
    const canvas = document.createElement("canvas");
    canvas.className = `sh-screen sh-screen-${c.kind}`;
    canvas.setAttribute("aria-hidden", "true"); // the Player panel says all this in words
    if (c.r) {
      placeCircle(canvas, c);
      canvas.classList.add("is-round");
    } else {
      canvas.style.left = pct(c.x, skin.width);
      canvas.style.top = pct(c.y, skin.height);
      canvas.style.width = pct(c.w, skin.width);
      canvas.style.height = pct(c.h, skin.height);
    }
    if (c.mask) {
      // Only draw inside the painted glass (its exact outline, traced from the art).
      canvas.style.maskImage = canvas.style.webkitMaskImage = `url("${c.mask}")`;
      canvas.style.maskSize = canvas.style.webkitMaskSize = "100% 100%";
      canvas.style.borderRadius = "0";
    }
    return { el: canvas, kind: c.kind, ctx: canvas.getContext("2d") };
  }

  function makeLed(c) {
    const el = document.createElement("span");
    el.className = "sh-led";
    el.setAttribute("aria-hidden", "true");
    placeCircle(el, c);
    el.style.width = pct(c.r * 2, skin.width);
    return { el, state: c.state };
  }

  // ------------------------------------------------------------ drawing
  function sizeCanvas(cv) {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(cv.clientWidth * ratio));
    const h = Math.max(1, Math.round(cv.clientHeight * ratio));
    if (cv.width !== w || cv.height !== h) {
      cv.width = w;
      cv.height = h;
    }
    return { w, h };
  }

  function glass(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, P.glassTop);
    g.addColorStop(1, P.glassBottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function lcdText(ctx, text, x, y, size, align = "center", color = P.lcd) {
    ctx.font = `700 ${size}px ${MONO}`;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.shadowColor = color;
    ctx.shadowBlur = size * 0.35;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.shadowBlur = 0;
  }

  /** Scroll text that doesn't fit, like the marquee on a hi-fi display. */
  function marquee(ctx, text, x, y, width, size, t, align = "center") {
    ctx.font = `700 ${size}px ${MONO}`;
    const tw = ctx.measureText(text).width;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x - (align === "center" ? width / 2 : 0), y - size, width, size * 2);
    ctx.clip();
    if (tw <= width) {
      lcdText(ctx, text, x, y, size, align);
    } else {
      const gap = size * 3;
      const offset = ((t / 1000) * size * 2.2) % (tw + gap);
      const start = (align === "center" ? x - width / 2 : x) - offset;
      lcdText(ctx, text, start, y, size, "left");
      lcdText(ctx, text, start + tw + gap, y, size, "left");
    }
    ctx.restore();
  }

  const STATUS = { PLAYING: "PLAYING", PAUSED: "PAUSED", STOPPED: "STOPPED", ENDED: "FINISHED", CLOSED: "STOPPED" };

  function drawRound(sc, s, t) {
    const { w, h } = sizeCanvas(sc.el);
    const ctx = sc.ctx;
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2);
    ctx.clip();
    const g = ctx.createRadialGradient(w / 2, h * 0.35, w * 0.05, w / 2, h / 2, w / 2);
    g.addColorStop(0, P.glassMid);
    g.addColorStop(1, P.glassBottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    lcdText(ctx, s.current ? STATUS[s.status] ?? "" : "PLUMAGE", w / 2, h * 0.25, w * 0.085);
    lcdText(ctx, formatTime(s.timeElapsed).padStart(5, "0"), w / 2, h * 0.5, w * 0.27);
    ctx.fillStyle = P.line;
    ctx.fillRect(w * 0.22, h * 0.66, w * 0.56, Math.max(1, w * 0.006));
    marquee(ctx, s.current ? s.current.name : "BY GERTRUDE RADIO", w / 2, h * 0.76, w * 0.62, w * 0.075, t);
    ctx.restore();
  }

  function drawMeter(sc) {
    const { w, h } = sizeCanvas(sc.el);
    const ctx = sc.ctx;
    ctx.fillStyle = "#120304";
    ctx.fillRect(0, 0, w, h);
    const n = 26;
    const gap = w * 0.006;
    const segW = (w - gap * (n + 1)) / n;
    const lit = Math.round(level * n);
    for (let i = 0; i < n; i++) {
      const hot = i / n;
      const on = i < lit;
      ctx.fillStyle = on ? (hot > 0.6 ? P.hot : P.lcd) : P.dim;
      if (on) {
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = h * 0.3;
      }
      ctx.fillRect(gap + i * (segW + gap), h * 0.18, segW, h * 0.64);
      ctx.shadowBlur = 0;
    }
  }

  // ---- the paged screen (D). Layout is in fractions of the screen box; the
  // glass outline (mask) is narrower at the top right, so rows keep clear of it.
  const ellipsize = (ctx, text, width) => {
    if (ctx.measureText(text).width <= width) return text;
    let t = text;
    while (t.length > 1 && ctx.measureText(`${t}…`).width > width) t = t.slice(0, -1);
    return `${t}…`;
  };

  function screenChrome(ctx, w, h, title) {
    lcdText(ctx, title, w * 0.43, h * 0.1, h * 0.068, "center", P.hot);
    // page dots, so it's clear there are more pages
    const n = PAGES.length;
    for (let i = 0; i < n; i++) {
      ctx.beginPath();
      ctx.arc(w * 0.43 + (i - (n - 1) / 2) * h * 0.045, h * 0.185, h * 0.011, 0, Math.PI * 2);
      ctx.fillStyle = i === page ? P.lcd : P.dim;
      ctx.fill();
    }
  }

  function drawSpectrum(ctx, w, h) {
    const cols = bars.length;
    const rows = 12;
    const left = w * 0.07;
    const areaW = w * 0.8;
    const top = h * 0.25;
    const areaH = h * 0.47;
    const cw = areaW / cols;
    const rh = areaH / rows;
    for (let c = 0; c < cols; c++) {
      const litRows = Math.round(bars[c] * rows);
      for (let r = 0; r < rows; r++) {
        const on = r < litRows;
        const y = top + areaH - (r + 1) * rh;
        ctx.fillStyle = on ? (r > rows * 0.8 ? P.hot : P.lcd) : P.dim;
        ctx.fillRect(left + c * cw + cw * 0.14, y + rh * 0.18, cw * 0.72, rh * 0.64);
      }
    }
  }

  function drawPages(sc, s, t) {
    const { w, h } = sizeCanvas(sc.el);
    const ctx = sc.ctx;
    const id = PAGES[page].id;
    const size = h * 0.068;
    glass(ctx, w, h);

    if (id === "visuals") {
      // The live MilkDrop picture, filling the glass.
      const fresh = Number(snap.dataset.fresh || 0) > performance.now() - 500;
      if (fresh && snap.width) {
        const k = Math.max(w / snap.width, h / snap.height);
        const dw = snap.width * k;
        const dh = snap.height * k;
        ctx.drawImage(snap, (w - dw) / 2, (h - dh) / 2, dw, dh);
      } else {
        lcdText(ctx, s.tracks.length ? "VISUALS ARE OFF" : "OPEN SOME MUSIC", w * 0.45, h * 0.45, size);
        lcdText(ctx, s.tracks.length ? "turn them on in the Visuals panel" : "and the visuals wake up", w * 0.45, h * 0.57, size * 0.8, "center", P.line);
      }
      // dark bands so the title and the preset name stay readable
      const top = ctx.createLinearGradient(0, 0, 0, h * 0.24);
      top.addColorStop(0, "rgb(0 0 0 / 0.75)");
      top.addColorStop(1, "rgb(0 0 0 / 0)");
      ctx.fillStyle = top;
      ctx.fillRect(0, 0, w, h * 0.24);
      const bottom = ctx.createLinearGradient(0, h * 0.78, 0, h);
      bottom.addColorStop(0, "rgb(0 0 0 / 0)");
      bottom.addColorStop(1, "rgb(0 0 0 / 0.8)");
      ctx.fillStyle = bottom;
      ctx.fillRect(0, h * 0.78, w, h * 0.22);
      screenChrome(ctx, w, h, "VISUALS");
      ctx.font = `700 ${size}px ${MONO}`;
      lcdText(ctx, ellipsize(ctx, presets[visuals.presetIndex].label.toUpperCase(), w * 0.56), w * 0.42, h * 0.905, size);
      return;
    }

    screenChrome(ctx, w, h, PAGES[page].title);

    if (id === "nowplaying") {
      drawSpectrum(ctx, w, h);
      ctx.fillStyle = P.line;
      ctx.fillRect(w * 0.05, h * 0.78, w * 0.9, Math.max(1, h * 0.006));
      marquee(ctx, s.current ? s.current.name : "Plumage — by Gertrude Radio", w * 0.06, h * 0.885, w * 0.66, size, t, "left");
      lcdText(ctx, s.current ? formatTime(s.timeElapsed) : "", w * 0.94, h * 0.885, size, "right");
      return;
    }

    if (id === "info") {
      if (!s.current) {
        lcdText(ctx, "NO TRACK YET", w * 0.45, h * 0.5, size);
        return;
      }
      marquee(ctx, s.current.name, w * 0.07, h * 0.34, w * 0.78, size * 1.15, t, "left");
      lcdText(ctx, `TRACK ${s.currentIndex + 1} OF ${s.tracks.length}`, w * 0.07, h * 0.47, size * 0.9, "left", P.hot);
      const left = Math.max(0, (s.duration || 0) - s.timeElapsed);
      lcdText(ctx, `${formatTime(s.timeElapsed)} PLAYED · ${formatTime(left)} LEFT`, w * 0.07, h * 0.58, size * 0.9, "left");
      // progress bar
      const f = s.duration ? Math.min(1, s.timeElapsed / s.duration) : 0;
      ctx.fillStyle = P.dim;
      ctx.fillRect(w * 0.07, h * 0.665, w * 0.78, h * 0.03);
      ctx.fillStyle = P.lcd;
      ctx.fillRect(w * 0.07, h * 0.665, w * 0.78 * f, h * 0.03);
      ctx.fillStyle = P.line;
      ctx.fillRect(w * 0.05, h * 0.78, w * 0.9, Math.max(1, h * 0.006));
      const on = (v) => (v ? "ON" : "OFF");
      lcdText(ctx, `VOL ${s.volume}%   SHUFFLE ${on(s.shuffle)}   REPEAT ${on(s.repeat)}`, w * 0.06, h * 0.885, size * 0.85, "left");
      return;
    }

    if (id === "upnext") {
      if (!s.tracks.length) {
        lcdText(ctx, "PLAYLIST IS EMPTY", w * 0.45, h * 0.5, size);
        return;
      }
      const start = Math.max(0, s.currentIndex);
      ctx.font = `700 ${size}px ${MONO}`;
      for (let i = 0; i < 4; i++) {
        const k = start + i;
        if (k >= s.tracks.length) break;
        const y = h * (0.33 + i * 0.12);
        const label = `${k === s.currentIndex ? "▶" : " "} ${k + 1}. `;
        lcdText(ctx, label, w * 0.06, y, size, "left", k === s.currentIndex ? P.hot : P.lcd);
        ctx.font = `700 ${size}px ${MONO}`;
        const lw = ctx.measureText(label).width;
        if (k === s.currentIndex) marquee(ctx, s.tracks[k].name, w * 0.06 + lw, y, w * 0.8 - lw, size, t, "left");
        else lcdText(ctx, ellipsize(ctx, s.tracks[k].name, w * 0.8 - lw), w * 0.06 + lw, y, size, "left");
      }
      ctx.fillStyle = P.line;
      ctx.fillRect(w * 0.05, h * 0.78, w * 0.9, Math.max(1, h * 0.006));
      const total = s.tracks.reduce((sum, tr) => sum + (tr.duration || 0), 0);
      lcdText(ctx, `${s.tracks.length} TRACK${s.tracks.length === 1 ? "" : "S"} · ${formatTime(total)}`, w * 0.06, h * 0.885, size * 0.9, "left");
    }
  }

  function readAudio() {
    let analyser;
    try {
      analyser = player.analyser();
    } catch {
      return;
    }
    if (!analyser) return;
    if (!freq || freq.length !== analyser.frequencyBinCount) freq = new Uint8Array(analyser.frequencyBinCount);
    if (!wave || wave.length !== analyser.fftSize) wave = new Uint8Array(analyser.fftSize);
    const playing = player.state.status === "PLAYING";
    analyser.getByteFrequencyData(freq);
    analyser.getByteTimeDomainData(wave);
    // Ten log-spaced bands from 60 Hz to 12 kHz, falling gently like real LEDs.
    const nyquist = analyser.context.sampleRate / 2;
    for (let b = 0; b < bars.length; b++) {
      const lo = 60 * Math.pow(200, b / bars.length);
      const hi = 60 * Math.pow(200, (b + 1) / bars.length);
      let sum = 0;
      let n = 0;
      for (let i = Math.floor((lo / nyquist) * freq.length); i <= Math.ceil((hi / nyquist) * freq.length) && i < freq.length; i++) {
        sum += freq[i];
        n++;
      }
      const v = playing && n ? sum / n / 255 : 0;
      bars[b] = Math.max(v, bars[b] * 0.86);
    }
    let rms = 0;
    for (let i = 0; i < wave.length; i++) rms += ((wave[i] - 128) / 128) ** 2;
    rms = playing ? Math.min(1, Math.sqrt(rms / wave.length) * 3.2) : 0;
    level = Math.max(rms, level * 0.88);
  }

  function frame(t) {
    raf = 0;
    if (!visible || !skin) return;
    readAudio();
    const s = player.state;
    for (const sc of screens) {
      if (sc.kind === "round") drawRound(sc, s, t);
      else if (sc.kind === "meter") drawMeter(sc);
      else if (sc.kind === "pages") drawPages(sc, s, t);
    }
    // Slider positions move with playback (the seek bar), so refresh them here too.
    for (const p of parts) if (p.el.getAttribute("role") === "slider") p.update(s);
    if (tipFor && !tip.hidden) tip.textContent = tipText(tipFor);
    raf = requestAnimationFrame(frame);
  }
  const startLoop = () => {
    if (!raf && visible && document.visibilityState === "visible") raf = requestAnimationFrame(frame);
  };

  // Only draw while the bird is on screen.
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    startLoop();
  }).observe(root);
  document.addEventListener("visibilitychange", startLoop);

  // ------------------------------------------------------------ hover labels
  // A big, readable label over the control under the mouse or keyboard focus.
  // It stays while the pointer is over it, and Escape hides it (WCAG 1.4.13).
  const tip = document.createElement("div");
  tip.className = "sh-tip";
  tip.setAttribute("aria-hidden", "true"); // controls already have names
  tip.hidden = true;
  let tipFor = null;
  let hideTimer = 0;
  const tipText = (el) => {
    const label = el.getAttribute("aria-label") ?? "";
    const value = el.getAttribute("aria-valuetext");
    return value ? `${label}: ${value}` : label;
  };
  function showTip(el) {
    clearTimeout(hideTimer);
    tipFor = el;
    tip.textContent = tipText(el);
    tip.hidden = false;
    const box = el.getBoundingClientRect();
    const host = root.getBoundingClientRect();
    tip.style.left = `${box.left + box.width / 2 - host.left}px`;
    tip.style.top = `${box.top - host.top}px`;
  }
  function hideTip(soon) {
    clearTimeout(hideTimer);
    const go = () => {
      tip.hidden = true;
      tipFor = null;
    };
    if (soon) hideTimer = setTimeout(go, 200);
    else go();
  }
  root.addEventListener("pointerover", (e) => {
    const el = e.target.closest(".sh-ctl");
    if (el && e.pointerType === "mouse") showTip(el);
  });
  root.addEventListener("pointerout", (e) => {
    const el = e.target.closest(".sh-ctl");
    if (el && !el.contains(e.relatedTarget) && e.relatedTarget !== tip) hideTip(true);
  });
  tip.addEventListener("pointerenter", () => clearTimeout(hideTimer));
  tip.addEventListener("pointerleave", () => hideTip(true));
  root.addEventListener("focusin", (e) => {
    const el = e.target.closest(".sh-ctl");
    if (el && el.matches(":focus-visible")) showTip(el);
  });
  root.addEventListener("focusout", () => hideTip(false));
  // Escape hides it wherever focus is (a mouse hover leaves focus elsewhere).
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !tip.hidden) hideTip(false);
  });

  function updateAll(s) {
    for (const p of parts) p.update(s);
    for (const l of leds) l.el.classList.toggle("is-on", l.state === "playing" && s.status === "PLAYING");
    if (tipFor && !tip.hidden) tip.textContent = tipText(tipFor);
  }
  player.subscribe((s) => skin && updateAll(s));

  return {
    /** Light colour for screens, lights and sliders (any CSS hex colour). */
    setLights(hex) {
      P = lightPalette(hex);
      root.style.setProperty("--sh-light", P.lcd);
      root.style.setProperty("--sh-light-hot", P.hot);
      if (skin) updateAll(player.state);
    },
    setSkin(next) {
      skin = next;
      // Only skins with a paged screen have pages; others start (and stay) on page one.
      if (!skin.controls.some((c) => c.kind === "pages")) page = 0;
      watchVisuals();
      root.replaceChildren();
      parts = [];
      screens = [];
      leds = [];
      root.style.aspectRatio = `${skin.width} / ${skin.height}`;
      const art = document.createElement("img");
      art.className = "sh-art";
      art.src = skin.art;
      art.alt = ""; // decorative; the controls carry the meaning
      art.draggable = false;
      root.append(art);
      for (const c of skin.controls) {
        if (c.type === "button") parts.push(makeButton(c));
        else if (c.type === "slider") parts.push(makeRange(c, "slider"));
        else if (c.type === "knob") parts.push(makeRange(c, "knob"));
        else if (c.type === "screen") screens.push(makeScreen(c));
        else if (c.type === "led") leds.push(makeLed(c));
      }
      // Screens and lights sit under the controls; controls go in skin order,
      // which is also the Tab order.
      root.append(...screens.map((s) => s.el), ...leds.map((l) => l.el), ...parts.map((p) => p.el), tip);
      tip.hidden = true;
      updateAll(player.state);
      startLoop();
    },
  };
}
