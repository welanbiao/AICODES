import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

const root = dirname(fileURLToPath(import.meta.url));
const MX_FILES = ["skybox.glb", "fps_arms.glb", "iphone_12_teardown.glb"] as const;

function xxrModels(): Plugin {
  return {
    name: "xxr-models",
    apply: "build",
    buildStart() {
      mkdirSync(resolve(root, "public/models"), { recursive: true });
      for (const name of MX_FILES) {
        const dest = resolve(root, "public/models", name);
        if (!existsSync(dest) && existsSync(resolve(root, "mx", name))) {
          copyFileSync(resolve(root, "mx", name), dest);
        }
      }
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
  },
  preview: {
    host: true,
    port: 5173,
    strictPort: true,
  },
});
