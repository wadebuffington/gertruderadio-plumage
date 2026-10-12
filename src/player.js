// The one player. Webamp owns the audio; every Plumage surface (the classic
// skin, the accessible control bar, the visuals) reads and drives this same
// instance, so they can never disagree about what is playing.
import Webamp from "webamp";

export function createPlayer() {
  const webamp = new Webamp({
    // Our own shortcuts live in the semantic layer; Webamp's global hotkeys
    // would fire while typing or using a screen reader.
    enableHotkeys: false,
    enableMediaSession: true,
    windowLayout: {
      main: { position: { left: 0, top: 0 } },
      equalizer: { position: { left: 0, top: 116 } },
      playlist: { position: { left: 0, top: 232 }, size: { extraHeight: 2, extraWidth: 0 } },
    },
  });

  const listeners = new Set();
  let snapshot = readState();

  function readState() {
    const state = webamp.store.getState();
    const { trackOrder, currentTrack } = state.playlist;
    const tracks = trackOrder.map((id) => {
      const t = state.tracks[id];
      return { id, name: trackName(t), duration: t.duration ?? null };
    });
    const currentIndex = currentTrack == null ? -1 : trackOrder.indexOf(currentTrack);
    const current = currentIndex >= 0 ? tracks[currentIndex] : null;
    return {
      status: state.media.status, // PLAYING | PAUSED | STOPPED | ENDED | CLOSED
      timeElapsed: state.media.timeElapsed,
      duration: current?.duration ?? 0,
      volume: state.media.volume,
      tracks,
      currentIndex,
      current,
    };
  }

  // Webamp's store is Redux; subscribing to it is how Webamp's own UI stays
  // in sync, so it is the most reliable way for us to follow it too.
  webamp.store.subscribe(() => {
    const next = readState();
    const prev = snapshot;
    snapshot = next;
    for (const fn of listeners) fn(next, prev);
  });

  return {
    webamp,
    get state() {
      return snapshot;
    },
    subscribe(fn) {
      listeners.add(fn);
      fn(snapshot, null);
      return () => listeners.delete(fn);
    },
    analyser: () => webamp.media.getAnalyser(),

    togglePlay() {
      if (snapshot.status === "PLAYING") webamp.pause();
      else if (snapshot.tracks.length) webamp.play();
    },
    stop: () => webamp.stop(),
    next: () => webamp.nextTrack(),
    previous: () => webamp.previousTrack(),
    seek: (seconds) => webamp.seekToTime(seconds),
    setVolume: (v) => webamp.setVolume(Math.max(0, Math.min(100, Math.round(v)))),
    playIndex(index) {
      webamp.setCurrentTrack(index);
      webamp.play();
    },

    /** Add local files. Blobs stay in the browser; nothing is uploaded. */
    addFiles(files) {
      const tracks = files.map((file) => ({
        blob: file,
        defaultName: file.name.replace(/\.[^.]+$/, ""),
      }));
      if (!tracks.length) return;
      if (snapshot.tracks.length === 0) {
        webamp.setTracksToPlay(tracks);
      } else {
        const first = snapshot.tracks.length;
        webamp.appendTracks(tracks);
        if (snapshot.status !== "PLAYING") this.playIndex(first);
      }
    },
  };
}

function trackName(t) {
  if (!t) return "";
  if (t.title && t.artist) return `${t.artist} — ${t.title}`;
  return t.title || t.defaultName || "Untitled track";
}
