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

/** 原球体直径 1.05；立方体边长为其一半 */
const CUBE_SIZE = 1.05 / 2;

/** 第六关：科技灰立方体，六面各一 ➕ */
export function buildPortalSphere(scene: Scene): PortalBuild {
  const wrap = new TransformNode("level-portal", scene);
  const spin = new TransformNode("portalSpin", scene);
  spin.parent = wrap;

  const cube = MeshBuilder.CreateBox("portalCube", { size: CUBE_SIZE }, scene);
  cube.parent = spin;
  cube.isPickable = true;
  cube.metadata = { ...(cube.metadata ?? {}), xxr: "level" };

  const bodyMat = new PBRMaterial("portalCubeMat", scene);
  bodyMat.albedoColor = new Color3(0.38, 0.4, 0.44);
  bodyMat.metallic = 0.62;
  bodyMat.roughness = 0.32;
  bodyMat.emissiveColor = new Color3(0.04, 0.05, 0.06);
  cube.material = bodyMat;

  const plusMat = new StandardMaterial("portalPlusMat", scene);
  plusMat.diffuseColor = new Color3(0.55, 0.62, 0.7);
  plusMat.emissiveColor = new Color3(0.18, 0.22, 0.28);
  plusMat.specularColor = new Color3(0.35, 0.38, 0.42);

  const faces = [
    new Vector3(0, 1, 0),
    new Vector3(0, -1, 0),
    new Vector3(1, 0, 0),
    new Vector3(-1, 0, 0),
    new Vector3(0, 0, 1),
    new Vector3(0, 0, -1),
  ];

  const meshes: Mesh[] = [cube];
  const plusRoots: TransformNode[] = [];
  const half = CUBE_SIZE / 2;
  const lift = 0.012;
  const barW = CUBE_SIZE * 0.42;
  const barT = CUBE_SIZE * 0.1;
  const barD = CUBE_SIZE * 0.06;

  faces.forEach((normal, i) => {
    const root = new TransformNode(`portalPlus_${i}`, scene);
    root.parent = spin;
    root.position.copyFrom(normal.scale(half + lift));
    // 本地 +Z 朝外，使 ➕ 贴在该面上
    root.lookAt(root.position.add(normal));
    plusRoots.push(root);

    const barH = MeshBuilder.CreateBox(`portalPlusH_${i}`, { width: barW, height: barT, depth: barD }, scene);
    const barV = MeshBuilder.CreateBox(`portalPlusV_${i}`, { width: barT, height: barW, depth: barD }, scene);
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

/** 立方体面加号固定朝外，无需每帧朝向相机 */
export function facePortalPluses(_plusRoots: TransformNode[], _cameraPos: Vector3) {
  /* no-op */
}
