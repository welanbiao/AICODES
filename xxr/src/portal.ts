import {
  Color3,
  Mesh,
  MeshBuilder,
  PBRMaterial,
  Scene,
  StandardMaterial,
  TransformNode,
  Vector3,
} from "@babylonjs/core";

export type PortalBuild = {
  wrap: TransformNode;
  spin: TransformNode;
  meshes: Mesh[];
  plusRoots: TransformNode[];
};

/** 第六关：一球 + 五个 ➕，旋转时 ➕ 始终朝向相机 */
export function buildPortalSphere(scene: Scene): PortalBuild {
  const wrap = new TransformNode("level-portal", scene);
  const spin = new TransformNode("portalSpin", scene);
  spin.parent = wrap;

  const sphere = MeshBuilder.CreateSphere("portalSphere", { diameter: 1.05, segments: 28 }, scene);
  sphere.parent = spin;
  sphere.isPickable = true;
  sphere.metadata = { ...(sphere.metadata ?? {}), xxr: "level" };
  const ballMat = new PBRMaterial("portalBallMat", scene);
  ballMat.albedoColor = new Color3(0.12, 0.16, 0.22);
  ballMat.metallic = 0.35;
  ballMat.roughness = 0.42;
  ballMat.emissiveColor = new Color3(0.02, 0.08, 0.1);
  sphere.material = ballMat;

  const plusMat = new StandardMaterial("portalPlusMat", scene);
  plusMat.diffuseColor = new Color3(0.22, 0.92, 0.78);
  plusMat.emissiveColor = new Color3(0.12, 0.55, 0.48);
  plusMat.specularColor = new Color3(0.2, 0.2, 0.22);

  const dirs = [
    new Vector3(0, 1, 0),
    new Vector3(0.95, 0.25, 0).normalize(),
    new Vector3(-0.48, 0.25, 0.84).normalize(),
    new Vector3(-0.48, 0.25, -0.84).normalize(),
    new Vector3(0, -0.92, 0.18).normalize(),
  ];

  const meshes: Mesh[] = [sphere];
  const plusRoots: TransformNode[] = [];
  const radius = 0.54;

  dirs.forEach((dir, i) => {
    const root = new TransformNode(`portalPlus_${i}`, scene);
    root.parent = spin;
    root.position.copyFrom(dir.scale(radius));
    plusRoots.push(root);

    const barH = MeshBuilder.CreateBox(`portalPlusH_${i}`, { width: 0.28, height: 0.07, depth: 0.05 }, scene);
    const barV = MeshBuilder.CreateBox(`portalPlusV_${i}`, { width: 0.07, height: 0.28, depth: 0.05 }, scene);
    barH.parent = root;
    barV.parent = root;
    barH.material = plusMat;
    barV.material = plusMat;
    barH.isPickable = true;
    barV.isPickable = true;
    barH.metadata = { ...(barH.metadata ?? {}), xxr: "level" };
    barV.metadata = { ...(barV.metadata ?? {}), xxr: "level" };
    meshes.push(barH, barV);
  });

  return { wrap, spin, meshes, plusRoots };
}

export function facePortalPluses(plusRoots: TransformNode[], cameraPos: Vector3) {
  for (const root of plusRoots) {
    root.lookAt(cameraPos);
  }
}
