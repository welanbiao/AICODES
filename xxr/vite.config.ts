import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  server: {
    host: true,
    port: 5180,
    strictPort: true,
  },
  preview: {
    host: true,
    port: 5180,
    strictPort: true,
  },
});
