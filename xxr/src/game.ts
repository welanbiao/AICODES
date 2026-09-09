import {
  AbstractMesh,
  AnimationGroup,
  Color3,
  Color4,
  DirectionalLight,
  Engine,
  HemisphericLight,
  Matrix,
  Node,
  PBRMaterial,
  PickingInfo,
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
  setHookVisible,
  updateRope,
  setClaws,
  aimHook,
  isAvatarMesh,
  loadFpsArms,
  type Arms,
} from "./avatar";
import { infoFor, partKeyFromName, CATALOG } from "./catalog";
import { createLaptopProp, createEarbudsProp } from "./props";
import { initAudio, unlockAudio, playSfx, stopAudio } from "./audio";

export type Phase = "loading" | "fps" | "docked" | "interior";

type HandState = "holstered" | "flying" | "stuck" | "reeling";
type LevelId = "phone" | "laptop" | "earbuds";
type LevelRef = { id: LevelId; wrap: TransformNode };

const SKY_SIZE = 72;
const PHONE_SPAN = 1.15;
const ORBIT_RADIUS = 2.52;
const ORBIT_SPEED = 0.035;
const SPIN_SPEED = 0.125;
const EXPLODE_SEC = 12;
const STAND_DIST = 1.38;
const INTERIOR_SPAN = 22;

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

function touchUi() {
  return (navigator.maxTouchPoints ?? 0) > 0 || window.matchMedia("(pointer: coarse)").matches;
}

function setPhase(phase: Phase) {
  $("#app").dataset.phase = phase;
  $<HTMLElement>("#screen-load").hidden = phase !== "loading";
  $<HTMLElement>("#screen-play").hidden = phase === "loading";
}

function playable(phase: Phase) {
  return phase === "fps" || phase === "docked" || phase === "interior";
}

let gameGen = 0;

export class Game {
  readonly engine: Engine;
  readonly scene: Scene;
  phase: Phase = "loading";
  fps = 0;
  private readonly gen: number;

  private canvas: HTMLCanvasElement;
  private fpsCam!: UniversalCamera;
  private headlamp!: SpotLight;
  private arms: Arms | null = null;
  private explodeGroup: AnimationGroup | null = null;
  private exploded = false;
  private keys = new Set<string>();
  private look = { yaw: 0, pitch: -0.08 };
  private dragging = false;
  private lookPtr: number | null = null;
  private lastPtr = { x: 0, y: 0 };
  private joy = { x: 0, y: 0 };
  private phoneSize = new Vector3(1, 1, 1);
  private moveSpeed = 7.5;
  private handState: HandState = "holstered";
  private handVel = Vector3.Zero();
  private handFlight = 0;
  private highlight: AbstractMesh | null = null;
  private worldReady = false;
  private riding: { t: number; from: Vector3; to: Vector3; lookYaw: number } | null = null;
  private restLocal = new Map<number, Vector3>();
  private explodeNodes: TransformNode[] = [];
  private explodeRest = new Map<number, Vector3>();
  private explodePose = new Map<number, Vector3>();
  private explodeT = 0;
  private explodeGoal = 0;
  private explodeDone = false;
  private phoneWrap: TransformNode | null = null;
  private phoneSpin: TransformNode | null = null;
  private phoneMeshes: AbstractMesh[] = [];
  private lv2: TransformNode | null = null;
  private lv3: TransformNode | null = null;
  private phoneAngle = 0;
  private skyMin = new Vector3(-30, -30, -30);
  private skyMax = new Vector3(30, 30, 30);
  private skyLimit = 30;
  private docked: LevelRef | null = null;
  private pendingLevel: LevelRef | null = null;
  private phoneHubScale = new Vector3(1, 1, 1);

  constructor(canvas: HTMLCanvasElement) {
    this.gen = ++gameGen;
    (window as Window & { __XXR_GEN?: number }).__XXR_GEN = this.gen;
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
    this.fpsCam.fov = 0.98;
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
    initAudio();
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
    stopAudio();
    this.engine.dispose();
  }

  private bindUi() {
    $<HTMLButtonElement>('[data-testid="btn-home"]').onclick = () => this.returnToCenter();
    $<HTMLButtonElement>('[data-testid="btn-explode-fps"]').onclick = () => this.toggleExplode();
    $<HTMLButtonElement>('[data-testid="btn-identify"]').onclick = () => this.identify();
    $<HTMLButtonElement>('[data-testid="btn-fire"]').onclick = () => this.fireHand();
    $<HTMLButtonElement>('[data-testid="btn-recall"]').onclick = () => this.recallHand();
    $<HTMLButtonElement>('[data-testid="btn-dismount"]').onclick = () => this.dismount();
    $<HTMLButtonElement>('[data-testid="btn-enter"]').onclick = () => this.enterPhone();
    this.bindHoldButtons();
  }

