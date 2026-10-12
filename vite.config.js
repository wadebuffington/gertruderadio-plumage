import { defineConfig } from "vite";

export default defineConfig({
  // Relative asset paths, so dist/ works from any folder or host.
  base: "./",
  build: {
    // Webamp is one large (~1 MB) bundle; that's expected.
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        // Preset files have spaces and brackets in their names; keep URLs plain.
        sanitizeFileName: (name) => name.replace(/[^\w.-]+/g, "-"),
      },
    },
  },
});
