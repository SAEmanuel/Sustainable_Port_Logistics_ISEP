// src/features/viewer3d/scene/PortScene.ts
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { SceneData, ContainerDto, StorageAreaDto, DockDto } from "../types";

import { makePortBase } from "./objects/PortBase";
import { ASSETS_TEXTURES } from "./utils/assets";
// @ts-ignore
import { computePortGrids, drawPortGridsDebug } from "./objects/portGrids";
import { makeContainerPlaceholder } from "./objects/Container";
import { addRoadPoles } from "./objects/roadLights";
import { makeStorageArea } from "./objects/StorageArea";
import { makeDock, layoutDocksForZoneC } from "./objects/Dock";

export type LayerVis = { containers: boolean };

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

    pickables: THREE.Object3D[] = [];
    reqId = 0;

    private _grids: ReturnType<typeof computePortGrids> | null = null;

    constructor(container: HTMLDivElement) {
        this.container = container;

        // RENDERER
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(this.renderer.domElement);

        // SCENE & CAMERA
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);

        this.camera = new THREE.PerspectiveCamera(20, container.clientWidth / container.clientHeight, 0.1, 8000);
        this.camera.position.set(180, 200, 420);

        this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
        this.scene.add(new THREE.HemisphereLight(0xffffff, 0x404040, 0.25));

        // BASE DO PORTO
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

        // FARÓIS
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

        // GRELHAS (A/B/C)
        const W = layout.zoneC.size.w;
        const D = layout.zoneC.size.d * 2;
        this._grids = computePortGrids(W, D, 10);
        drawPortGridsDebug(this.scene, this._grids, 0.06);

        // CONTROLOS
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.target.set(0, 0, 0);

        // GRUPOS
        this.gContainers.name = "containers";
        this.gStorage.name = "storage-areas";
        this.gDocks.name = "docks";
        this.gBase.add(this.gContainers);
        this.gBase.add(this.gStorage);
        this.gBase.add(this.gDocks);

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
        this.gContainers.visible = vis.containers;
    }

    /* ======================================================================
       STORAGE AREAS EM B: máx. 10 em B.1 e 10 em B.2, tamanhos uniformes
       ====================================================================== */

    private placeUniformInRect(
        items: StorageAreaDto[],
        fromIdx: number,
        rect: { minX: number; maxX: number; minZ: number; maxZ: number },
        maxCount: number,
        marginInit = 6,
        gapInit = 3,
        rotY = 0
    ): number {
        let margin = marginInit;
        let gap = gapInit;

        const total = Math.min(maxCount, Math.max(0, items.length - fromIdx));
        if (total <= 0) return fromIdx;

        const rectW = rect.maxX - rect.minX;
        const rectD = rect.maxZ - rect.minZ;
        const aspect = rectW / Math.max(1e-6, rectD);

        let cols = Math.max(1, Math.min(total, Math.ceil(Math.sqrt(total * aspect))));
        let rows = Math.max(1, Math.ceil(total / cols));

        const calcSize = () => ({
            w: (rectW - 2 * margin - (cols - 1) * gap) / cols,
            d: (rectD - 2 * margin - (rows - 1) * gap) / rows,
        });

        let { w, d } = calcSize();
        let guard = 0;
        while ((w <= 0 || d <= 0) && guard++ < 20) {
            if (margin > 2) margin -= 1;
            else if (gap > 1) gap -= 1;
            else { cols = Math.max(1, cols - 1); rows = Math.max(1, Math.ceil(total / cols)); }
            ({ w, d } = calcSize());
        }

        const hDefault = 3;

        for (let k = 0; k < total; k++) {
            const idx = fromIdx + k;
            const r = Math.floor(k / cols);
            const c = k % cols;

            const cx = rect.minX + margin + c * (w + gap) + w / 2;
            const cz = rect.minZ + margin + r * (d + gap) + d / 2;

            const sa = items[idx] as any;
            const h = Math.max(1, Number(sa.heightM) || hDefault);

            sa.widthM  = w;
            sa.depthM  = d;
            sa.heightM = h;

            sa.positionX = cx;
            sa.positionY = h / 2;
            sa.positionZ = cz;
            sa.rotationY = rotY;
        }

        return fromIdx + total;
    }

    private placeStorageAreasInB(storage: StorageAreaDto[]) {
        if (!this._grids) return;

        const B1 = this._grids.B["B.1"].rect;
        const B2 = this._grids.B["B.2"].rect;

        let idx = this.placeUniformInRect(storage, 0, B1, 10, 6, 3, 0);
        if (idx < storage.length) {
            idx = this.placeUniformInRect(storage, idx, B2, 10, 6, 3, Math.PI);
        }
    }

    /* ===================== Containers: A.2 com máx. 2 tiers ===================== */

    private remapContainersToA2_Max2PerSlot(
        items: ContainerDto[],
        gridA2: {
            rect: { minX: number; maxX: number; minZ: number; maxZ: number };
            rows: number; cols: number;
            cells: Array<{
                minX: number; maxX: number; minZ: number; maxZ: number;
                r: number; c: number; center: THREE.Vector3;
            }>;
        }
    ) {
        const SCALE = 3;
        const ROAD_W = 12;

        const L40 = 12.19 * SCALE;  // X
        const W40 =  2.44 * SCALE;  // Z
        const H    =  2.59 * SCALE; // Y
        const SAFE = 1.0;
        const GAP_Y = 0.14;

        const rect = gridA2.rect;

        const insetFromX0   = ROAD_W / 2 + W40 / 2 + SAFE;
        const insetFromZTop = ROAD_W / 2 + L40 / 2 + SAFE;

        const strideR = 3;
        const strideC = 2;

        const slots = gridA2.cells
            .filter((cell) => {
                const { r, c } = cell;
                const cx = cell.center.x, cz = cell.center.z;

                if (cx < rect.minX + insetFromX0) return false;
                if (cx > rect.maxX - (W40 / 2 + SAFE)) return false;
                if (cz < rect.minZ + (L40 / 2 + SAFE)) return false;
                if (cz > rect.maxZ - insetFromZTop)   return false;

                if (r < 1 || r >= gridA2.rows - 1) return false;
                if (c < 1 || c >= gridA2.cols - 1) return false;

                if (r % strideR !== 0) return false;
                if (c % strideC !== 0) return false;

                return true;
            })
            .sort((a, b) => (a.c - b.c) || (a.r - b.r));

        if (!slots.length) return;

        for (let i = 0; i < items.length; i++) {
            const slotIndex = Math.floor(i / 2) % slots.length;
            const tier = i % 2; // 0 ou 1
            const cell = slots[slotIndex];
            const c = items[i];

            c.positionX = cell.center.x;
            c.positionY = (H / 2) + tier * (H + GAP_Y);
            c.positionZ = cell.center.z;
            (c as any).rotationY = 0;
        }
    }

    /* ===================== LOAD / PICK / LOOP / DISPOSE ===================== */

    load(data: SceneData) {
        // limpa containers
        while (this.gContainers.children.length) {
            const c: any = this.gContainers.children.pop();
            c?.geometry?.dispose?.();
            if (Array.isArray(c?.material)) c.material.forEach((m: any) => m?.dispose?.());
            else c?.material?.dispose?.();
        }
        // limpa storage
        while (this.gStorage.children.length) {
            const o: any = this.gStorage.children.pop();
            o?.geometry?.dispose?.();
            if (Array.isArray(o?.material)) o.material.forEach((m: any) => m?.dispose?.());
            else o?.material?.dispose?.();
        }
        // limpa docks
        while (this.gDocks.children.length) {
            const o: any = this.gDocks.children.pop();
            o?.geometry?.dispose?.();
            if (Array.isArray(o?.material)) o.material.forEach((m: any) => m?.dispose?.());
            else o?.material?.dispose?.();
        }

        this.pickables = [];

        // STORAGE AREAS (B.1 → B.2) — máximo 20
        const storageCopy = data.storageAreas.slice(0, 20).map(sa => ({ ...sa }));
        this.placeStorageAreasInB(storageCopy);
        for (const sa of storageCopy) {
            const node = makeStorageArea(sa);
            this.gStorage.add(node);
            this.pickables.push(node);
        }

        // DOCKS — máximo 8, layout na ZONA C
        const docksCopy: DockDto[] = (data.docks ?? []).slice(0, 8).map(d => ({ ...d }));
        if (this._grids) {
            layoutDocksForZoneC(docksCopy, this._grids as any);
            for (const d of docksCopy) {
                const m = makeDock(d);
                this.gDocks.add(m);
                this.pickables.push(m);
            }
        }

        // CONTAINERS (A.2, máx. 2 tiers por célula)
        const a2 = this._grids?.A?.["A.2"];
        if (a2) this.remapContainersToA2_Max2PerSlot(data.containers, a2);
        for (const c of data.containers) {
            const mesh = makeContainerPlaceholder(c, 3);
            this.gContainers.add(mesh);
            this.pickables.push(mesh);
        }

        // Fit da câmara
        const box = new THREE.Box3();
        this.pickables.forEach((o) => box.expandByObject(o));
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
