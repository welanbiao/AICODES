import {
  AbstractMesh,
  AnimationGroup,
  ArcRotateCamera,
  Color3,
  Color4,
  DirectionalLight,
  Engine,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  Node,
  PBRMaterial,
  PickingInfo,
  PointLight,
  Ray,
  Scene,
  SceneLoader,
  StandardMaterial,
  TransformNode,
  UniversalCamera,
  Vector3,
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import { createArms, holsterHook, updateRope, setClaws, aimHook, isAvatarMesh, type Arms } from "./avatar";
import { infoFor, partKeyFromName, CATALOG } from "./catalog";

export type Phase = "menu" | "loading" | "god" | "entering" | "fps" | "observe";

type HandState = "holstered" | "flying" | "stuck" | "reeling";

const $ = <T extends HTMLElement>(sel: string) => document.querySelector(sel) as T;

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function toast(text: string) {
  const el = $<HTMLElement>("#toast");
  el.textContent = text;
  el.hidden = false;
  window.setTimeout(() => {
    el.hidden = true;
  }, 1600);
}

function setPhase(phase: Phase) {
  $("#app").dataset.phase = phase;
  $<HTMLElement>("#screen-menu").hidden = phase !== "menu";
  $<HTMLElement>("#screen-load").hidden = phase !== "loading";
  $<HTMLElement>("#screen-god").hidden = phase !== "god" && phase !== "entering";
  $<HTMLElement>("#screen-play").hidden = phase !== "fps" && phase !== "observe";
  const joy = $<HTMLElement>("#joystick");
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  joy.hidden = !(coarse && (phase === "fps" || phase === "observe"));
}

export class Game {
  readonly engine: Engine;
  readonly scene: Scene;
  phase: Phase = "menu";
  fps = 0;

  private canvas: HTMLCanvasElement;
  private godCam!: ArcRotateCamera;
  private fpsCam!: UniversalCamera;
  private arms: Arms | null = null;
  private explodeGroup: AnimationGroup | null = null;
  private exploded = false;
  private keys = new Set<string>();
  private look = { yaw: 0, pitch: 0 };
  private dragging = false;
  private lastPtr = { x: 0, y: 0 };
  private joy = { x: 0, y: 0 };
  private phoneSize = new Vector3(1, 1, 1);
  private moveSpeed = 22;
  private handState: HandState = "holstered";
  private handVel = Vector3.Zero();
  private handFlight = 0;
  private highlight: AbstractMesh | null = null;
  private observePivot = Vector3.Zero();
  private worldReady = false;
  private enterFrom = 0;
  private enterTo = 0;
  private enterStartedAt = 0;
  private floor!: Mesh;
  private riding: { t: number; from: Vector3; to: Vector3 } | null = null;
  private restAbs = new Map<number, Vector3>();
  private explodeT = 0;
  private explodeGoal = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.engine = new Engine(canvas, true, { adaptToDeviceRatio: false, stencil: true, preserveDrawingBuffer: true }, true);
    const cap = Math.min(window.devicePixelRatio || 1, 1.6);
    this.engine.setHardwareScalingLevel(1 / cap);
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.043, 0.05, 0.07, 1);
    this.scene.skipPointerMovePicking = true;

    const hemi = new HemisphericLight("hemi", new Vector3(0.2, 1, 0.3), this.scene);
    hemi.intensity = 1.15;
    hemi.groundColor = new Color3(0.12, 0.14, 0.18);
    const sun = new DirectionalLight("sun", new Vector3(-0.4, -1, 0.35), this.scene);
    sun.intensity = 0.55;
    const bulb = new PointLight("bulb", Vector3.Zero(), this.scene);
    bulb.intensity = 0.45;
    bulb.range = 80;

    this.godCam = new ArcRotateCamera("god", 0.85, 1.05, 40, Vector3.Zero(), this.scene);
    this.godCam.lowerBetaLimit = 0.12;
    this.godCam.upperBetaLimit = Math.PI / 2 - 0.04;
    this.godCam.wheelDeltaPercentage = 0.01;
    this.godCam.minZ = 0.05;
    this.godCam.maxZ = 20000;
    this.scene.activeCamera = this.godCam;

    this.fpsCam = new UniversalCamera("fps", new Vector3(0, 0, 0), this.scene);
    this.fpsCam.minZ = 0.03;
    this.fpsCam.maxZ = 20000;
    this.fpsCam.inertia = 0;
    this.fpsCam.speed = 0;
    this.fpsCam.applyGravity = false;
    this.fpsCam.checkCollisions = false;
    this.arms = createArms(this.scene, this.fpsCam);

    const floorMat = new StandardMaterial("floorMat", this.scene);
    floorMat.diffuseColor = new Color3(0.07, 0.08, 0.1);
    floorMat.specularColor = Color3.Black();
    this.floor = MeshBuilder.CreateDisc("floor", { radius: 90, tessellation: 48 }, this.scene);
    this.floor.rotation.x = Math.PI / 2;
    this.floor.position.y = -12;
    this.floor.material = floorMat;
    this.floor.isPickable = false;

    this.bindUi();
    this.bindInput();
    this.scene.onBeforeRenderObservable.add(() => this.tick());
    this.engine.runRenderLoop(() => {
      this.fps = this.engine.getFps();
      if (this.fps > 1 && this.fps < 24 && this.engine.getHardwareScalingLevel() < 1.2) {
        this.engine.setHardwareScalingLevel(1.15);
      }
      this.scene.render();
      this.publish();
    });
    setPhase("menu");
  }

  resize() {
    this.engine.resize();
  }

  dispose() {
    this.engine.dispose();
  }

  private bindUi() {
    $<HTMLButtonElement>('[data-testid="level-phone"]').onclick = () => void this.startLevel();
    for (const id of ["level-laptop", "level-earbuds"] as const) {
      $<HTMLButtonElement>(`[data-testid="${id}"]`).onclick = () => toast("这一关还在制作中");
    }
    $<HTMLButtonElement>('[data-testid="btn-enter"]').onclick = () => this.enterInside();
    $<HTMLButtonElement>('[data-testid="btn-explode"]').onclick = () => this.toggleExplode();
    $<HTMLButtonElement>('[data-testid="btn-explode-fps"]').onclick = () => this.toggleExplode();
    $<HTMLButtonElement>('[data-testid="btn-menu"]').onclick = () => this.backToMenu();
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
      if (this.phase === "god") return;
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

  async startLevel() {
    if (this.worldReady) {
      this.toGod();
      return;
    }
    this.phase = "loading";
    setPhase("loading");
    const bar = $<HTMLElement>("#load-bar");
    const pct = $<HTMLElement>("#load-pct");
    try {
      await SceneLoader.ImportMeshAsync("", "/models/", "iphone12.glb", this.scene, (ev) => {
        const p = ev.lengthComputable && ev.total ? ev.loaded / ev.total : 0.15;
        bar.style.width = `${Math.round(p * 100)}%`;
        pct.textContent = `${Math.round(p * 100)}%`;
      });
      this.preparePhone();
      this.worldReady = true;
      bar.style.width = "100%";
      pct.textContent = "100%";
      this.toGod();
    } catch (err) {
      console.error(err);
      toast("模型加载失败");
      this.phase = "menu";
      setPhase("menu");
    }
  }

  private preparePhone() {
    this.explodeGroup = this.scene.animationGroups.find((g) => /take/i.test(g.name)) ?? this.scene.animationGroups[0] ?? null;
    if (this.explodeGroup) {
      this.explodeGroup.stop();
      this.explodeGroup.reset();
      this.explodeGroup.goToFrame(this.explodeGroup.from);
    }

    const wrap = this.scene.getTransformNodeByName("phoneWrap") ?? new TransformNode("phoneWrap", this.scene);
    const root =
      this.scene.getTransformNodeByName("__root__") ||
      this.scene.getMeshByName("__root__") ||
      this.scene.transformNodes.find((n) => n.name === "__root__") ||
      null;
    if (root && root !== wrap) root.parent = wrap;

    this.scene.meshes.forEach((m) => m.computeWorldMatrix(true));
    const extents = this.scene.getWorldExtends((m) => {
      if (m === this.floor) return false;
      if (m.name === "floor" || isAvatarMesh(m.name)) return false;
      return m.isEnabled() && !!m.getTotalVertices();
    });
    const size = extents.max.subtract(extents.min);
    const thick = Math.max(0.0001, Math.min(size.x, size.y, size.z));
    const s = 18 / thick;
    wrap.scaling.setAll(s);
    this.scene.meshes.forEach((m) => m.computeWorldMatrix(true));
    const b2 = this.scene.getWorldExtends((m) => m !== this.floor && m.name !== "floor" && !isAvatarMesh(m.name) && !!m.getTotalVertices());
    const center = b2.min.add(b2.max).scale(0.5);
    wrap.position.subtractInPlace(center);
    this.scene.meshes.forEach((m) => m.computeWorldMatrix(true));
    const b3 = this.scene.getWorldExtends((m) => m !== this.floor && m.name !== "floor" && !isAvatarMesh(m.name) && !!m.getTotalVertices());
    this.phoneSize = b3.max.subtract(b3.min);

    for (const mesh of this.scene.meshes) {
      if (mesh.name.includes("$Assimp") || mesh.name === "floor" || mesh.name.startsWith("left") || mesh.name.startsWith("right") || mesh.name.startsWith("scanner")) {
        mesh.isPickable = false;
      }
    }

    const diag = this.phoneSize.length();
    this.godCam.setTarget(Vector3.Zero());
    this.godCam.alpha = 0.32;
    this.godCam.beta = 1.18;
    this.godCam.radius = Math.max(24, diag * 1.05);
    this.godCam.lowerRadiusLimit = 4;
    this.godCam.upperRadiusLimit = Math.max(80, diag * 3);
    this.moveSpeed = Math.max(16, diag * 0.08);
    this.enterTo = Math.max(2.2, thick * s * 0.22);
    this.floor.position.y = b3.min.y - 1.2;
    this.floor.scaling.setAll(Math.max(1, diag / 70));

    const env = this.scene.createDefaultEnvironment({
      createGround: false,
      createSkybox: true,
      skyboxSize: Math.max(200, diag * 6),
      enableGroundShadow: false,
    });
    env?.skybox?.setEnabled(false);
    this.scene.environmentIntensity = 1.35;
    this.scene.imageProcessingConfiguration.exposure = 1.45;
    this.scene.imageProcessingConfiguration.contrast = 1.1;
    for (const mat of this.scene.materials) {
      if (mat instanceof PBRMaterial) {
        mat.directIntensity = 1.6;
        mat.environmentIntensity = 1.2;
        mat.emissiveColor = mat.emissiveColor.add(new Color3(0.03, 0.03, 0.035));
      }
    }

    this.restAbs.clear();
    this.scene.meshes.forEach((m) => m.computeWorldMatrix(true));
    for (const mesh of this.scene.meshes) {
      if (mesh === this.floor || !mesh.getTotalVertices()) continue;
      this.restAbs.set(mesh.uniqueId, mesh.getAbsolutePosition().clone());
    }
    this.explodeT = 0;
    this.explodeGoal = 0;
  }

  private toGod() {
    this.phase = "god";
    setPhase("god");
    this.scene.activeCamera = this.godCam;
    this.godCam.attachControl(this.canvas, true);
    this.arms?.root.setEnabled(false);
    this.handState = "holstered";
    if (this.arms) setRightHandOnWrist(this.arms);
    this.syncHandButtons();
  }

  private backToMenu() {
    this.godCam.detachControl();
    document.exitPointerLock();
    this.phase = "menu";
    setPhase("menu");
  }

  private enterInside() {
    if (this.phase !== "god") return;
    this.godCam.detachControl();
    this.phase = "entering";
    setPhase("entering");
    this.enterFrom = this.godCam.radius;
    this.enterStartedAt = performance.now();
    toast("缩小进入…");
    window.setTimeout(() => {
      if (this.phase === "entering") this.finishEnter();
    }, 1100);
  }

  toggleExplode() {
    this.exploded = !this.exploded;
    this.explodeGoal = this.exploded ? 1 : 0;
    toast(this.exploded ? "爆炸图展开" : "零件合拢");
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
    const origin = this.arms.rightHand.getAbsolutePosition();
    this.arms.rightHand.setParent(null);
    this.arms.rightHand.position.copyFrom(origin);
    this.handVel = this.fpsCam.getForwardRay(1).direction.scale(this.moveSpeed * 3.2);
    this.handFlight = 0;
    this.handState = "flying";
    this.syncHandButtons();
  }

  recallHand() {
    if (!this.arms || this.handState === "holstered") return;
    this.riding = null;
    setRightHandOnWrist(this.arms);
    this.handState = "holstered";
    this.syncHandButtons();
    if (this.phase === "observe") this.dismount();
  }

  dismount() {
    if (this.phase !== "observe") return;
    this.phase = "fps";
    setPhase("fps");
    $<HTMLElement>("#play-status").textContent = "内部穿梭";
    this.syncHandButtons();
  }

  private syncHandButtons() {
    $<HTMLButtonElement>('[data-testid="btn-recall"]').hidden = this.handState === "holstered";
    $<HTMLButtonElement>('[data-testid="btn-fire"]').hidden = this.handState !== "holstered" || this.phase === "observe";
    $<HTMLButtonElement>('[data-testid="btn-dismount"]').hidden = this.phase !== "observe";
  }

  private pickPart(): PickingInfo | null {
    const ray = this.fpsCam.getForwardRay(this.phoneSize.length() * 1.2);
    return this.scene.pickWithRay(ray, (m) => {
      if (!m.isPickable || !m.isEnabled()) return false;
      if (m.name === "floor" || m.name === "__root__" || m.name === "phoneWrap") return false;
      return true;
    });
  }

  private resolveName(mesh: AbstractMesh): string {
    let n: Node | null = mesh;
    let fallback = mesh.name;
    while (n) {
      const raw = partKeyFromName(n.name);
      if (raw && raw !== "__root__" && raw !== "phoneWrap") {
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
    mat.emissiveColor = new Color3(0.55, 1, 0.92);
    window.setTimeout(() => {
      mat.emissiveColor = new Color3(0.12, 0.7, 0.62);
    }, 180);
  }

  private finishEnter() {
    this.godCam.detachControl();
    const pos = this.godCam.position.clone();
    this.fpsCam.position.copyFrom(pos);
    this.look.yaw = Math.atan2(pos.x, pos.z);
    this.look.pitch = 0.08;
    this.fpsCam.position.set(0, 0, 0);
    this.applyLook();
    this.scene.activeCamera = this.fpsCam;
    this.arms?.root.setEnabled(true);
    if (this.arms) setRightHandOnWrist(this.arms);
    this.phase = "fps";
    setPhase("fps");
    $<HTMLElement>("#play-status").textContent = "内部穿梭";
    this.syncHandButtons();
    toast("已进入内部，自由穿梭");
  }

  private applyExplode(dt: number) {
    const diff = this.explodeGoal - this.explodeT;
    if (Math.abs(diff) < 0.0005 && (this.explodeT === 0 || this.explodeT === 1)) return;
    this.explodeT += diff * Math.min(1, dt * 2.4);
    if (Math.abs(this.explodeGoal - this.explodeT) < 0.002) this.explodeT = this.explodeGoal;
    const t = this.explodeT;
    const ease = t * t * (3 - 2 * t);
    for (const mesh of this.scene.meshes) {
      const rest = this.restAbs.get(mesh.uniqueId);
      if (!rest) continue;
      const key = partKeyFromName(mesh.name);
      let dir = rest.clone();
      const len = dir.length();
      if (len < 0.05) dir = new Vector3(0, 1, 0);
      else dir.scaleInPlace(1 / len);
      if (key === "front_panel") dir = new Vector3(rest.x >= 0 ? 1 : -1, 0, 0);
      if (key === "back_cover" || key === "backplate") dir = new Vector3(rest.x >= 0 ? -1 : 1, 0, 0);
      if (key === "battery") dir = new Vector3(0, 0, rest.z >= 0 ? 1 : -1);
      const extra = key === "front_panel" || key === "back_cover" ? 26 : 8 + Math.min(28, Math.max(len, 1) * 0.22);
      mesh.setAbsolutePosition(rest.add(dir.scale(extra * ease)));
    }
  }

  private applyLook() {
    this.fpsCam.rotation.x = this.look.pitch;
    this.fpsCam.rotation.y = this.look.yaw;
    this.fpsCam.rotation.z = 0;
  }

  private tick() {
    const dt = Math.min(0.05, this.scene.getEngine().getDeltaTime() / 1000 || 0.016);
    if (this.phase === "god") {
      this.godCam.alpha += dt * 0.05;
    }
    this.applyExplode(dt);
    if (this.phase === "entering") {
      const t = Math.min(1, (performance.now() - this.enterStartedAt) / 1050);
      this.godCam.radius = this.enterFrom + (this.enterTo - this.enterFrom) * easeInOut(t);
      this.godCam.beta = 1.05 + (1.35 - 1.05) * t;
      if (t >= 1) this.finishEnter();
    }
    if (this.riding) {
      this.riding.t += dt / 0.75;
      const t = easeInOut(Math.min(1, this.riding.t));
      Vector3.LerpToRef(this.riding.from, this.riding.to, t, this.fpsCam.position);
      if (this.riding.t >= 1) {
        this.riding = null;
        this.phase = "observe";
        setPhase("observe");
        this.syncHandButtons();
        toast("抓住了，360° 观察");
      }
    } else if (this.phase === "fps") this.moveFps(dt);
    if (this.phase === "observe") this.moveObserve(dt);
    if (this.handState === "flying") this.tickHand(dt);
    this.applyLook();
  }

  private moveFps(dt: number) {
    const sprint = this.keys.has("ShiftLeft") || this.keys.has("ShiftRight") ? 2.1 : 1;
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
  }

  private tickHand(dt: number) {
    if (!this.arms) return;
    const hand = this.arms.rightHand;
    const prev = hand.position.clone();
    hand.position.addInPlace(this.handVel.scale(dt));
    const delta = hand.position.subtract(prev);
    const dist = delta.length();
    this.handFlight += dist;
    if (dist > 0.0001) {
      const hit = this.scene.pickWithRay(
        new Ray(prev, delta.normalize(), dist + 0.2),
        (m) => m.isPickable && m.isEnabled() && m.name !== "floor",
      );
      if (hit?.hit && hit.pickedMesh && hit.pickedPoint) {
        this.catchPart(hit);
        return;
      }
    }
    if (this.handFlight > Math.max(18, this.phoneSize.length() * 0.35)) {
      toast("没有抓住零件");
      this.recallHand();
    }
  }

  private catchPart(hit: PickingInfo) {
    if (!this.arms || !hit.pickedPoint || !hit.pickedMesh) return;
    this.arms.rightHand.position.copyFrom(hit.pickedPoint);
    this.arms.rightHand.setParent(hit.pickedMesh);
    this.handState = "stuck";
    this.observePivot.copyFrom(hit.pickedPoint);
    const normal = (hit.getNormal(true) ?? Vector3.Up()).normalize();
    const stand = hit.pickedPoint.add(normal.scale(1.15));
    this.riding = { t: 0, from: this.fpsCam.position.clone(), to: stand };
    $<HTMLElement>("#play-status").textContent = `站在 ${infoFor(this.resolveName(hit.pickedMesh)).name} 上`;
    this.syncHandButtons();
    this.identify();
    toast("抓住零件，飞过去");
  }

  private publish() {
    window.__XXR__ = {
      phase: this.phase,
      fps: this.fps,
      ready: this.worldReady,
      exploded: this.exploded,
      size: [this.phoneSize.x, this.phoneSize.y, this.phoneSize.z],
      radius: this.godCam.radius,
      meshes: this.scene.meshes.length,
      identify: () => this.identify(),
      fire: () => this.fireHand(),
      explode: () => this.toggleExplode(),
      enter: () => this.enterInside(),
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
      radius?: number;
      meshes?: number;
      identify: () => void;
      fire: () => void;
      explode: () => void;
      enter: () => void;
    };
  }
}
