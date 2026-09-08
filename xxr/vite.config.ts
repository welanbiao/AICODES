import { copyFileSync, createReadStream, existsSync, mkdirSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

const root = dirname(fileURLToPath(import.meta.url));
const MX_FILES = ["skybox.glb", "fps_arms.glb", "iphone_12_teardown.glb"] as const;

function modelFile(name: string) {
  const compressed = resolve(root, "public/models", name);
  const source = resolve(root, "mx", name);
  if (existsSync(compressed) && statSync(compressed).size > 2048) return compressed;
  return source;
}

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

function xxrModelsDev(): Plugin {
  return {
    name: "xxr-models-dev",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split("?")[0] ?? "";
        const match = url.match(/^\/models\/([^/]+\.glb)$/);
        if (!match || !(MX_FILES as readonly string[]).includes(match[1])) return next();
        const file = modelFile(match[1]);
        if (!existsSync(file)) return next();
        res.setHeader("Content-Type", "model/gltf-binary");
        res.setHeader("Cache-Control", "public, max-age=86400");
        createReadStream(file).pipe(res);
      });
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [xxrModels(), xxrModelsDev()],
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
