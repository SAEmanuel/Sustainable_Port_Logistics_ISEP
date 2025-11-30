import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { SceneData, ContainerDto } from "../types";

import { makePortBase } from "./objects/PortBase";
import type { PortLayout } from "./objects/PortBase";
import { ASSETS_TEXTURES } from "./utils/assets";
// @ts-ignore – util interno com tipos compatíveis
import { computePortGrids /* , drawPortGridsDebug */ } from "./objects/portGrids";

import { addRoadPoles } from "./objects/roadLights";
import { makeStorageArea } from "./objects/StorageArea";
import { makeContainerPlaceholder } from "./objects/Container";
import { makeDock } from "./objects/Dock";
import { makeVessel } from "./objects/Vessel";
import { makeDecorativeStorage } from "./objects/DecorativeStorage";
import { makeDecorativeCrane } from "./objects/DecorativeCrane";
import { makePhysicalResource } from "./objects/PhysicalResource";
import { addRoadTrees } from "./objects/roadTrees";
import { addBridges } from "./objects/Bridges";

import { addRoadTraffic } from "../services/placement/addRoadTraffic";
import { addAngleParkingInC } from "../services/placement/addParking";
import { addWorkshopsInC34 } from "../services/placement/addWorkshopsC34";
import { addExtrasRowInC34 } from "../services/placement/addExtrasRowC34";
import { addContainerYardsInC78910 } from "../services/placement/addStacksYardC78910";
import { addModernAwningsInA1 } from "../services/placement/addMarqueeA1";

import { computeLayout } from "../services/layoutEngine";

import { WorkerAvatar } from "./objects/Worker";
import { FirstPersonRig } from "./FisrtPersonRig";
import { LightingController } from "./lighting/LightingController";
import { portSceneConfig } from "../config/sceneConfigLoader";

import { PMREMGenerator, EquirectangularReflectionMapping } from "three";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

const BASE = import.meta.env.BASE_URL || "/";
const BACKGROUND_MUSIC_URL = `${BASE}audio/ambient.mp3`;
const CLICK_SOUND_URL = `${BASE}audio/select.mp3`;

export type LayerVis = Partial<{
    containers: boolean;
    storage: boolean;
    docks: boolean;
    vessels: boolean;
    resources: boolean;
    decoratives?: boolean;
}>;

/* ===========================================================
   Simulação local de estado operacional (VVN + Tasks)
   =========================================================== */

type SimStatus =
    | "Waiting"
    | "Loading"
    | "Unloading"
    | "Loading & Unloading"
    | "Completed";

type VisitSimSummary = {
    status: SimStatus;
    ongoingCount: number;
    totalTasks: number;
    progress: number; // 0..1
};

