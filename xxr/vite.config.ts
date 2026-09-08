import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: ["welanbiao.gnway.cc", ".gnway.cc"],
  },
  preview: {
    host: true,
    port: 5173,
    strictPort: true,
  },
});
