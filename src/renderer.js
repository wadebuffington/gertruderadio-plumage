// Offline renderer: turns one track + one MilkDrop preset into a video file,
// frame by frame. No screen capture: we decode the whole song, hand
// Butterchurn the exact slice of audio for each frame, and encode what it
// draws. The result is the same no matter how busy the computer is.
// Everything happens in this browser tab; nothing is uploaded.
import butterchurnModule from "butterchurn";
import {
  Output,
  Mp4OutputFormat,
  WebMOutputFormat,
  BufferTarget,
  CanvasSource,
  AudioBufferSource,
  QUALITY_HIGH,
  getFirstEncodableVideoCodec,
  getFirstEncodableAudioCodec,
} from "mediabunny";

const butterchurn = butterchurnModule?.default ?? butterchurnModule;

export const FPS = 30;
const SAMPLE_RATE = 44100;
const WINDOW = 1024; // samples per frame Butterchurn looks at (its fftSize)

/** Output shapes. Sizes are even numbers, as video encoders require. */
export const SHAPES = {
  wide: { label: "Widescreen 16:9", w: 16, h: 9 },
  tall: { label: "Tall 9:16", w: 9, h: 16 },
  square: { label: "Square 1:1", w: 1, h: 1 },
};

export function frameSize(shape, lines) {
  const { w, h } = SHAPES[shape];
  // `lines` is the short side (720 or 1080), like "720p".
  const scale = lines / Math.min(w, h);
  const even = (n) => Math.round(n / 2) * 2;
  return { width: even(w * scale), height: even(h * scale) };
}

export function rendererSupported() {
  return typeof VideoEncoder !== "undefined" && typeof AudioEncoder !== "undefined";
}

/** Pick a container + codecs this browser can actually encode. */
async function chooseFormat(width, height) {
  const mp4Video = await getFirstEncodableVideoCodec(["avc"], { width, height });
  const mp4Audio = await getFirstEncodableAudioCodec(["aac", "opus"]);
  if (mp4Video && mp4Audio) {
    return { format: new Mp4OutputFormat({ fastStart: "in-memory" }), video: mp4Video, audio: mp4Audio, ext: "mp4", mime: "video/mp4" };
  }
  const webmVideo = await getFirstEncodableVideoCodec(["vp9", "vp8", "av1"], { width, height });
  const webmAudio = await getFirstEncodableAudioCodec(["opus"]);
  if (webmVideo && webmAudio) {
    return { format: new WebMOutputFormat(), video: webmVideo, audio: webmAudio, ext: "webm", mime: "video/webm" };
  }
  return null;
}

/** 1024 samples ending at `end`, as the 0–255 bytes an AnalyserNode would give. */
function bytesAt(channel, end, out) {
  for (let i = 0; i < WINDOW; i++) {
    const s = channel[end - WINDOW + i] ?? 0;
    out[i] = Math.max(0, Math.min(255, Math.round(128 + s * 127)));
  }
  return out;
}

/**
 * Render a video.
 * @param {object} job
 * @param {string} job.trackUrl   the track's (local) object URL
 * @param {() => Promise<object>} job.loadPreset  resolves to Butterchurn preset JSON
 * @param {string} job.shape      key of SHAPES
 * @param {number} job.lines      720 or 1080
 * @param {(p: {frame:number, frames:number}) => void} job.onProgress
 * @param {AbortSignal} job.signal
 * @returns {Promise<{blob: Blob, ext: string}>}
 */
export async function renderVideo({ trackUrl, loadPreset, shape, lines, onProgress, signal }) {
  const { width, height } = frameSize(shape, lines);
  const chosen = await chooseFormat(width, height);
  if (!chosen) throw new Error("This browser can't encode video. Try Chrome or Edge.");

  // 1. Decode the whole song to raw samples (stays in memory, on this device).
  const bytes = await (await fetch(trackUrl)).arrayBuffer();
  const decoder = new OfflineAudioContext(2, SAMPLE_RATE, SAMPLE_RATE);
  const audio = await decoder.decodeAudioData(bytes);
  const left = audio.getChannelData(0);
  const right = audio.numberOfChannels > 1 ? audio.getChannelData(1) : left;
  const mono = new Float32Array(left.length);
  for (let i = 0; i < mono.length; i++) mono[i] = (left[i] + right[i]) / 2;

  // 2. A private Butterchurn, drawing at the exact output size.
  const glCanvas = document.createElement("canvas");
  glCanvas.width = width;
  glCanvas.height = height;
  const visualizer = butterchurn.createVisualizer(decoder, glCanvas, { width, height, pixelRatio: 1 });
  visualizer.loadPreset(await loadPreset(), 0);
  // WebGL canvases may be cleared once the browser composites, so copy each
  // finished frame onto a plain 2D canvas for the encoder to read.
  const frameCanvas = document.createElement("canvas");
  frameCanvas.width = width;
  frameCanvas.height = height;
  const ctx = frameCanvas.getContext("2d", { alpha: false });

  // 3. The file.
  const output = new Output({ format: chosen.format, target: new BufferTarget() });
  const videoSource = new CanvasSource(frameCanvas, { codec: chosen.video, bitrate: QUALITY_HIGH });
  const audioSource = new AudioBufferSource({ codec: chosen.audio, bitrate: QUALITY_HIGH });
  output.addVideoTrack(videoSource, { frameRate: FPS });
  output.addAudioTrack(audioSource);

  const abort = async () => {
    await output.cancel().catch(() => {});
    throw new DOMException("Render canceled", "AbortError");
  };

  await output.start();
  await audioSource.add(audio);
  audioSource.close();

  const frames = Math.ceil(audio.duration * FPS);
  const tb = new Uint8Array(WINDOW);
  const tbL = new Uint8Array(WINDOW);
  const tbR = new Uint8Array(WINDOW);
  for (let f = 0; f < frames; f++) {
    if (signal?.aborted) await abort();
    const end = Math.floor(((f + 1) / FPS) * SAMPLE_RATE);
    visualizer.render({
      audioLevels: {
        timeByteArray: bytesAt(mono, end, tb),
        timeByteArrayL: bytesAt(left, end, tbL),
        timeByteArrayR: bytesAt(right, end, tbR),
      },
      elapsedTime: 1 / FPS,
    });
    ctx.drawImage(glCanvas, 0, 0);
    await videoSource.add(f / FPS, 1 / FPS); // waits when the encoder is busy
    if (f % 10 === 0) {
      onProgress?.({ frame: f, frames });
      await new Promise((r) => setTimeout(r)); // let the page breathe and repaint
    }
  }
  if (signal?.aborted) await abort();
  videoSource.close();
  await output.finalize();
  onProgress?.({ frame: frames, frames });

  // Free the GPU context straight away rather than waiting for garbage collection.
  glCanvas.getContext("webgl2")?.getExtension("WEBGL_lose_context")?.loseContext();

  return { blob: new Blob([output.target.buffer], { type: chosen.mime }), ext: chosen.ext };
}
