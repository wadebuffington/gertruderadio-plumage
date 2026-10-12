// Opening local audio. Files are read by the browser on this device only;
// nothing is sent anywhere.

const AUDIO_EXT = /\.(mp3|m4a|aac|ogg|oga|opus|wav|flac|webm)$/i;

export function isAudio(file) {
  return file.type.startsWith("audio/") || AUDIO_EXT.test(file.name);
}

export function setupFileOpening({ button, input, dropZone, onFiles }) {
  function take(fileList) {
    const files = [...fileList];
    const audio = files.filter(isAudio);
    onFiles(audio, files.length - audio.length);
  }

  button.addEventListener("click", () => input.click());
  input.addEventListener("change", () => {
    take(input.files);
    input.value = "";
  });

  // Drag-and-drop anywhere on the page. Webamp's own windows handle their
  // own drops, so we leave those alone to avoid adding a file twice.
  let depth = 0;
  const hasFiles = (e) => [...(e.dataTransfer?.types ?? [])].includes("Files");
  const fromWebamp = (e) => e.target instanceof Element && e.target.closest("#webamp");

  window.addEventListener("dragenter", (e) => {
    if (!hasFiles(e)) return;
    depth++;
    dropZone.hidden = false;
  });
  window.addEventListener("dragleave", (e) => {
    if (!hasFiles(e)) return;
    depth = Math.max(0, depth - 1);
    if (depth === 0) dropZone.hidden = true;
  });
  window.addEventListener("dragover", (e) => {
    if (hasFiles(e)) e.preventDefault();
  });
  window.addEventListener("drop", (e) => {
    depth = 0;
    dropZone.hidden = true;
    if (!hasFiles(e) || fromWebamp(e)) return;
    e.preventDefault();
    take(e.dataTransfer.files);
  });
}
