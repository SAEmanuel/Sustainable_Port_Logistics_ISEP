// src/features/viewer3d/scene/PortScene.ts
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

import { addRoadTraffic } from "../services/placement/addRoadTraffic";
import { addAngleParkingInC } from "../services/placement/addParking";
import { addWorkshopsInC34 } from "../services/placement/addWorkshopsC34";
import { addExtrasRowInC34 } from "../services/placement/addExtrasRowC34";
import { addContainerYardsInC78910 } from "../services/placement/addStacksYardC78910";
import { addModernAwningsInA1 } from "../services/placement/addMarqueeA1";

import { computeLayout } from "../services/layoutEngine";

import { WorkerAvatar } from "./objects/Worker";
import { FirstPersonRig } from "./FisrtPersonRig";

export type LayerVis = Partial<{
    containers: boolean;
    storage: boolean;
    docks: boolean;
    vessels: boolean;
    resources: boolean;
    decoratives?: boolean;
}>;

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

    // 1st-person
    fp!: FirstPersonRig;
    worker!: WorkerAvatar;
    lastT = performance.now();

    pickables: THREE.Object3D[] = [];
    reqId = 0;

    // grelhas/rects de A/B/C (para layoutEngine)
    private _grids: ReturnType<typeof computePortGrids> | null = null;
    // guarda o layout do cais/estradas (PortLayout) para o tráfego
    private _baseLayout!: PortLayout;

    constructor(container: HTMLDivElement) {
        this.container = container;

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

        this.camera = new THREE.PerspectiveCamera(20, container.clientWidth / container.clientHeight, 0.1, 8000);
        this.camera.position.set(180, 200, 420);

        this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
        this.scene.add(new THREE.HemisphereLight(0xffffff, 0x404040, 0.25));

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
        );

        /* ------------ AVATAR + FIRST PERSON (desligado por omissão) ------------ */
        this.worker = new WorkerAvatar({ heightM: 1.85, bodyH: 1.85, bodyR: 0.36, yBase: 0.03 });
        this.worker.setXZ(0, 0);
        this.gBase.add(this.worker.root);

        this.fp = new FirstPersonRig(this.camera, this.renderer.domElement, {
            groundY: 0.03,
            speed: 20,
            autoPointerLock: false,   // NÃO entra ao clicar
            keyToggleCode: "KeyF",    // alterna com F
        });
        this.fp.attachTo(this.worker.getCameraAnchor());

        // o “player object” tem de estar na Scene
        this.scene.add(this.fp.controls.object);
        // começa onde a câmara está, para evitar salto/esmagamento
        (this.fp.controls.object as THREE.Object3D).position.copy(this.camera.position);

        // tecla F alterna orbit <-> FP
        window.addEventListener("keydown", (e) => {
            if (e.code === "KeyF") {
                this.fp.controls.isLocked ? this.fp.unlock() : this.fp.lock();
            }
        });

        /* ------------ GRELHAS (A/B/C) ------------ */
        const W = this._baseLayout.zoneC.size.w;
        const D = this._baseLayout.zoneC.size.d * 2;
        this._grids = computePortGrids(W, D, 10);
        // drawPortGridsDebug(this.scene, this._grids, 1.1);

        /* ------------ FARÓIS ------------ */
        addRoadPoles(this.scene, this._baseLayout, {
            yGround: 0,
            roadWidth: 12,
            poleHeight: 7.5,
            poleOffset: 1.4,
            spacing: 22,
            intensity: 0,
            spawnGlow: false,
            clearMargin: 1.2,
        });



        /* ------------ ARVORES ------------ */

        addRoadTrees(this.scene, this._baseLayout, {
            yGround: 0,
            roadWidth: 12,
            offsetFromRoad: 4.2,
            spacing: 18,
            spacingPhase: 9,
            jitterXY: 1.4,
            clearMargin: 1.6,
            density: 0.9,
            scaleMin: 0.9,
            scaleMax: 1.45,
            bothSides: true,
            seed: 20251111,
            // opcional: afinar pesos (continuará a garantir 1x de cada se houver >=3 marcas)
            // weights: { pine: 2, fallTree: 1, tree: 2 },
        });






        /* ------------ CONTROLOS ORBIT ------------ */
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.target.set(0, 0, 0);

        window.addEventListener("resize", this.onResize);
        this.loop();
    }

    onResize = () => {
        const w = this.container.clientWidth, h = this.container.clientHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    };

    setLayers(vis: LayerVis) {
        if (vis.containers !== undefined) this.gContainers.visible = vis.containers;
        if (vis.storage !== undefined) this.gStorage.visible = vis.storage;
        if (vis.docks !== undefined) this.gDocks.visible = vis.docks;
        if (vis.vessels !== undefined) this.gVessels.visible = vis.vessels;
        if (vis.resources !== undefined) this.gResources.visible = vis.resources;
        if ((vis as any).decoratives !== undefined) this.gDecor.visible = (vis as any).decoratives;
    }

    /* ===========================================================
       LOAD / BUILD
       =========================================================== */
    load(data: SceneData) {
        // 1) limpar grupos
        const disposeGroup = (g: THREE.Group) => {
            while (g.children.length) {
                const o: any = g.children.pop();
                o?.geometry?.dispose?.();
                if (Array.isArray(o?.material)) o.material.forEach((m: any) => m?.dispose?.());
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

        // 2) calcular layout
        if (!this._grids) {
            console.warn("[PortScene] grids não inicializadas — fallback.");
            this._grids = computePortGrids(600, 500, 10);
        }
        const layoutResult = computeLayout(data, this._grids!);

        // 3) construir nós 3D
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
            this.gVessels.add(node);
            this.pickables.push(node);
        }

        // decor
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

        // tráfego (usa PortLayout base)
        addRoadTraffic(this.gTraffic, this._baseLayout, {
            approxVehicles: 100,
            truckRatio: 0.35,
            minPerRoad: 1,
            laneWidth: 3.2,
            lateralMargin: 0.6,
            minGapMeters: 11,
            roadY: 0.03,
            seed: 20251110,
        });

        // parques (C.1 e C.2)
        addAngleParkingInC(this.gParking, this._grids!, {
            zones: ["C.1", "C.2"],
            angleDeg: 60,
            stallWidth: 2.6,
            stallLength: 5.2,
            aisleWidth: 6.0,
            edgeMargin: 1.2,
            roadClearM: 4.5,
            blockWidthRatio: 0.68,
            blockDepthRatio: 0.50,
            blockDriveway: 6.0,
            lineWidth: 0.18,
            occupancy: 0.20,
            roadY: 0.03,
            seed: 20251110,
        });

        addWorkshopsInC34(this.gWorkshops, this._grids!, {
            zones: ["C.3", "C.4"],
            countPerZone: 5,
            marginX: 4,
            marginZ: 4,
            fillWidthRatio: 0.96,
            fillDepthRatio: 0.96,
            cellGap: 1.2,
            fitScaleFactor: 0.985,
            faceParking: true,
            roadY: 0.03,
        });

        addExtrasRowInC34(this.gExtras!, this._grids!, {
            zones: ["C.3", "C.4"],
            fillWidthRatio: 0.98,
            fillDepthRatio: 0.92,
            marginX: 2.5,
            marginZ: 2.5,
            cellGap: 10,
            fitScaleFactor: 0.992,
            roadY: 0.03,
        });

        // Yards no miolo (C.7…C.10)
        addContainerYardsInC78910(this.gYards, this._grids!, {
            unitScale: 0.60,
            gapX: 0.95,
            gapZ: 0.18,
            widthRatio: 0.70,
            depthRatio: 0.62,
            maxCols: 4,
            rowsMax: 0,
            maxStack: 3,
            yawRad: -Math.PI / 2,
            roadY: 0.03,
        });

        // toldos A.1 a ocupar praticamente toda a zona
        addModernAwningsInA1(this.gDecor, this._grids!, {
            fillWidthRatio: 0.87,
            fillDepthRatio: 0.87,
            marginX: 1.0,
            marginZ: 1.0,
            gapBetween: 1.2,
            eaveHeight: 29.5,
            ridgeExtra: 32,
            postRadius: 0.50,
            beamRadius: 0.50,
            finishBarRadius: 0.50,
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
                const size = new THREE.Vector3(), center = new THREE.Vector3();
                box.getSize(size);
                box.getCenter(center);
                const maxSize = Math.max(size.x, size.y, size.z);
                const distance = (maxSize * 1.5) / Math.tan((this.camera.fov * Math.PI) / 360);
                const dir = new THREE.Vector3(1, 1, 1).normalize();
                this.controls.target.copy(center);
                this.camera.position.copy(center.clone().add(dir.multiplyScalar(distance)));
                this.camera.near = Math.max(0.1, maxSize / 1000);
                this.camera.far = Math.max(2000, distance * 10);
                this.camera.updateProjectionMatrix();
            }
        }
    }

    /** Click → devolve o userData do objeto selecionado */
    raycastAt = (ev: MouseEvent, onPick?: (u: any) => void) => {
        const rect = this.renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((ev.clientX - rect.left) / rect.width) * 2 - 1,
            -((ev.clientY - rect.top) / rect.height) * 2 + 1,
        );
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, this.camera);

        const hits = raycaster.intersectObjects(this.pickables, true);
        if (!hits.length) return;

        let obj: THREE.Object3D | null = hits[0].object;
        while (obj && !obj.userData?.type) obj = obj.parent!;
        onPick?.(obj?.userData ?? { type: "Unknown" });
    };

    /* =================== LOOP & DISPOSE =================== */
    loop = () => {
        const now = performance.now();
        const dt = Math.min(0.05, (now - this.lastT) / 1000);
        this.lastT = now;

        // Orbit ativo só quando NÃO estiver em FP
        if (!this.fp.controls.isLocked) this.controls.update();
        this.fp.update(dt);

        this.renderer.render(this.scene, this.camera);
        this.reqId = requestAnimationFrame(this.loop);
    };

    dispose() {
        cancelAnimationFrame(this.reqId);
        window.removeEventListener("resize", this.onResize);
        this.scene.traverse((o) => {
            const m = o as THREE.Mesh;
            (m.geometry as any)?.dispose?.();
            const mat = (m.material as THREE.Material | THREE.Material[] | undefined);
            if (Array.isArray(mat)) mat.forEach((mm) => (mm as any)?.dispose?.());
            else (mat as any)?.dispose?.();
        });
        this.renderer.dispose();
        if (this.container.contains(this.renderer.domElement)) {
            this.container.removeChild(this.renderer.domElement);
        }
    }
}
