import {
  AbstractMesh,
  AnimationGroup,
  Color3,
  Color4,
  DirectionalLight,
  Engine,
  HemisphericLight,
  Matrix,
  Mesh,
  MeshBuilder,
  Node,
  PBRMaterial,
  PickingInfo,
  Ray,
  Scene,
  SceneLoader,
  SpotLight,
  StandardMaterial,
  TransformNode,
  UniversalCamera,
  Vector3,
} from "@babylonjs/core";
import type { ISceneLoaderAsyncResult } from "@babylonjs/core/Loading/sceneLoader";
import "@babylonjs/loaders/glTF";
import {
  createArms,
  holsterHook,
  updateRope,
  setClaws,
  aimHook,
  isAvatarMesh,
  loadFpsArms,
  type Arms,
} from "./avatar";
import { infoFor, partKeyFromName, CATALOG } from "./catalog";

export type Phase = "loading" | "fps" | "observe";

type HandState = "holstered" | "flying" | "stuck" | "reeling";

const SKY_SIZE = 72;
const PHONE_SPAN = 1.15;
const ORBIT_RADIUS = 2.52;
const ORBIT_SPEED = 0.14;
const SPIN_SPEED = 0.5;
const EXPLODE_SEC = 12;

const $ = <T extends HTMLElement>(sel: string) => document.querySelector(sel) as T;

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function toast(text: string) {
  const el = $<HTMLElement>("#toast");
  el.textContent = text;
  el.hidden = false;
  window.setTimeout(() => {
    el.hidden = true;
  }, 1600);
}

function loadProgress(ev: { loaded: number; total: number; lengthComputable?: boolean }) {
  if (ev.lengthComputable && ev.total) return Math.min(1, ev.loaded / ev.total);
  return ev.total ? Math.min(0.92, ev.loaded / ev.total) : 0.12;
}

function setPhase(phase: Phase) {
  $("#app").dataset.phase = phase;
  $<HTMLElement>("#screen-load").hidden = phase !== "loading";
  $<HTMLElement>("#screen-play").hidden = phase !== "fps" && phase !== "observe";
  const joy = $<HTMLElement>("#joystick");
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  joy.hidden = !(coarse && (phase === "fps" || phase === "observe"));
}

export class Game {
  readonly engine: Engine;
  readonly scene: Scene;
  phase: Phase = "loading";
  fps = 0;

