import {
  Color3,
  Mesh,
  MeshBuilder,
  Node,
  Quaternion,
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
  rope: Mesh;
  claws: TransformNode[];
  wristAnchor: TransformNode;
};

const ARM_GROUP = 1;

function mat(scene: Scene, name: string, color: Color3, spec = 0.35, emit = 0.06) {
  const m = new StandardMaterial(name, scene);
  m.diffuseColor = color;
  m.specularColor = new Color3(0.55, 0.6, 0.65).scale(spec);
  m.emissiveColor = color.scale(emit);
  return m;
}

function glowMat(scene: Scene, name: string, color: Color3) {
  const m = new StandardMaterial(name, scene);
  m.diffuseColor = color;
  m.emissiveColor = color;
  m.specularColor = Color3.Black();
  m.disableLighting = true;
  return m;
}

function tag(mesh: Mesh) {
  mesh.isPickable = false;
  mesh.renderingGroupId = ARM_GROUP;
  return mesh;
}

function box(
  name: string,
  size: { width: number; height: number; depth: number },
  scene: Scene,
  material: StandardMaterial,
  parent: Node,
  pos: Vector3,
) {
  const m = MeshBuilder.CreateBox(name, size, scene);
  m.parent = parent;
  m.position.copyFrom(pos);
  m.material = material;
  return tag(m);
}

function cyl(
  name: string,
  opts: { height: number; diameter?: number; diameterTop?: number; diameterBottom?: number; tessellation?: number },
  scene: Scene,
  material: StandardMaterial,
  parent: Node,
  pos: Vector3,
) {
  const m = MeshBuilder.CreateCylinder(name, { tessellation: 8, ...opts }, scene);
  m.parent = parent;
  m.position.copyFrom(pos);
  m.material = material;
  return tag(m);
}

export function isAvatarMesh(name: string) {
  return name.startsWith("xxr");
}

export function createArms(scene: Scene, parent: Node): Arms {
  scene.setRenderingAutoClearDepthStencil(ARM_GROUP, false);

  const root = new TransformNode("xxrArms", scene);
  root.parent = parent;

  const chassis = mat(scene, "xxrChassis", new Color3(0.11, 0.13, 0.16), 0.45, 0.04);
  const plate = mat(scene, "xxrPlate", new Color3(0.2, 0.22, 0.26), 0.3, 0.05);
  const dark = mat(scene, "xxrDark", new Color3(0.06, 0.07, 0.09), 0.2, 0.02);
  const blade = mat(scene, "xxrBlade", new Color3(0.55, 0.58, 0.62), 0.85, 0.08);
  const cyan = glowMat(scene, "xxrCyan", new Color3(0.18, 0.92, 0.82));
  const amber = glowMat(scene, "xxrAmber", new Color3(0.98, 0.48, 0.16));
  const cable = glowMat(scene, "xxrCable", new Color3(0.75, 0.42, 0.18));

  const mkLimb = (side: 1 | -1, label: string) => {
    const pivot = new TransformNode(`xxr${label}Pivot`, scene);
    pivot.parent = root;
    pivot.position = new Vector3(0.145 * side, -0.2, 0.36);
    pivot.rotation = new Vector3(0.4, -0.34 * side, 0.08 * side);

    cyl(`xxr${label}Upper`, { height: 0.2, diameterTop: 0.05, diameterBottom: 0.072 }, scene, chassis, pivot, new Vector3(0, -0.07, 0));
    box(`xxr${label}Plate`, { width: 0.046, height: 0.12, depth: 0.018 }, scene, plate, pivot, new Vector3(0.018 * side, -0.07, 0.028));

    const stripe = box(
      `xxr${label}Stripe`,
      { width: 0.008, height: 0.14, depth: 0.006 },
      scene,
      side < 0 ? cyan : amber,
      pivot,
      new Vector3(0.026 * side, -0.07, 0.038),
    );
    stripe.material = side < 0 ? cyan : amber;

    const elbow = MeshBuilder.CreateSphere(`xxr${label}Elbow`, { diameter: 0.048, segments: 8 }, scene);
    elbow.parent = pivot;
    elbow.position = new Vector3(0, -0.17, 0.01);
    elbow.material = dark;
    tag(elbow);

    const wrist = new TransformNode(`xxr${label}Wrist`, scene);
    wrist.parent = pivot;
    wrist.position = new Vector3(0, -0.205, 0.02);

    cyl(`xxr${label}Fore`, { height: 0.07, diameterTop: 0.058, diameterBottom: 0.05 }, scene, chassis, wrist, new Vector3(0, 0.02, 0));
    const cuff = MeshBuilder.CreateTorus(`xxr${label}Cuff`, { diameter: 0.062, thickness: 0.01, tessellation: 12 }, scene);
    cuff.parent = wrist;
    cuff.rotation.x = Math.PI / 2;
    cuff.position = new Vector3(0, -0.012, 0);
    cuff.material = side < 0 ? cyan : amber;
    tag(cuff);

    const socket = cyl(`xxr${label}Socket`, { height: 0.028, diameter: 0.044 }, scene, dark, wrist, new Vector3(0, -0.03, 0));
    socket.rotation.x = Math.PI / 2;
    socket.position = new Vector3(0, -0.018, -0.01);

    const hand = new TransformNode(`xxr${label}Hand`, scene);
    hand.parent = wrist;

    return { pivot, wrist, hand };
  };

  const left = mkLimb(-1, "Left");
  const right = mkLimb(1, "Right");

  const palmL = box("xxrLeftPalm", { width: 0.078, height: 0.032, depth: 0.09 }, scene, plate, left.hand, new Vector3(0, 0, -0.01));
  palmL.rotation.x = -0.15;
  for (let i = 0; i < 3; i++) {
    const f = box(
      `xxrLeftF${i}`,
      { width: 0.016, height: 0.014, depth: 0.042 },
      scene,
      chassis,
      left.hand,
      new Vector3(-0.022 + i * 0.022, 0.006, -0.062),
    );
    f.rotation.x = -0.35;
  }

  const scanner = box("xxrScanner", { width: 0.09, height: 0.038, depth: 0.12 }, scene, dark, left.hand, new Vector3(0, 0.028, -0.012));
  const scannerGlow = box("xxrScannerScreen", { width: 0.07, height: 0.005, depth: 0.078 }, scene, cyan, scanner, new Vector3(0, 0.02, 0));
  box("xxrIdentLens", { width: 0.022, height: 0.012, depth: 0.022 }, scene, cyan, scanner, new Vector3(0, 0.01, -0.055));

  const hook = right.hand;
  box("xxrHookBody", { width: 0.034, height: 0.034, depth: 0.13 }, scene, chassis, hook, new Vector3(0, 0, -0.02));
  cyl("xxrHookSpike", { height: 0.09, diameterTop: 0.005, diameterBottom: 0.024 }, scene, blade, hook, new Vector3(0, 0, -0.1)).rotation.x = Math.PI / 2;
  box("xxrHookCore", { width: 0.022, height: 0.022, depth: 0.048 }, scene, amber, hook, new Vector3(0, 0, -0.01));

  const claws: TransformNode[] = [];
  for (let i = 0; i < 3; i++) {
    const pivot = new TransformNode(`xxrClawP${i}`, scene);
    pivot.parent = hook;
    const ang = (i / 3) * Math.PI * 2;
    pivot.position = new Vector3(Math.cos(ang) * 0.014, Math.sin(ang) * 0.014, -0.045);
    pivot.rotation.z = ang;
    const claw = box(`xxrClaw${i}`, { width: 0.012, height: 0.007, depth: 0.085 }, scene, blade, pivot, new Vector3(0.022, 0, -0.032));
    claw.rotation.y = 0.35;
    claws.push(pivot);
  }

  const rope = MeshBuilder.CreateCylinder("xxrRope", { height: 1, diameter: 0.007, tessellation: 7 }, scene);
  rope.material = cable;
  tag(rope);
  rope.isVisible = false;
  rope.parent = null;

  setClaws(claws, 0.18);
  holsterHook({
    root,
    leftHand: left.hand,
    rightWrist: right.wrist,
    rightHand: hook,
    scannerGlow,
    rope,
    claws,
    wristAnchor: right.wrist,
  });

  return {
    root,
    leftHand: left.hand,
    rightWrist: right.wrist,
    rightHand: hook,
    scannerGlow,
    rope,
    claws,
    wristAnchor: right.wrist,
  };
}

