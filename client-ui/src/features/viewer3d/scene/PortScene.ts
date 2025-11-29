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


    // vista "overview" (porto inteiro)
    private overviewTarget = new THREE.Vector3(0, 0, 0);
    private overviewPosition = new THREE.Vector3(180, 200, 420);

// animação de reset
    private isResettingCamera = false;
    private resetFromPos = new THREE.Vector3();
    private resetFromTarget = new THREE.Vector3();
    private resetStartTime = 0;
    private resetDuration = 1.2; // segundos (podes afinar)

    
    

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
        this.scene.background = new THREE.Color(0x000000);

        this.camera = new THREE.PerspectiveCamera(
            20,
            container.clientWidth / container.clientHeight,
            0.1,
            8000,
        );
        this.camera.position.set(180, 200, 420);

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
            const x = baseX + offset;

            const spotLight = new THREE.SpotLight(0xffffff, 150);
            spotLight.position.set(x, y, z);
            spotLight.target.position.set(x, 0, z);

            spotLight.angle = Math.PI / 3;
            spotLight.penumbra = 0.5;
            spotLight.decay = 1;
            spotLight.distance = 0; // ilimitado

            this.scene.add(spotLight);
            this.scene.add(spotLight.target);
        }

        // === Spotlight dinâmico para o elemento selecionado ===
        this.selectionSpotlightTarget = new THREE.Object3D();
        this.scene.add(this.selectionSpotlightTarget);

        this.selectionSpotlight = new THREE.SpotLight(
            0xff0000,
            400,          // intensidade forte para sobressair
            0,            // distance 0 → sem limite
            Math.PI / 6,  // cone ~30º
            0.5,          // penumbra bem visível
            1,            // decay
        );
        this.selectionSpotlight.castShadow = false;
        this.selectionSpotlight.visible = false; // só liga com seleção
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
        });

        this.selectedObj = null;

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

                const highlightColor = new THREE.Color(0xffff00); // amarelo bem forte

                // cor base → puxar muito para o amarelo
                if ("color" in m && m.color) {
                    m.color.lerp(highlightColor, 0.7);
                }
                
                if ("emissive" in m) {
                    if (!m.emissive) {
                        m.emissive = new THREE.Color(0x000000);
                    }
                    m.emissive.lerp(highlightColor, 0.8);
                    // se o material suportar intensidade emissiva:
                    if ("emissiveIntensity" in m) {
                        m.emissiveIntensity = 1.5;
                    }
                }
            });

        });

        this.selectedObj = obj;

        // spotlight aponta para o centro do objeto
        if (this.selectionSpotlight && this.selectionSpotlightTarget) {
            const box = new THREE.Box3().setFromObject(obj);
            box.getCenter(this.selectionCenter);

            this.selectionSpotlightTarget.position.copy(this.selectionCenter);
            this.selectionSpotlightTarget.updateMatrixWorld();

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

    /** Recentra a câmara horizontalmente no centro do objeto. */
    private focusCameraOnObject(obj: THREE.Object3D) {
        const box = new THREE.Box3().setFromObject(obj);
        const center = box.getCenter(new THREE.Vector3());

        const currentTarget = this.controls.target.clone();
        const cam = this.camera;

        const offset = cam.position.clone().sub(currentTarget);
        const height = cam.position.y;
        const horizOffset = new THREE.Vector3(offset.x, 0, offset.z);

        this.controls.target.copy(center);

        cam.position.copy(center.clone().add(horizOffset));
        cam.position.y = height;

        cam.updateProjectionMatrix();
    }
    
    /** Atualiza animação suave de reset da câmara (se ativa). */
    private updateCameraResetAnimation() {
        if (!this.isResettingCamera) return;

        const nowSec = performance.now() / 1000;
        let t = (nowSec - this.resetStartTime) / this.resetDuration;

        if (t >= 1) {
            // fim da animação
            this.isResettingCamera = false;
            this.camera.position.copy(this.overviewPosition);
            this.controls.target.copy(this.overviewTarget);
            this.camera.updateProjectionMatrix();
            this.controls.update();
            return;
        }

        if (t < 0) t = 0;
        if (t > 1) t = 1;

        // easing suave (ease in-out cúbico)
        const u = t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;

        // interpolar posição e target
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


    /** Inicia animação suave para a vista overview (full port). */
    public resetCameraToOverview() {
        // se estiver em First-Person, liberta para usar OrbitControls
        if (this.fp && this.fp.controls && this.fp.controls.isLocked) {
            this.fp.unlock();
        }

        // 🔹 garantir que a vista overview não viola os limites de zoom
        const desiredRadius = this.overviewPosition
            .clone()
            .sub(this.overviewTarget)
            .length();

        if (desiredRadius > this.controls.maxDistance) {
            // dá um bocadinho de margem
            this.controls.maxDistance = desiredRadius * 1.05;
        }

        this.isResettingCamera = true;
        this.resetStartTime = performance.now() / 1000;

        this.resetFromPos.copy(this.camera.position);
        this.resetFromTarget.copy(this.controls.target);
    }


    /* ===========================================================
       LOAD / BUILD
       =========================================================== */
    load(data: SceneData) {
        // 1) limpar grupos dinâmicos
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

        // limpar labels HTML de navios
        this.vesselLabels.forEach((vl) => {
            if (vl.el.parentElement === this.labelsLayer) {
                this.labelsLayer.removeChild(vl.el);
            }
        });
        this.vesselLabels = [];

        // 2) calcular layout
        if (!this._grids) {
            console.warn("[PortScene] grids não inicializadas — fallback.");
            this._grids = computePortGrids(600, 500, 10);
        }
        const layoutResult = computeLayout(data, this._grids!);

        // 3) construir nós 3D (facilities + decorativos)
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

            // info de visita (VVN accepted) com tasks
            const visit = (v as any).visit ?? null;

            // userData já usado para picking
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

        // decor “layout-based”
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

        // 3.b) ambiente dependente da grelha/layout mas configurado por JSON
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

        // toldos A.1
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

        // physical resources (posicionados pelo layout)
        if ((layoutResult as any).resources) {
            for (const pr of (layoutResult as any).resources) {
                const node = makePhysicalResource(pr);
                this.gResources.add(node);
                this.pickables.push(node);
            }
        }

        // 4) fit de câmara ao conteúdo (apenas quando NÃO estiver em FP)
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

            // posição 3D um pouco acima do navio
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

            // atualizar cor emissiva/casco do navio
            this.applyVesselStatusVisual(obj, sim.status);
        }
    }

    /** Click → picking + highlight + focar câmara + callback para UI */
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

        let obj: THREE.Object3D | null = hits[0].object;
        while (obj && !obj.userData?.type) obj = obj.parent!;

        if (!obj) return;

        // 1) highlight visual
        this.clearHighlight();
        this.applyHighlight(obj);

        // 2) focar câmara no centro do objeto (horizontalmente)
        this.focusCameraOnObject(obj);

        // 3) callback para React / UI
        onPick?.(obj.userData ?? { type: "Unknown" });
    };

    /* =================== LOOP & DISPOSE =================== */
    loop = () => {
        const now = performance.now();
        const dt = Math.min(0.05, (now - this.lastT) / 1000);
        this.lastT = now;

        if (!this.fp.controls.isLocked) this.controls.update();
        this.fp.update(dt);
        
        this.updateVesselLabelsAndStatus();
        this.updateCameraResetAnimation();
        
        this.updateVesselLabelsAndStatus();

        // spotlight dinâmico segue a câmara e continua apontado ao centro da seleção
        if (this.selectionSpotlight && this.selectionSpotlightTarget && this.selectedObj) {
            const box = new THREE.Box3().setFromObject(this.selectedObj);
            box.getCenter(this.selectionCenter);

            this.selectionSpotlightTarget.position.copy(this.selectionCenter);
            this.selectionSpotlightTarget.updateMatrixWorld();

            // direção câmara → centro do objeto
            const dir = new THREE.Vector3()
                .subVectors(this.selectionCenter, this.camera.position)
                .normalize();

            // luz fica um pouco atrás dessa direção e mais alta
            const lightPos = this.selectionCenter.clone().sub(dir.multiplyScalar(80));
            lightPos.y += 40;

            this.selectionSpotlight.position.copy(lightPos);
        }

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
    }
}