  private canvas: HTMLCanvasElement;
  private fpsCam!: UniversalCamera;
  private headlamp!: SpotLight;
  private arms: Arms | null = null;
  private explodeGroup: AnimationGroup | null = null;
  private exploded = false;
  private keys = new Set<string>();
  private look = { yaw: 0, pitch: -0.08 };
  private dragging = false;
  private lastPtr = { x: 0, y: 0 };
  private joy = { x: 0, y: 0 };
  private phoneSize = new Vector3(1, 1, 1);
  private moveSpeed = 7.5;
  private handState: HandState = "holstered";
  private handVel = Vector3.Zero();
  private handFlight = 0;
  private highlight: AbstractMesh | null = null;
  private observePivot = Vector3.Zero();
  private worldReady = false;
  private riding: { t: number; from: Vector3; to: Vector3 } | null = null;
  private restLocal = new Map<number, Vector3>();
  private explodeT = 0;
  private explodeGoal = 0;
  private phoneWrap: TransformNode | null = null;
  private phoneSpin: TransformNode | null = null;
  private phoneMeshes: AbstractMesh[] = [];
  private lv2: Mesh | null = null;
  private lv3: Mesh | null = null;
  private phoneAngle = 0;
  private skyMin = new Vector3(-30, -30, -30);
  private skyMax = new Vector3(30, 30, 30);
  private skyLimit = 30;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.engine = new Engine(canvas, true, { adaptToDeviceRatio: false, stencil: true, preserveDrawingBuffer: true }, true);
    const cap = Math.min(window.devicePixelRatio || 1, 1.5);
    this.engine.setHardwareScalingLevel(1 / cap);
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.01, 0.012, 0.02, 1);
    this.scene.skipPointerMovePicking = true;
    this.scene.autoClear = true;
    this.scene.animationsEnabled = true;

    const hemi = new HemisphericLight("hemi", new Vector3(0.2, 1, 0.35), this.scene);
    hemi.intensity = 0.95;
    hemi.groundColor = new Color3(0.08, 0.09, 0.12);
    const sun = new DirectionalLight("sun", new Vector3(-0.35, -1, 0.15), this.scene);
    sun.intensity = 0.55;

    this.fpsCam = new UniversalCamera("fps", new Vector3(0, 0, 0), this.scene);
    this.fpsCam.minZ = 0.04;
    this.fpsCam.maxZ = 400;
    this.fpsCam.inertia = 0;
    this.fpsCam.speed = 0;
    this.fpsCam.applyGravity = false;
    this.fpsCam.checkCollisions = false;
    this.scene.activeCamera = this.fpsCam;

    this.headlamp = new SpotLight("headlamp", new Vector3(0, 0.04, 0.06), new Vector3(0, -0.04, 1), 0.92, 1.8, this.scene);
    this.headlamp.parent = this.fpsCam;
    this.headlamp.intensity = 5.4;
    this.headlamp.range = 28;
    this.headlamp.diffuse = new Color3(1, 0.96, 0.86);
    this.headlamp.specular = new Color3(1, 0.95, 0.85);
    this.headlamp.angle = 0.98;

    this.bindUi();
    this.bindInput();
    this.scene.onBeforeRenderObservable.add(() => this.tick());
    this.engine.runRenderLoop(() => {
      this.fps = this.engine.getFps();
      if (this.fps > 1 && this.fps < 40 && this.engine.getHardwareScalingLevel() < 1.35) {
        this.engine.setHardwareScalingLevel(1.28);
      }
      this.scene.render();
      this.publish();
    });
    setPhase("loading");
    void this.boot();
  }

  resize() {
    this.engine.resize();
  }

  dispose() {
    this.engine.dispose();
  }

  private bindUi() {
    $<HTMLButtonElement>('[data-testid="btn-explode-fps"]').onclick = () => this.toggleExplode();
    $<HTMLButtonElement>('[data-testid="btn-identify"]').onclick = () => this.identify();
    $<HTMLButtonElement>('[data-testid="btn-fire"]').onclick = () => this.fireHand();
    $<HTMLButtonElement>('[data-testid="btn-recall"]').onclick = () => this.recallHand();
    $<HTMLButtonElement>('[data-testid="btn-dismount"]').onclick = () => this.dismount();
  }

  private bindInput() {
    window.addEventListener("keydown", (e) => {
      this.keys.add(e.code);
      if (e.code === "KeyE") this.identify();
      if (e.code === "KeyF") this.fireHand();
      if (e.code === "KeyR") this.recallHand();
      if (e.code === "KeyX") this.toggleExplode();
      if (e.code === "Escape") {
        document.exitPointerLock();
        if (this.phase === "observe") this.dismount();
      }
    });
    window.addEventListener("keyup", (e) => this.keys.delete(e.code));

    this.canvas.addEventListener("pointerdown", (e) => {
      if (this.phase !== "fps" && this.phase !== "observe") return;
      this.dragging = true;
      this.lastPtr = { x: e.clientX, y: e.clientY };
      if (e.pointerType === "mouse") this.canvas.requestPointerLock();
    });
    window.addEventListener("pointerup", () => {
      this.dragging = false;
    });
    window.addEventListener("pointermove", (e) => {
      if (this.phase !== "fps" && this.phase !== "observe") return;
      let dx = 0;
      let dy = 0;
      if (document.pointerLockElement === this.canvas) {
        dx = e.movementX;
        dy = e.movementY;
      } else if (this.dragging) {
        dx = e.clientX - this.lastPtr.x;
        dy = e.clientY - this.lastPtr.y;
        this.lastPtr = { x: e.clientX, y: e.clientY };
      } else return;
      this.look.yaw += dx * 0.0024;
      this.look.pitch = Math.max(-1.2, Math.min(1.2, this.look.pitch + dy * 0.0024));
    });

    this.bindJoystick();
  }

  private bindJoystick() {
    const base = $<HTMLElement>("#joystick");
    const knob = $<HTMLElement>("#joy-knob");
    let pid: number | null = null;
    const apply = (x: number, y: number) => {
      const r = 40;
      const len = Math.hypot(x, y) || 1;
      const nx = (x / len) * Math.min(len, r);
      const ny = (y / len) * Math.min(len, r);
      this.joy.x = nx / r;
      this.joy.y = ny / r;
      knob.style.left = `calc(29% + ${nx * 0.4}px)`;
      knob.style.top = `calc(29% + ${ny * 0.4}px)`;
    };
    base.addEventListener("pointerdown", (e) => {
      pid = e.pointerId;
      base.setPointerCapture(e.pointerId);
      const b = base.getBoundingClientRect();
      apply(e.clientX - (b.left + b.width / 2), e.clientY - (b.top + b.height / 2));
    });
    base.addEventListener("pointermove", (e) => {
      if (pid !== e.pointerId) return;
      const b = base.getBoundingClientRect();
      apply(e.clientX - (b.left + b.width / 2), e.clientY - (b.top + b.height / 2));
    });
    const end = () => {
      pid = null;
      this.joy.x = 0;
      this.joy.y = 0;
      knob.style.left = "29%";
      knob.style.top = "29%";
    };
    base.addEventListener("pointerup", end);
    base.addEventListener("pointercancel", end);
  }

  private setLoad(p: number) {
    const pct = Math.round(clamp(p, 0, 1) * 100);
    $<HTMLElement>("#load-bar").style.width = `${pct}%`;
    $<HTMLElement>("#load-pct").textContent = `${pct}%`;
  }

  private async boot() {
    this.phase = "loading";
    setPhase("loading");
    this.setLoad(0.02);
    try {
      let skyP = 0;
      let armsP = 0;
      let phoneP = 0;
      const bump = () => this.setLoad(skyP * 0.16 + armsP * 0.22 + phoneP * 0.6);

      const skyJob = SceneLoader.ImportMeshAsync("", "/models/", "skybox.glb", this.scene, (ev) => {
        skyP = loadProgress(ev);
        bump();
      });
      const phoneJob = SceneLoader.ImportMeshAsync("", "/models/", "iphone_12_teardown.glb", this.scene, (ev) => {
        phoneP = loadProgress(ev);
        bump();
      });
      const armsJob = loadFpsArms(this.scene, this.fpsCam, (ev) => {
        armsP = loadProgress(ev);
        bump();
      }).catch((err) => {
        console.warn("fps_arms.glb failed, using fallback arms", err);
        return createArms(this.scene, this.fpsCam);
      });

      const [skyRes, phoneRes, arms] = await Promise.all([skyJob, phoneJob, armsJob]);
      this.arms = arms;
      this.prepareSkybox(skyRes);
      this.preparePhone(phoneRes);
      this.makeLevelOrbs();
      this.look.yaw = 0;
      this.look.pitch = -0.08;
      this.fpsCam.position.set(0, 0, 0);
      this.applyLook();
      this.scene.activeCamera = this.fpsCam;
      this.arms.root.setEnabled(true);
      if (this.arms) holsterHook(this.arms);

      const env = this.scene.createDefaultEnvironment({
        createGround: false,
        createSkybox: true,
        skyboxSize: 4,
        enableGroundShadow: false,
      });
      if (env?.skybox) {
        env.skybox.setEnabled(false);
        env.skybox.isPickable = false;
      }
      this.scene.environmentIntensity = 1.45;
      this.scene.imageProcessingConfiguration.exposure = 1.25;
      this.scene.imageProcessingConfiguration.contrast = 1.08;

      this.setLoad(1);
      this.worldReady = true;
      this.phase = "fps";
      setPhase("fps");
      $<HTMLElement>("#play-status").textContent = "星空枢纽";
      this.syncHandButtons();
      toast("第一关：我的手机");
    } catch (err) {
      console.error(err);
      toast("模型加载失败");
    }
  }

  private prepareSkybox(loaded: ISceneLoaderAsyncResult) {
    const root = loaded.meshes[0];
    if (!root) return;
    root.name = "skyRoot";
    for (const mesh of loaded.meshes) {
      mesh.isPickable = false;
      mesh.alwaysSelectAsActiveMesh = true;
      const mat = mesh.material;
      if (!mat) continue;
      mat.backFaceCulling = false;
      if (mat instanceof PBRMaterial) {
        mat.directIntensity = 0;
        mat.environmentIntensity = 0;
        mat.emissiveColor = Color3.White();
        mat.emissiveIntensity = 1.05;
        if (mat.albedoTexture) mat.emissiveTexture = mat.albedoTexture;
        (mat as PBRMaterial & { unlit?: boolean }).unlit = true;
      }
      if (mat instanceof StandardMaterial) {
        mat.disableLighting = true;
        mat.emissiveColor = Color3.White();
        mat.diffuseColor = Color3.White();
        if (mat.diffuseTexture) mat.emissiveTexture = mat.diffuseTexture;
      }
    }
    root.computeWorldMatrix(true);
    const b = root.getHierarchyBoundingVectors(true);
    const size = b.max.subtract(b.min);
    const longest = Math.max(size.x, size.y, size.z, 0.001);
    root.scaling.scaleInPlace(SKY_SIZE / longest);
    root.computeWorldMatrix(true);
    const b2 = root.getHierarchyBoundingVectors(true);
    const center = b2.min.add(b2.max).scale(0.5);
    root.position.subtractInPlace(center);
    root.computeWorldMatrix(true);
    const b3 = root.getHierarchyBoundingVectors(true);
    const pad = 1.6;
    this.skyMin.copyFrom(b3.min.add(new Vector3(pad, pad, pad)));
    this.skyMax.copyFrom(b3.max.subtract(new Vector3(pad, pad, pad)));
    this.skyLimit = Math.max(
      Math.abs(this.skyMin.x),
      Math.abs(this.skyMax.x),
      Math.abs(this.skyMin.y),
      Math.abs(this.skyMax.y),
      Math.abs(this.skyMin.z),
      Math.abs(this.skyMax.z),
    );
  }

  private preparePhone(loaded: ISceneLoaderAsyncResult) {
    this.explodeGroup = loaded.animationGroups.find((g) => /teardown/i.test(g.name)) ?? loaded.animationGroups[0] ?? null;
    if (this.explodeGroup) {
      const g = this.explodeGroup;
      g.stop();
      g.reset();
      g.loopAnimation = false;
      g.goToFrame(g.from);
      g.pause();
    }

    const wrap = new TransformNode("phoneWrap", this.scene);
    const spin = new TransformNode("phoneSpin", this.scene);
    spin.parent = wrap;
    const glbRoot = loaded.meshes[0];
    if (glbRoot) {
      glbRoot.parent = spin;
      glbRoot.name = "phoneModel";
    }
    this.phoneWrap = wrap;
    this.phoneSpin = spin;

    spin.computeWorldMatrix(true);
    const extents = this.scene.getWorldExtends((m) => this.isPhonePart(m) && !!m.getTotalVertices());
    const size = extents.max.subtract(extents.min);
    const longest = Math.max(size.x, size.y, size.z, 0.001);
    spin.scaling.setAll(PHONE_SPAN / longest);
    spin.rotation.y = Math.PI / 2;
    spin.computeWorldMatrix(true);
    const b2 = this.scene.getWorldExtends((m) => this.isPhonePart(m) && !!m.getTotalVertices());
    const center = b2.min.add(b2.max).scale(0.5);
    if (glbRoot) {
      const inv = spin.getWorldMatrix().clone().invert();
      glbRoot.position.subtractInPlace(Vector3.TransformCoordinates(center, inv));
    }
    spin.computeWorldMatrix(true);
    const b3 = this.scene.getWorldExtends((m) => this.isPhonePart(m) && !!m.getTotalVertices());
    this.phoneSize = b3.max.subtract(b3.min);

    this.animDriven.clear();
    if (this.explodeGroup) {
      for (const ta of this.explodeGroup.targetedAnimations) {
        const target = ta.target as Node | undefined;
        if (target) this.markDriven(target);
      }
    }

    this.phoneMeshes = [];
    this.restLocal.clear();
    this.scene.meshes.forEach((m) => m.computeWorldMatrix(true));
    for (const mesh of this.scene.meshes) {
      if (!this.isPhonePart(mesh) || !mesh.getTotalVertices()) continue;
      mesh.isPickable = true;
      this.phoneMeshes.push(mesh);
      this.restLocal.set(mesh.uniqueId, mesh.position.clone());
      const mat = mesh.material;
      if (mat instanceof PBRMaterial) {
        mat.directIntensity = 1.7;
        mat.environmentIntensity = 1.15;
        mat.emissiveColor = mat.emissiveColor.add(new Color3(0.04, 0.04, 0.045));
        if (mat.subSurface) {
          mat.subSurface.isRefractionEnabled = false;
          mat.subSurface.isTranslucencyEnabled = false;
        }
      }
    }

    this.explodeT = 0;
    this.explodeGoal = 0;
    wrap.position.set(0, 0.16, ORBIT_RADIUS);
  }

  private markDriven(node: Node) {
    this.animDriven.add(node.uniqueId);
    for (const child of node.getChildren()) this.markDriven(child);
  }

  private isAnimDriven(node: Node) {
    let n: Node | null = node;
    while (n) {
      if (this.animDriven.has(n.uniqueId)) return true;
      n = n.parent;
    }
    return false;
  }

  private isPhonePart(mesh: AbstractMesh) {
    let n: Node | null = mesh;
    while (n) {
      if (n.name === "phoneWrap" || n.name === "phoneSpin" || n.name === "phoneModel") return true;
      n = n.parent;
    }
    return false;
  }

  private makeLevelOrbs() {
    const mk = (name: string, color: Color3) => {
      const mat = new StandardMaterial(`${name}Mat`, this.scene);
      mat.diffuseColor = color;
      mat.emissiveColor = color.scale(0.45);
      mat.specularColor = Color3.Black();
      const mesh = MeshBuilder.CreateBox(name, { size: 0.28 }, this.scene);
      mesh.material = mat;
      mesh.isPickable = false;
      return mesh;
    };
    this.lv2 = mk("level-laptop-orb", new Color3(0.25, 0.32, 0.4));
    this.lv3 = mk("level-earbuds-orb", new Color3(0.25, 0.32, 0.4));
  }

  toggleExplode() {
    if (!this.worldReady) return;
    this.exploded = !this.exploded;
    this.explodeGoal = this.exploded ? 1 : 0;
    toast(this.exploded ? "爆炸图展开" : "零件合拢");
  }

  lookAtPhone() {
    this.look.yaw = this.phoneAngle;
    this.look.pitch = -0.1;
    this.applyLook();
  }

  identify() {
    if (this.phase !== "fps" && this.phase !== "observe") return;
    const hit = this.pickPart();
    const card = $<HTMLElement>("#identify-card");
    if (this.highlight) {
      this.highlight.renderOverlay = false;
      this.highlight = null;
    }
    if (!hit?.pickedMesh) {
      card.hidden = false;
      card.innerHTML = `<h2>未锁定</h2><p>准星没有对准可鉴定零件，再靠近一些。</p>`;
      return;
    }
    const mesh = hit.pickedMesh;
    this.highlight = mesh;
    mesh.renderOverlay = true;
    mesh.overlayColor = new Color3(0.24, 0.88, 0.78);
    mesh.overlayAlpha = 0.35;
    const info = infoFor(this.resolveName(mesh));
    card.hidden = false;
    card.innerHTML = `<h2>${info.name}</h2>
      <p><strong>作用</strong>　${info.role}</p>
      <p><strong>材料</strong>　${info.material}</p>
      <p>${info.note}</p>`;
    this.pulseScanner();
  }

  fireHand() {
    if (this.phase !== "fps" || !this.arms) return;
    if (this.handState !== "holstered") return;
    const hook = this.arms.rightHand;
    const origin = hook.getAbsolutePosition();
    hook.setParent(null);
    hook.position.copyFrom(origin);
    this.handVel = this.fpsCam.getForwardRay(1).direction.scale(Math.max(14, this.moveSpeed * 2.4));
    aimHook(hook, this.handVel);
    setClaws(this.arms.claws, 0.92);
    this.handFlight = 0;
    this.handState = "flying";
    this.syncHandButtons();
  }

  recallHand() {
    if (!this.arms || this.handState === "holstered" || this.handState === "reeling") return;
    this.riding = null;
    this.arms.rightHand.setParent(null);
    setClaws(this.arms.claws, 0.35);
    this.handState = "reeling";
    this.syncHandButtons();
    if (this.phase === "observe") this.dismount();
  }

  dismount() {
    if (this.phase !== "observe") return;
    this.phase = "fps";
    setPhase("fps");
    $<HTMLElement>("#play-status").textContent = "星空枢纽";
    this.syncHandButtons();
  }

  private syncHandButtons() {
    $<HTMLButtonElement>('[data-testid="btn-recall"]').hidden = this.handState === "holstered" || this.handState === "reeling";
    $<HTMLButtonElement>('[data-testid="btn-fire"]').hidden = this.handState !== "holstered" || this.phase === "observe";
    $<HTMLButtonElement>('[data-testid="btn-dismount"]').hidden = this.phase !== "observe";
  }

  private pickPart(): PickingInfo | null {
    const ray = this.fpsCam.getForwardRay(12);
    return this.scene.pickWithRay(ray, (m) => m.isPickable && m.isEnabled() && this.isPhonePart(m) && !isAvatarMesh(m));
  }

  private resolveName(mesh: AbstractMesh): string {
    let n: Node | null = mesh;
    let fallback = mesh.name;
    while (n) {
      const raw = partKeyFromName(n.name);
      if (raw && raw !== "__root__" && raw !== "phoneWrap" && raw !== "phoneSpin" && raw !== "phoneModel") {
        fallback = raw;
        if (raw in CATALOG || raw === "__screw__") return n.name;
      }
      n = n.parent;
    }
    return fallback;
  }

  private pulseScanner() {
    const glow = this.arms?.scannerGlow;
    if (!glow) return;
    const mat = glow.material as StandardMaterial;
    if (!mat?.emissiveColor) return;
    mat.emissiveColor = new Color3(0.55, 1, 0.92);
    window.setTimeout(() => {
      mat.emissiveColor = new Color3(0.12, 0.7, 0.62);
    }, 180);
  }

  private applyExplode(dt: number) {
    const step = dt / EXPLODE_SEC;
    if (this.explodeT < this.explodeGoal) this.explodeT = Math.min(this.explodeGoal, this.explodeT + step);
    else if (this.explodeT > this.explodeGoal) this.explodeT = Math.max(this.explodeGoal, this.explodeT - step);
    const ease = this.explodeT * this.explodeT * (3 - 2 * this.explodeT);
    if (this.explodeGroup) {
      const g = this.explodeGroup;
      const frame = g.from + (g.to - g.from) * ease;
      g.goToFrame(frame);
      g.pause();
    }
    for (const mesh of this.phoneMeshes) {
      const rest = this.restLocal.get(mesh.uniqueId);
      if (!rest) continue;
      const key = partKeyFromName(mesh.name);
      let dir = rest.clone();
      const len = dir.length();
      if (len < 0.0008) dir = new Vector3(0, 1, 0);
      else dir.scaleInPlace(1 / len);
      if (key === "front_panel") dir = new Vector3(rest.x >= 0 ? 1 : -1, 0.15, 0);
      if (key === "back_cover" || key === "backplate") dir = new Vector3(rest.x >= 0 ? -1 : 1, -0.1, 0);
      if (key === "battery") dir = new Vector3(0, 0, rest.z >= 0 ? 1 : -1);
      const extra = key === "front_panel" || key === "back_cover" ? 12 : 3.5 + Math.min(9, Math.max(len, 0.2) * 0.45);
      mesh.position.copyFrom(rest.add(dir.scale(extra * ease)));
    }
  }

  private applyLook() {
    this.fpsCam.rotation.x = this.look.pitch;
    this.fpsCam.rotation.y = this.look.yaw;
    this.fpsCam.rotation.z = 0;
  }

  private orbitLevels(dt: number) {
    this.phoneAngle += dt * ORBIT_SPEED;
    const cam = this.fpsCam.position;
    const place = (node: TransformNode | null, offset: number, y: number) => {
      if (!node) return;
      const a = this.phoneAngle + offset;
      node.position.set(cam.x + Math.sin(a) * ORBIT_RADIUS, cam.y + y, cam.z + Math.cos(a) * ORBIT_RADIUS);
    };
    place(this.phoneWrap, 0, 0.16);
    place(this.lv2, (Math.PI * 2) / 3, 0.02);
    place(this.lv3, (Math.PI * 4) / 3, 0.02);
    if (this.phoneSpin) this.phoneSpin.rotation.y += dt * SPIN_SPEED;
    if (this.lv2) this.lv2.rotation.y += dt * 0.7;
    if (this.lv3) this.lv3.rotation.y += dt * 0.7;
  }

  private projectLabel(el: HTMLElement, world: Vector3) {
    const cam = this.fpsCam;
    const dir = world.subtract(cam.position);
    if (Vector3.Dot(cam.getForwardRay(1).direction, dir) < 0.08) {
      el.style.opacity = "0";
      return;
    }
    const w = this.engine.getRenderWidth();
    const h = this.engine.getRenderHeight();
    const viewport = cam.viewport.toGlobal(w, h);
    const p = Vector3.Project(world, Matrix.Identity(), this.scene.getTransformMatrix(), viewport);
    el.style.opacity = p.z > 0 && p.z < 1 ? "1" : "0";
    el.style.left = `${(p.x / w) * 100}%`;
    el.style.top = `${(p.y / h) * 100}%`;
  }

  private updateLabels() {
    if (this.phase === "loading") return;
    if (this.phoneWrap) {
      this.projectLabel($<HTMLElement>('[data-testid="level-label"]'), this.phoneWrap.position.add(new Vector3(0, -0.58, 0)));
    }
    if (this.lv2) {
      this.projectLabel($<HTMLElement>('[data-testid="level-2-label"]'), this.lv2.position.add(new Vector3(0, -0.32, 0)));
    }
    if (this.lv3) {
      this.projectLabel($<HTMLElement>('[data-testid="level-3-label"]'), this.lv3.position.add(new Vector3(0, -0.32, 0)));
    }
  }

  private tick() {
    const dt = Math.min(0.05, this.scene.getEngine().getDeltaTime() / 1000 || 0.016);
    if (this.worldReady) this.orbitLevels(dt);
    this.applyExplode(dt);
    if (this.riding) {
      this.riding.t += dt / 0.75;
      const t = easeInOut(Math.min(1, this.riding.t));
      Vector3.LerpToRef(this.riding.from, this.riding.to, t, this.fpsCam.position);
      this.clampPlayer();
      if (this.riding.t >= 1) {
        this.riding = null;
        this.phase = "observe";
        setPhase("observe");
        this.syncHandButtons();
        toast("钩住了，360° 观察");
      }
    } else if (this.phase === "fps") this.moveFps(dt);
    if (this.phase === "observe") this.moveObserve(dt);
    if (this.handState === "flying") this.tickHand(dt);
    else if (this.handState === "reeling") this.tickReel(dt);
    this.updateHookRope();
    this.applyLook();
    this.updateLabels();
  }

  private clampPlayer() {
    const p = this.fpsCam.position;
    p.x = clamp(p.x, this.skyMin.x, this.skyMax.x);
    p.y = clamp(p.y, this.skyMin.y, this.skyMax.y);
    p.z = clamp(p.z, this.skyMin.z, this.skyMax.z);
  }

  private moveFps(dt: number) {
    const sprint = this.keys.has("ShiftLeft") || this.keys.has("ShiftRight") ? 1.85 : 1;
    const speed = this.moveSpeed * sprint;
    let x = this.joy.x;
    let z = -this.joy.y;
    if (this.keys.has("KeyA")) x -= 1;
    if (this.keys.has("KeyD")) x += 1;
    if (this.keys.has("KeyW")) z += 1;
    if (this.keys.has("KeyS")) z -= 1;
    let y = 0;
    if (this.keys.has("Space")) y += 1;
    if (this.keys.has("KeyC") || this.keys.has("ControlLeft")) y -= 1;
    const fwd = this.fpsCam.getForwardRay(1).direction;
    const right = this.fpsCam.getDirection(new Vector3(1, 0, 0));
    this.fpsCam.position.addInPlace(fwd.scale(z * speed * dt));
    this.fpsCam.position.addInPlace(right.scale(x * speed * dt));
    this.fpsCam.position.addInPlace(Vector3.Up().scale(y * speed * dt));
    this.clampPlayer();
  }

  private moveObserve(dt: number) {
    if (this.keys.has("KeyA") || this.joy.x < -0.2) this.look.yaw -= dt * 1.2;
    if (this.keys.has("KeyD") || this.joy.x > 0.2) this.look.yaw += dt * 1.2;
    const orbit = this.keys.has("KeyQ") ? -1 : this.keys.has("KeyZ") ? 1 : 0;
    if (orbit) {
      const rel = this.fpsCam.position.subtract(this.observePivot);
      const q = orbit * dt * 1.4;
      const c = Math.cos(q);
      const s = Math.sin(q);
      const nx = rel.x * c - rel.z * s;
      const nz = rel.x * s + rel.z * c;
      this.fpsCam.position.x = this.observePivot.x + nx;
      this.fpsCam.position.z = this.observePivot.z + nz;
    }
    this.clampPlayer();
  }

  private tickHand(dt: number) {
    if (!this.arms) return;
    const hand = this.arms.rightHand;
    const prev = hand.position.clone();
    hand.position.addInPlace(this.handVel.scale(dt));
    aimHook(hand, this.handVel);
    const delta = hand.position.subtract(prev);
    const dist = delta.length();
    this.handFlight += dist;
    if (dist > 0.0001) {
      const hit = this.scene.pickWithRay(
        new Ray(prev, delta.normalize(), dist + 0.2),
        (m) => m.isPickable && m.isEnabled() && this.isPhonePart(m) && !isAvatarMesh(m),
      );
      if (hit?.hit && hit.pickedMesh && hit.pickedPoint) {
        this.catchPart(hit);
        return;
      }
    }
    if (this.handFlight > 14) {
      toast("钩索没有勾住");
      this.recallHand();
    }
  }

  private catchPart(hit: PickingInfo) {
    if (!this.arms || !hit.pickedPoint || !hit.pickedMesh) return;
    const hook = this.arms.rightHand;
    hook.position.copyFrom(hit.pickedPoint);
    aimHook(hook, hit.pickedPoint.subtract(this.arms.wristAnchor.getAbsolutePosition()));
    setClaws(this.arms.claws, 1.15);
    hook.setParent(hit.pickedMesh);
    this.handState = "stuck";
    this.observePivot.copyFrom(hit.pickedPoint);
    const normal = (hit.getNormal(true) ?? Vector3.Up()).normalize();
    const stand = hit.pickedPoint.add(normal.scale(0.55));
    this.riding = { t: 0, from: this.fpsCam.position.clone(), to: stand };
    $<HTMLElement>("#play-status").textContent = `钩住 ${infoFor(this.resolveName(hit.pickedMesh)).name}`;
    this.syncHandButtons();
    this.identify();
    toast("钩索抓住，沿绳飞过去");
  }

  private tickReel(dt: number) {
    if (!this.arms) return;
    const hook = this.arms.rightHand;
    const target = this.arms.wristAnchor.getAbsolutePosition();
    const pos = hook.getAbsolutePosition();
    const to = target.subtract(pos);
    const dist = to.length();
    const step = Math.max(this.moveSpeed * 4.5, 18) * dt;
    if (dist <= step + 0.08) {
      holsterHook(this.arms);
      this.handState = "holstered";
      this.syncHandButtons();
      return;
    }
    hook.setParent(null);
    hook.position.copyFrom(pos.add(to.scale(step / dist)));
    aimHook(hook, to.scale(-1));
  }

  private updateHookRope() {
    if (!this.arms || this.handState === "holstered") {
      if (this.arms) this.arms.rope.isVisible = false;
      return;
    }
    updateRope(this.arms, this.arms.wristAnchor.getAbsolutePosition(), this.arms.rightHand.getAbsolutePosition());
  }

  private publish() {
    const p = this.fpsCam.position;
    window.__XXR__ = {
      phase: this.phase,
      fps: this.fps,
      ready: this.worldReady,
      exploded: this.exploded,
      size: [this.phoneSize.x, this.phoneSize.y, this.phoneSize.z],
      meshes: this.scene.meshes.length,
      pos: [p.x, p.y, p.z],
      skyLimit: this.skyLimit,
      armsOn: !!this.arms?.root.isEnabled(),
      armMeshes: this.arms?.root.getChildMeshes().length ?? 0,
      wrist: this.arms ? this.arms.wristAnchor.getAbsolutePosition().asArray() : [0, 0, 0],
      identify: () => this.identify(),
      fire: () => this.fireHand(),
      explode: () => this.toggleExplode(),
      lookAtPhone: () => this.lookAtPhone(),
      tryMove: (x, y, z) => {
        this.fpsCam.position.set(x, y, z);
        this.clampPlayer();
        return [this.fpsCam.position.x, this.fpsCam.position.y, this.fpsCam.position.z];
      },
    };
  }
}

declare global {
  interface Window {
    __XXR__?: {
      phase: string;
      fps: number;
      ready: boolean;
      exploded: boolean;
      size?: number[];
      meshes?: number;
      pos?: number[];
      skyLimit?: number;
      armsOn?: boolean;
      armMeshes?: number;
      wrist?: number[];
      identify: () => void;
      fire: () => void;
      explode: () => void;
      lookAtPhone: () => void;
      tryMove: (x: number, y: number, z: number) => number[];
    };
  }
}