  private bindHoldButtons() {
    document.querySelectorAll<HTMLButtonElement>("[data-hold]").forEach((btn) => {
      const code = btn.dataset.hold;
      if (!code) return;
      const down = (e: PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        unlockAudio();
        this.keys.add(code);
        btn.setPointerCapture(e.pointerId);
      };
      const up = () => this.keys.delete(code);
      btn.addEventListener("pointerdown", down);
      btn.addEventListener("pointerup", up);
      btn.addEventListener("pointercancel", up);
    });
  }

  private bindInput() {
    window.addEventListener("keydown", (e) => {
      if (playable(this.phase) && (e.code === "Space" || e.code.startsWith("Arrow"))) e.preventDefault();
      if (e.repeat) return;
      this.keys.add(e.code);
      unlockAudio();
      if (e.code === "KeyE") this.identify();
      if (e.code === "KeyF") this.fireHand();
      if (e.code === "KeyR") this.recallHand();
      if (e.code === "KeyX") this.toggleExplode();
      if (e.code === "KeyG") this.enterPhone();
      if (e.code === "KeyH" || e.code === "Home") this.returnToCenter();
      if (e.code === "Escape" && this.phase === "docked") this.dismount();
    });
    window.addEventListener("keyup", (e) => this.keys.delete(e.code));
    window.addEventListener("blur", () => {
      this.keys.clear();
      this.dragging = false;
      this.lookPtr = null;
    });

    this.canvas.addEventListener("pointerdown", (e) => {
      if (!playable(this.phase)) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.preventDefault();
      this.dragging = true;
      this.lookPtr = e.pointerId;
      this.lastPtr = { x: e.clientX, y: e.clientY };
      this.canvas.setPointerCapture(e.pointerId);
      unlockAudio();
    });
    const endLook = (e: PointerEvent) => {
      if (e.pointerId !== this.lookPtr) return;
      this.dragging = false;
      this.lookPtr = null;
    };
    this.canvas.addEventListener("pointerup", endLook);
    this.canvas.addEventListener("pointercancel", endLook);
    this.canvas.addEventListener("lostpointercapture", endLook);
    this.canvas.addEventListener("pointermove", (e) => {
      if (!playable(this.phase) || !this.dragging || e.pointerId !== this.lookPtr) return;
      const dx = e.clientX - this.lastPtr.x;
      const dy = e.clientY - this.lastPtr.y;
      this.lastPtr = { x: e.clientX, y: e.clientY };
      const sens = e.pointerType === "touch" ? 0.0034 : 0.0024;
      this.look.yaw += dx * sens;
      this.look.pitch = Math.max(-1.2, Math.min(1.2, this.look.pitch + dy * sens));
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
      e.stopPropagation();
      e.preventDefault();
      pid = e.pointerId;
      unlockAudio();
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
        env.skybox.metadata = { xxr: "sky" };
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
      toast("瞄准关卡后发射钩爪");
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
      mesh.checkCollisions = false;
      mesh.alwaysSelectAsActiveMesh = true;
      mesh.metadata = { ...(mesh.metadata ?? {}), xxr: "sky" };
      mesh.name = mesh.name.startsWith("sky") ? mesh.name : `sky_${mesh.name}`;
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
      g.start(false, 0, g.from, g.to);
      g.pause();
      g.goToFrame(g.from);
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

    this.phoneMeshes = [];
    this.restLocal.clear();
    this.scene.meshes.forEach((m) => m.computeWorldMatrix(true));
    for (const mesh of this.scene.meshes) {
      if (!this.isPhonePart(mesh) || !mesh.getTotalVertices()) continue;
      mesh.isPickable = true;
      mesh.metadata = { ...(mesh.metadata ?? {}), xxr: "level" };
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

    if (this.explodeGroup) this.captureExplodePoses(this.explodeGroup);

    this.explodeT = 0;
    this.explodeGoal = 0;
    this.explodeDone = false;
    wrap.position.set(0, 0.16, ORBIT_RADIUS);
    this.phoneHubScale.copyFrom(wrap.scaling);
  }

  private capturingExplode = false;

  private captureExplodePoses(g: AnimationGroup) {
    this.capturingExplode = true;
    this.explodeNodes = [];
    this.explodeRest.clear();
    this.explodePose.clear();
    try {
      const seen = new Set<number>();
      for (const ta of g.targetedAnimations) {
        const node = ta.target as TransformNode | null;
        if (!node?.position || seen.has(node.uniqueId)) continue;
        seen.add(node.uniqueId);
        this.explodeNodes.push(node);
        this.explodeRest.set(node.uniqueId, node.position.clone());
      }
      if (!this.explodeNodes.length) return;

      const span = g.to - g.from;
      const cap = g.from + span * 0.92;
      let peakFrame = g.from;
      let peakScore = -1;
      const steps = 48;
      for (let i = 0; i <= steps; i++) {
        const frame = Math.min(cap, g.from + span * (i / steps));
        g.goToFrame(frame);
        let score = 0;
        for (const node of this.explodeNodes) {
          const rest = this.explodeRest.get(node.uniqueId);
          if (rest) score += Vector3.Distance(node.position, rest);
        }
        if (score > peakScore) {
          peakScore = score;
          peakFrame = frame;
        }
      }

      if (peakScore < 0.05) {
        this.explodeNodes = [];
        this.explodeRest.clear();
        this.explodePose.clear();
        return;
      }

      g.goToFrame(peakFrame);
      for (const node of this.explodeNodes) {
        this.explodePose.set(node.uniqueId, node.position.clone());
      }
      g.goToFrame(g.from);
      g.pause();
      for (const node of this.explodeNodes) {
        const rest = this.explodeRest.get(node.uniqueId);
        if (rest) node.position.copyFrom(rest);
      }
      g.stop();
      for (const node of this.explodeNodes) {
        const rest = this.explodeRest.get(node.uniqueId);
        if (rest) node.position.copyFrom(rest);
      }
    } finally {
      this.capturingExplode = false;
    }
  }

  private phoneWorldSpan() {
    const e = this.scene.getWorldExtends((m) => this.isPhonePart(m) && !!m.getTotalVertices());
    const s = e.max.subtract(e.min);
    return {
      size: [s.x, s.y, s.z],
      longest: Math.max(s.x, s.y, s.z),
      parts: this.explodeNodes.length,
    };
  }

  private isSkyMesh(mesh: AbstractMesh) {
    if (mesh.metadata?.xxr === "sky") return true;
    let n: Node | null = mesh;
    while (n) {
      if (n.name === "skyRoot" || n.name.startsWith("sky_") || /skybox|hdrSkyBox|BackgroundSkybox/i.test(n.name)) return true;
      n = n.parent;
    }
    return false;
  }

  private isLevelMesh(mesh: AbstractMesh) {
    if (!mesh.isPickable || !mesh.isEnabled()) return false;
    if (this.isSkyMesh(mesh) || isAvatarMesh(mesh)) return false;
    if (mesh.metadata?.xxr === "level") return true;
    return !!this.levelRootOf(mesh);
  }

  private canLatch(mesh: AbstractMesh) {
    return this.isLevelMesh(mesh);
  }

  private isPhonePart(mesh: AbstractMesh) {
    let n: Node | null = mesh;
    while (n) {
      if (n.name === "phoneWrap" || n.name === "phoneSpin" || n.name === "phoneModel") return true;
      n = n.parent;
    }
    return false;
  }

  private levelRootOf(mesh: AbstractMesh | Node | null): LevelRef | null {
    let n: Node | null = mesh;
    while (n) {
      if (n.name === "phoneWrap" && this.phoneWrap) return { id: "phone", wrap: this.phoneWrap };
      if (n.name === "level-laptop" && this.lv2) return { id: "laptop", wrap: this.lv2 };
      if (n.name === "level-earbuds" && this.lv3) return { id: "earbuds", wrap: this.lv3 };
      n = n.parent;
    }
    return null;
  }

  private makeLevelOrbs() {
    this.lv2 = createLaptopProp(this.scene);
    this.lv3 = createEarbudsProp(this.scene);
  }

  returnToCenter() {
    if (!this.worldReady) return;
    this.riding = null;
    this.pendingLevel = null;
    this.docked = null;
    if (this.arms && this.handState !== "holstered") this.recallHand(true);
    this.exitInterior(true);
    this.fpsCam.position.set(0, 0, 0);
    this.look.yaw = 0;
    this.look.pitch = -0.08;
    this.applyLook();
    this.phase = "fps";
    setPhase("fps");
    $<HTMLElement>("#play-status").textContent = "星空枢纽";
    this.syncHandButtons();
    toast("已返回星空中心");
  }

  toggleExplode() {
    if (!this.worldReady) return;
    const onPhone = this.phase === "interior" || this.docked?.id === "phone";
    if (!onPhone) {
      toast("先用钩爪锁定我的手机");
      return;
    }
    this.exploded = !this.exploded;
    this.explodeGoal = this.exploded ? 1 : 0;
    if (!this.exploded) this.explodeDone = false;
    this.syncHandButtons();
    toast(this.exploded ? "爆炸图展开" : "零件合拢");
  }

  lookAtPhone() {
    if (!this.phoneWrap) return;
    this.lookAtNode(this.phoneWrap);
  }

  private lookAtNode(node: TransformNode) {
    node.computeWorldMatrix(true);
    const dir = node.getAbsolutePosition().subtract(this.fpsCam.position);
    const horiz = Math.max(0.001, Math.hypot(dir.x, dir.z));
    this.look.yaw = Math.atan2(dir.x, dir.z);
    this.look.pitch = clamp(-Math.atan2(dir.y, horiz), -1.2, 1.2);
    this.applyLook();
    this.fpsCam.getViewMatrix();
  }

  identify() {
    if (!playable(this.phase)) return;
    const hit = this.pickPart();
    const card = $<HTMLElement>("#identify-card");
    if (this.highlight) {
      this.highlight.renderOverlay = false;
      this.highlight = null;
    }
    if (!hit?.pickedMesh) {
      card.hidden = false;
      card.innerHTML = `<h2>未锁定</h2><p>准星没有对准关卡模型或零件。</p>`;
      return;
    }
    const mesh = hit.pickedMesh;
    this.highlight = mesh;
    mesh.renderOverlay = true;
    mesh.overlayColor = new Color3(0.24, 0.88, 0.78);
    mesh.overlayAlpha = 0.35;
    const level = this.levelRootOf(mesh);
    const info =
      level?.id === "laptop"
        ? { name: "我的电脑", role: "第二关场景", material: "铝合金机身", note: "即将开放。" }
        : level?.id === "earbuds"
          ? { name: "无线耳机", role: "第三关场景", material: "塑料 + 金属", note: "即将开放。" }
          : infoFor(this.resolveName(mesh));
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
    this.fpsCam.getViewMatrix();
    this.scene.updateTransformMatrix();
    const level = this.aimLevel();
    if (!level) {
      toast("未锁定关卡，钩爪不能发射");
      return;
    }
    this.lookAtNode(level.wrap);
    this.launchAt(level);
  }

  private launchAt(level: LevelRef) {
    if (!this.arms || this.handState !== "holstered" || this.phase !== "fps") return;
    const hook = this.arms.rightHand;
    setHookVisible(this.arms, true);
    const origin = this.arms.wristAnchor.getAbsolutePosition();
    hook.setParent(null);
    hook.setAbsolutePosition(origin);
    this.clampToSky(hook.position);
    const target = level.wrap.getAbsolutePosition();
    const dir = target.subtract(origin);
    if (dir.lengthSquared() < 1e-6) dir.set(0, 0, 1);
    this.handVel = dir.normalize().scale(28);
    aimHook(hook, this.handVel);
    setClaws(this.arms.claws, 0.92);
    this.handFlight = 0;
    this.handState = "flying";
    this.pendingLevel = level;
    this.docked = level;
    this.phase = "docked";
    setPhase("docked");
    const { stand, yaw } = this.standInFront(level.wrap);
    this.riding = { t: 0, from: this.fpsCam.position.clone(), to: stand, lookYaw: yaw };
    $<HTMLElement>("#play-status").textContent = `锁定 ${{ phone: "我的手机", laptop: "我的电脑", earbuds: "无线耳机" }[level.id]}`;
    this.syncHandButtons();
    playSfx("fire");
    window.setTimeout(() => {
      if (this.riding) {
        this.fpsCam.position.copyFrom(this.riding.to);
        this.look.yaw = this.riding.lookYaw;
        this.clampPlayer();
        this.riding = null;
      }
      if (this.phase === "docked") this.finishDock();
    }, 850);
  }

  recallHand(silent = false) {
    if (!this.arms || this.handState === "holstered" || this.handState === "reeling") return;
    this.riding = null;
    this.pendingLevel = null;
    if (this.phase === "fps") this.docked = null;
    this.arms.rightHand.setParent(null);
    setClaws(this.arms.claws, 0.35);
    this.handState = "reeling";
    this.syncHandButtons();
    if (!silent) playSfx("recall");
  }

  dismount() {
    if (this.phase !== "docked" || !this.docked) return;
    this.alignOrbitTo(this.docked);
    this.docked = null;
    this.pendingLevel = null;
    this.phase = "fps";
    setPhase("fps");
    $<HTMLElement>("#play-status").textContent = "星空枢纽";
    this.syncHandButtons();
    toast("已解除锁定");
  }

  private alignOrbitTo(level: LevelRef) {
    const cam = this.fpsCam.position;
    const rel = level.wrap.position.subtract(cam);
    const a = Math.atan2(rel.x, rel.z);
    if (level.id === "phone") this.phoneAngle = a;
    else if (level.id === "laptop") this.phoneAngle = a - (Math.PI * 2) / 3;
    else this.phoneAngle = a - (Math.PI * 4) / 3;
  }

  private syncHandButtons() {
    const holstered = this.handState === "holstered";
    const moving = this.phase === "fps" || this.phase === "interior";
    $<HTMLButtonElement>('[data-testid="btn-recall"]').hidden = holstered || this.handState === "reeling";
    $<HTMLButtonElement>('[data-testid="btn-fire"]').hidden = !holstered || this.phase !== "fps";
    $<HTMLButtonElement>('[data-testid="btn-dismount"]').hidden = this.phase !== "docked";
    const canExplode = this.phase === "interior" || this.docked?.id === "phone";
    $<HTMLButtonElement>('[data-testid="btn-explode-fps"]').hidden = !canExplode;
    const canEnter = this.explodeDone && this.docked?.id === "phone" && this.phase === "docked";
    $<HTMLButtonElement>('[data-testid="btn-enter"]').hidden = !canEnter;
    const pad = $<HTMLElement>('[data-testid="move-pad"]');
    if (pad) pad.hidden = !moving;
    const joy = $<HTMLElement>("#joystick");
    if (joy) joy.hidden = !(touchUi() && moving);
  }

  private pickPart(): PickingInfo | null {
    const ray = this.fpsCam.getForwardRay(22);
    const hit = this.scene.pickWithRay(ray, (m) => this.canLatch(m));
    if (hit?.hit && hit.pickedMesh) return hit;
    const aimed = this.aimLevel();
    if (!aimed) return null;
    const mesh = this.scene.meshes.find((m) => this.levelRootOf(m)?.id === aimed.id && !!m.getTotalVertices());
    if (!mesh) return null;
    const info = new PickingInfo();
    info.hit = true;
    info.pickedMesh = mesh;
    info.distance = Vector3.Distance(this.fpsCam.position, aimed.wrap.position);
    return info;
  }

  private eachLevel(): LevelRef[] {
    const levels: LevelRef[] = [];
    if (this.phoneWrap) levels.push({ id: "phone", wrap: this.phoneWrap });
    if (this.lv2) levels.push({ id: "laptop", wrap: this.lv2 });
    if (this.lv3) levels.push({ id: "earbuds", wrap: this.lv3 });
    return levels;
  }

  private aimLevel(): LevelRef | null {
    this.fpsCam.getViewMatrix();
    this.scene.updateTransformMatrix();
    const w = this.engine.getRenderWidth();
    const h = this.engine.getRenderHeight();
    const pick = this.scene.pick(w * 0.5, h * 0.5, (m) => this.canLatch(m));
    if (pick?.hit && pick.pickedMesh) {
      const locked = this.levelRootOf(pick.pickedMesh);
      if (locked) return locked;
    }

    const ray = this.fpsCam.getForwardRay(28);
    const hit = this.scene.pickWithRay(ray, (m) => this.canLatch(m));
    if (hit?.hit && hit.pickedMesh) {
      const locked = this.levelRootOf(hit.pickedMesh);
      if (locked) return locked;
    }

    const fwd = ray.direction;
    if (fwd.lengthSquared() < 1e-8) return null;
    const viewport = this.fpsCam.viewport.toGlobal(w, h);
    const transform = this.scene.getTransformMatrix();
    let best: { level: LevelRef; score: number } | null = null;
    for (const level of this.eachLevel()) {
      level.wrap.computeWorldMatrix(true);
      const center = level.wrap.getAbsolutePosition();
      const to = center.subtract(this.fpsCam.position);
      const dist = to.length();
      if (dist < 0.12 || dist > 28) continue;
      const dir = to.scale(1 / dist);
      const dot = Vector3.Dot(fwd, dir);
      if (dot < 0.18) continue;
      const p = Vector3.Project(center, Matrix.Identity(), transform, viewport);
      if (p.z <= 0 || p.z >= 1) continue;
      const screen = Math.hypot(p.x / w - 0.5, p.y / h - 0.5);
      const box = level.wrap.getHierarchyBoundingVectors(true);
      const boxOk = Number.isFinite(box.min.x) && Number.isFinite(box.max.x) && box.max.x >= box.min.x;
      const hitsBox = boxOk && ray.intersectsBoxMinMax(box.min, box.max);
      if (!hitsBox && screen > 0.36 && dot < 0.78) continue;
      const score = (hitsBox ? 2.2 : 1) * dot + (1 - Math.min(screen, 1)) * 1.35 + 0.4 / Math.max(dist, 0.5);
      if (!best || score > best.score) best = { level, score };
    }
    return best?.level ?? null;
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
    if (this.capturingExplode) return;
    const step = dt / EXPLODE_SEC;
    if (this.explodeT < this.explodeGoal) this.explodeT = Math.min(this.explodeGoal, this.explodeT + step);
    else if (this.explodeT > this.explodeGoal) this.explodeT = Math.max(this.explodeGoal, this.explodeT - step);
    const ease = this.explodeT * this.explodeT * (3 - 2 * this.explodeT);
    if (this.explodeNodes.length) {
      for (const node of this.explodeNodes) {
        const rest = this.explodeRest.get(node.uniqueId);
        const pose = this.explodePose.get(node.uniqueId);
        if (!rest || !pose) continue;
        Vector3.LerpToRef(rest, pose, ease, node.position);
      }
    } else if (this.explodeGroup) {
      const g = this.explodeGroup;
      g.goToFrame(g.from + (g.to - g.from) * 0.84 * ease);
      g.pause();
    }
    if (this.exploded && this.explodeT >= 0.995) {
      if (!this.explodeDone) {
        this.explodeDone = true;
        this.syncHandButtons();
        if (this.phase === "docked" && this.docked?.id === "phone") toast("可以进入内部探索");
      }
    }
  }

  private applyLook() {
    this.fpsCam.rotation.x = this.look.pitch;
    this.fpsCam.rotation.y = this.look.yaw;
    this.fpsCam.rotation.z = 0;
  }

  private orbitLevels(dt: number) {
    if (this.phase === "interior") return;
    this.phoneAngle += dt * ORBIT_SPEED;
    const cam = this.fpsCam.position;
    const frozen = this.docked?.id;
    const place = (node: TransformNode | null, offset: number, y: number, id: LevelId) => {
      if (!node || frozen === id) return;
      const a = this.phoneAngle + offset;
      node.position.set(cam.x + Math.sin(a) * ORBIT_RADIUS, cam.y + y, cam.z + Math.cos(a) * ORBIT_RADIUS);
    };
    place(this.phoneWrap, 0, 0.16, "phone");
    place(this.lv2, (Math.PI * 2) / 3, 0.02, "laptop");
    place(this.lv3, (Math.PI * 4) / 3, 0.02, "earbuds");
    if (this.phoneSpin && frozen !== "phone") this.phoneSpin.rotation.y += dt * SPIN_SPEED;
    if (this.lv2 && frozen !== "laptop") this.lv2.rotation.y += dt * 0.175;
    if (this.lv3 && frozen !== "earbuds") this.lv3.rotation.y += dt * 0.175;
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
    if (this.phase === "loading" || this.phase === "interior") {
      $<HTMLElement>('[data-testid="level-label"]').style.opacity = "0";
      $<HTMLElement>('[data-testid="level-2-label"]').style.opacity = "0";
      $<HTMLElement>('[data-testid="level-3-label"]').style.opacity = "0";
      return;
    }
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
      this.riding.t += Math.max(dt, 0.016) / 0.7;
      const t = easeInOut(Math.min(1, this.riding.t));
      Vector3.LerpToRef(this.riding.from, this.riding.to, t, this.fpsCam.position);
      this.look.yaw = this.riding.lookYaw;
      this.clampPlayer();
      if (this.riding.t >= 1) {
        this.riding = null;
        this.finishDock();
      }
    } else if (this.phase === "fps" || this.phase === "interior") this.moveFps(dt);
    if (this.handState === "flying") this.tickHand(dt);
    else if (this.handState === "reeling") this.tickReel(dt);
    this.updateHookRope();
    this.applyLook();
    this.updateLabels();
  }

  private clampToSky(p: Vector3) {
    p.x = clamp(p.x, this.skyMin.x, this.skyMax.x);
    p.y = clamp(p.y, this.skyMin.y, this.skyMax.y);
    p.z = clamp(p.z, this.skyMin.z, this.skyMax.z);
    return p;
  }

  private clampPlayer() {
    this.clampToSky(this.fpsCam.position);
    if (this.phase !== "interior" || !this.phoneWrap) return;
    const extents = this.scene.getWorldExtends((m) => this.isPhonePart(m) && !!m.getTotalVertices());
    const pad = 0.45;
    const p = this.fpsCam.position;
    p.x = clamp(p.x, extents.min.x + pad, extents.max.x - pad);
    p.y = clamp(p.y, extents.min.y + pad, extents.max.y - pad);
    p.z = clamp(p.z, extents.min.z + pad, extents.max.z - pad);
    this.clampToSky(p);
  }

  private moveFps(dt: number) {
    const sprint = this.keys.has("ShiftLeft") || this.keys.has("ShiftRight") ? 1.85 : 1;
    const speed = (this.phase === "interior" ? 3.2 : this.moveSpeed) * sprint;
    let x = this.joy.x;
    let z = -this.joy.y;
    if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) x -= 1;
    if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) x += 1;
    if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) z += 1;
    if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) z -= 1;
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

  private standInFront(wrap: TransformNode) {
    wrap.computeWorldMatrix(true);
    const center = wrap.getAbsolutePosition();
    const dir = center.subtract(this.fpsCam.position);
    dir.y = 0;
    if (dir.lengthSquared() < 1e-6) dir.set(0, 0, 1);
    dir.normalize();
    const stand = this.clampToSky(center.subtract(dir.scale(STAND_DIST)));
    stand.y = center.y + 0.08;
    this.clampToSky(stand);
    return { stand, yaw: Math.atan2(dir.x, dir.z) };
  }

  private finishDock() {
    const level = this.docked ?? this.pendingLevel;
    this.pendingLevel = null;
    if (this.arms) {
      holsterHook(this.arms);
      this.handState = "holstered";
    }
    if (!level) return;
    this.docked = level;
    this.phase = "docked";
    setPhase("docked");
    const names: Record<LevelId, string> = { phone: "我的手机", laptop: "我的电脑", earbuds: "无线耳机" };
    $<HTMLElement>("#play-status").textContent = `锁定 ${names[level.id]}`;
    this.syncHandButtons();
    if (level.id === "phone") toast("点击爆炸图，看完后可进入内部");
    else toast(`${names[level.id]}即将开放`);
  }

  enterPhone() {
    if (!this.worldReady || !this.phoneWrap) return;
    if (this.phase !== "docked" || this.docked?.id !== "phone") {
      toast("先用钩爪锁定我的手机");
      return;
    }
    if (!this.explodeDone) {
      toast("先看完爆炸图动画");
      return;
    }
    this.riding = null;
    this.phoneHubScale.copyFrom(this.phoneWrap.scaling);
    this.phoneWrap.computeWorldMatrix(true);
    const before = this.scene.getWorldExtends((m) => this.isPhonePart(m) && !!m.getTotalVertices());
    const size = before.max.subtract(before.min);
    const longest = Math.max(size.x, size.y, size.z, 0.001);
    this.phoneWrap.scaling.scaleInPlace(INTERIOR_SPAN / longest);
    this.phoneWrap.computeWorldMatrix(true);
    const after = this.scene.getWorldExtends((m) => this.isPhonePart(m) && !!m.getTotalVertices());
    const center = after.min.add(after.max).scale(0.5);
    this.lv2?.setEnabled(false);
    this.lv3?.setEnabled(false);
    this.phase = "interior";
    setPhase("interior");
    this.fpsCam.position.copyFrom(center);
    this.clampPlayer();
    $<HTMLElement>("#play-status").textContent = "手机内部";
    this.syncHandButtons();
    toast("进入内部探索");
  }

  private exitInterior(resetExplode: boolean) {
    if (this.phoneWrap) {
      this.phoneWrap.scaling.copyFrom(this.phoneHubScale);
    }
    this.lv2?.setEnabled(true);
    this.lv3?.setEnabled(true);
    if (resetExplode) {
      this.exploded = false;
      this.explodeGoal = 0;
      this.explodeT = 0;
      this.explodeDone = false;
      if (this.explodeGroup) {
        this.explodeGroup.goToFrame(this.explodeGroup.from);
        this.explodeGroup.pause();
      }
      for (const node of this.explodeNodes) {
        const rest = this.explodeRest.get(node.uniqueId);
        if (rest) node.position.copyFrom(rest);
      }
      for (const mesh of this.phoneMeshes) {
        const rest = this.restLocal.get(mesh.uniqueId);
        if (rest) mesh.position.copyFrom(rest);
      }
    }
  }

  private finishExplodeNow() {
    this.exploded = true;
    this.explodeGoal = 1;
    this.explodeT = 1;
    this.applyExplode(0);
    this.explodeDone = true;
    this.syncHandButtons();
  }

  private tickHand(dt: number) {
    if (!this.arms) return;
    const hand = this.arms.rightHand;
    const prev = hand.getAbsolutePosition();
    const level = this.pendingLevel ?? this.docked;
    if (level) {
      const to = level.wrap.getAbsolutePosition().subtract(prev);
      if (to.lengthSquared() > 1e-8) this.handVel = to.normalize().scale(28);
    }
    const next = prev.add(this.handVel.scale(dt));
    this.clampToSky(next);
    hand.setParent(null);
    hand.setAbsolutePosition(next);
    aimHook(hand, this.handVel);
    this.handFlight += Vector3.Distance(prev, next);
    if (level && Vector3.Distance(next, level.wrap.getAbsolutePosition()) < 0.55) {
      hand.setAbsolutePosition(level.wrap.getAbsolutePosition());
      this.handState = "stuck";
      playSfx("hit");
    }
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
    if ((window as Window & { __XXR_GEN?: number }).__XXR_GEN !== this.gen) return;
    const p = this.fpsCam.position;
    window.__XXR__ = {
      phase: this.phase,
      fps: this.fps,
      ready: this.worldReady,
      exploded: this.exploded,
      explodeDone: this.explodeDone,
      docked: this.docked?.id ?? null,
      hookOn: !!this.arms?.rightHand.isEnabled(),
      size: [this.phoneSize.x, this.phoneSize.y, this.phoneSize.z],
      meshes: this.scene.meshes.length,
      pos: [p.x, p.y, p.z],
      skyLimit: this.skyLimit,
      armsOn: !!this.arms?.root.isEnabled(),
      armMeshes: this.arms?.root.getChildMeshes().length ?? 0,
      wrist: this.arms ? this.arms.wristAnchor.getAbsolutePosition().asArray() : [0, 0, 0],
      handState: this.handState,
      identify: () => this.identify(),
      fire: () => this.fireHand(),
      grabPhone: () => {
        if (!this.phoneWrap || this.phase !== "fps") return this.phase;
        this.lookAtPhone();
        this.launchAt({ id: "phone", wrap: this.phoneWrap });
        return this.phase;
      },
      getState: () => ({
        phase: this.phase,
        docked: this.docked?.id ?? null,
        hookOn: !!this.arms?.rightHand.isEnabled(),
        exploded: this.exploded,
        explodeDone: this.explodeDone,
        handState: this.handState,
        gen: this.gen,
      }),
      explode: () => this.toggleExplode(),
      phoneSpan: () => this.phoneWorldSpan(),
      finishExplode: () => this.finishExplodeNow(),
      enter: () => this.enterPhone(),
      lookAtPhone: () => this.lookAtPhone(),
      home: () => this.returnToCenter(),
      setLook: (yaw, pitch) => {
        this.look.yaw = yaw;
        this.look.pitch = pitch;
        this.applyLook();
      },
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
      explodeDone?: boolean;
      docked?: string | null;
      hookOn?: boolean;
      size?: number[];
      meshes?: number;
      pos?: number[];
      skyLimit?: number;
      armsOn?: boolean;
      armMeshes?: number;
      wrist?: number[];
      handState?: string;
      identify: () => void;
      fire: () => void;
      grabPhone?: () => string | void;
      getState?: () => {
        phase: string;
        docked: string | null;
        hookOn: boolean;
        exploded: boolean;
        explodeDone: boolean;
        handState: string;
        gen: number;
      };
      explode: () => void;
      phoneSpan?: () => { size: number[]; longest: number; parts: number };
      finishExplode?: () => void;
      enter?: () => void;
      lookAtPhone: () => void;
      home: () => void;
      setLook: (yaw: number, pitch: number) => void;
      tryMove: (x: number, y: number, z: number) => number[];
    };
  }
}
