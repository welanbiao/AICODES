import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const mx = resolve(root, "mx");
const outDir = resolve(root, "public/models");
mkdirSync(outDir, { recursive: true });

const jobs = [
  { name: "skybox.glb", textureSize: "2048", preserveAnim: false },
  { name: "fps_arms.glb", textureSize: "1024", preserveAnim: false },
  { name: "iphone_12_teardown.glb", textureSize: "1024", preserveAnim: true },
];

function copy(src, dest) {
  copyFileSync(src, dest);
  console.log("copied", dest, statSync(dest).size);
}

for (const job of jobs) {
  const src = resolve(mx, job.name);
  const dest = resolve(outDir, job.name);
  if (!existsSync(src)) {
    console.error("missing", src);
    process.exitCode = 1;
    continue;
  }
  copy(src, dest);
  const args = [
    "--yes",
    "@gltf-transform/cli",
    "optimize",
    src,
    dest,
    "--compress",
    "draco",
    "--texture-compress",
    "webp",
    "--texture-size",
    job.textureSize,
  ];
  if (job.preserveAnim) {
    args.push("--flatten", "false", "--join", "false", "--simplify", "false", "--instance", "false");
  }
  if (result.status !== 0) {
    console.warn("compress failed, keeping uncompressed copy:", job.name);
    copy(src, dest);
  } else {
    console.log("compressed", dest, statSync(dest).size);
  }
}
