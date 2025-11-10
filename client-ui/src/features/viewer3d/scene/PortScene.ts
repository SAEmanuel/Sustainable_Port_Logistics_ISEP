// src/features/viewer3d/scene/PortScene.ts
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { SceneData, ContainerDto } from "../types";

import { makePortBase } from "./objects/PortBase";
import { ASSETS_TEXTURES } from "./utils/assets";
// @ts-ignore – util interno com tipos compatíveis
import { computePortGrids, drawPortGridsDebug } from "./objects/portGrids";

import { addRoadPoles } from "./objects/roadLights";
import { makeStorageArea } from "./objects/StorageArea";
import { makeContainerPlaceholder } from "./objects/Container";
import { makeDock } from "./objects/Dock";
import { makeVessel } from "./objects/Vessel";
import { makeDecorativeStorage } from "./objects/DecorativeStorage";
import {makeDecorativeCrane} from "./objects/DecorativeCrane";

import { computeLayout } from "../services/layoutEngine";

// depois — permite enviar só o que queres mudar
export type LayerVis = Partial<{
    containers: boolean;
    storage: boolean;
    docks: boolean;
    vessels: boolean;
    resources: boolean;  // futuro
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
    
    pickables: THREE.Object3D[] = [];
    reqId = 0;

    // grelhas/rects de A/B/C (para layoutEngine)
    private _grids: ReturnType<typeof computePortGrids> | null = null;

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
            8000
        );
        this.camera.position.set(180, 200, 420);

        this.scene.add(new THREE.AmbientLight(0xffffff, 0.2));
        this.scene.add(new THREE.HemisphereLight(0xffffff, 0x404040, 0.25));

        /* ------------ BASE DO PORTO ------------ */
        const { group: base, layout } = makePortBase({
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
        this.scene.add(this.gBase);

        /* ------------ FARÓIS ------------ */
        addRoadPoles(this.scene, layout, {
            yGround: 0,
            roadWidth: 12,
            poleHeight: 7.5,
            poleOffset: 1.4,
            spacing: 22,
            intensity: 0,
            spawnGlow: false,
            clearMargin: 1.2,
        });

        /* ------------ GRELHAS (A/B/C) ------------ */
        const W = layout.zoneC.size.w;
        const D = layout.zoneC.size.d * 2;
        this._grids = computePortGrids(W, D, 10);
        drawPortGridsDebug(this.scene, this._grids, 1.10);

        /* ------------ CONTROLOS ------------ */
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.target.set(0, 0, 0);

        /* ------------ GRUPOS 3D ------------ */
        this.gContainers.name = "containers";
        this.gStorage.name = "storage-areas";
        this.gDocks.name = "docks";
        this.gVessels.name = "vessels";
        this.gDecor.name = "decorative";
        this.gBase.add(this.gContainers);
        this.gBase.add(this.gStorage);
        this.gBase.add(this.gDocks);
        this.gBase.add(this.gVessels);
        this.gBase.add(this.gDecor); 

        window.addEventListener("resize", this.onResize);
        this.loop();
    }

    onResize = () => {
        const w = this.container.clientWidth,
            h = this.container.clientHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    };

    // depois
    setLayers(vis: LayerVis) {
        if (vis.containers !== undefined) this.gContainers.visible = vis.containers;
        if (vis.storage    !== undefined) this.gStorage.visible    = vis.storage;
        if (vis.docks      !== undefined) this.gDocks.visible      = vis.docks;
        if (vis.vessels    !== undefined) this.gVessels.visible    = vis.vessels;
        if ((vis as any).decoratives !== undefined) this.gDecor.visible = (vis as any).decoratives; // opcional
        // if (vis.resources !== undefined) this.gResources.visible = vis.resources;
    }

    /* ===========================================================
       LOAD / BUILD
       - PortScene apenas coordena; posições/tamanhos vêm de computeLayout
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
        this.pickables = [];

        // 2) calcular layout (storage B, containers A.2, docks C)
        const layout = computeLayout(data, this._grids!);

        // 3) construir nós 3D
        // Storage Areas
        for (const sa of layout.storage) {
            const node = makeStorageArea(sa);
            this.gStorage.add(node);
            this.pickables.push(node);
        }

        // Docks
        for (const d of layout.docks) {
            const node = makeDock(d as any);
            this.gDocks.add(node);
            this.pickables.push(node);
        }

        // Containers (A.2 com limitação de 2 por slot – já posicionado)
        for (const c of layout.containers as ContainerDto[]) {
            const mesh = makeContainerPlaceholder(c, 3);
            this.gContainers.add(mesh);
            this.pickables.push(mesh);
        }

        // Vessels
        for (const v of layout.vessels) {
            const node = makeVessel(v as any);
            this.gVessels.add(node);
            this.pickables.push(node);
        }

        // Decoratives Storage Areas (retângulos amarelos)
        for (const deco of layout.decoratives) {
            const mesh = makeDecorativeStorage(deco);
            this.gDecor.add(mesh);
            this.pickables.push(mesh);
        }

        for (const dc of layout.decorativeCranes) {
            const node = makeDecorativeCrane(dc as any);
            this.gDecor.add(node);
            this.pickables.push(node);
        }
        
        // 4) fit de câmara ao conteúdo
        const box = new THREE.Box3();
        this.pickables.forEach((o) => box.expandByObject(o));
        if (!box.isEmpty()) {
            const size = new THREE.Vector3(),
                center = new THREE.Vector3();
            box.getSize(size);
            box.getCenter(center);
            const maxSize = Math.max(size.x, size.y, size.z);
            const distance =
                (maxSize * 1.5) / Math.tan((this.camera.fov * Math.PI) / 360);
            const dir = new THREE.Vector3(1, 1, 1).normalize();
            this.controls.target.copy(center);
            this.camera.position.copy(center.clone().add(dir.multiplyScalar(distance)));
            this.camera.near = Math.max(0.1, maxSize / 1000);
            this.camera.far = Math.max(2000, distance * 10);
            this.camera.updateProjectionMatrix();
        }
    }

    /** Click → devolve o userData do objeto selecionado */
    raycastAt = (ev: MouseEvent, onPick?: (u: any) => void) => {
        const rect = this.renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((ev.clientX - rect.left) / rect.width) * 2 - 1,
            -((ev.clientY - rect.top) / rect.height) * 2 + 1
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
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
        this.reqId = requestAnimationFrame(this.loop);
    };

    dispose() {
        cancelAnimationFrame(this.reqId);
        window.removeEventListener("resize", this.onResize);
        this.scene.traverse((o) => {
            const m = o as THREE.Mesh;
            (m.geometry as any)?.dispose?.();
            const mat = m.material as THREE.Material | THREE.Material[] | undefined;
            if (Array.isArray(mat)) mat.forEach((mm) => (mm as any)?.dispose?.());
            else (mat as any)?.dispose?.();
        });
        this.renderer.dispose();
        if (this.container.contains(this.renderer.domElement)) {
            this.container.removeChild(this.renderer.domElement);
        }
    }
}
