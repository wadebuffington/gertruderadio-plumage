import "./style.css";
import Webamp from "webamp";
import { createPlayer, classicSize, SKINS } from "./player.js";
import { createControls } from "./controls.js";
import { createVisuals } from "./visuals.js";
import { setupFileOpening } from "./files.js";
import { PRESETS } from "./presets.js";

const $ = (sel) => document.querySelector(sel);
const messages = $("#messages");
let messageTimer = 0;
const say = (msg) => {
  // Clearing first makes screen readers repeat an identical message.
  messages.textContent = "";
  requestAnimationFrame(() => (messages.textContent = msg));
  clearTimeout(messageTimer);
  messageTimer = setTimeout(() => (messages.textContent = ""), 8000);
};
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

if (!Webamp.browserIsSupported()) {
  $("#unsupported").hidden = false;
} else {
  start();
}

function start() {
  // Double size wherever it fits; phones keep the original size.
  const player = createPlayer({ doubleSize: window.innerWidth >= 720 });
  createControls(document.body, player, say);

  // --- Classic skin surface ---------------------------------------------
  const classicHost = $("#classic-host");
  const reopenBtn = $("#classic-reopen");
  // Size the box to the classic windows, and follow if someone switches
  // double size from Webamp's own Options menu.
  let doubled = null;
  const fitClassic = () => {
    if (player.doubleSize === doubled) return;
    const changed = doubled !== null;
    doubled = player.doubleSize;
    // Covers Webamp's own Options → Double Size too.
    if (changed) player.restackClassic();
    const { width, height } = classicSize(doubled);
    classicHost.style.width = `${width}px`;
    classicHost.style.height = `${height}px`;
  };
  fitClassic();
  player.webamp.store.subscribe(fitClassic);
  // If the window gets too narrow for double size (a phone turned upright,
  // a window dragged smaller), drop back to normal size rather than overflow.
  new ResizeObserver(() => {
    if (player.doubleSize && classicHost.parentElement.clientWidth < classicSize(true).width) {
      player.setDoubleSize(false);
    }
  }).observe(classicHost.parentElement);
  player.webamp.renderInto(classicHost);
  player.webamp.onClose(() => {
    reopenBtn.hidden = false;
  });
  reopenBtn.addEventListener("click", () => {
    player.webamp.reopen();
    reopenBtn.hidden = true;
  });

  // --- Skins ---------------------------------------------------------------
  const skinSelect = $("#skin-select");
  const skinInput = $("#skin-input");
  skinSelect.append(...SKINS.map((s) => new Option(s.name, s.id)));
  skinSelect.addEventListener("change", async () => {
    const skin = SKINS.find((s) => s.id === skinSelect.value);
    if (!skin) return; // "your skin" entry: already loaded
    await player.setSkin(skin);
    say(`Classic player skin: ${skin.name}.`);
  });
  $("#skin-load").addEventListener("click", () => skinInput.click());
  skinInput.addEventListener("change", async () => {
    const file = skinInput.files[0];
    skinInput.value = "";
    if (!file) return;
    if (!/\.(wsz|zip)$/i.test(file.name)) {
      say("That isn't a skin file. Classic skins end in .wsz.");
      return;
    }
    try {
      await player.loadSkinFile(file);
    } catch {
      say(`Couldn't read ${file.name} as a skin.`);
      return;
    }
    const name = file.name.replace(/\.(wsz|zip)$/i, "");
    let mine = skinSelect.querySelector('option[value="file"]');
    if (!mine) skinSelect.append((mine = new Option("", "file")));
    mine.textContent = `Your skin: ${name}`;
    skinSelect.value = "file";
    say(`Classic player skin: ${name}.`);
  });

  // --- Opening files ------------------------------------------------------
  setupFileOpening({
    button: $("#open-files"),
    input: $("#file-input"),
    dropZone: $("#drop-zone"),
    onFiles(files, skipped) {
      const parts = [];
      if (files.length) parts.push(`Added ${plural(files.length, "track")} to the playlist.`);
      if (skipped) parts.push(`Skipped ${plural(skipped, "file")} that ${skipped === 1 ? "isn't" : "aren't"} audio.`);
      if (parts.length) say(parts.join(" "));
      if (!files.length) return;
      player.addFiles(files);
      visualsAutoStart();
    },
  });

  // --- Visuals --------------------------------------------------------------
  const presetSelect = $("#preset-select");
  const visualsToggle = $("#visuals-toggle");
  const visualsNote = $("#visuals-note");
  const stage = $("#stage");
  presetSelect.append(...PRESETS.map((p, i) => new Option(p.label, String(i))));

  const visuals = createVisuals({
    canvas: $("#visuals-canvas"),
    player,
    onPresetChange(i) {
      presetSelect.value = String(i);
      $("#preset-credit").textContent = PRESETS[i].name;
    },
  });

  // MilkDrop flashes. People who ask their system for reduced motion start
  // with visuals off and can turn them on themselves.
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let wantVisuals = !reducedMotion;

  function setVisuals(on) {
    wantVisuals = on;
    if (on && player.state.tracks.length) visuals.start();
    if (!on) visuals.stop();
    const live = visuals.running;
    visualsToggle.setAttribute("aria-pressed", String(on));
    visualsToggle.querySelector(".state").textContent = on ? "On" : "Off";
    stage.classList.toggle("is-live", live);
    visualsNote.textContent = !visuals.supported
      ? "Visuals need WebGL 2, which this browser doesn't offer. The music still plays."
      : !on
        ? "Visuals are off. Turn them on with the button below."
        : live
          ? ""
          : "Open some music and the visuals will wake up.";
  }
  function visualsAutoStart() {
    if (wantVisuals) setVisuals(true);
  }

  if (!visuals.supported) {
    visualsToggle.disabled = true;
    presetSelect.disabled = true;
    for (const b of document.querySelectorAll("[data-preset-step]")) b.disabled = true;
  }
  setVisuals(wantVisuals);
  // Webamp's own drag-and-drop also adds tracks; wake the visuals then too.
  player.subscribe((s, prev) => {
    if (prev && s.tracks.length && !prev.tracks.length) visualsAutoStart();
  });

  // Handy for poking at the player from the browser console while developing.
  if (import.meta.env.DEV) window.__plumage = { player, visuals };

  visualsToggle.addEventListener("click", () => setVisuals(!wantVisuals));
  presetSelect.addEventListener("change", () => visuals.setPreset(Number(presetSelect.value)));
  $("#preset-prev").addEventListener("click", () => visuals.previousPreset());
  $("#preset-next").addEventListener("click", () => visuals.nextPreset());

  $("#stage-fullscreen").addEventListener("click", () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else stage.requestFullscreen?.();
  });

  // --- About ------------------------------------------------------------------
  const about = $("#about-dialog");
  $("#open-about").addEventListener("click", () => about.showModal());
  $("#close-about").addEventListener("click", () => about.close());
  // Click on the dimmed backdrop closes it, like Escape does.
  about.addEventListener("click", (e) => {
    if (e.target === about) about.close();
  });
}
