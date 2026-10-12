// The semantic surface: real buttons, labeled sliders, a real list. This is
// the accessible source of truth; the classic skin is presentation only.

export function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const s = Math.floor(seconds);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

function spokenTime(seconds) {
  const s = Math.floor(Number.isFinite(seconds) ? seconds : 0);
  const m = Math.floor(s / 60);
  const parts = [];
  if (m) parts.push(`${m} minute${m === 1 ? "" : "s"}`);
  parts.push(`${s % 60} second${s % 60 === 1 ? "" : "s"}`);
  return parts.join(" ");
}

const STATUS_WORDS = {
  PLAYING: "Playing",
  PAUSED: "Paused",
  STOPPED: "Stopped",
  ENDED: "Finished",
  CLOSED: "Stopped",
};

export function createControls(root, player, say) {
  const $ = (sel) => root.querySelector(sel);
  const playBtn = $("#ctl-play");
  const playLabel = $("#ctl-play-label");
  const playIcon = $("#ctl-play-icon");
  const seek = $("#ctl-seek");
  const elapsed = $("#ctl-elapsed");
  const total = $("#ctl-total");
  const volume = $("#ctl-volume");
  const volumeOut = $("#ctl-volume-value");
  const title = $("#now-title");
  const statusText = $("#now-status");
  const list = $("#playlist");
  const emptyNote = $("#playlist-empty");
  const announcer = $("#announcer");
  const transport = root.querySelectorAll("[data-needs-tracks]");

  const tell = (msg) => msg && say(msg);
  $("#ctl-prev").addEventListener("click", () => tell(player.previous()));
  $("#ctl-next").addEventListener("click", () => tell(player.next()));
  $("#ctl-back").addEventListener("click", () => player.skip(-10));
  $("#ctl-fwd").addEventListener("click", () => player.skip(10));
  $("#ctl-stop").addEventListener("click", () => player.stop());
  playBtn.addEventListener("click", () => player.togglePlay());

  // While the user is dragging/arrowing the seek slider, don't let playback
  // updates yank the thumb out from under them.
  let seeking = false;
  seek.addEventListener("input", () => {
    seeking = true;
    elapsed.textContent = formatTime(Number(seek.value));
    seek.setAttribute("aria-valuetext", seekText(Number(seek.value), Number(seek.max)));
  });
  seek.addEventListener("change", () => {
    player.seek(Number(seek.value));
    seeking = false;
  });
  seek.addEventListener("blur", () => (seeking = false));

  volume.addEventListener("input", () => player.setVolume(Number(volume.value)));

  list.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-index]");
    if (btn) player.playIndex(Number(btn.dataset.index));
  });

  function seekText(t, d) {
    return d ? `${spokenTime(t)} of ${spokenTime(d)}` : "No track loaded";
  }

  let listKey = "";
  function renderPlaylist(s) {
    const key = s.tracks.map((t) => `${t.id}:${t.name}:${t.duration}`).join("|") + `#${s.currentIndex}`;
    if (key === listKey) return;
    listKey = key;
    emptyNote.hidden = s.tracks.length > 0;
    list.replaceChildren(
      ...s.tracks.map((t, i) => {
        const li = document.createElement("li");
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "track";
        btn.dataset.index = String(i);
        const isCurrent = i === s.currentIndex;
        if (isCurrent) btn.setAttribute("aria-current", "true");
        const dur = t.duration ? formatTime(t.duration) : "";
        btn.setAttribute(
          "aria-label",
          `${isCurrent ? "Current track. " : ""}Play ${t.name}${t.duration ? `, ${spokenTime(t.duration)}` : ""}`,
        );
        btn.innerHTML = `<span class="track-num" aria-hidden="true">${i + 1}.</span>
          <span class="track-name"></span>
          <span class="track-time" aria-hidden="true">${dur}</span>`;
        btn.querySelector(".track-name").textContent = t.name;
        li.append(btn);
        return li;
      }),
    );
  }

  function render(s, prev) {
    const playing = s.status === "PLAYING";
    playLabel.textContent = playing ? "Pause" : "Play";
    playIcon.textContent = playing ? "❚❚" : "▶";

    const hasTracks = s.tracks.length > 0;
    for (const el of transport) el.disabled = !hasTracks;

    const d = Math.max(0, s.duration || 0);
    seek.max = String(Math.max(1, Math.floor(d)));
    seek.disabled = !s.current;
    if (!seeking) {
      seek.value = String(Math.min(s.timeElapsed, d));
      elapsed.textContent = formatTime(s.timeElapsed);
      seek.setAttribute("aria-valuetext", seekText(s.timeElapsed, d));
    }
    total.textContent = formatTime(d);

    if (document.activeElement !== volume) volume.value = String(s.volume);
    volumeOut.textContent = `${s.volume}%`;
    volume.setAttribute("aria-valuetext", `${s.volume} percent`);

    title.textContent = s.current ? s.current.name : "Nothing playing yet";
    statusText.textContent = s.current ? STATUS_WORDS[s.status] ?? "" : "Open some audio files to begin.";

    renderPlaylist(s);

    // Announce track changes (and metadata arriving for the current track)
    // in the polite live region — not every tick of the clock.
    const nowName = s.current?.name;
    const wasName = prev?.current?.name;
    if (prev && nowName && (nowName !== wasName || s.currentIndex !== prev.currentIndex)) {
      announcer.textContent = `Now playing: ${nowName}`;
    }
  }

  player.subscribe(render);
}
