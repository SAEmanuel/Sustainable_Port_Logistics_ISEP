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

        this.camera = new THREE.PerspectiveCamera(
            20,
            container.clientWidth / container.clientHeight,
            0.1,
            8000,
        );
        this.camera.position.set(180, 200, 420);

        // this.renderer.toneMappingExposure = 0.7;
        // this.loadSkyHDR();

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
            }
        });

        /* ------------ GRELHAS (A/B/C) ------------ */
        const W = this._baseLayout.zoneC.size.w;
        const D = this._baseLayout.zoneC.size.d * 2;
        this._grids = computePortGrids(W, D, 10);
        // drawPortGridsDebug(this.scene, this._grids, 1.1);

        /* ------------ OBJETOS “AMBIENTAIS” FIXOS ------------ */
        // FARÓIS
        addRoadPoles(this.scene, this._baseLayout, portSceneConfig.roadLights);

        // ÁRVORES
        addRoadTrees(this.scene, this._baseLayout, portSceneConfig.roadTrees);

        // PONTES + CIDADE
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
            // libertar o clone
            if (Array.isArray(current)) current.forEach((m: any) => m?.dispose?.());
            else current?.dispose?.();

            // restaurar material original
            o.material = o.userData.__origMat;
            delete o.userData.__origMat;
        });

        this.selectedObj = null;
    }

    private applyHighlight(obj: THREE.Object3D) {
        obj.traverse((o: any) => {
            if (!o.isMesh) return;

            // 1) Se ainda não tiver material original guardado, guarda e clona
            if (!o.userData.__origMat) {
                if (Array.isArray(o.material)) {
                    o.userData.__origMat = o.material;
                    o.material = o.material.map((m: THREE.Material) => m.clone());
                } else if (o.material) {
                    o.userData.__origMat = o.material;
                    o.material = (o.material as THREE.Material).clone();
                }
            }

            // 2) Agora já é seguro mexer na cor (é um clone)
            const mats = Array.isArray(o.material) ? o.material : [o.material];
            mats.forEach((m: any) => {
                if (!m || !("color" in m)) return;
                m.color.lerp(new THREE.Color(0xffff00), 0.5);
            });
        });

        this.selectedObj = obj;
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
            this.gVessels.add(node);
            this.pickables.push(node);
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

        // toldos A.1 (ainda hardcoded, mas podes criar portSceneConfig.awnings se quiseres)
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
            }
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
            // opcional: limpar seleção se clicares no "vazio"
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
    }
}
