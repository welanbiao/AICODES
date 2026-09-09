import { readFileSync } from "node:fs";
const j = JSON.parse(readFileSync("tmp-mesh-names.json", "utf8"));
function norm(name) {
  return name
    .split("_$Assimp")[0]
    .replace(/_primitive\d+$/i, "")
    .replace(/_node$/i, "")
    .replace(/_\d+$/, "")
    .replace(/\.\d+$/, "")
    .replace(/\s+/g, "_")
    .trim();
}
function uniq(arr) {
  const skip = /^(Sketchfab|root|GLTF|Lamp|Point|Spot|__root__|Root)$/i;
  const m = new Map();
  for (const n of arr) {
    const k = norm(n);
    if (!k || skip.test(k) || /^Object_\d+$/i.test(k)) continue;
    m.set(k, (m.get(k) || 0) + 1);
  }
  return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}
console.log("=== SPARK KEYS ===");
for (const [k, c] of uniq(j.spark.nodes)) console.log(c + "\t" + k);
console.log("=== PC KEYS ===");
for (const [k, c] of uniq([...j.pc.nodes, ...j.pc.meshes])) console.log(c + "\t" + k);