/** 0 folded along the spike, 1 open for flight, >1 clenched. */
export function setClaws(claws: TransformNode[], open: number) {
  claws.forEach((p, i) => {
    const ang = (i / 3) * Math.PI * 2;
    p.rotation.z = ang;
    p.rotation.x = 0.12 + open * 0.55;
  });
}

export function holsterHook(arms: Arms) {
  arms.rightHand.setParent(arms.rightWrist);
  arms.rightHand.position = new Vector3(0, -0.01, -0.04);
  arms.rightHand.rotation = Vector3.Zero();
  arms.rightHand.rotationQuaternion = null;
  arms.rightHand.scaling = Vector3.One();
  setClaws(arms.claws, 0.16);
  arms.rope.isVisible = false;
}

export function updateRope(arms: Arms, from: Vector3, to: Vector3) {
  const delta = to.subtract(from);
  const len = Math.max(0.02, delta.length());
  arms.rope.isVisible = true;
  arms.rope.position.copyFrom(from.add(to).scale(0.5));
  arms.rope.scaling.set(1, len, 1);
  const dir = delta.scale(1 / len);
  const up = Vector3.Up();
  let axis = Vector3.Cross(up, dir);
  if (axis.lengthSquared() < 1e-8) axis = new Vector3(1, 0, 0);
  axis.normalize();
  const angle = Math.acos(Math.max(-1, Math.min(1, Vector3.Dot(up, dir))));
  arms.rope.rotationQuaternion = Quaternion.RotationAxis(axis, angle);
}

export function aimHook(hook: TransformNode, dir: Vector3) {
  const n = dir.clone();
  if (n.lengthSquared() < 1e-8) return;
  n.normalize();
  n.scaleInPlace(-1);
  const yaw = Math.atan2(n.x, n.z);
  const pitch = Math.asin(Math.max(-1, Math.min(1, -n.y)));
  hook.rotationQuaternion = Quaternion.FromEulerAngles(pitch, yaw, 0);
}

export const setRightHandOnWrist = holsterHook;
