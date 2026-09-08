import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fbxPath = path.join(root, "iphone-12-teardown", "source", "iphone_12.fbx");
const texDir = path.join(root, "iphone-12-teardown", "textures");
const outDir = path.join(root, "public", "models");
const outGlb = path.join(outDir, "iphone12.glb");
const convertDir = path.join(root, "_convert");

fs.mkdirSync(outDir, { recursive: true });

const assimpMod = await import(pathToFileURL(path.join(convertDir, "node_modules", "assimpjs", "dist", "assimpjs.js")).href);
const ajs = await assimpMod.default();

const fileList = new ajs.FileList();
fileList.AddFile("iphone_12.fbx", fs.readFileSync(fbxPath));

for (const name of fs.readdirSync(texDir)) {
  const buf = fs.readFileSync(path.join(texDir, name));
  const aliases = [
    name,
    `textures/${name}`,
    `iphone12_ready/textures/${name}`,
    `iphone12_ready\\textures\\${name}`,
  ];
  const stem = name.replace(/\.(jpeg|jpg|png)$/i, "");
  if (/\.jpeg$/i.test(name)) {
    aliases.push(`${stem}.jpg`, `textures/${stem}.jpg`, `iphone12_ready\\textures\\${stem}.jpg`);
  }
  if (/\.jpg$/i.test(name)) {
    aliases.push(`${stem}.jpeg`);
  }
  for (const alias of aliases) {
    fileList.AddFile(alias, buf);
  }
}

console.log("converting FBX -> glb2 …");
const result = ajs.ConvertFileList(fileList, "glb2");
if (!result.IsSuccess() || result.FileCount() === 0) {
  console.error("assimp failed:", result.GetErrorCode?.() ?? "unknown");
  process.exit(1);
}

for (let i = 0; i < result.FileCount(); i++) {
  const file = result.GetFile(i);
  const name = file.GetPath ? file.GetPath() : file.GetName?.() ?? `out_${i}.glb`;
  const content = file.GetContent();
  const destName = String(name).toLowerCase().endsWith(".glb") ? path.basename(String(name)) : "iphone12.glb";
  const dest = destName === "iphone12.glb" || i === 0 ? outGlb : path.join(outDir, destName);
  fs.writeFileSync(dest, Buffer.from(content));
  console.log("wrote", dest, fs.statSync(dest).size);
}

console.log("done");
