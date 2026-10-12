import "./style.css";
import Webamp from "webamp";
import { createPlayer, classicSize, SKINS } from "./player.js";
import { createControls } from "./controls.js";
import { createVisuals } from "./visuals.js";
import { setupFileOpening } from "./files.js";
import { PRESETS } from "./presets.js";
import { renderVideo, rendererSupported, frameSize, FPS } from "./renderer.js";
import { createShapedPlayer } from "./shaped/shaped.js";
import { SHAPED_SKINS } from "./shaped/skins.js";

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

  // --- Shaped player (experiment) -----------------------------------------
  const shaped = createShapedPlayer({
    root: $("#shaped-stage"),
    player,
    visuals,
    presets: PRESETS,
    openFiles: () => $("#file-input").click(),
    say,
  });
  const shapedPick = document.querySelectorAll('input[name="shaped-skin"]');
  // Small per-browser preferences; if storage is blocked we just use defaults.
  const pref = {
    get: (k, d) => {
      try {
        return localStorage.getItem(`plumage.${k}`) ?? d;
      } catch {
        return d;
      }
    },
    set: (k, v) => {
      try {
        localStorage.setItem(`plumage.${k}`, v);
      } catch {}
    },
  };
  const shapedChoice = pref.get("shapedSkin", "d");
  const showShaped = (id) => {
    const skin = SHAPED_SKINS.find((s) => s.id === id) ?? SHAPED_SKINS[0];
    for (const r of shapedPick) r.checked = r.value === skin.id;
    shaped.setSkin(skin);
  };
  for (const r of shapedPick) {
    r.addEventListener("change", () => {
      showShaped(r.value);
      pref.set("shapedSkin", r.value);
    });
  }
  showShaped(shapedChoice);

  // Light colour and bird colour: presets, or the person's own pick.
  const lightCustom = $("#light-custom");
  const birdCustom = $("#bird-custom");
  const radios = (name) => [...document.querySelectorAll(`input[name="${name}"]`)];
  const chosen = (name) => radios(name).find((r) => r.checked)?.value;
  function applyColors(save) {
    const lightChoice = chosen("lights");
    const light = lightChoice === "custom" ? lightCustom.value : lightChoice;
    shaped.setLights(light);
    const birdChoice = chosen("bird");
    shaped.setBirdColor(birdChoice === "natural" ? null : birdChoice === "lights" ? light : birdCustom.value);
    if (save) {
      pref.set("lights", lightChoice);
      pref.set("lightCustom", lightCustom.value);
      pref.set("bird", birdChoice);
      pref.set("birdCustom", birdCustom.value);
    }
  }
  lightCustom.value = pref.get("lightCustom", lightCustom.value);
  birdCustom.value = pref.get("birdCustom", birdCustom.value);
  for (const [name, def] of [["lights", "#ffa53a"], ["bird", "natural"]]) {
    const saved = pref.get(name, def);
    for (const r of radios(name)) r.checked = r.value === saved;
    if (!chosen(name)) radios(name)[0].checked = true;
  }
  for (const r of [...radios("lights"), ...radios("bird")]) r.addEventListener("change", () => applyColors(true));
  // Picking a colour also selects "Your own" for that row.
  lightCustom.addEventListener("input", () => {
    radios("lights").find((r) => r.value === "custom").checked = true;
    applyColors(true);
  });
  birdCustom.addEventListener("input", () => {
    radios("bird").find((r) => r.value === "custom").checked = true;
    applyColors(true);
  });
  applyColors(false);

  // --- Make a video ------------------------------------------------------------
  const renderForm = $("#render-form");
  const renderStart = $("#render-start");
  const renderWhat = $("#render-what");
  const renderProgress = $("#render-progress");
  const renderBar = $("#render-bar");
  const renderDetail = $("#render-detail");
  const renderDone = $("#render-done");
  const renderSave = $("#render-save");
  let renderJob = null; // AbortController while a render runs
  let savedUrl = null;

  const canRender = rendererSupported() && visuals.supported;
  if (!canRender) {
    $("#render-unsupported").hidden = false;
    renderForm.hidden = true;
  }
  const renderChoice = () => {
    const shape = renderForm.elements.shape.value;
    const lines = Number($("#render-lines").value);
    return { shape, lines, ...frameSize(shape, lines) };
  };
  function describeRender() {
    if (renderJob) return;
    const track = player.state.current;
    renderStart.disabled = !canRender || !track;
    if (!track) {
      renderWhat.textContent = "Open a track first.";
      return;
    }
    const { width, height } = renderChoice();
    const preset = PRESETS[visuals.presetIndex].label;
    renderWhat.textContent = `“${track.name}” with the “${preset}” visual, ${width} × ${height}.`;
  }
  player.subscribe((s, prev) => {
    if (!prev || s.current?.id !== prev.current?.id || s.current?.name !== prev.current?.name) describeRender();
  });
  renderForm.addEventListener("change", describeRender);
  presetSelect.addEventListener("change", describeRender);
  $("#preset-prev").addEventListener("click", () => setTimeout(describeRender));
  $("#preset-next").addEventListener("click", () => setTimeout(describeRender));
  describeRender();

  const minutes = (sec) => {
    const m = Math.max(1, Math.round(sec / 60));
    return `${m} minute${m === 1 ? "" : "s"}`;
  };

  renderForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const track = player.state.current;
    if (!track || renderJob) return;
    const { shape, lines, width, height } = renderChoice();
    const presetIndex = visuals.presetIndex;

    renderJob = new AbortController();
    renderStart.disabled = true;
    renderDone.hidden = true;
    renderProgress.hidden = false;
    renderBar.value = 0;
    renderDetail.textContent = "Getting ready…";
    $("#render-cancel").focus();
    say(`Making a ${width} by ${height} video of ${track.name}. This can take a few minutes.`);
    // Give the renderer the graphics card to itself; the live visuals resume after.
    const liveWasOn = visuals.running;
    visuals.stop();

    const started = performance.now();
    try {
      const { blob, ext } = await renderVideo({
        trackUrl: track.url,
        loadPreset: async () => {
          const mod = await PRESETS[presetIndex].load();
          return mod.default ?? mod;
        },
        shape,
        lines,
        signal: renderJob.signal,
        onProgress({ frame, frames }) {
          const pct = Math.floor((frame / frames) * 100);
          renderBar.value = pct;
          const spent = (performance.now() - started) / 1000;
          const left = frame > 30 ? (spent / frame) * (frames - frame) : null;
          renderDetail.textContent =
            `${pct}% · ${Math.round(frame / FPS)} of ${Math.round(frames / FPS)} seconds of video` +
            (left != null ? ` · about ${minutes(left)} left` : "");
        },
      });
      if (savedUrl) URL.revokeObjectURL(savedUrl);
      savedUrl = URL.createObjectURL(blob);
      const safeName = track.name.replace(/[\\/:*?"<>|]+/g, "-").slice(0, 80);
      renderSave.href = savedUrl;
      renderSave.download = `${safeName} - Plumage ${width}x${height}.${ext}`;
      const mb = (blob.size / 1048576).toFixed(1);
      $("#render-done-detail").textContent = `${ext.toUpperCase()}, ${width} × ${height}, ${mb} MB.`;
      renderDone.hidden = false;
      renderSave.focus();
      say("Your video is ready. Press Save video to keep it.");
    } catch (err) {
      if (err.name === "AbortError") say("Video canceled.");
      else {
        console.error(err);
        say(`Sorry, the video couldn't be made: ${err.message}`);
      }
    } finally {
      renderJob = null;
      renderProgress.hidden = true;
      if (liveWasOn) visuals.start();
      describeRender();
      // Focus was on Cancel, which just disappeared: put it somewhere sensible.
      if (renderDone.hidden) renderStart.focus();
    }
  });
  $("#render-cancel").addEventListener("click", () => renderJob?.abort());

  // --- About ------------------------------------------------------------------
  const about = $("#about-dialog");
  $("#open-about").addEventListener("click", () => about.showModal());
  $("#close-about").addEventListener("click", () => about.close());
  // Click on the dimmed backdrop closes it, like Escape does.
  about.addEventListener("click", (e) => {
    if (e.target === about) about.close();
  });
}
