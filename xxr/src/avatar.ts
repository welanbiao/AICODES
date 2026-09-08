import {
  Color3,
  Mesh,
  MeshBuilder,
  Node,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3,
} from "@babylonjs/core";

export type Arms = {
  root: TransformNode;
  leftHand: TransformNode;
  rightWrist: TransformNode;
  rightHand: TransformNode;
  scannerGlow: Mesh;
};

function mat(scene: Scene, name: string, color: Color3, spec = 0.25) {
  const m = new StandardMaterial(name, scene);
  m.diffuseColor = color;
  m.specularColor = color.scale(spec);
  m.emissiveColor = color.scale(0.08);
  return m;
}

export function createArms(scene: Scene, parent: Node): Arms {
  const root = new TransformNode("arms", scene);
  root.parent = parent;

  const skin = mat(scene, "skin", new Color3(0.86, 0.68, 0.52), 0.15);
  const sleeve = mat(scene, "sleeve", new Color3(0.14, 0.16, 0.2), 0.05);
  const glove = mat(scene, "glove", new Color3(0.22, 0.24, 0.28), 0.2);
  const device = mat(scene, "scannerBody", new Color3(0.12, 0.18, 0.2), 0.4);
  const glow = mat(scene, "scannerGlow", new Color3(0.15, 0.85, 0.75), 0);
  glow.emissiveColor = new Color3(0.12, 0.7, 0.62);
  glow.disableLighting = true;

  const mkArm = (side: 1 | -1, label: string) => {
    const pivot = new TransformNode(`${label}Pivot`, scene);
    pivot.parent = root;
    pivot.position = new Vector3(0.22 * side, -0.28, 0.38);
    pivot.rotation = new Vector3(0.55, -0.18 * side, 0.12 * side);

    const upper = MeshBuilder.CreateCylinder(
      `${label}Upper`,
      { height: 0.22, diameterTop: 0.055, diameterBottom: 0.07, tessellation: 10 },
      scene,
    );
    upper.parent = pivot;
    upper.position = new Vector3(0, -0.08, 0);
    upper.material = sleeve;
    upper.isPickable = false;

    const wrist = new TransformNode(`${label}Wrist`, scene);
    wrist.parent = pivot;
    wrist.position = new Vector3(0, -0.2, 0.02);

    const hand = new TransformNode(`${label}Hand`, scene);
    hand.parent = wrist;

    const palm = MeshBuilder.CreateBox(
      `${label}Palm`,
      { width: 0.07, height: 0.035, depth: 0.09 },
      scene,
    );
    palm.parent = hand;
    palm.material = label === "right" ? glove : skin;
    palm.isPickable = false;

    for (let i = 0; i < 4; i++) {
      const f = MeshBuilder.CreateBox(
        `${label}F${i}`,
        { width: 0.012, height: 0.012, depth: 0.045 },
        scene,
      );
      f.parent = hand;
      f.position = new Vector3(-0.024 + i * 0.016, 0.01, -0.06);
      f.material = palm.material;
      f.isPickable = false;
    }
    const thumb = MeshBuilder.CreateBox(
      `${label}Thumb`,
      { width: 0.014, height: 0.012, depth: 0.03 },
      scene,
    );
    thumb.parent = hand;
    thumb.position = new Vector3(0.04 * side, 0.005, -0.02);
    thumb.rotation.y = 0.6 * side;
    thumb.material = palm.material;
    thumb.isPickable = false;

    return { pivot, wrist, hand };
  };

  const left = mkArm(-1, "left");
  const right = mkArm(1, "right");

  const scanner = MeshBuilder.CreateBox("scanner", { width: 0.08, height: 0.04, depth: 0.11 }, scene);
  scanner.parent = left.hand;
  scanner.position = new Vector3(0, 0.03, -0.02);
  scanner.material = device;
  scanner.isPickable = false;

  const scannerGlow = MeshBuilder.CreateBox("scannerScreen", { width: 0.06, height: 0.006, depth: 0.07 }, scene);
  scannerGlow.parent = scanner;
  scannerGlow.position = new Vector3(0, 0.022, 0);
  scannerGlow.material = glow;
  scannerGlow.isPickable = false;

  return {
    root,
    leftHand: left.hand,
    rightWrist: right.wrist,
    rightHand: right.hand,
    scannerGlow,
  };
}

export function setRightHandOnWrist(arms: Arms) {
  arms.rightHand.setParent(arms.rightWrist);
  arms.rightHand.position = Vector3.Zero();
  arms.rightHand.rotation = Vector3.Zero();
  arms.rightHand.scaling = Vector3.One();
}
