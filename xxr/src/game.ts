import {
  AbstractMesh,
  AnimationGroup,
  Camera,
  Color3,
  Color4,
  DirectionalLight,
  Engine,
  HemisphericLight,
  Material,
  Matrix,
  MultiMaterial,
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
import { CREDITS_TEXT } from "./credits";
import { initAudio, unlockAudio, playSfx, stopAudio } from "./audio";
import {
  deleteMyModel,
  fetchMyModelBuffer,
  fileToBase64,
  listMyModels,
  loadAuthSession,
  type AuthSession,
  uploadMyModel,
  type UserModel,
} from "./api";
import { buildPortalSphere, facePortalPluses, type PortalBuild } from "./portal";

export type Phase = "loading" | "fps" | "docked" | "interior";

type HandState = "holstered" | "flying" | "stuck" | "reeling";
type BuiltinLevelId = "phone" | "laptop" | "earbuds" | "connor" | "north" | "portal";
type LevelId = BuiltinLevelId | string;
type LevelRef = { id: LevelId; wrap: TransformNode };
type LevelKind = "normal" | "portal" | "custom";
type LevelRing = "inner" | "outer";

type LevelPack = {
  id: LevelId;
  title: string;
  wrap: TransformNode;
  spin: TransformNode;
  meshes: AbstractMesh[];
  explodeGroup: AnimationGroup | null;
  explodeNodes: TransformNode[];
  explodeRest: Map<number, Vector3>;
  explodePose: Map<number, Vector3>;
  restLocal: Map<number, Vector3>;
  hubScale: Vector3;
  explodeT: number;
  explodeGoal: number;
  exploded: boolean;
  explodeDone: boolean;
  explodeSec: number;
  animGroups: AnimationGroup[];
  looping: boolean;
  ring: LevelRing;
  orbit: number;
  y: number;
  kind: LevelKind;
  plusRoots?: TransformNode[];
  modelId?: string;
  interior: string;
  role: string;
  material: string;
  note: string;
};

const LEVEL_META: Record<
  BuiltinLevelId,
  {
    title: string;
    wrap: string;
    spin: string;
    model: string;
    file: string;
    y: number;
    orbit: number;
    interior: string;
    role: string;
    material: string;
    note: string;
  }
> = {
  phone: {
    title: "手机",
    wrap: "phoneWrap",
    spin: "phoneSpin",
    model: "phoneModel",
    file: "iphone_12_teardown.glb",
    y: 0.16,
    orbit: 0,
    interior: "手机内部",
    role: "口袋里的微型计算机",
    material: "铝合金中框 + 玻璃盖板。内部叠着电池、主板、摄像头和天线，把整台电脑缩进掌心。",
    note: "靠近后会自动展开爆炸图，看完可进入内部。",
  },
  laptop: {
    title: "20世纪电脑",
    wrap: "level-laptop",
    spin: "laptopSpin",
    model: "laptopModel",
    file: "lumen_64_spark__computer.glb",
    y: 0.1,
    orbit: (Math.PI * 2) / 6,
    interior: "20世纪电脑内部",
    role: "蒸汽齿轮实验主机",
    material: "外露齿轮、灯管和机械锁扣的金属箱体。运算靠可见的传动机构完成，像一台会动的机械电脑。",
    note: "靠近后会自动播放动画，看完可进入内部。",
  },
  earbuds: {
    title: "21世纪电脑",
    wrap: "level-earbuds",
    spin: "earbudsSpin",
    model: "earbudsModel",
    file: "computer.glb",
    y: 0.1,
    orbit: (Math.PI * 4) / 6,
    interior: "21世纪电脑内部",
    role: "新时代电脑主机",
    material: "承载电脑所有核心运算和硬件调度的“核心箱体”。包含CPU、主板、内存条、硬盘、电源、显卡、散热系统等关键组件。",
    note: "靠近后会自动播放动画，看完可进入内部。",
  },
  connor: {
    title: "康纳",
    wrap: "level-connor",
    spin: "connorSpin",
    model: "connorModel",
    file: "connor_human.glb",
    y: 0.08,
    orbit: (Math.PI * 6) / 6,
    interior: "康纳内部",
    role: "CyberLife 派来的仿生人侦探",
    material: "仿生皮肤、液态聚合物肌肉与精密骨架。太阳穴有一枚状态 LED。",
    note: "靠近后会自动播放待机动画，看完可进入内部。",
  },
  north: {
    title: "诺斯",
    wrap: "level-north",
    spin: "northSpin",
    model: "northModel",
    file: "north_human.glb",
    y: 0.08,
    orbit: (Math.PI * 8) / 6,
    interior: "诺斯内部",
    role: "耶利哥的仿生人革命者",
    material: "仿生皮肤与强化纤维组织。短发、作战上衣与赤手。",
    note: "靠近后会自动播放待机动画，看完可进入内部。",
  },
  portal: {
    title: "创世球",
    wrap: "level-portal",
    spin: "portalSpin",
    model: "portalModel",
    file: "",
    y: 0.12,
    orbit: (Math.PI * 10) / 6,
    interior: "创世球内部",
    role: "自定义关卡入口",
    material: "深空球体与五个加号标记。",
    note: "钩爪锁定后可导入自己的 GLB，生成外环关卡。",
  },
};

const BUILTIN_LOAD_ORDER: BuiltinLevelId[] = ["phone", "laptop", "earbuds", "connor", "north", "portal"];

const SKY_SIZE = 72;
const PHONE_SPAN = 1.15;
const ORBIT_RADIUS = 2.52;
const OUTER_ORBIT_RADIUS = ORBIT_RADIUS * 2;
const ORBIT_SPEED = 0.035;
const OUTER_ORBIT_SPEED = ORBIT_SPEED * (2 / 3);
const OUTER_Y = -0.95;
const SPIN_SPEED = 0.125;
const EXPLODE_SEC = 12;
const STAND_DIST = 1.38;
const AUTO_EXPLODE_DIST = 2.05;
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

function setPhase(phase: Phase) {
  $("#app").dataset.phase = phase;
  const load = document.querySelector("#screen-load") as HTMLElement | null;
  if (load) load.hidden = phase !== "loading";
  const play = document.querySelector("#screen-play") as HTMLElement | null;
  if (play) play.hidden = phase === "loading";
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
  private hemi!: HemisphericLight;
  private sun!: DirectionalLight;
  private arms: Arms | null = null;
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
  private levelsReady = false;
  private loadingLevel: LevelId | null = null;
  private riding: { t: number; from: Vector3; to: Vector3; lookYaw: number; lookPitch?: number } | null = null;
  private pendingPart: AbstractMesh | null = null;
  private explodeDone = false;
  private nearExplode = false;
  private packs = new Map<LevelId, LevelPack>();
  private interiorId: LevelId | null = null;
  private phoneWrap: TransformNode | null = null;
  private phoneSpin: TransformNode | null = null;
  private lv2: TransformNode | null = null;
  private lv3: TransformNode | null = null;
  private lv4: TransformNode | null = null;
  private lv5: TransformNode | null = null;
  private lv6: TransformNode | null = null;
  private phoneAngle = 0;
  private outerAngle = 0;
  private authSession: AuthSession | null = null;
  private portalPlus: TransformNode[] = [];
  private importBusy = false;
  private skyRoot: TransformNode | null = null;
  private skyMin = new Vector3(-30, -30, -30);
  private skyMax = new Vector3(30, 30, 30);
  private skyCenter = new Vector3(0, 0, 0);
  private skyRadius = 30;
  private skyLimit = 30;
  private docked: LevelRef | null = null;
  private pendingLevel: LevelRef | null = null;
  private nativeScale = new Map<number, Vector3>();
  private zoomBase = new Map<number, Vector3>();
  private ptrs = new Map<number, { x: number; y: number }>();
  private pinchDist = 0;
  private pinching = false;
  private viewZoom = 1;
  private readonly baseFov = 1.22;

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
    this.hemi = hemi;
    const sun = new DirectionalLight("sun", new Vector3(-0.35, -1, 0.15), this.scene);
    sun.intensity = 0.55;
    this.sun = sun;

    this.fpsCam = new UniversalCamera("fps", new Vector3(0, 0, 0), this.scene);
    this.fpsCam.minZ = 0.02;
    this.fpsCam.maxZ = 400;
    this.fpsCam.fovMode = Camera.FOVMODE_HORIZONTAL_FIXED;
    this.fpsCam.fov = this.baseFov;
    this.fpsCam.inertia = 0;
    this.fpsCam.speed = 0;
    this.fpsCam.applyGravity = false;
    this.fpsCam.checkCollisions = false;
    this.scene.activeCamera = this.fpsCam;

    this.headlamp = new SpotLight("headlamp", Vector3.Zero(), new Vector3(0, 0, 1), 0.7, 2.2, this.scene);
    this.headlamp.intensity = 5.4;
    this.headlamp.range = 40;
    this.headlamp.diffuse = new Color3(1, 0.97, 0.88);
    this.headlamp.specular = new Color3(1, 0.96, 0.9);
    this.headlamp.angle = 0.7;
    this.headlamp.innerAngle = 0.28;
    this.headlamp.exponent = 2.2;
    this.headlamp.falloffType = SpotLight.FALLOFF_STANDARD;

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
    this.fpsCam.fovMode = Camera.FOVMODE_HORIZONTAL_FIXED;
    this.applyViewFov();
  }

  dispose() {
    stopAudio();
    this.engine.dispose();
  }

  private bindUi() {
    $<HTMLButtonElement>('[data-testid="btn-home"]').onclick = () => this.returnToCenter();
    $<HTMLButtonElement>('[data-testid="btn-explode-fps"]').onclick = () => this.foldTogether();
    $<HTMLButtonElement>('[data-testid="btn-identify"]').onclick = () => this.identify();
    $<HTMLButtonElement>('[data-testid="btn-fire"]').onclick = () => this.fireHand();
    $<HTMLButtonElement>('[data-testid="btn-dismount"]').onclick = () => this.dismount();
    $<HTMLButtonElement>('[data-testid="btn-enter"]').onclick = () => this.enterInterior();
    const aboutBtn = document.querySelector('[data-testid="btn-about"]') as HTMLButtonElement | null;
    if (aboutBtn) aboutBtn.onclick = () => this.openAbout();
    const aboutClose = document.querySelector('[data-testid="btn-about-close"]') as HTMLButtonElement | null;
    if (aboutClose) aboutClose.onclick = () => this.closeAbout();
    this.fillAbout();
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
      if (e.code === "KeyX") this.foldTogether();
      if (e.code === "KeyG") this.enterInterior();
      if (e.code === "KeyH" || e.code === "Home") this.returnToCenter();
      if (e.code === "Escape") {
        if (this.aboutOpen()) {
          this.closeAbout();
          return;
        }
        if (this.phase === "docked") this.dismount();
      }
    });
    window.addEventListener("keyup", (e) => this.keys.delete(e.code));
    window.addEventListener("blur", () => {
      this.keys.clear();
      this.dragging = false;
      this.lookPtr = null;
      this.ptrs.clear();
      this.pinching = false;
    });

    this.canvas.addEventListener("pointerdown", (e) => {
      if (!playable(this.phase)) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.preventDefault();
      this.ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      unlockAudio();
      if (this.ptrs.size >= 2) {
        this.pinching = true;
        this.dragging = false;
        this.lookPtr = null;
        this.pinchDist = this.pointerSpan();
        return;
      }
      this.dragging = true;
      this.lookPtr = e.pointerId;
      this.lastPtr = { x: e.clientX, y: e.clientY };
    });
    const endLook = (e: PointerEvent) => {
      this.ptrs.delete(e.pointerId);
      if (this.ptrs.size < 2) this.pinching = false;
      if (e.pointerId === this.lookPtr) {
        this.dragging = false;
        this.lookPtr = null;
      }
      if (this.ptrs.size === 1 && !this.pinching) {
        const [id, p] = [...this.ptrs.entries()][0];
        this.dragging = true;
        this.lookPtr = id;
        this.lastPtr = { x: p.x, y: p.y };
      }
      if (this.ptrs.size === 0) {
        this.dragging = false;
        this.lookPtr = null;
      }
    };
    this.canvas.addEventListener("pointerup", endLook);
    this.canvas.addEventListener("pointercancel", endLook);
    this.canvas.addEventListener("pointermove", (e) => {
      if (!playable(this.phase)) return;
      const tracked = this.ptrs.get(e.pointerId);
      if (tracked) {
        tracked.x = e.clientX;
        tracked.y = e.clientY;
      }
      if (this.pinching && this.ptrs.size >= 2) {
        const dist = this.pointerSpan();
        if (this.pinchDist > 12 && dist > 12) this.zoomInspect(dist / this.pinchDist);
        this.pinchDist = dist;
        return;
      }
      if (!this.dragging || e.pointerId !== this.lookPtr) return;
      const dx = e.clientX - this.lastPtr.x;
      const dy = e.clientY - this.lastPtr.y;
      this.lastPtr = { x: e.clientX, y: e.clientY };
      const sens = e.pointerType === "touch" ? 0.0034 : 0.0024;
      this.look.yaw += dx * sens;
      this.look.pitch = Math.max(-1.2, Math.min(1.2, this.look.pitch + dy * sens));
    });
    this.canvas.addEventListener(
      "wheel",
      (e) => {
        if (!playable(this.phase)) return;
        e.preventDefault();
        this.zoomInspect(e.deltaY < 0 ? 1.08 : 0.92);
      },
      { passive: false },
    );
    this.bindTouchZoom();

    this.bindJoystick();
  }

  private bindTouchZoom() {
    const span = (touches: TouchList) => {
      if (touches.length < 2) return 0;
      return Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
    };
    const opts: AddEventListenerOptions = { passive: false, capture: true };
    window.addEventListener(
      "touchstart",
      (e) => {
        if (!playable(this.phase) || e.touches.length < 2) return;
        e.preventDefault();
        this.pinching = true;
        this.dragging = false;
        this.lookPtr = null;
        this.joy.x = 0;
        this.joy.y = 0;
        this.pinchDist = span(e.touches);
      },
      opts,
    );
    window.addEventListener(
      "touchmove",
      (e) => {
        if (!this.pinching || e.touches.length < 2) return;
        e.preventDefault();
        const dist = span(e.touches);
        if (this.pinchDist > 8 && dist > 8) this.zoomInspect(dist / this.pinchDist);
        this.pinchDist = dist;
      },
      opts,
    );
    const endPinch = (e: TouchEvent) => {
      if (e.touches.length < 2) this.pinching = false;
    };
    window.addEventListener("touchend", endPinch, opts);
    window.addEventListener("touchcancel", endPinch, opts);
    window.addEventListener("gesturestart", (e) => e.preventDefault(), opts);
    window.addEventListener("gesturechange", (e) => e.preventDefault(), opts);
  }

  private bindJoystick() {
    const base = $<HTMLElement>("#joystick");
    const knob = $<HTMLElement>("#joy-knob");
    let pid: number | null = null;
    let origin = { x: 0, y: 0 };
    let radius = 48;
    const resetKnob = () => {
      knob.style.transform = "translate(-50%, -50%)";
    };
    const apply = (dx: number, dy: number) => {
      const len = Math.hypot(dx, dy) || 1;
      const nx = (dx / len) * Math.min(len, radius);
      const ny = (dy / len) * Math.min(len, radius);
      this.joy.x = nx / radius;
      this.joy.y = ny / radius;
      knob.style.transform = `translate(calc(-50% + ${nx}px), calc(-50% + ${ny}px))`;
    };
    base.addEventListener(
      "pointerdown",
      (e) => {
        e.stopPropagation();
        e.preventDefault();
        pid = e.pointerId;
        unlockAudio();
        const b = base.getBoundingClientRect();
        origin = { x: b.left + b.width * 0.5, y: b.top + b.height * 0.5 };
        radius = Math.max(24, b.width * 0.36);
        base.setPointerCapture(e.pointerId);
        apply(e.clientX - origin.x, e.clientY - origin.y);
      },
      { passive: false },
    );
    base.addEventListener(
      "pointermove",
      (e) => {
        if (pid !== e.pointerId) return;
        e.preventDefault();
        apply(e.clientX - origin.x, e.clientY - origin.y);
      },
      { passive: false },
    );
    const end = (e: PointerEvent) => {
      if (pid !== e.pointerId) return;
      pid = null;
      this.joy.x = 0;
      this.joy.y = 0;
      resetKnob();
    };
    base.addEventListener("pointerup", end);
    base.addEventListener("pointercancel", end);
    base.addEventListener("lostpointercapture", end);
  }

  private setLoad(p: number) {
    const pct = Math.round(clamp(p, 0, 1) * 100);
    const bar = document.querySelector("#load-bar") as HTMLElement | null;
    const label = document.querySelector("#load-pct") as HTMLElement | null;
    if (bar) bar.style.width = `${pct}%`;
    if (label) label.textContent = `${pct}%`;
  }

  private async boot() {
    this.phase = "loading";
    setPhase("loading");
    this.setLoad(0.02);
    try {
      let skyP = 0;
      let armsP = 0;
      const bumpBoot = () => this.setLoad(0.08 + skyP * 0.52 + armsP * 0.4);

      const skyJob = SceneLoader.ImportMeshAsync("", "/models/", "skybox.glb", this.scene, (ev) => {
        skyP = loadProgress(ev);
        bumpBoot();
      });
      const armsJob = loadFpsArms(this.scene, this.fpsCam, (ev) => {
        armsP = loadProgress(ev);
        bumpBoot();
      }).catch((err) => {
        console.warn("fps_arms.glb failed, using fallback arms", err);
        return createArms(this.scene, this.fpsCam);
      });

      const [skyRes, arms] = await Promise.all([skyJob, armsJob]);
      this.arms = arms;
      this.prepareSkybox(skyRes);
      this.look.yaw = 0;
      this.look.pitch = -0.08;
      this.fpsCam.position.set(0, 0, 0);
      this.applyLook();
      this.scene.activeCamera = this.fpsCam;
      this.arms.root.setEnabled(true);
      holsterHook(this.arms);

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
      this.syncHandButtons();
      this.refreshPlayStatus();
      toast("已进入星空，正在加载关卡…");
      void this.loadLevelsSequentially();
    } catch (err) {
      console.error(err);
      toast("模型加载失败");
    }
  }

  setAuthSession(session: AuthSession | null) {
    this.authSession = session;
    if (this.worldReady) void this.refreshCustomLevels();
  }

  private packTitle(id: LevelId) {
    return this.packs.get(id)?.title ?? (LEVEL_META[id as BuiltinLevelId]?.title ?? String(id));
  }

  private packMeta(id: LevelId) {
    const pack = this.packs.get(id);
    if (pack) {
      return {
        title: pack.title,
        role: pack.role,
        material: pack.material,
        note: pack.note,
        interior: pack.interior,
      };
    }
    const meta = LEVEL_META[id as BuiltinLevelId];
    return meta
      ? { title: meta.title, role: meta.role, material: meta.material, note: meta.note, interior: meta.interior }
      : { title: String(id), role: "自定义关卡", material: "用户模型", note: "", interior: `${id} 内部` };
  }

  private refreshPlayStatus() {
    if (this.phase === "docked" && this.docked) {
      $<HTMLElement>("#play-status").textContent = `锁定 ${this.packTitle(this.docked.id)}`;
      return;
    }
    if (this.phase === "interior" && this.interiorId) {
      $<HTMLElement>("#play-status").textContent = this.packMeta(this.interiorId).interior;
      return;
    }
    if (this.loadingLevel) {
      const n = [...this.packs.values()].filter((p) => p.ring === "inner").length + 1;
      const total = BUILTIN_LOAD_ORDER.length;
      $<HTMLElement>("#play-status").textContent = `加载 ${this.packTitle(this.loadingLevel)}（${n}/${total}）`;
      return;
    }
    $<HTMLElement>("#play-status").textContent = this.levelsReady ? "小小人" : "小小人 · 加载关卡中";
  }

  private assignLevelWrap(id: LevelId, pack: LevelPack) {
    if (id === "phone") {
      this.phoneWrap = pack.wrap;
      this.phoneSpin = pack.spin;
    } else if (id === "laptop") this.lv2 = pack.wrap;
    else if (id === "earbuds") this.lv3 = pack.wrap;
    else if (id === "connor") this.lv4 = pack.wrap;
    else if (id === "north") this.lv5 = pack.wrap;
    else if (id === "portal") this.lv6 = pack.wrap;
  }

  private async loadLevelsSequentially() {
    for (const id of BUILTIN_LOAD_ORDER) {
      if ((window as Window & { __XXR_GEN?: number }).__XXR_GEN !== this.gen) return;
      this.loadingLevel = id;
      this.refreshPlayStatus();
      try {
        if (id === "portal") {
          this.createPortalLevel();
        } else {
          let fileP = 0;
          const loaded = await SceneLoader.ImportMeshAsync("", "/models/", LEVEL_META[id].file, this.scene, (ev) => {
            fileP = loadProgress(ev);
            if (this.phase === "fps" && !this.docked && !this.riding) {
              const n = [...this.packs.values()].filter((p) => p.ring === "inner").length + 1;
              const pct = Math.round(fileP * 100);
              $<HTMLElement>("#play-status").textContent = `加载 ${LEVEL_META[id].title}（${n}/${BUILTIN_LOAD_ORDER.length} · ${pct}%）`;
            }
          });
          if ((window as Window & { __XXR_GEN?: number }).__XXR_GEN !== this.gen) return;
          await new Promise<void>((r) => requestAnimationFrame(() => r()));
          const pack = this.prepareLevelGlb(loaded, id);
          this.assignLevelWrap(id, pack);
          if (this.viewZoom !== 1 || this.phase === "interior") this.setZoomBase(pack.wrap);
        }
      } catch (err) {
        console.warn(`level ${id} failed`, err);
        toast(`${LEVEL_META[id].title} 加载失败`);
      }
      await new Promise<void>((r) => window.setTimeout(() => r(), 0));
    }
    this.loadingLevel = null;
    this.levelsReady = true;
    this.refreshPlayStatus();
    if (this.phase === "fps" && !this.docked) toast("关卡已就绪，瞄准后发射钩爪");
    await this.refreshCustomLevels();
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
    this.skyRoot = root;
    this.captureNativeScale(root);
    this.refreshSkyBounds();
  }

  private prepareLevelGlb(
    loaded: ISceneLoaderAsyncResult,
    id: LevelId,
    opts?: {
      title?: string;
      ring?: LevelRing;
      orbit?: number;
      y?: number;
      kind?: LevelKind;
      modelId?: string;
      wrapName?: string;
      spinName?: string;
      modelName?: string;
      role?: string;
      material?: string;
      note?: string;
      interior?: string;
    },
  ): LevelPack {
    const builtin = LEVEL_META[id as BuiltinLevelId];
    const title = opts?.title ?? builtin?.title ?? String(id);
    const wrapName = opts?.wrapName ?? builtin?.wrap ?? `level-${id}`;
    const spinName = opts?.spinName ?? builtin?.spin ?? `${id}Spin`;
    const modelName = opts?.modelName ?? builtin?.model ?? `${id}Model`;
    const ring = opts?.ring ?? "inner";
    const orbit = opts?.orbit ?? builtin?.orbit ?? 0;
    const y = opts?.y ?? builtin?.y ?? 0.1;
    const kind = opts?.kind ?? "normal";

    for (const group of loaded.animationGroups) {
      group.stop();
      group.reset();
      group.loopAnimation = false;
      group.pause();
    }
    const explodeGroup =
      loaded.animationGroups.find((g) => /teardown/i.test(g.name)) ?? loaded.animationGroups[0] ?? null;
    if (explodeGroup) {
      explodeGroup.start(false, 0, explodeGroup.from, explodeGroup.to);
      explodeGroup.pause();
      explodeGroup.goToFrame(explodeGroup.from);
    }

    const wrap = new TransformNode(wrapName, this.scene);
    const spin = new TransformNode(spinName, this.scene);
    spin.parent = wrap;
    const glbRoot = loaded.meshes[0];
    if (glbRoot) {
      glbRoot.parent = spin;
      glbRoot.name = modelName;
    }

    const isMine = (mesh: AbstractMesh) => {
      let n: Node | null = mesh;
      while (n) {
        if (n === wrap) return true;
        n = n.parent;
      }
      return false;
    };

    spin.computeWorldMatrix(true);
    const extents = this.scene.getWorldExtends((m) => isMine(m) && !!m.getTotalVertices());
    const size = extents.max.subtract(extents.min);
    const longest = Math.max(size.x, size.y, size.z, 0.001);
    spin.scaling.setAll(PHONE_SPAN / longest);
    if (id === "phone") spin.rotation.y = Math.PI / 2;
    spin.computeWorldMatrix(true);
    const b2 = this.scene.getWorldExtends((m) => isMine(m) && !!m.getTotalVertices());
    const center = b2.min.add(b2.max).scale(0.5);
    if (glbRoot) {
      const inv = spin.getWorldMatrix().clone().invert();
      glbRoot.position.subtractInPlace(Vector3.TransformCoordinates(center, inv));
    }
    spin.computeWorldMatrix(true);
    if (id === "phone") {
      const b3 = this.scene.getWorldExtends((m) => isMine(m) && !!m.getTotalVertices());
      this.phoneSize = b3.max.subtract(b3.min);
    }

    const pack: LevelPack = {
      id,
      title,
      wrap,
      spin,
      meshes: [],
      explodeGroup,
      explodeNodes: [],
      explodeRest: new Map(),
      explodePose: new Map(),
      restLocal: new Map(),
      hubScale: new Vector3(1, 1, 1),
      explodeT: 0,
      explodeGoal: 0,
      exploded: false,
      explodeDone: false,
      explodeSec: id === "phone" ? EXPLODE_SEC : this.clipSeconds(explodeGroup),
      animGroups: [...loaded.animationGroups],
      looping: false,
      ring,
      orbit,
      y,
      kind,
      modelId: opts?.modelId,
      interior: opts?.interior ?? builtin?.interior ?? `${title}内部`,
      role: opts?.role ?? builtin?.role ?? "自定义关卡模型",
      material: opts?.material ?? builtin?.material ?? "用户导入的 GLB",
      note: opts?.note ?? builtin?.note ?? "靠近后可展开并进入内部探索。",
    };

    this.scene.meshes.forEach((m) => m.computeWorldMatrix(true));
    for (const mesh of this.scene.meshes) {
      if (!isMine(mesh) || !mesh.getTotalVertices()) continue;
      mesh.isPickable = true;
      mesh.metadata = { ...(mesh.metadata ?? {}), xxr: "level" };
      pack.meshes.push(mesh);
      pack.restLocal.set(mesh.uniqueId, mesh.position.clone());
      this.tuneLevelMaterial(mesh.material, id === "phone" ? "phone" : id === "connor" || id === "north" ? id : "laptop");
    }

    if (explodeGroup) {
      if (id === "phone") this.captureExplodePoses(explodeGroup, pack);
      else {
        explodeGroup.goToFrame(explodeGroup.from);
        explodeGroup.pause();
      }
    }
    wrap.position.set(0, y, ring === "outer" ? OUTER_ORBIT_RADIUS : ORBIT_RADIUS);
    pack.hubScale.copyFrom(wrap.scaling);
    this.captureNativeScale(wrap);
    this.packs.set(id, pack);
    return pack;
  }

  private createPortalLevel() {
    const built: PortalBuild = buildPortalSphere(this.scene);
    const meta = LEVEL_META.portal;
    const pack: LevelPack = {
      id: "portal",
      title: meta.title,
      wrap: built.wrap,
      spin: built.spin,
      meshes: built.meshes,
      explodeGroup: null,
      explodeNodes: [],
      explodeRest: new Map(),
      explodePose: new Map(),
      restLocal: new Map(),
      hubScale: new Vector3(1, 1, 1),
      explodeT: 0,
      explodeGoal: 0,
      exploded: false,
      explodeDone: true,
      explodeSec: 1,
      animGroups: [],
      looping: false,
      ring: "inner",
      orbit: meta.orbit,
      y: meta.y,
      kind: "portal",
      plusRoots: built.plusRoots,
      interior: meta.interior,
      role: meta.role,
      material: meta.material,
      note: meta.note,
    };
    for (const mesh of pack.meshes) {
      pack.restLocal.set(mesh.uniqueId, mesh.position.clone());
    }
    this.portalPlus = built.plusRoots;
    pack.wrap.position.set(0, meta.y, ORBIT_RADIUS);
    pack.hubScale.copyFrom(pack.wrap.scaling);
    this.captureNativeScale(pack.wrap);
    this.packs.set("portal", pack);
    this.assignLevelWrap("portal", pack);
    return pack;
  }

  private clearCustomLevels() {
    for (const [id, pack] of [...this.packs.entries()]) {
      if (pack.kind !== "custom") continue;
      for (const mesh of pack.meshes) mesh.dispose(false, true);
      pack.spin.dispose();
      pack.wrap.dispose();
      this.packs.delete(id);
    }
  }

  async refreshCustomLevels() {
    this.clearCustomLevels();
    const session = this.authSession ?? loadAuthSession();
    if (!session || !this.worldReady) return;
    this.authSession = session;
    try {
      const models = await listMyModels(session.token);
      let i = 0;
      for (const model of models) {
        await this.spawnCustomLevel(session.token, model, i, models.length);
        i += 1;
      }
    } catch (err) {
      console.warn("custom levels", err);
    }
  }

  private async spawnCustomLevel(token: string, model: UserModel, index: number, total: number) {
    const id = `custom_${model.id}`;
    if (this.packs.has(id)) return;
    const buf = await fetchMyModelBuffer(token, model.id);
    const blob = new Blob([buf], { type: "model/gltf-binary" });
    const url = URL.createObjectURL(blob);
    try {
      const loaded = await SceneLoader.ImportMeshAsync("", "", url, this.scene);
      const orbit = total > 0 ? (Math.PI * 2 * index) / total : 0;
      this.prepareLevelGlb(loaded, id, {
        title: model.name,
        ring: "outer",
        orbit,
        y: OUTER_Y,
        kind: "custom",
        modelId: model.id,
        wrapName: `level-${id}`,
        spinName: `${id}Spin`,
        modelName: `${id}Model`,
        role: "用户自定义关卡",
        material: "自行导入的 GLB 模型",
        note: "外环关卡，逻辑与内环关卡相同。",
        interior: `${model.name}内部`,
      });
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  openPortalImport() {
    const session = this.authSession ?? loadAuthSession();
    if (!session) {
      toast("请先登录账号");
      document.querySelector<HTMLElement>('[data-testid="btn-login"]')?.click();
      return;
    }
    this.authSession = session;
    const modal = document.querySelector<HTMLElement>('[data-testid="import-modal"]');
    if (modal) modal.hidden = false;
  }

  closePortalImport() {
    const modal = document.querySelector<HTMLElement>('[data-testid="import-modal"]');
    if (modal) modal.hidden = true;
  }

  async handlePortalFile(file: File) {
    if (this.importBusy) return;
    const session = this.authSession ?? loadAuthSession();
    if (!session) {
      toast("请先登录账号");
      return;
    }
    if (!/\.glb$/i.test(file.name)) {
      toast("请选择 .glb 文件");
      return;
    }
    this.importBusy = true;
    const tip = document.querySelector<HTMLElement>('[data-testid="import-status"]');
    if (tip) tip.textContent = "正在上传…";
    try {
      const dataBase64 = await fileToBase64(file);
      const name = file.name.replace(/\.glb$/i, "").slice(0, 32) || "自定义模型";
      const model = await uploadMyModel(session.token, { name, filename: file.name, dataBase64 });
      if (tip) tip.textContent = "上传成功，正在生成关卡…";
      await this.refreshCustomLevels();
      this.closePortalImport();
      toast(`已生成外环关卡：${model.name}`);
      this.dismount();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "上传失败";
      if (tip) tip.textContent = msg;
      toast(msg);
    } finally {
      this.importBusy = false;
    }
  }

  async removeCustomModel(modelId: string) {
    const session = this.authSession ?? loadAuthSession();
    if (!session) return;
    await deleteMyModel(session.token, modelId);
    await this.refreshCustomLevels();
  }

  private clipSeconds(g: AnimationGroup | null) {
    if (!g) return EXPLODE_SEC;
    const fps = g.targetedAnimations[0]?.animation.framePerSecond || 30;
    const sec = Math.abs(g.to - g.from) / Math.max(1, fps);
    return clamp(sec || EXPLODE_SEC, 2.2, 8);
  }

  private tuneLevelMaterial(mat: Material | null | undefined, id: LevelId) {
    if (!mat) return;
    if (mat instanceof MultiMaterial) {
      for (const sub of mat.subMaterials) this.tuneLevelMaterial(sub, id);
      return;
    }
    if (mat instanceof PBRMaterial) {
      if (mat.subSurface) {
        mat.subSurface.isRefractionEnabled = false;
        mat.subSurface.isTranslucencyEnabled = false;
      }
      if (id === "phone") {
        this.tunePhonePbr(mat, false);
        return;
      }
      if (id === "connor" || id === "north") {
        (mat as PBRMaterial & { unlit?: boolean }).unlit = false;
        mat.directIntensity = 1.35;
        mat.environmentIntensity = 0.85;
        mat.emissiveIntensity = Math.min(mat.emissiveIntensity || 1, 0.28);
        return;
      }
      (mat as PBRMaterial & { unlit?: boolean }).unlit = false;
      mat.directIntensity = 0.82;
      mat.environmentIntensity = 0.22;
      if (mat.emissiveTexture && !mat.albedoTexture) mat.albedoTexture = mat.emissiveTexture;
      mat.emissiveIntensity = Math.min(mat.emissiveIntensity || 1, 0.16);
      mat.emissiveColor = new Color3(mat.emissiveColor.r * 0.1, mat.emissiveColor.g * 0.1, mat.emissiveColor.b * 0.1);
      if (mat.emissiveTexture) mat.emissiveIntensity = 0.14;
      const bright = Math.max(mat.albedoColor.r, mat.albedoColor.g, mat.albedoColor.b);
      if (bright > 0.82) mat.albedoColor = mat.albedoColor.scale(0.52);
      return;
    }
    if (mat instanceof StandardMaterial && id !== "phone" && id !== "connor" && id !== "north") {
      mat.disableLighting = false;
      mat.emissiveColor = mat.emissiveColor.scale(0.1);
      mat.specularColor = new Color3(0.1, 0.1, 0.12);
    }
  }

  private tunePhonePbr(mat: PBRMaterial, interior: boolean) {
    (mat as PBRMaterial & { unlit?: boolean }).unlit = false;
    if (interior) {
      // 靠头灯照明：提高对直射光的响应，压低环境反射避免整片发白
      mat.directIntensity = 1.55;
      mat.environmentIntensity = 0.1;
      mat.emissiveIntensity = Math.min(mat.emissiveIntensity || 1, 0.08);
      mat.specularIntensity = Math.min(mat.specularIntensity ?? 1, 0.5);
      mat.maxSimultaneousLights = Math.max(mat.maxSimultaneousLights || 0, 6);
      return;
    }
    mat.directIntensity = 1.55;
    mat.environmentIntensity = 0.95;
    if (!mat.metadata?.xxrPhoneBoost) {
      mat.emissiveColor = mat.emissiveColor.add(new Color3(0.03, 0.03, 0.035));
      mat.metadata = { ...(mat.metadata ?? {}), xxrPhoneBoost: true };
    }
    mat.emissiveIntensity = Math.max(mat.emissiveIntensity || 0, 0.2);
    mat.specularIntensity = mat.specularIntensity ?? 1;
  }

  private setPhoneInteriorLook(on: boolean) {
    const pack = this.packs.get("phone");
    if (!pack) return;
    const apply = (mat: Material | null | undefined) => {
      if (!mat) return;
      if (mat instanceof MultiMaterial) {
        for (const sub of mat.subMaterials) apply(sub);
        return;
      }
      if (mat instanceof PBRMaterial) this.tunePhonePbr(mat, on);
    };
    for (const mesh of pack.meshes) apply(mesh.material);
  }

  private applySceneTone(mode: "hub" | "phoneInterior") {
    if (mode === "phoneInterior") {
      // 环境偏暗，让头灯锥光成为主光源
      this.scene.environmentIntensity = 0.28;
      this.scene.imageProcessingConfiguration.exposure = 0.98;
      this.scene.imageProcessingConfiguration.contrast = 1.1;
      this.hemi.intensity = 0.2;
      this.sun.intensity = 0.06;
      return;
    }
    this.scene.environmentIntensity = 1.45;
    this.scene.imageProcessingConfiguration.exposure = 1.25;
    this.scene.imageProcessingConfiguration.contrast = 1.08;
    this.hemi.intensity = 0.95;
    this.sun.intensity = 0.55;
  }

  private capturingExplode = false;

  private captureExplodePoses(g: AnimationGroup, pack: LevelPack) {
    this.capturingExplode = true;
    pack.explodeNodes = [];
    pack.explodeRest.clear();
    pack.explodePose.clear();
    try {
      const seen = new Set<number>();
      for (const ta of g.targetedAnimations) {
        const node = ta.target as TransformNode | null;
        if (!node?.position || seen.has(node.uniqueId)) continue;
        seen.add(node.uniqueId);
        pack.explodeNodes.push(node);
        pack.explodeRest.set(node.uniqueId, node.position.clone());
      }
      if (!pack.explodeNodes.length) return;

      const span = g.to - g.from;
      const cap = g.from + span * 0.92;
      let peakFrame = g.from;
      let peakScore = -1;
      const steps = 48;
      for (let i = 0; i <= steps; i++) {
        const frame = Math.min(cap, g.from + span * (i / steps));
        g.goToFrame(frame);
        let score = 0;
        for (const node of pack.explodeNodes) {
          const rest = pack.explodeRest.get(node.uniqueId);
          if (rest) score += Vector3.Distance(node.position, rest);
        }
        if (score > peakScore) {
          peakScore = score;
          peakFrame = frame;
        }
      }

      if (peakScore < 0.05) {
        pack.explodeNodes = [];
        pack.explodeRest.clear();
        pack.explodePose.clear();
        return;
      }

      g.goToFrame(peakFrame);
      for (const node of pack.explodeNodes) {
        pack.explodePose.set(node.uniqueId, node.position.clone());
      }
      g.goToFrame(g.from);
      g.pause();
      for (const node of pack.explodeNodes) {
        const rest = pack.explodeRest.get(node.uniqueId);
        if (rest) node.position.copyFrom(rest);
      }
      g.stop();
      for (const node of pack.explodeNodes) {
        const rest = pack.explodeRest.get(node.uniqueId);
        if (rest) node.position.copyFrom(rest);
      }
    } finally {
      this.capturingExplode = false;
    }
  }

  private phoneWorldSpan() {
    const pack = this.packs.get("phone");
    if (pack) {
      pack.wrap.computeWorldMatrix(true);
      for (const mesh of pack.meshes) mesh.computeWorldMatrix(true);
    }
    const e = this.scene.getWorldExtends((m) => this.isPackPart(m, pack) && !!m.getTotalVertices());
    const s = e.max.subtract(e.min);
    return {
      size: [s.x, s.y, s.z],
      longest: Math.max(s.x, s.y, s.z),
      parts: this.packs.get("phone")?.explodeNodes.length ?? 0,
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

  private isPackPart(mesh: AbstractMesh, pack: LevelPack | null | undefined) {
    if (!pack) return false;
    let n: Node | null = mesh;
    while (n) {
      if (n === pack.wrap) return true;
      n = n.parent;
    }
    return false;
  }

  private activePack() {
    const id = this.phase === "interior" ? this.interiorId ?? this.docked?.id : this.docked?.id;
    return id ? this.packs.get(id) ?? null : null;
  }

  private isActivePart(mesh: AbstractMesh) {
    return this.isPackPart(mesh, this.activePack());
  }

  private levelRootOf(mesh: AbstractMesh | Node | null): LevelRef | null {
    let n: Node | null = mesh;
    while (n) {
      for (const pack of this.packs.values()) {
      for (const pack of this.packs.values()) {
        if (n === pack.wrap || n.name === pack.wrap.name) return { id: pack.id, wrap: pack.wrap };
      }
      }
      n = n.parent;
    }
    return null;
  }

  returnToCenter() {
    if (!this.worldReady) return;
    this.riding = null;
    this.pendingLevel = null;
    this.pendingPart = null;
    this.docked = null;
    this.nearExplode = false;
    this.interiorId = null;
    if (this.arms && this.handState !== "holstered") this.recallHand(true);
    this.exitInterior(true);
    this.restoreNativeScales();
    this.viewZoom = 1;
    this.applyViewFov();
    this.fpsCam.position.set(0, 0, 0);
    this.look.yaw = 0;
    this.look.pitch = -0.08;
    this.applyLook();
    this.phase = "fps";
    setPhase("fps");
    this.refreshPlayStatus();
    this.syncHandButtons();
    toast("已返回星空中心");
  }

  toggleExplode() {
    if (!this.worldReady) return;
    const pack = this.activePack();
    if (!pack) {
      toast("先用钩爪锁定关卡");
      return;
    }
    if (pack.exploded) this.foldTogether();
    else this.startExplode();
  }

  private startExplode(pack: LevelPack | null = this.activePack()) {
    if (!pack || pack.exploded) return;
    pack.exploded = true;
    pack.explodeGoal = 1;
    this.exploded = true;
    this.syncHandButtons();
    toast("靠近模型，爆炸图展开");
  }

  foldTogether() {
    if (!this.worldReady) return;
    const pack = this.activePack();
    if (!pack) return;
    if (!pack.exploded && pack.explodeT <= 0.02) return;
    this.stopInteriorLoop(pack);
    pack.exploded = false;
    pack.explodeGoal = 0;
    pack.explodeDone = false;
    this.exploded = false;
    this.explodeDone = false;
    this.syncHandButtons();
    toast("零件合拢");
  }

  private aboutOpen() {
    const el = document.querySelector("#screen-about") as HTMLElement | null;
    return !!el && !el.hidden;
  }

  private fillAbout() {
    const title = document.querySelector("#about-title") as HTMLElement | null;
    const body = document.querySelector("#about-body") as HTMLElement | null;
    const lines = CREDITS_TEXT.split("\n");
    const head = lines[0]?.trim() || "小小人";
    if (title) title.textContent = head;
    if (body) body.textContent = lines.slice(1).join("\n").trim();
  }

  private openAbout() {
    const el = document.querySelector("#screen-about") as HTMLElement | null;
    if (!el) return;
    el.hidden = false;
  }

  private closeAbout() {
    const el = document.querySelector("#screen-about") as HTMLElement | null;
    if (!el) return;
    el.hidden = true;
  }

  lookAtPhone() {
    if (!this.phoneWrap) return;
    this.lookAtNode(this.phoneWrap);
  }

  private lookAtNode(node: TransformNode) {
    const target =
      node instanceof AbstractMesh && node.getTotalVertices()
        ? this.partCenter(node)
        : (node.computeWorldMatrix(true), node.getAbsolutePosition());
    this.fpsCam.setTarget(target);
    this.fpsCam.rotationQuaternion = null;
    this.look.yaw = this.fpsCam.rotation.y;
    this.look.pitch = clamp(this.fpsCam.rotation.x, -1.2, 1.2);
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
    // 白色低透明叠加：只加亮，不改色相
    mesh.overlayColor = new Color3(1, 1, 1);
    mesh.overlayAlpha = 0.14;
    const level = this.levelRootOf(mesh);
    const info = this.phase === "fps" && level
      ? this.packMeta(level.id)
      : (() => {
          const p = infoFor(this.resolveName(mesh));
          return { name: p.name, role: p.role, material: p.material, note: p.note };
        })();
    const display = "name" in info ? info : { name: info.title, role: info.role, material: info.material, note: info.note };
    card.hidden = false;
    card.innerHTML = `<h2>${display.name}</h2>
      <p><strong>作用</strong>　${display.role}</p>
      <p><strong>材料</strong>　${display.material}</p>
      <p>${display.note}</p>`;
    this.pulseScanner();
  }

  fireHand() {
    if (!this.arms || this.handState !== "holstered") return;
    if (this.phase === "interior") {
      this.fireAtPart();
      return;
    }
    if (this.phase !== "fps") return;
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

  private fireAtPart(mesh?: AbstractMesh) {
    if (this.phase !== "interior" || !this.arms || this.handState !== "holstered") return false;
    this.fpsCam.getViewMatrix();
    this.scene.updateTransformMatrix();
    const target = mesh ?? this.pickPart()?.pickedMesh ?? this.nearestAimedPart();
    if (!target || !this.isActivePart(target)) {
      toast("未锁定零件，钩爪不能发射");
      return false;
    }
    this.launchAtPart(target);
    return true;
  }

  private launchAtPart(mesh: AbstractMesh) {
    if (!this.arms || this.handState !== "holstered") return;
    const hook = this.arms.rightHand;
    const origin = this.arms.wristAnchor.getAbsolutePosition();
    const dest = this.partCenter(mesh);
    setHookVisible(this.arms, true);
    hook.setParent(null);
    hook.setAbsolutePosition(origin);
    const dir = dest.subtract(origin);
    if (dir.lengthSquared() < 1e-6) dir.copyFrom(this.fpsCam.getForwardRay(1).direction);
    this.handVel = dir.normalize().scale(48);
    aimHook(hook, this.handVel);
    setClaws(this.arms.claws, 0.92);
    this.handFlight = 0;
    this.handState = "flying";
    this.pendingPart = mesh;
    if (this.highlight && this.highlight !== mesh) this.highlight.renderOverlay = false;
    this.highlight = mesh;
    mesh.renderOverlay = true;
    mesh.overlayColor = new Color3(0.24, 0.88, 0.78);
    mesh.overlayAlpha = 0.35;
    const pose = this.standInFrontOfMesh(mesh);
    this.riding = {
      t: 0,
      from: this.fpsCam.position.clone(),
      to: pose.stand,
      lookYaw: pose.lookYaw,
      lookPitch: pose.lookPitch,
    };
    this.syncHandButtons();
    playSfx("fire");
  }

  private partCenter(mesh: AbstractMesh) {
    mesh.computeWorldMatrix(true);
    return mesh.getBoundingInfo().boundingBox.centerWorld.clone();
  }

  private standInFrontOfMesh(mesh: AbstractMesh) {
    const center = this.partCenter(mesh);
    let dir = center.subtract(this.fpsCam.position);
    if (dir.lengthSquared() < 0.05) dir = this.fpsCam.getForwardRay(1).direction.clone();
    dir.normalize();
    const ext = mesh.getBoundingInfo().boundingBox.extendSizeWorld;
    const thick = Math.max(ext.x, ext.y, ext.z, 0.06) * 2;
    const dist = clamp(thick * 1.55 + 0.5, 1.05, 3.6);
    let stand = this.clampPlayerDest(center.subtract(dir.scale(dist)));
    if (Vector3.Distance(stand, this.fpsCam.position) < 0.45) {
      const away = center.subtract(this.fpsCam.position);
      if (away.lengthSquared() < 0.05) away.copyFrom(this.fpsCam.getForwardRay(1).direction);
      away.normalize();
      stand = this.clampPlayerDest(this.fpsCam.position.add(away.scale(2.6)));
    }
    const lookDir = center.subtract(stand);
    const horiz = Math.max(0.001, Math.hypot(lookDir.x, lookDir.z));
    return {
      stand,
      lookYaw: Math.atan2(lookDir.x, lookDir.z),
      lookPitch: clamp(-Math.atan2(lookDir.y, horiz), -1.2, 1.2),
    };
  }

  private finishPartYank() {
    const mesh = this.pendingPart;
    this.pendingPart = null;
    if (this.arms) {
      holsterHook(this.arms);
      this.handState = "holstered";
    }
    this.syncHandButtons();
    if (mesh) {
      this.lookAtNode(mesh);
      toast(`到达 ${infoFor(this.resolveName(mesh)).name} 前方`);
    }
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
    $<HTMLElement>("#play-status").textContent = `锁定 ${this.packTitle(level.id)}`;
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
    this.pendingPart = null;
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
    this.restoreNativeScales();
    this.viewZoom = 1;
    this.applyViewFov();
    this.docked = null;
    this.pendingLevel = null;
    this.nearExplode = false;
    this.phase = "fps";
    setPhase("fps");
    this.refreshPlayStatus();
    this.syncHandButtons();
    toast("已离开");
  }

  private alignOrbitTo(level: LevelRef) {
    const cam = this.fpsCam.position;
    const rel = level.wrap.position.subtract(cam);
    const a = Math.atan2(rel.x, rel.z);
    const pack = this.packs.get(level.id);
    const orbit = pack?.orbit ?? 0;
    if (pack?.ring === "outer") this.outerAngle = a - orbit;
    else this.phoneAngle = a - orbit;
  }

  private syncHandButtons() {
    $<HTMLButtonElement>('[data-testid="btn-dismount"]').hidden = this.phase !== "docked";
    const explodeBtn = $<HTMLButtonElement>('[data-testid="btn-explode-fps"]');
    const pack = this.activePack();
    const canFold = !!pack && (pack.exploded || pack.explodeT > 0.02);
    explodeBtn.textContent = "动作";
    explodeBtn.hidden = !canFold;
    const canEnter = !!pack && pack.explodeDone && this.phase === "docked";
    $<HTMLButtonElement>('[data-testid="btn-enter"]').hidden = !canEnter;
    const joy = $<HTMLElement>("#joystick");
    if (joy) joy.hidden = !playable(this.phase);
  }

  private tryAutoExplode() {
    const pack = this.phase === "docked" ? this.activePack() : null;
    if (!pack) {
      this.nearExplode = false;
      return;
    }
    const dist = Vector3.Distance(this.fpsCam.position, pack.wrap.getAbsolutePosition());
    const near = dist < AUTO_EXPLODE_DIST * 1.35;
    if (near && !this.nearExplode && !pack.exploded) this.startExplode(pack);
    this.nearExplode = near;
  }

  private setSideLevelsVisible(on: boolean, keep?: LevelId) {
    for (const pack of this.packs.values()) {
      if (keep && pack.id === keep) continue;
      pack.wrap.setEnabled(on);
      for (const mesh of pack.meshes) mesh.isVisible = on;
    }
  }

  private nearestAimedPart(): AbstractMesh | null {
    this.fpsCam.getViewMatrix();
    const fwd = this.fpsCam.getForwardRay(1).direction;
    const origin = this.fpsCam.position;
    let best: AbstractMesh | null = null;
    let bestScore = Number.NEGATIVE_INFINITY;
    let fallback: AbstractMesh | null = null;
    let fallbackDist = Number.POSITIVE_INFINITY;
    const meshes = this.activePack()?.meshes ?? [];
    for (const mesh of meshes) {
      if (!mesh.isEnabled() || !mesh.isVisible || mesh.getTotalVertices() < 3) continue;
      const center = this.partCenter(mesh);
      const to = center.subtract(origin);
      const dist = to.length();
      if (dist < 0.05) continue;
      const dot = Vector3.Dot(fwd, to.scale(1 / dist));
      if (dot > 0.22) {
        const score = dot * 6 - dist * 0.015;
        if (score > bestScore) {
          bestScore = score;
          best = mesh;
        }
      } else if (dist < fallbackDist) {
        fallback = mesh;
        fallbackDist = dist;
      }
    }
    return best ?? fallback;
  }

  private pickPart(): PickingInfo | null {
    const reach = this.phase === "interior" ? 80 : 28;
    const ray = this.fpsCam.getForwardRay(reach);
    const hit = this.scene.pickWithRay(ray, (m) => this.canLatch(m));
    if (hit?.hit && hit.pickedMesh) return hit;
    const cx = this.canvas.clientWidth * 0.5;
    const cy = this.canvas.clientHeight * 0.5;
    const screenHit = this.scene.pick(cx, cy, (m) => this.canLatch(m));
    if (screenHit?.hit && screenHit.pickedMesh) return screenHit;
    if (this.phase === "interior") {
      const part = this.nearestAimedPart();
      if (!part) return null;
      const info = new PickingInfo();
      info.hit = true;
      info.pickedMesh = part;
      info.distance = Vector3.Distance(this.fpsCam.position, this.partCenter(part));
      return info;
    }
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
    return [...this.packs.values()].map((pack) => ({ id: pack.id, wrap: pack.wrap }));
  }

  private aimLevel(): LevelRef | null {
    this.fpsCam.getViewMatrix();
    this.scene.updateTransformMatrix();
    const w = this.engine.getRenderWidth();
    const h = this.engine.getRenderHeight();
    const pick = this.scene.pick(this.canvas.clientWidth * 0.5, this.canvas.clientHeight * 0.5, (m) => this.canLatch(m));
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
    const candidates: string[] = [];
    const push = (name: string | null | undefined) => {
      if (name && !candidates.includes(name)) candidates.push(name);
    };
    push(mesh.name);
    const mat = mesh.material;
    if (mat) {
      push(mat.name);
      if (mat instanceof MultiMaterial) {
        for (const sub of mat.subMaterials) push(sub?.name);
      }
    }
    let n: Node | null = mesh.parent;
    while (n) {
      push(n.name);
      n = n.parent;
    }

    const genericKeys = new Set(["Object", "Cube", "Cylinder", "Plane", "Circle"]);
    let fallback = mesh.name;
    let generic: string | null = null;
    for (const name of candidates) {
      const raw = partKeyFromName(name);
      if (!raw || raw === "__root__") continue;
      if (Object.values(LEVEL_META).some((m) => m.wrap === raw || m.spin === raw || m.model === raw)) continue;
      if (Object.values(LEVEL_META).some((m) => m.wrap === name || m.spin === name || m.model === name)) continue;
      fallback = name;
      if (raw === "__screw__" || (raw in CATALOG && !genericKeys.has(raw))) return name;
      if (raw in CATALOG) generic ??= name;
    }
    return generic ?? fallback;
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
    for (const pack of this.packs.values()) {
      if (pack.looping) continue;
      const step = dt / Math.max(0.5, pack.explodeSec || EXPLODE_SEC);
      if (pack.explodeT < pack.explodeGoal) pack.explodeT = Math.min(pack.explodeGoal, pack.explodeT + step);
      else if (pack.explodeT > pack.explodeGoal) pack.explodeT = Math.max(pack.explodeGoal, pack.explodeT - step);
      const ease = pack.explodeT * pack.explodeT * (3 - 2 * pack.explodeT);
      if (pack.explodeNodes.length) {
        for (const node of pack.explodeNodes) {
          const rest = pack.explodeRest.get(node.uniqueId);
          const pose = pack.explodePose.get(node.uniqueId);
          if (!rest || !pose) continue;
          Vector3.LerpToRef(rest, pose, ease, node.position);
        }
      } else if (pack.explodeGroup) {
        const g = pack.explodeGroup;
        g.goToFrame(g.from + (g.to - g.from) * ease);
        g.pause();
      }
      if (pack.exploded && pack.explodeT >= 0.995 && !pack.explodeDone) {
        pack.explodeDone = true;
        this.syncHandButtons();
        if (this.phase === "docked" && this.docked?.id === pack.id) toast("可以进入内部探索");
      }
    }
    const active = this.activePack();
    if (active) {
      this.exploded = active.exploded;
      this.explodeDone = active.explodeDone;
    } else {
      this.exploded = false;
      this.explodeDone = false;
    }
  }

  private applyLook() {
    this.fpsCam.rotation.x = this.look.pitch;
    this.fpsCam.rotation.y = this.look.yaw;
    this.fpsCam.rotation.z = 0;
  }

  private captureNativeScale(node: TransformNode | null) {
    if (!node) return;
    const s = node.scaling.clone();
    this.nativeScale.set(node.uniqueId, s);
    this.zoomBase.set(node.uniqueId, s.clone());
  }

  private setZoomBase(node: TransformNode | null) {
    if (!node) return;
    this.zoomBase.set(node.uniqueId, node.scaling.clone());
  }

  private restoreNativeScales() {
    const nodes: TransformNode[] = [];
    if (this.skyRoot) nodes.push(this.skyRoot);
    for (const pack of this.packs.values()) nodes.push(pack.wrap);
    for (const node of nodes) {
      const s = this.nativeScale.get(node.uniqueId);
      if (!s) continue;
      node.scaling.copyFrom(s);
      this.zoomBase.set(node.uniqueId, s.clone());
    }
    for (const pack of this.packs.values()) pack.hubScale.copyFrom(pack.wrap.scaling);
    this.refreshSkyBounds();
  }

  private zoomTargets() {
    const nodes: TransformNode[] = [];
    if (this.skyRoot) nodes.push(this.skyRoot);
    for (const pack of this.packs.values()) nodes.push(pack.wrap);
    return nodes;
  }

  private scaleNode(node: TransformNode, factor: number) {
    let base = this.zoomBase.get(node.uniqueId);
    if (!base) {
      this.setZoomBase(node);
      base = this.zoomBase.get(node.uniqueId);
    }
    if (!base) return false;
    const rest = Math.max(1e-5, Math.abs(base.x));
    const k = clamp((node.scaling.x / rest) * factor, 0.4, 3.2);
    node.scaling.copyFrom(base);
    node.scaling.scaleInPlace(k);
    return true;
  }

  private refreshSkyBounds() {
    if (!this.skyRoot) return;
    this.skyRoot.computeWorldMatrix(true);
    const b = this.skyRoot.getHierarchyBoundingVectors(true);
    this.skyMin.copyFrom(b.min);
    this.skyMax.copyFrom(b.max);
    this.skyCenter.copyFrom(b.min.add(b.max).scale(0.5));
    const hx = (b.max.x - b.min.x) * 0.5;
    const hy = (b.max.y - b.min.y) * 0.5;
    const hz = (b.max.z - b.min.z) * 0.5;
    const inner = Math.min(hx, hy, hz);
    const pad = Math.max(2.8, inner * 0.08);
    this.skyRadius = Math.max(4, inner - pad);
    this.skyLimit = this.skyRadius;
    if (this.phase !== "interior") this.clampPlayer();
  }

  private pointerSpan() {
    const pts = [...this.ptrs.values()];
    if (pts.length < 2) return 0;
    return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
  }

  private applyViewFov() {
    this.fpsCam.fovMode = Camera.FOVMODE_HORIZONTAL_FIXED;
    this.fpsCam.fov = clamp(this.baseFov / this.viewZoom, 0.36, 1.85);
  }

  private zoomInspect(factor: number) {
    if (!Number.isFinite(factor) || factor <= 0) return false;
    if (this.phase === "interior") {
      this.viewZoom = clamp(this.viewZoom * factor, 0.45, 3.4);
      this.applyViewFov();
      if (this.skyRoot) this.scaleNode(this.skyRoot, factor);
      this.refreshSkyBounds();
      return true;
    }
    let ok = false;
    for (const node of this.zoomTargets()) ok = this.scaleNode(node, factor) || ok;
    this.refreshSkyBounds();
    return ok;
  }

  private levelPose() {
    const pack = (node: TransformNode | null) =>
      node ? { pos: node.position.asArray() as [number, number, number], rotY: node.rotation.y } : null;
    return {
      phone: pack(this.phoneWrap),
      laptop: pack(this.lv2),
      earbuds: pack(this.lv3),
      connor: pack(this.lv4),
      north: pack(this.lv5),
      spinY: this.phoneSpin?.rotation.y ?? 0,
    };
  }

  private orbitLevels(dt: number) {
    if (this.phase === "interior") {
      this.setSideLevelsVisible(false, this.interiorId ?? this.docked?.id);
      return;
    }
    if (this.phase === "docked" || this.pendingLevel) return;
    this.phoneAngle += dt * ORBIT_SPEED;
    this.outerAngle += dt * OUTER_ORBIT_SPEED;
    const cam = this.fpsCam.position;
    for (const pack of this.packs.values()) {
      const radius = pack.ring === "outer" ? OUTER_ORBIT_RADIUS : ORBIT_RADIUS;
      const angle = (pack.ring === "outer" ? this.outerAngle : this.phoneAngle) + pack.orbit;
      pack.wrap.position.set(cam.x + Math.sin(angle) * radius, cam.y + pack.y, cam.z + Math.cos(angle) * radius);
      if (pack.kind === "portal") {
        // 球体自转；加号另由 facePortalPluses 朝向玩家
        pack.spin.rotation.y += dt * SPIN_SPEED * 0.65;
      } else {
        pack.spin.rotation.y += dt * SPIN_SPEED;
      }
    }
    if (this.portalPlus.length) facePortalPluses(this.portalPlus, this.fpsCam.position);
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
    const ids = ["level-label", "level-2-label", "level-3-label", "level-4-label", "level-5-label"] as const;
    if (this.phase === "loading" || this.phase === "interior") {
      for (const id of ids) {
        const el = document.querySelector(`[data-testid="${id}"]`) as HTMLElement | null;
        if (el) el.style.opacity = "0";
      }
      return;
    }
    const show = (sel: string, node: TransformNode | null, dy: number) => {
      const el = document.querySelector(sel) as HTMLElement | null;
      if (!el || !node) return;
      this.projectLabel(el, node.position.add(new Vector3(0, dy, 0)));
    };
    show('[data-testid="level-label"]', this.phoneWrap, -0.58);
    show('[data-testid="level-2-label"]', this.lv2, -0.32);
    show('[data-testid="level-3-label"]', this.lv3, -0.32);
    show('[data-testid="level-4-label"]', this.lv4, -0.58);
    show('[data-testid="level-5-label"]', this.lv5, -0.58);
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
      if (this.riding.lookPitch != null) this.look.pitch = this.riding.lookPitch;
      if (this.phase !== "interior") this.clampPlayer();
      if (this.riding.t >= 1) {
        const interiorYank = this.phase === "interior";
        this.riding = null;
        if (interiorYank) this.finishPartYank();
        else this.finishDock();
      }
    } else if (playable(this.phase)) this.moveFps(dt);
    this.tryAutoExplode();
    if (this.handState === "flying") this.tickHand(dt);
    else if (this.handState === "reeling") this.tickReel(dt);
    this.updateHookRope();
    this.applyLook();
    this.updateLabels();
    this.syncHeadlamp();
    if (this.phase !== "interior") this.clampPlayer();
  }

  private syncHeadlamp() {
    const cam = this.fpsCam;
    cam.getViewMatrix();
    const origin = cam.globalPosition;
    const fwd = cam.getForwardRay(1).direction.clone();
    if (fwd.lengthSquared() < 1e-8) fwd.set(0, 0, 1);
    else fwd.normalize();

    // 每帧对准准星中心（世界空间），探照灯光锥跟随瞄准点
    this.headlamp.parent = null;
    this.headlamp.position.set(origin.x + fwd.x * 0.08, origin.y + fwd.y * 0.08, origin.z + fwd.z * 0.08);
    this.headlamp.setDirectionToTarget(
      new Vector3(origin.x + fwd.x * 80, origin.y + fwd.y * 80, origin.z + fwd.z * 80),
    );

    // 光斑直径 = 当前水平视场对应屏幕宽度的 2/3（随分辨率/FOV/捏合缩放自动变）
    const outer = clamp(cam.fov * (2 / 3), 0.28, 2.6);
    this.headlamp.angle = outer;
    this.headlamp.innerAngle = outer * 0.42;
    this.headlamp.falloffType = SpotLight.FALLOFF_STANDARD;

    const id = this.activePack()?.id;
    const interior = this.phase === "interior";
    const close = this.phase === "docked" || interior;
    if (interior && id === "phone") {
      this.headlamp.intensity = 26;
      this.headlamp.range = 48;
      this.headlamp.exponent = 1.6;
      return;
    }
    if (close && id === "phone") {
      this.headlamp.intensity = 8;
      this.headlamp.range = 28;
      this.headlamp.exponent = 1.8;
      return;
    }
    if (close && id) {
      this.headlamp.intensity = 3.5;
      this.headlamp.range = 22;
      this.headlamp.exponent = 1.8;
      return;
    }
    this.headlamp.intensity = 6.5;
    this.headlamp.range = 40;
    this.headlamp.exponent = 2.0;
  }

  private clampToSky(p: Vector3) {
    const dx = p.x - this.skyCenter.x;
    const dy = p.y - this.skyCenter.y;
    const dz = p.z - this.skyCenter.z;
    const dist = Math.hypot(dx, dy, dz);
    if (dist > this.skyRadius && dist > 1e-8) {
      const k = this.skyRadius / dist;
      p.x = this.skyCenter.x + dx * k;
      p.y = this.skyCenter.y + dy * k;
      p.z = this.skyCenter.z + dz * k;
    }
    return p;
  }

  private clampPlayerDest(p: Vector3) {
    if (this.phase === "interior") {
      const pack = this.activePack();
      if (!pack) return p;
      const extents = this.scene.getWorldExtends((m) => this.isPackPart(m, pack) && !!m.getTotalVertices());
      const pad = 0.35;
      const axis = (v: number, lo: number, hi: number) => (hi - lo > pad * 2 ? clamp(v, lo + pad, hi - pad) : v);
      p.x = axis(p.x, extents.min.x, extents.max.x);
      p.y = axis(p.y, extents.min.y, extents.max.y);
      p.z = axis(p.z, extents.min.z, extents.max.z);
      return p;
    }
    return this.clampToSky(p);
  }

  private clampPlayer() {
    this.clampPlayerDest(this.fpsCam.position);
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
    $<HTMLElement>("#play-status").textContent = `锁定 ${LEVEL_META[level.id].title}`;
    this.syncHandButtons();
    const pack = this.packs.get(level.id);
    if (pack && !pack.exploded) this.startExplode(pack);
    else this.tryAutoExplode();
  }

  enterInterior() {
    const pack = this.activePack();
    if (!this.worldReady || !pack) return;
    if (this.phase !== "docked") {
      toast("先用钩爪锁定关卡");
      return;
    }
    if (!pack.explodeDone) {
      toast("先看完爆炸图动画");
      return;
    }
    this.riding = null;
    this.pendingPart = null;
    if (this.arms) {
      holsterHook(this.arms);
      this.handState = "holstered";
    }
    pack.hubScale.copyFrom(pack.wrap.scaling);
    pack.wrap.computeWorldMatrix(true);
    const before = this.scene.getWorldExtends((m) => this.isPackPart(m, pack) && !!m.getTotalVertices());
    const size = before.max.subtract(before.min);
    const longest = Math.max(size.x, size.y, size.z, 0.001);
    pack.wrap.scaling.scaleInPlace(INTERIOR_SPAN / longest);
    pack.wrap.computeWorldMatrix(true);
    this.setZoomBase(pack.wrap);
    this.viewZoom = 1;
    this.applyViewFov();
    const after = this.scene.getWorldExtends((m) => this.isPackPart(m, pack) && !!m.getTotalVertices());
    const center = after.min.add(after.max).scale(0.5);
    this.interiorId = pack.id;
    this.setSideLevelsVisible(false, pack.id);
    this.phase = "interior";
    setPhase("interior");
    if (pack.id === "phone") {
      this.setPhoneInteriorLook(true);
      this.applySceneTone("phoneInterior");
    }
    this.fpsCam.position.copyFrom(center);
    this.clampPlayer();
    $<HTMLElement>("#play-status").textContent = LEVEL_META[pack.id].interior;
    this.syncHandButtons();
    this.syncHeadlamp();
    toast("进入内部探索");
    this.startInteriorLoop(pack);
  }

  private startInteriorLoop(pack: LevelPack) {
    if (pack.id === "phone" || !pack.animGroups.length) return;
    this.stopInteriorLoop(pack);
    pack.looping = true;
    for (const g of pack.animGroups) {
      g.loopAnimation = true;
      g.start(true, 1, g.from, g.to);
    }
  }

  private stopInteriorLoop(pack: LevelPack) {
    pack.looping = false;
    for (const g of pack.animGroups) {
      g.stop();
      g.reset();
      g.loopAnimation = false;
      g.pause();
      g.goToFrame(g.from);
    }
  }

  private exitInterior(resetExplode: boolean) {
    for (const pack of this.packs.values()) {
      pack.wrap.scaling.copyFrom(pack.hubScale);
      pack.wrap.setEnabled(true);
      for (const mesh of pack.meshes) mesh.isVisible = true;
      this.stopInteriorLoop(pack);
      if (!resetExplode) continue;
      pack.exploded = false;
      pack.explodeGoal = 0;
      pack.explodeT = 0;
      pack.explodeDone = false;
      if (pack.explodeGroup) {
        pack.explodeGroup.goToFrame(pack.explodeGroup.from);
        pack.explodeGroup.pause();
      }
      for (const node of pack.explodeNodes) {
        const rest = pack.explodeRest.get(node.uniqueId);
        if (rest) node.position.copyFrom(rest);
      }
      for (const mesh of pack.meshes) {
        const rest = pack.restLocal.get(mesh.uniqueId);
        if (rest) mesh.position.copyFrom(rest);
      }
    }
    this.interiorId = null;
    this.setSideLevelsVisible(true);
    this.setPhoneInteriorLook(false);
    this.applySceneTone("hub");
    if (resetExplode) {
      this.exploded = false;
      this.explodeDone = false;
    }
  }

  private finishExplodeNow() {
    const pack = this.activePack();
    if (pack) {
      pack.exploded = true;
      pack.explodeGoal = 1;
      pack.explodeT = 1;
      pack.explodeDone = true;
    }
    this.exploded = true;
    this.explodeDone = true;
    this.applyExplode(0);
    this.syncHandButtons();
  }

  private finishFoldNow() {
    const pack = this.activePack();
    if (pack) {
      pack.exploded = false;
      pack.explodeGoal = 0;
      pack.explodeT = 0;
      pack.explodeDone = false;
    }
    this.exploded = false;
    this.explodeDone = false;
    this.applyExplode(0);
    this.syncHandButtons();
  }

  private tickHand(dt: number) {
    if (!this.arms) return;
    const hand = this.arms.rightHand;
    const prev = hand.getAbsolutePosition();
    const part = this.pendingPart;
    const level = this.pendingLevel ?? this.docked;
    const dest = part ? this.partCenter(part) : level?.wrap.getAbsolutePosition() ?? null;
    if (dest) {
      const to = dest.subtract(prev);
      if (to.lengthSquared() > 1e-8) this.handVel = to.normalize().scale(part ? 48 : 28);
    }
    const next = prev.add(this.handVel.scale(dt));
    if (this.phase !== "interior") this.clampToSky(next);
    hand.setParent(null);
    hand.setAbsolutePosition(next);
    aimHook(hand, this.handVel);
    this.handFlight += Vector3.Distance(prev, next);
    const reach = part
      ? clamp(part.getBoundingInfo().boundingBox.extendSizeWorld.length() * 2.2, 0.55, 2.8)
      : 0.55;
    if (dest && Vector3.Distance(next, dest) < reach) {
      hand.setAbsolutePosition(dest);
      this.handState = "stuck";
      playSfx("hit");
      if (part && !this.riding) {
        const pose = this.standInFrontOfMesh(part);
        pose.stand.copyFrom(this.clampPlayerDest(pose.stand));
        this.riding = {
          t: 0,
          from: this.fpsCam.position.clone(),
          to: pose.stand,
          lookYaw: pose.lookYaw,
          lookPitch: pose.lookPitch,
        };
      }
    } else if (this.handFlight > 42) {
      playSfx("miss");
      this.recallHand(true);
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
      levelsReady: this.levelsReady,
      loadingLevel: this.loadingLevel,
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
      fold: () => this.foldTogether(),
      finishFold: () => this.finishFoldNow(),
      yankPart: () => {
        if (this.phase !== "interior") return false;
        const cam = this.fpsCam.position;
        const mesh = [...(this.activePack()?.meshes ?? [])]
          .filter((m) => m.isEnabled() && m.getTotalVertices() > 8)
          .sort((a, b) => Vector3.DistanceSquared(this.partCenter(b), cam) - Vector3.DistanceSquared(this.partCenter(a), cam))[0];
        if (!mesh) return false;
        this.lookAtNode(mesh);
        return this.fireAtPart(mesh);
      },
      phoneSpan: () => this.phoneWorldSpan(),
      finishExplode: () => this.finishExplodeNow(),
      enter: () => this.enterInterior(),
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
      pinch: (factor: number) => this.zoomInspect(factor),
      levelPose: () => this.levelPose(),
      fov: () => this.fpsCam.fov,
      partName: (n: string) => infoFor(n).name,
      partCatalog: (id?: string) => {
        const pack = id ? this.packs.get(id as LevelId) : this.activePack();
        if (!pack) return [] as { mesh: string; mat: string; resolved: string; name: string }[];
        return pack.meshes.map((m) => {
          const resolved = this.resolveName(m);
          return {
            mesh: m.name,
            mat: m.material?.name ?? "",
            resolved,
            name: infoFor(resolved).name,
          };
        });
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
      levelsReady?: boolean;
      loadingLevel?: string | null;
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
      fold?: () => void;
      finishFold?: () => void;
      yankPart?: () => boolean;
      phoneSpan?: () => { size: number[]; longest: number; parts: number };
      finishExplode?: () => void;
      enter?: () => void;
      lookAtPhone: () => void;
      home: () => void;
      setLook: (yaw: number, pitch: number) => void;
      tryMove: (x: number, y: number, z: number) => number[];
      pinch?: (factor: number) => boolean;
      fov?: () => number;
      partName?: (n: string) => string;
      partCatalog?: (id?: string) => { mesh: string; mat: string; resolved: string; name: string }[];
      levelPose?: () => {
        phone: { pos: [number, number, number]; rotY: number } | null;
        laptop: { pos: [number, number, number]; rotY: number } | null;
        earbuds: { pos: [number, number, number]; rotY: number } | null;
        connor: { pos: [number, number, number]; rotY: number } | null;
        north: { pos: [number, number, number]; rotY: number } | null;
        spinY: number;
      };
    };
  }
}
