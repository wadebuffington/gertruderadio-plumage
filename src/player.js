// The one player. Webamp owns the audio; every Plumage surface (the classic
// skin, the accessible control bar, the visuals) reads and drives this same
// instance, so they can never disagree about what is playing.
import Webamp from "webamp";

// Classic windows are 275px wide (550 at double size); the playlist window
// grows in 25px x 29px steps, so it is widened to sit flush under the others.
function classicLayout(doubled) {
  const k = doubled ? 2 : 1;
  return {
    main: { position: { left: 0, top: 0 } },
    equalizer: { position: { left: 0, top: 116 * k } },
    playlist: {
      position: { left: 0, top: 232 * k },
      size: doubled ? { extraWidth: 11, extraHeight: 4 } : { extraWidth: 0, extraHeight: 2 },
    },
  };
}

/** Pixel size of the whole classic stack, for the box that holds it. */
export function classicSize(doubled) {
  return doubled ? { width: 550, height: 696 } : { width: 275, height: 406 };
}

/** Skins we ship. Redbird is our own artwork (tools/redbird-skin). */
export const SKINS = [
  { id: "redbird", name: "Redbird (Plumage)", url: "./skins/redbird.wsz" },
  { id: "base", name: "Webamp default", url: null },
];

export function createPlayer({ doubleSize = false } = {}) {
  const webamp = new Webamp({
    // Our own shortcuts live in the semantic layer; Webamp's global hotkeys
    // would fire while typing or using a screen reader.
    enableHotkeys: false,
    enableMediaSession: true,
    // Despite the name, this sets whether Webamp *starts* in double size.
    // It can still be switched from Webamp's own Options menu.
    enableDoubleSizeMode: doubleSize,
    windowLayout: classicLayout(doubleSize),
    initialSkin: { url: SKINS[0].url },
    // Also offered in Webamp's own Options → Skins menu.
    availableSkins: SKINS.filter((s) => s.url).map(({ url, name }) => ({ url, name })),
  });

  const listeners = new Set();
  let snapshot = readState();

  function readState() {
    const state = webamp.store.getState();
    const { trackOrder, currentTrack } = state.playlist;
    const tracks = trackOrder.map((id) => {
      const t = state.tracks[id];
      // `url` is a local object URL for files opened from this device.
      return { id, name: trackName(t), duration: t.duration ?? null, url: t.url };
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

  // With an empty playlist Webamp's display reads "Winamp 2.91". Show our own
  // name there instead, and step aside the moment there's music (or another
  // message, like "Volume: 50%", that Webamp wants to show).
  const IDLE_TEXT = "Plumage - by Gertrude Radio";
  function keepIdleText() {
    const state = webamp.store.getState();
    const empty = state.playlist.trackOrder.length === 0;
    const message = state.userInput.userMessage;
    if (empty && message == null) webamp.store.dispatch({ type: "SET_USER_MESSAGE", message: IDLE_TEXT });
    else if (!empty && message === IDLE_TEXT) webamp.store.dispatch({ type: "UNSET_USER_MESSAGE" });
  }
  keepIdleText();
  webamp.store.subscribe(keepIdleText);

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

    /** Classic skins are ~275px wide; double size makes them readable on today's screens. */
    get doubleSize() {
      return webamp.store.getState().display.doubled;
    },
    setDoubleSize(on) {
      if (this.doubleSize !== on) webamp.store.dispatch({ type: "TOGGLE_DOUBLESIZE_MODE" });
      this.restackClassic();
    },
    /** Put the three classic windows back in a tidy stack for the current size. */
    restackClassic() {
      const layout = classicLayout(this.doubleSize);
      const { extraWidth, extraHeight } = layout.playlist.size;
      webamp.store.dispatch({ type: "WINDOW_SIZE_CHANGED", windowId: "playlist", size: [extraWidth, extraHeight] });
      webamp.store.dispatch({
        type: "UPDATE_WINDOW_POSITIONS",
        // Once rendered, Webamp keeps positions in its own coordinates, so
        // stack relative to wherever the main window currently is.
        positions: Object.fromEntries(
          ["main", "equalizer", "playlist"].map((id) => {
            const origin = webamp.store.getState().windows.genWindows.main.position;
            const p = layout[id].position;
            return [id, { x: origin.x + p.left, y: origin.y + p.top }];
          }),
        ),
        absolute: false,
      });
    },

    /** Switch the classic skin: one of SKINS, or a skin file from the user's device. */
    async setSkin(skin) {
      if (skin.url) webamp.setSkinFromUrl(skin.url);
      else webamp.store.dispatch({ type: "LOAD_DEFAULT_SKIN" });
      await webamp.skinIsLoaded();
    },
    async loadSkinFile(file) {
      // An object URL keeps the file on this device; nothing is uploaded.
      const url = URL.createObjectURL(file);
      try {
        webamp.setSkinFromUrl(url);
        await webamp.skinIsLoaded();
      } finally {
        URL.revokeObjectURL(url);
      }
    },

    togglePlay() {
      if (snapshot.status === "PLAYING") webamp.pause();
      else if (snapshot.tracks.length) webamp.play();
    },
    stop: () => webamp.stop(),

    /** Next track. Returns a message to show when there is nowhere to go. */
    next() {
      const { currentIndex, tracks } = snapshot;
      const atEnd = currentIndex >= tracks.length - 1;
      if (atEnd && !webamp.isRepeatEnabled() && !webamp.isShuffleEnabled()) {
        return tracks.length === 1 ? "There's only one track. Open more files to skip ahead." : "This is the last track.";
      }
      webamp.nextTrack();
      return null;
    },

    /** Like a CD player: restart the song if it's been playing a while, else go back one. */
    previous() {
      if (snapshot.timeElapsed > 3 || snapshot.currentIndex <= 0) {
        webamp.seekToTime(0);
        return snapshot.currentIndex <= 0 ? "Back to the start of the track." : null;
      }
      webamp.previousTrack();
      return null;
    },

    /** Jump forward (positive) or back (negative) within the current track. */
    skip(seconds) {
      const end = Math.max(0, (snapshot.duration || 0) - 1);
      webamp.seekToTime(Math.min(end, Math.max(0, snapshot.timeElapsed + seconds)));
    },
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