function hashStringToInt(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
        h = (h * 31 + s.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
}

/** Duração pseudo-aleatória por task [30s, 120s), mas determinística pelo id/código */
function getTaskDurationSeconds(task: any): number {
    const key = String(task.id ?? task.code ?? "");
    const base = hashStringToInt(key);
    const span = 120 - 30; // 90
    return 30 + (base % span);
}

/**
 * Dado um visit + tempo (seg desde início da sim), devolve:
 *  - status textual
 *  - nº de tasks em execução
 *  - total de tasks
 *  - progresso global [0..1]
 */
function computeVesselSimulation(visit: any, simNowSec: number): VisitSimSummary | null {
    if (!visit || !Array.isArray(visit.tasks) || visit.tasks.length === 0) {
        return null;
    }

    const tasks = visit.tasks as any[];

    let cursor = 0;
    let ongoingCount = 0;
    const activeTypes = new Set<string>();
    let lastEnd = 0;

    for (const t of tasks) {
        const dur = getTaskDurationSeconds(t);
        const start = cursor;
        const end = cursor + dur;

        if (simNowSec >= start && simNowSec < end) {
            ongoingCount++;
            activeTypes.add(String(t.type));
        }

        cursor = end + 5; // ~5s de intervalo entre tasks
        lastEnd = end;
    }

    const totalSpanEnd = lastEnd;
    const clamped = Math.max(0, Math.min(simNowSec, totalSpanEnd || 1));
    const progress = totalSpanEnd > 0 ? clamped / totalSpanEnd : 0;

    let status: SimStatus;

    if (ongoingCount === 0 && simNowSec < totalSpanEnd) {
        status = "Waiting";
    } else if (ongoingCount === 0 && simNowSec >= totalSpanEnd) {
        status = "Completed";
    } else {
        const hasContainer = Array.from(activeTypes).some((t) => t === "ContainerHandling");
        const hasYardOrStorage = Array.from(activeTypes).some(
            (t) => t === "YardTransport" || t === "StoragePlacement",
        );

        if (hasContainer && hasYardOrStorage) status = "Loading & Unloading";
        else if (hasContainer) status = "Unloading";
        else status = "Loading";
    }

    return {
        status,
        ongoingCount,
        totalTasks: tasks.length,
        progress,
    };
}

function vesselStatusColorHex(status?: SimStatus | string): number {
    switch (status) {
        case "Loading":
            return 0x22c55e; // verde
        case "Unloading":
            return 0xf97316; // laranja
        case "Loading & Unloading":
            return 0xa855f7; // roxo
        case "Completed":
            return 0x3b82f6; // azul
        case "Waiting":
        default:
            return 0x9ca3af; // cinza
    }
}

function getStatusTooltip(status?: SimStatus): string {
    switch (status) {
        case "Loading":
            return "Vessel currently loading cargo.";
        case "Unloading":
            return "Vessel currently unloading cargo.";
        case "Loading & Unloading":
            return "Vessel loading and unloading cargo simultaneously.";
        case "Completed":
            return "All scheduled operations for this vessel are completed.";
        case "Waiting":
        default:
            return "Vessel at dock, waiting for operations to start.";
    }
}

export class PortScene {
    container: HTMLDivElement;
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;

    gBase = new THREE.Group();
    gContainers = new THREE.Group();
    gStorage = new THREE.Group();
    gDocks = new THREE.Group();
    gVessels = new THREE.Group();
    gDecor = new THREE.Group();
    gTraffic = new THREE.Group();
    gParking = new THREE.Group();
    gWorkshops = new THREE.Group();
    gExtras = new THREE.Group();
    gIndustry = new THREE.Group();
    gYards = new THREE.Group();
    gResources = new THREE.Group();
    gBridge = new THREE.Group();

    // 1st-person
    fp!: FirstPersonRig;
    worker!: WorkerAvatar;
    lastT = performance.now();

    light!: LightingController;

    pickables: THREE.Object3D[] = [];
    reqId = 0;

    // seleção atual (para highlight & camera focus)
    private selectedObj: THREE.Object3D | null = null;

    // grelhas/rects de A/B/C (para layoutEngine)
    private _grids: ReturnType<typeof computePortGrids> | null = null;
    // guarda o layout do cais/estradas (PortLayout) para o tráfego
    private _baseLayout!: PortLayout;

    // labels HTML acima dos navios
    private labelsLayer: HTMLDivElement;
    private vesselLabels: {
        obj: THREE.Object3D;
        visit: any | null;
        el: HTMLDivElement;
    }[] = [];

    private simulationStartSec: number;

    // spotlight dinâmico que segue a câmara e ilumina a seleção
    private selectionSpotlight: THREE.SpotLight | null = null;
    private selectionSpotlightTarget: THREE.Object3D | null = null;
    private selectionCenter = new THREE.Vector3();

    // animação do alvo do spotlight
    private spotFromCenter = new THREE.Vector3();
    private spotToCenter = new THREE.Vector3();
    private spotElapsed = 0;
    private spotDuration = 0.5;
    private hasSpotTarget = false;

    // vista "overview" (porto inteiro)
    private overviewTarget = new THREE.Vector3(0, 0, 0);
    private overviewPosition = new THREE.Vector3(180, 200, 420);

    // animação de reset
    private isResettingCamera = false;
    private resetFromPos = new THREE.Vector3();
    private resetFromTarget = new THREE.Vector3();
    private resetStartTime = 0;
    private resetDuration = 1.2; // segundos

    // animação de foco (seleção)
    private isAnimatingFocus = false;
    private focusStartTime = 0;
    private focusDuration = 0.9;
    private focusFromPos = new THREE.Vector3();
    private focusFromTarget = new THREE.Vector3();
    private focusToPos = new THREE.Vector3();
    private focusToTarget = new THREE.Vector3();

    // animação "pulse" na seleção
    private selectionPulseElapsed = 0;
    private selectionPulseDuration = 0.6;
    private selectionBaseScale = new THREE.Vector3(1, 1, 1);

    // 🎵 Áudio
    private audioListener: THREE.AudioListener;
    private bgMusic: THREE.Audio | null = null;
    private clickSound: THREE.Audio | null = null;
    private bgLoaded = false;
    private clickLoaded = false;
    private bgStartedOnce = false;

    // 🐦 Aves
    private birdsGroup = new THREE.Group();
    private birds: {
        mesh: THREE.Group;
        radius: number;
        angle: number;
        speed: number;
        height: number;
        wingPhase: number;
        wingSpeed: number;
    }[] = [];

    constructor(container: HTMLDivElement) {
        this.container = container;

        // camada de labels HTML por cima do canvas
        if (!this.container.style.position) {
            this.container.style.position = "relative";
        }
        this.labelsLayer = document.createElement("div");
        Object.assign(this.labelsLayer.style, {
            position: "absolute",
            inset: "0",
            pointerEvents: "none",
            fontSize: "11px",
            color: "#f9fafb",
            zIndex: "4",
        });
        this.container.appendChild(this.labelsLayer);

        this.simulationStartSec = performance.now() / 1000;

        /* ------------ RENDERER ------------ */
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(this.renderer.domElement);

        /* ------------ SCENE & CAMERA ------------ */
        this.scene = new THREE.Scene();

        // fundo + fog mais realista (nítido perto, fecha no horizonte)
        const fogColor = new THREE.Color(0x020617);
        this.scene.background = fogColor;

        const fogNear = 900;
        const fogFar = 15000;
        this.scene.fog = new THREE.Fog(fogColor.getHex(), fogNear, fogFar);

        this.camera = new THREE.PerspectiveCamera(
            20,
            container.clientWidth / container.clientHeight,
            0.1,
            8000,
        );
        this.camera.position.set(180, 200, 420);

        /* ------------ ÁUDIO ------------ */
        this.audioListener = new THREE.AudioListener();
        this.camera.add(this.audioListener);

        const audioLoader = new THREE.AudioLoader();

        // música de fundo
        this.bgMusic = new THREE.Audio(this.audioListener);
        audioLoader.load(
            BACKGROUND_MUSIC_URL,
            (buffer) => {
                this.bgMusic!.setBuffer(buffer);
                this.bgMusic!.setLoop(true);
                this.bgMusic!.setVolume(0.25);
                this.bgLoaded = true;
            },
            undefined,
            (err) => {
                console.warn("[PortScene] Falha ao carregar BG music:", err);
            },
        );

        // som de click
        this.clickSound = new THREE.Audio(this.audioListener);
        audioLoader.load(
            CLICK_SOUND_URL,
            (buffer) => {
                this.clickSound!.setBuffer(buffer);
                this.clickSound!.setLoop(false);
                this.clickSound!.setVolume(0.6);
                this.clickLoaded = true;
            },
            undefined,
            (err) => {
                console.warn("[PortScene] Falha ao carregar click sound:", err);
            },
        );

        /* ------------ Luzes (LightingController) ------------ */
        this.light = new LightingController(this.scene, this.renderer, {
            enableGUI: true,
            guiMount: container,
            guiPlacement: "bottom-left",
            startTime: 14,
            exposure: 1.0,
            ambientIntensity: 0.35,
            hemiIntensity: 0.35,
            dirIntensity: 1.1,
            castsShadows: true,
            shadowSize: 1024,
        });

        // iluminação estática do cais
        const numLights = 6;
        const spacing = 100;
        const baseX = 50;
        const y = 45;
        const width = 1000 / 2 / 2 / 2;
        const z = -width;

        for (let i = 0; i < numLights; i++) {
            const offset = spacing * i;
            const lx = baseX + offset;

            const spotLight = new THREE.SpotLight(0xffffff, 150);
            spotLight.position.set(lx, y, z);
            spotLight.target.position.set(lx, 0, z);

            spotLight.angle = Math.PI / 3;
            spotLight.penumbra = 0.5;
            spotLight.decay = 1;
            spotLight.distance = 0;

            this.scene.add(spotLight);
            this.scene.add(spotLight.target);
        }

        // Spotlight dinâmico para o elemento selecionado
        this.selectionSpotlightTarget = new THREE.Object3D();
        this.scene.add(this.selectionSpotlightTarget);

        this.selectionSpotlight = new THREE.SpotLight(
            0xff0000,
            400,
            0,
            Math.PI / 6,
            0.5,
            1,
        );
        this.selectionSpotlight.castShadow = false;
        this.selectionSpotlight.visible = false;
        this.selectionSpotlight.target = this.selectionSpotlightTarget;
        this.scene.add(this.selectionSpotlight);

        const el = this.light.gui!.domElement as HTMLElement;
        const host = this.renderer.domElement.parentElement!;
        host.style.position = "relative";
        Object.assign(el.style, {
            position: "absolute",
            bottom: "10px",
            left: "10px",
            right: "auto",
            top: "auto",
            zIndex: "10",
        });
        host.appendChild(el);

        /* ------------ BASE DO PORTO ------------ */
        const { group: base, layout: baseLayout } = makePortBase({
            width: 1200,
            depth: 1000,
            waterMargin: 500,
            roadWidth: 12,
            gridStep: 10,
            slabHeight: 0,
            slabThickness: 18,
            waterGap: 10,
            waterThickness: 60,
            showZones: false,
            showGrid: false,
            textures: {
                paving: ASSETS_TEXTURES.port.paving.paving,
                water: ASSETS_TEXTURES.port.water.water,
                road_vertical: ASSETS_TEXTURES.port.road.road,
                road_horizontal: ASSETS_TEXTURES.port.road.roadhorizontal,
            },
        });
        this.gBase = base;
        this._baseLayout = baseLayout;
        this.scene.add(this.gBase);

        /* ------------ GRUPO DAS AVES ------------ */
        this.birdsGroup.name = "birds";
        this.scene.add(this.birdsGroup);
        this.initBirdsFlight();

        /* ------------ PREPARAR GRUPOS 3D E ANEXAR ------------ */
        this.gContainers.name = "containers";
        this.gStorage.name = "storage-areas";
        this.gDocks.name = "docks";
        this.gVessels.name = "vessels";
        this.gDecor.name = "decorative";
        this.gTraffic.name = "traffic";
        this.gParking.name = "parking";
        this.gWorkshops.name = "workshops";
        this.gExtras.name = "extras";
        this.gIndustry.name = "industry";
        this.gYards.name = "yards";
        this.gResources.name = "resources";
        this.gBridge.name = "bridge";

        this.gBase.add(
            this.gContainers,
            this.gStorage,
            this.gDocks,
            this.gVessels,
            this.gDecor,
            this.gTraffic,
            this.gParking,
            this.gWorkshops,
            this.gExtras,
            this.gIndustry,
            this.gYards,
            this.gResources,
            this.gBridge,
        );

        /* ------------ AVATAR + FIRST PERSON ------------ */
        this.worker = new WorkerAvatar({
            heightM: 1.85,
            bodyH: 1.85,
            bodyR: 0.36,
            yBase: 0.03,
        });
        this.worker.setXZ(0, 0);
        this.gBase.add(this.worker.root);

        this.fp = new FirstPersonRig(this.camera, this.renderer.domElement, {
            groundY: 0.03,
            speed: 20,
            autoPointerLock: false,
            keyToggleCode: "KeyF",
        });
        this.fp.attachTo(this.worker.getCameraAnchor());

        this.scene.add(this.fp.controls.object);
        (this.fp.controls.object as THREE.Object3D).position.copy(
            this.camera.position,
        );

        window.addEventListener("keydown", (e) => {
            if (e.code === "KeyF") {
                this.fp.controls.isLocked
                    ? this.fp.unlock()
                    : this.fp.lock();
            } else if (e.code === "KeyR") {
                e.preventDefault();
                this.resetCameraToOverview();
            }
        });

        /* ------------ GRELHAS (A/B/C) ------------ */
        const W = this._baseLayout.zoneC.size.w;
        const D = this._baseLayout.zoneC.size.d * 2;
        this._grids = computePortGrids(W, D, 10);
        // drawPortGridsDebug(this.scene, this._grids, 1.1);

        /* ------------ OBJETOS “AMBIENTAIS” FIXOS ------------ */
        addRoadPoles(this.scene, this._baseLayout, portSceneConfig.roadLights);
        addRoadTrees(this.scene, this._baseLayout, portSceneConfig.roadTrees);
        addBridges(this.gBridge, this._baseLayout, portSceneConfig.bridges);

        /* ------------ CONTROLOS ORBIT ------------ */
        this.controls = new OrbitControls(
            this.camera,
            this.renderer.domElement,
        );

        this.controls.mouseButtons = {
            LEFT: THREE.MOUSE.PAN,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.ROTATE,
        };

        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;
        this.controls.rotateSpeed = 0.9;
        this.controls.zoomSpeed = 0.9;
        this.controls.panSpeed = 0.9;
        this.controls.enableZoom = true;
        (this.controls as any).zoomToCursor = true;

        const sceneRadius = this.getSceneRadius();
        this.controls.minDistance = Math.max(10, sceneRadius * 0.15);
        this.controls.maxDistance = sceneRadius * 3.0;
        this.controls.minPolarAngle = 0.1;
        this.controls.maxPolarAngle = Math.PI / 2.05;

        this.controls.target.set(0, 0, 0);

        this.renderer.domElement.addEventListener("contextmenu", (e) =>
            e.preventDefault(),
        );

        window.addEventListener("resize", this.onResize);
        this.loop();
    }

    /** Cria um pássaro simples: corpo + 2 asas animáveis */
    private createBirdMesh(): THREE.Group {
        const bird = new THREE.Group();

        const bodyGeom = new THREE.SphereGeometry(0.8, 12, 12);
        const wingGeom = new THREE.BoxGeometry(2.2, 0.12, 0.6);
        const mat = new THREE.MeshStandardMaterial({
            color: 0xf9fafb,
            metalness: 0.1,
            roughness: 0.5,
            flatShading: true,
        });

        const body = new THREE.Mesh(bodyGeom, mat);
        body.castShadow = false;
        body.receiveShadow = false;
        bird.add(body);

        const wingLeft = new THREE.Mesh(wingGeom, mat);
        wingLeft.position.set(-1.1, 0, 0);
        bird.add(wingLeft);

        const wingRight = new THREE.Mesh(wingGeom, mat);
        wingRight.position.set(1.1, 0, 0);
        bird.add(wingRight);

        (bird.userData as any).wingLeft = wingLeft;
        (bird.userData as any).wingRight = wingRight;

        return bird;
    }

    /** Inicializa um pequeno conjunto de aves a voar em círculos acima do porto. */
    private initBirdsFlight() {
        const flockCount = 7;
        for (let i = 0; i < flockCount; i++) {
            const mesh = this.createBirdMesh();

            const radius = 380 + Math.random() * 220;
            const angle = Math.random() * Math.PI * 2;
            const height = 130 + Math.random() * 90;
            const speed = 0.25 + Math.random() * 0.35;

            mesh.position.set(
                Math.cos(angle) * radius,
                height,
                Math.sin(angle) * radius,
            );

            this.birdsGroup.add(mesh);
            this.birds.push({
                mesh,
                radius,
                angle,
                speed,
                height,
                wingPhase: Math.random() * Math.PI * 2,
                wingSpeed: 6 + Math.random() * 4,
            });
        }
    }

    /** Atualiza a animação das aves em voo circular + batimento de asas. */
    private updateBirds(dt: number) {
        if (!this.birds.length) return;

        for (const b of this.birds) {
            b.angle += b.speed * dt;
            b.wingPhase += b.wingSpeed * dt;

            const x = Math.cos(b.angle) * b.radius;
            const z = Math.sin(b.angle) * b.radius;
            const y = b.height + Math.sin(b.angle * 2) * 5;

            b.mesh.position.set(x, y, z);

            // orientar na direção do movimento
            const dirAngle = b.angle + Math.PI / 2;
            b.mesh.rotation.set(0, -dirAngle, 0);

            // batimento das asas
            const wingAngle = Math.sin(b.wingPhase) * 0.6 + 0.2;
            const userData = b.mesh.userData as any;
            const leftWing = userData.wingLeft as THREE.Mesh | undefined;
            const rightWing = userData.wingRight as THREE.Mesh | undefined;

            if (leftWing && rightWing) {
                leftWing.rotation.z = wingAngle;
                rightWing.rotation.z = -wingAngle;
            }
        }
    }

    /** Raio “seguro” da cena, calculado a partir das rects das zonas A/B/C. */
    private getSceneRadius(): number {
        const l: any = this._baseLayout;
        if (l?.zoneA?.rect && l?.zoneB?.rect && l?.zoneC?.rect) {
            const xs = [
                l.zoneA.rect.minX,
                l.zoneA.rect.maxX,
                l.zoneB.rect.minX,
                l.zoneB.rect.maxX,
                l.zoneC.rect.minX,
                l.zoneC.rect.maxX,
            ];
            const zs = [
                l.zoneA.rect.minZ,
                l.zoneA.rect.maxZ,
                l.zoneB.rect.minZ,
                l.zoneB.rect.maxZ,
                l.zoneC.rect.minZ,
                l.zoneC.rect.maxZ,
            ];
            const w = Math.max(...xs) - Math.min(...xs);
            const d = Math.max(...zs) - Math.min(...zs);
            return Math.hypot(w, d) * 0.5;
        }

        const W = 1200,
            D = 1000;
        return Math.hypot(W, D) * 0.5;
    }

    // @ts-ignore
    private async loadSkyHDR() {
        const pmrem = new PMREMGenerator(this.renderer);
        pmrem.compileEquirectangularShader();

        const tex = await new RGBELoader().loadAsync(
            ASSETS_TEXTURES.hdri.skybox,
        );
        tex.mapping = EquirectangularReflectionMapping;

        this.scene.background = tex;
        const env = pmrem.fromEquirectangular(tex).texture;
        this.scene.environment = env;

        pmrem.dispose();
    }

    onResize = () => {
        const w = this.container.clientWidth,
            h = this.container.clientHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
        this.light.updateShadowCameraBounds(400);
    };

    setLayers(vis: LayerVis) {
        if (vis.containers !== undefined)
            this.gContainers.visible = vis.containers;
        if (vis.storage !== undefined) this.gStorage.visible = vis.storage;
        if (vis.docks !== undefined) this.gDocks.visible = vis.docks;
        if (vis.vessels !== undefined) this.gVessels.visible = vis.vessels;
        if (vis.resources !== undefined)
            this.gResources.visible = vis.resources;
        if ((vis as any).decoratives !== undefined)
            this.gDecor.visible = (vis as any).decoratives;
    }

    /* ===========================================================
       HIGHLIGHT & CAMERA FOCUS
       =========================================================== */

    /** Remove o highlight da seleção anterior, se existir. */
    private clearHighlight() {
        if (!this.selectedObj) return;

        this.selectedObj.traverse((o: any) => {
            if (!o.isMesh || !o.userData.__origMat) return;

            const current = o.material;
            if (Array.isArray(current)) current.forEach((m: any) => m?.dispose?.());
            else current?.dispose?.();

            o.material = o.userData.__origMat;
            delete o.userData.__origMat;

            o.scale.set(1, 1, 1);
        });

        this.selectedObj = null;
        this.hasSpotTarget = false;

        if (this.selectionSpotlight) {
            this.selectionSpotlight.visible = false;
        }
    }

    private applyHighlight(obj: THREE.Object3D) {
        obj.traverse((o: any) => {
            if (!o.isMesh) return;

            if (!o.userData.__origMat) {
                if (Array.isArray(o.material)) {
                    o.userData.__origMat = o.material;
                    o.material = o.material.map((m: THREE.Material) => m.clone());
                } else if (o.material) {
                    o.userData.__origMat = o.material;
                    o.material = (o.material as THREE.Material).clone();
                }
            }

            const mats = Array.isArray(o.material) ? o.material : [o.material];
            mats.forEach((m: any) => {
                if (!m) return;

                const highlightColor = new THREE.Color(0xffff00);

                if ("color" in m && m.color) {
                    m.color.lerp(highlightColor, 0.7);
                }

                if ("emissive" in m) {
                    if (!m.emissive) {
                        m.emissive = new THREE.Color(0x000000);
                    }
                    m.emissive.lerp(highlightColor, 0.8);
                    if ("emissiveIntensity" in m) {
                        m.emissiveIntensity = 1.5;
                    }
                }
            });
        });

        this.selectedObj = obj;

        this.selectionBaseScale.copy(obj.scale);
        this.selectionPulseElapsed = 0;

        if (this.selectionSpotlight && this.selectionSpotlightTarget) {
            const box = new THREE.Box3().setFromObject(obj);
            const newCenter = new THREE.Vector3();
            box.getCenter(newCenter);

            if (!this.hasSpotTarget) {
                this.selectionCenter.copy(newCenter);
            }

            this.spotFromCenter.copy(this.selectionCenter);
            this.spotToCenter.copy(newCenter);
            this.spotElapsed = 0;
            this.hasSpotTarget = true;

            this.selectionSpotlight.visible = true;
        }
    }

    private applyVesselStatusVisual(node: THREE.Object3D, status?: SimStatus) {
        if (!status) return;

        const col = new THREE.Color(vesselStatusColorHex(status));

        node.traverse((o: any) => {
            if (!o.isMesh) return;
            const mats = Array.isArray(o.material) ? o.material : [o.material];

            mats.forEach((m: any) => {
                if (!m) return;

                if ("emissive" in m) {
                    if (!m.emissive) m.emissive = new THREE.Color(0x000000);
                    m.emissive.lerp(col, 0.8);
                } else if ("color" in m) {
                    m.color.lerp(col, 0.4);
                }
            });
        });
    }

    /** Inicia animação de foco suave da câmara para o objeto selecionado. */
    private focusCameraOnObject(obj: THREE.Object3D) {
        const box = new THREE.Box3().setFromObject(obj);
        box.getCenter(this.focusToTarget);

        const cam = this.camera;
        const curTarget = this.controls.target.clone();

        const offset = cam.position.clone().sub(curTarget);
        const height = cam.position.y;
        const horizOffset = new THREE.Vector3(offset.x, 0, offset.z);

        this.focusToPos.copy(this.focusToTarget).add(horizOffset);
        this.focusToPos.y = height;

        this.isResettingCamera = false;

        this.isAnimatingFocus = true;
        this.focusStartTime = performance.now() / 1000;

        this.focusFromPos.copy(cam.position);
        this.focusFromTarget.copy(curTarget);
    }

    /** Atualiza animação de foco da câmara. */
    private updateFocusAnimation() {
        if (!this.isAnimatingFocus) return;

        const nowSec = performance.now() / 1000;
        let t = (nowSec - this.focusStartTime) / this.focusDuration;

        if (t >= 1) {
            this.isAnimatingFocus = false;
            this.camera.position.copy(this.focusToPos);
            this.controls.target.copy(this.focusToTarget);
            this.camera.updateProjectionMatrix();
            return;
        }

        if (t < 0) t = 0;

        const u = t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;

        this.camera.position.lerpVectors(this.focusFromPos, this.focusToPos, u);
        this.controls.target.lerpVectors(this.focusFromTarget, this.focusToTarget, u);
        this.camera.updateProjectionMatrix();
    }

    /** Atualiza animação de reset para a vista overview. */
    private updateCameraResetAnimation() {
        if (!this.isResettingCamera) return;

        const nowSec = performance.now() / 1000;
        let t = (nowSec - this.resetStartTime) / this.resetDuration;

        if (t >= 1) {
            this.isResettingCamera = false;
            this.camera.position.copy(this.overviewPosition);
            this.controls.target.copy(this.overviewTarget);
            this.camera.updateProjectionMatrix();
            this.controls.update();
            return;
        }

        if (t < 0) t = 0;
        if (t > 1) t = 1;

        const u = t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;

        this.camera.position.lerpVectors(
            this.resetFromPos,
            this.overviewPosition,
            u,
        );
        this.controls.target.lerpVectors(
            this.resetFromTarget,
            this.overviewTarget,
            u,
        );

        this.camera.updateProjectionMatrix();
    }

    /** Atualiza spotlight da seleção. */
    private updateSelectionSpotlight(dt: number) {
        if (!this.selectionSpotlight || !this.selectionSpotlightTarget) return;
        if (!this.selectedObj || !this.hasSpotTarget) return;

        if (this.spotElapsed < this.spotDuration) {
            this.spotElapsed += dt;
            let t = Math.min(1, this.spotElapsed / this.spotDuration);

            const u = t < 0.5
                ? 4 * t * t * t
                : 1 - Math.pow(-2 * t + 2, 3) / 2;

            this.selectionCenter.lerpVectors(this.spotFromCenter, this.spotToCenter, u);
        }

        this.selectionSpotlightTarget.position.copy(this.selectionCenter);
        this.selectionSpotlightTarget.updateMatrixWorld();

        const dir = new THREE.Vector3()
            .subVectors(this.selectionCenter, this.camera.position)
            .normalize();

        const lightPos = this.selectionCenter.clone().sub(dir.multiplyScalar(80));
        lightPos.y += 40;

        this.selectionSpotlight.position.copy(lightPos);
    }

    /** Atualiza efeito de "pulse" na escala do objeto selecionado. */
    private updateSelectionPulse(dt: number) {
        if (!this.selectedObj) return;

        this.selectionPulseElapsed += dt;
        const t = this.selectionPulseElapsed / this.selectionPulseDuration;

        if (t >= 1) {
            this.selectedObj.scale.copy(this.selectionBaseScale);
            return;
        }

        const s = 1 + 0.18 * Math.sin(t * Math.PI);

        this.selectedObj.scale.set(
            this.selectionBaseScale.x * s,
            this.selectionBaseScale.y * s,
            this.selectionBaseScale.z * s,
        );
    }

    /** Inicia animação suave para a vista overview (full port). */
    public resetCameraToOverview() {
        if (this.fp && this.fp.controls && this.fp.controls.isLocked) {
            this.fp.unlock();
        }

        const desiredRadius = this.overviewPosition
            .clone()
            .sub(this.overviewTarget)
            .length();

        if (desiredRadius > this.controls.maxDistance) {
            this.controls.maxDistance = desiredRadius * 1.05;
        }

        this.isAnimatingFocus = false;
        this.isResettingCamera = true;
        this.resetStartTime = performance.now() / 1000;

        this.resetFromPos.copy(this.camera.position);
        this.resetFromTarget.copy(this.controls.target);
    }

    private ensureBgMusic() {
        if (!this.bgMusic || !this.bgLoaded || this.bgStartedOnce) return;
        try {
            this.bgMusic.play();
            this.bgStartedOnce = true;
        } catch {
            // ignore
        }
    }

    private playClickSound() {
        if (!this.clickSound || !this.clickLoaded) return;
        try {
            if (this.clickSound.isPlaying) {
                this.clickSound.stop();
            }
            this.clickSound.play();
        } catch {
            // ignore
        }
    }

    /* ===========================================================
       LOAD / BUILD
       =========================================================== */
    load(data: SceneData) {
        const disposeGroup = (g: THREE.Group) => {
            while (g.children.length) {
                const o: any = g.children.pop();
                o?.geometry?.dispose?.();
                if (Array.isArray(o?.material))
                    o.material.forEach((m: any) => m?.dispose?.());
                else o?.material?.dispose?.();
            }
        };
        disposeGroup(this.gContainers);
        disposeGroup(this.gStorage);
        disposeGroup(this.gDocks);
        disposeGroup(this.gVessels);
        disposeGroup(this.gDecor);
        disposeGroup(this.gTraffic);
        disposeGroup(this.gParking);
        disposeGroup(this.gWorkshops);
        disposeGroup(this.gExtras);
        disposeGroup(this.gIndustry);
        disposeGroup(this.gYards);
        disposeGroup(this.gResources);
        this.pickables = [];
        this.clearHighlight();

        this.vesselLabels.forEach((vl) => {
            if (vl.el.parentElement === this.labelsLayer) {
                this.labelsLayer.removeChild(vl.el);
            }
        });
        this.vesselLabels = [];

        if (!this._grids) {
            console.warn("[PortScene] grids não inicializadas — fallback.");
            this._grids = computePortGrids(600, 500, 10);
        }
        const layoutResult = computeLayout(data, this._grids!);

        for (const sa of layoutResult.storage) {
            const node = makeStorageArea(sa);
            this.gStorage.add(node);
            this.pickables.push(node);
        }

        for (const d of layoutResult.docks) {
            const node = makeDock(d as any);
            this.gDocks.add(node);
            this.pickables.push(node);
        }

        for (const c of layoutResult.containers as ContainerDto[]) {
            const mesh = makeContainerPlaceholder(c, 3);
            this.gContainers.add(mesh);
            this.pickables.push(mesh);
        }

        for (const v of layoutResult.vessels) {
            const node = makeVessel(v as any);
            const visit = (v as any).visit ?? null;
            node.userData.visit = visit;

            this.gVessels.add(node);
            this.pickables.push(node);

            if (visit && Array.isArray(visit.tasks) && visit.tasks.length > 0) {
                const labelEl = document.createElement("div");
                labelEl.className = "vessel-status-label";
                Object.assign(labelEl.style, {
                    position: "absolute",
                    padding: "2px 6px",
                    borderRadius: "999px",
                    background: "rgba(15,23,42,0.9)",
                    border: "1px solid rgba(148,163,184,0.6)",
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                    transform: "translate(-50%, -100%)",
                });

                labelEl.innerText = "Waiting";

                this.labelsLayer.appendChild(labelEl);
                this.vesselLabels.push({ obj: node, visit, el: labelEl });
            }
        }

        for (const deco of layoutResult.decoratives) {
            const mesh = makeDecorativeStorage(deco);
            this.gDecor.add(mesh);
            this.pickables.push(mesh);
        }
        for (const dc of layoutResult.decorativeCranes) {
            const node = makeDecorativeCrane(dc as any);
            this.gDecor.add(node);
            this.pickables.push(node);
        }

        addRoadTraffic(this.gTraffic, this._baseLayout, portSceneConfig.traffic);
        addAngleParkingInC(this.gParking, this._grids!, portSceneConfig.parking);
        addWorkshopsInC34(
            this.gWorkshops,
            this._grids!,
            portSceneConfig.workshops,
        );
        addExtrasRowInC34(this.gExtras!, this._grids!, portSceneConfig.extras);
        addContainerYardsInC78910(
            this.gYards,
            this._grids!,
            portSceneConfig.yards,
        );

        addModernAwningsInA1(this.gDecor, this._grids!, {
            fillWidthRatio: 0.87,
            fillDepthRatio: 0.87,
            marginX: 1.0,
            marginZ: 1.0,
            gapBetween: 1.2,
            eaveHeight: 29.5,
            ridgeExtra: 32,
            postRadius: 0.5,
            beamRadius: 0.5,
            finishBarRadius: 0.5,
            overhangX: 1.0,
            overhangZ: 1.0,
            colorFabric: 0xffffff,
            fabricOpacity: 0.68,
            softEdges: true,
        });

        if ((layoutResult as any).resources) {
            for (const pr of (layoutResult as any).resources) {
                const node = makePhysicalResource(pr);
                this.gResources.add(node);
                this.pickables.push(node);
            }
        }

        if (!this.fp.controls.isLocked) {
            const box = new THREE.Box3();
            this.pickables.forEach((o) => box.expandByObject(o));
            box.expandByObject(this.gTraffic);
            box.expandByObject(this.gParking);

            if (!box.isEmpty()) {
                const size = new THREE.Vector3(),
                    center = new THREE.Vector3();
                box.getSize(size);
                box.getCenter(center);
                const maxSize = Math.max(size.x, size.y, size.z);
                const distance =
                    (maxSize * 1.5) /
                    Math.tan((this.camera.fov * Math.PI) / 360);
                const dir = new THREE.Vector3(1, 1, 1).normalize();
                this.controls.target.copy(center);
                this.camera.position.copy(
                    center.clone().add(dir.multiplyScalar(distance)),
                );
                this.camera.near = Math.max(0.1, maxSize / 1000);
                this.camera.far = Math.max(2000, distance * 10);
                this.camera.updateProjectionMatrix();

                this.overviewTarget.copy(this.controls.target);
                this.overviewPosition.copy(this.camera.position);
            }
        }
    }

    /** Atualiza posição + conteúdo das labels e cor dos navios */
    private updateVesselLabelsAndStatus() {
        if (!this.vesselLabels.length) return;

        const simNowSec = performance.now() / 1000 - this.simulationStartSec;
        const width = this.renderer.domElement.clientWidth;
        const height = this.renderer.domElement.clientHeight;

        const world = new THREE.Vector3();

        for (const item of this.vesselLabels) {
            const { obj, visit, el } = item;

            const sim = computeVesselSimulation(visit, simNowSec);
            if (!sim) {
                el.style.display = "none";
                continue;
            }

            obj.getWorldPosition(world);
            world.y += 12;

            world.project(this.camera);

            if (world.z < 0 || world.z > 1) {
                el.style.display = "none";
                continue;
            }

            const x = (world.x * 0.5 + 0.5) * width;
            const y = (-world.y * 0.5 + 0.5) * height;

            el.style.display = "block";
            el.style.transform = `translate(-50%, -100%) translate(${x}px, ${y}px)`;

            const pct = Math.round(sim.progress * 100);
            const colorHex = vesselStatusColorHex(sim.status);
            const colorCss = `#${colorHex.toString(16).padStart(6, "0")}`;
            const showPct = sim.status === "Completed" ? "" : ` ${pct}%`;

            el.innerHTML = `
                <span style="
                    display:inline-block;
                    width:8px;
                    height:8px;
                    border-radius:999px;
                    background:${colorCss};
                    margin-right:4px;
                "></span>
                <span>${sim.status}${showPct}</span>
            `;
            el.title = getStatusTooltip(sim.status);

            this.applyVesselStatusVisual(obj, sim.status);
        }
    }

    /** Click → picking + highlight + animações + callback para UI */
    raycastAt = (ev: MouseEvent, onPick?: (u: any) => void) => {
        const rect = this.renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((ev.clientX - rect.left) / rect.width) * 2 - 1,
            -((ev.clientY - rect.top) / rect.height) * 2 + 1,
        );
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);

        const hits = raycaster.intersectObjects(this.pickables, true);
        if (!hits.length) {
            this.clearHighlight();
            return;
        }

        this.ensureBgMusic();

        let obj: THREE.Object3D | null = hits[0].object;
        while (obj && !obj.userData?.type) obj = obj.parent!;

        if (!obj) return;

        this.clearHighlight();
        this.applyHighlight(obj);
        this.focusCameraOnObject(obj);
        this.playClickSound();

        onPick?.(obj.userData ?? { type: "Unknown" });
    };

    /* =================== LOOP & DISPOSE =================== */
    loop = () => {
        const now = performance.now();
        const dt = Math.min(0.05, (now - this.lastT) / 1000);
        this.lastT = now;

        // 🌊 atualizar animação da água (PortBase expõe em userData)
        const updateWater = (this.gBase.userData as any)?.updateWater;
        if (typeof updateWater === "function") {
            updateWater(dt, now / 1000);
        }

        if (!this.fp.controls.isLocked) this.controls.update();
        this.fp.update(dt);

        this.updateVesselLabelsAndStatus();
        this.updateFocusAnimation();
        this.updateCameraResetAnimation();
        this.updateSelectionSpotlight(dt);
        this.updateSelectionPulse(dt);
        this.updateBirds(dt);

        this.renderer.render(this.scene, this.camera);
        this.reqId = requestAnimationFrame(this.loop);
    };

    dispose() {
        cancelAnimationFrame(this.reqId);
        window.removeEventListener("resize", this.onResize);
        this.scene.traverse((o) => {
            const m = o as THREE.Mesh;
            (m.geometry as any)?.dispose?.();
            const mat = m.material as
                | THREE.Material
                | THREE.Material[]
                | undefined;
            if (Array.isArray(mat))
                mat.forEach((mm) => (mm as any)?.dispose?.());
            else (mat as any)?.dispose?.();
        });
        this.renderer.dispose();
        if (this.container.contains(this.renderer.domElement)) {
            this.container.removeChild(this.renderer.domElement);
        }

        if (this.labelsLayer && this.labelsLayer.parentElement === this.container) {
            this.container.removeChild(this.labelsLayer);
        }
        this.vesselLabels = [];

        if (this.bgMusic && this.bgMusic.isPlaying) this.bgMusic.stop();
        if (this.clickSound && this.clickSound.isPlaying) this.clickSound.stop();
    }
}
