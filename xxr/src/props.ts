import { Color3, Mesh, MeshBuilder, Scene, StandardMaterial, TransformNode, Vector3 } from "@babylonjs/core";

function paint(scene: Scene, name: string, color: Color3, emit = 0.18) {
  const m = new StandardMaterial(name, scene);
  m.diffuseColor = color;
  m.emissiveColor = color.scale(emit);
  m.specularColor = new Color3(0.25, 0.28, 0.3);
  return m;
}

function tag(mesh: Mesh) {
  mesh.isPickable = true;
  mesh.metadata = { ...(mesh.metadata ?? {}), xxr: "level" };
  return mesh;
}

export function createLaptopProp(scene: Scene): TransformNode {
  const root = new TransformNode("level-laptop", scene);
  const metal = paint(scene, "xxrLaptopMetal", new Color3(0.16, 0.18, 0.22), 0.12);
  const dark = paint(scene, "xxrLaptopDark", new Color3(0.05, 0.06, 0.08), 0.04);
  const screen = paint(scene, "xxrLaptopScreen", new Color3(0.12, 0.35, 0.42), 0.55);

  const base = tag(MeshBuilder.CreateBox("xxrLaptopBase", { width: 0.62, height: 0.028, depth: 0.42 }, scene));
  base.parent = root;
  base.material = metal;

  const keys = tag(MeshBuilder.CreateBox("xxrLaptopKeys", { width: 0.5, height: 0.008, depth: 0.28 }, scene));
  keys.parent = root;
  keys.position = new Vector3(0, 0.018, 0.02);
  keys.material = dark;

  const track = tag(MeshBuilder.CreateBox("xxrLaptopTrack", { width: 0.12, height: 0.004, depth: 0.08 }, scene));
  track.parent = root;
  track.position = new Vector3(0, 0.018, -0.14);
  track.material = paint(scene, "xxrLaptopTrackMat", new Color3(0.1, 0.12, 0.14), 0.08);

  const lid = new TransformNode("xxrLaptopLid", scene);
  lid.parent = root;
  lid.position = new Vector3(0, 0.014, 0.2);
  lid.rotation.x = -1.05;

  const panel = tag(MeshBuilder.CreateBox("xxrLaptopLidMesh", { width: 0.62, height: 0.4, depth: 0.012 }, scene));
  panel.parent = lid;
  panel.position = new Vector3(0, 0.2, 0);
  panel.material = metal;

  const glass = tag(MeshBuilder.CreateBox("xxrLaptopGlass", { width: 0.56, height: 0.34, depth: 0.004 }, scene));
  glass.parent = lid;
  glass.position = new Vector3(0, 0.2, -0.008);
  glass.material = screen;

  root.scaling.setAll(1.15);
  return root;
}

export function createEarbudsProp(scene: Scene): TransformNode {
  const root = new TransformNode("level-earbuds", scene);
  const caseMat = paint(scene, "xxrCaseMat", new Color3(0.82, 0.84, 0.88), 0.22);
  const stemMat = paint(scene, "xxrStemMat", new Color3(0.18, 0.2, 0.24), 0.1);
  const glow = paint(scene, "xxrBudGlow", new Color3(0.2, 0.75, 0.7), 0.7);

  const box = tag(MeshBuilder.CreateBox("xxrCase", { width: 0.28, height: 0.11, depth: 0.2 }, scene));
  box.parent = root;
  box.material = caseMat;

  const lid = tag(MeshBuilder.CreateBox("xxrCaseLid", { width: 0.28, height: 0.04, depth: 0.2 }, scene));
  lid.parent = root;
  lid.position = new Vector3(0, 0.07, 0);
  lid.material = paint(scene, "xxrCaseLidMat", new Color3(0.9, 0.91, 0.93), 0.2);

  const mkBud = (side: number) => {
    const bud = new TransformNode(`xxrBud${side < 0 ? "L" : "R"}`, scene);
    bud.parent = root;
    bud.position = new Vector3(0.16 * side, 0.16, 0.02);
    const head = tag(MeshBuilder.CreateSphere(`xxrBudHead${side}`, { diameter: 0.07, segments: 10 }, scene));
    head.parent = bud;
    head.material = caseMat;
    const stem = tag(MeshBuilder.CreateCylinder(`xxrBudStem${side}`, { height: 0.09, diameter: 0.022, tessellation: 8 }, scene));
    stem.parent = bud;
    stem.position = new Vector3(0, -0.06, 0);
    stem.material = stemMat;
    const led = tag(MeshBuilder.CreateSphere(`xxrBudLed${side}`, { diameter: 0.016, segments: 6 }, scene));
    led.parent = bud;
    led.position = new Vector3(0, 0.02, 0.03);
    led.material = glow;
  };
  mkBud(-1);
  mkBud(1);

  root.scaling.setAll(1.35);
  return root;
}
