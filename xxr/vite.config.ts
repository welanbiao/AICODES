import { copyFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

const root = dirname(fileURLToPath(import.meta.url));
const MX_FILES = [
  "skybox.glb",
  "fps_arms.glb",
  "iphone_12_teardown.glb",
  "lumen_64_spark__computer.glb",
  "computer.glb",
  "connor_human.glb",
  "north_human.glb",
] as const;

function copyIfNeeded(src: string, dest: string) {
  if (!existsSync(src)) return;
  mkdirSync(dirname(dest), { recursive: true });
  if (!existsSync(dest) || statSync(src).mtimeMs > statSync(dest).mtimeMs) copyFileSync(src, dest);
}

function syncMxAssets() {
  mkdirSync(resolve(root, "public/models"), { recursive: true });
  mkdirSync(resolve(root, "public/audio"), { recursive: true });
  for (const name of MX_FILES) {
    copyIfNeeded(resolve(root, "mx", name), resolve(root, "public/models", name));
  }
  copyIfNeeded(resolve(root, "mx/credits.txt"), resolve(root, "public/credits.txt"));
  copyIfNeeded(resolve(root, "mx/weightless.mp3"), resolve(root, "public/audio/weightless.mp3"));
}

function xxrModels(): Plugin {
  return {
    name: "xxr-models",
    buildStart() {
      syncMxAssets();
    },
    configureServer() {
      syncMxAssets();
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [xxrModels()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: ["welanbiao.gnway.cc", ".gnway.cc"],
    headers: {
      "Cache-Control": "no-cache",
    },
    proxy: {
      "/v1": { target: "http://127.0.0.1:8789", changeOrigin: true },
      "/health": { target: "http://127.0.0.1:8789", changeOrigin: true },
    },
  },
  preview: {
    host: true,
    port: 5173,
    strictPort: true,
  },
});
