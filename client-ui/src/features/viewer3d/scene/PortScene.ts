import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { SceneData, VesselDto, ContainerDto,StorageAreaDto } from "../types";
import { makeDock } from "./objects/Dock";
import { makeStorageAreaPlaceholder, makeStorageAreaNode } from "./objects/StorageArea";
import { makeVesselPlaceholder, makeVesselNode } from "./objects/Vessel";
import { makeContainerPlaceholder,makeContainerNode } from "./objects/Container";
import { makePhysicalResource } from "./objects/PhysicalResource";
import { ASSETS_MODELS /*, ASSETS_TEXTURES */ } from "./utils/assets";

export type LayerVis = { docks: boolean; storage: boolean; vessels: boolean; containers: boolean; resources: boolean };

export class PortScene {
    container: HTMLDivElement;
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    controls: OrbitControls;

    gDocks = new THREE.Group();
    gStorage = new THREE.Group();
    gVessels = new THREE.Group();
    gContainers = new THREE.Group();
    gResources = new THREE.Group();

    pickables: THREE.Object3D[] = [];
    reqId = 0;

    constructor(container: HTMLDivElement) {
        this.container = container;

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(this.renderer.domElement);

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf4f6fb);

        this.camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 8000);
        this.camera.position.set(120, 120, 220);

        const w = 3000, h = 10, d = 3000;          // largura, altura, profundidade
        const water = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({color: 0x0000ff}));
        this.scene.add(water);
        water.position.set(0, -10, 0);


        
        // lights
        this.scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 0.85));
        const dir = new THREE.DirectionalLight(0xffffff, 0.8);
        dir.position.set(100, 200, 100);
        this.scene.add(dir);

        // helpers
        this.scene.add(new THREE.GridHelper(2000, 200));
        const axes = new THREE.AxesHelper(20);
        axes.position.set(0, 0.01, 0);
        this.scene.add(axes);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.target.set(40, 0, 40);

        // groups
        this.gDocks.name = "docks";
        this.gStorage.name = "storage";
        this.gVessels.name = "vessels";
        this.gContainers.name = "containers";
        this.gResources.name = "resources";
        this.scene.add(this.gDocks, this.gStorage, this.gVessels, this.gContainers, this.gResources);
        
        this.gContainers.scale.set(10, 10, 10); // 1000% maior
        //this.gStorage.scale.set(3, 3, 3); // 1000% maior

        window.addEventListener("resize", this.onResize);
        this.loop();
    }

    onResize = () => {
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    };

    setLayers(vis: LayerVis) {
        this.gDocks.visible = vis.docks;
        this.gStorage.visible = vis.storage;
        this.gVessels.visible = vis.vessels;
        this.gContainers.visible = vis.containers;
        this.gResources.visible = vis.resources;
    }

    load(data: SceneData) {
        // limpar grupos & pickables
        [this.gDocks, this.gStorage, this.gVessels, this.gContainers, this.gResources].forEach((g) => {
            while (g.children.length) {
                const c = g.children.pop()!;
                if ((c as any).geometry) (c as any).geometry.dispose?.();
                const mat = (c as any).material;
                if (Array.isArray(mat)) mat.forEach((m: any) => m?.dispose?.());
                else mat?.dispose?.();
            }
        });
        this.pickables = [];

        // docks
        data.docks.forEach((d) => {
            const m = makeDock(d);
            this.gDocks.add(m);
            this.pickables.push(m);
        });

        // storage
        data.storageAreas.forEach((sa) => { this.importModel(sa); });
        // vessels & containers via import genérico
        data.vessels.forEach((v) => { void this.importModel(v); });
        data.containers.forEach((c) => { void this.importModel(c); });

        // resources
        data.resources.forEach((r) => {
            const m = makePhysicalResource(r);
            this.gResources.add(m);
            this.pickables.push(m);
        });

        // auto-frame
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
            this.camera.far  = Math.max(2000, distance * 10);
            this.camera.updateProjectionMatrix();
        }
    }

    raycastAt = (ev: MouseEvent, onPick?: (u: any) => void) => {
        const rect = this.renderer.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(((ev.clientX - rect.left) / rect.width) * 2 - 1, -((ev.clientY - rect.top) / rect.height) * 2 + 1);
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
            const mat = m.material as THREE.Material | THREE.Material[] | undefined;
            if (Array.isArray(mat)) mat.forEach((mm) => (mm as any)?.dispose?.());
            else (mat as any)?.dispose?.();
        });
        this.renderer.dispose();
        if (this.container.contains(this.renderer.domElement)) {
            this.container.removeChild(this.renderer.domElement);
        }
    }

    
    
    
    // ---------- TYPE GUARDS (métodos, sem 'function') ----------
    private isVessel(x: any): x is VesselDto {
        return x && typeof x === "object" && "imoNumber" in x;
    }

    private isContainer(x: any): x is ContainerDto {
        return x && typeof x === "object" && ("isoCode" in x || "iso6346" in x || "code" in x);
    }

    private isStorageArea(x: any): x is StorageAreaDto {
        return x && typeof x === "object" && ("widthM" in x || "maxBays" in x);
    }


    // ---------- Importador genérico ----------
    private async importWith(makePlaceholder: () => THREE.Object3D, loadNode: () => Promise<THREE.Object3D>, group: THREE.Group) {
        const ph = makePlaceholder();
        group.add(ph);
        this.pickables.push(ph);

        try {
            const node = await loadNode();

            node.position.copy((ph as any).position);
            node.rotation.copy((ph as any).rotation);
            node.userData = (ph as any).userData;

            group.add(node);
            this.pickables.push(node);

            group.remove(ph);
            (ph as any).traverse?.((o: any) => {
                o.geometry?.dispose?.();
                if (Array.isArray(o.material)) o.material.forEach((m: any) => m?.dispose?.());
                else o.material?.dispose?.();
            });
        } catch (e) {
            console.warn("Falha a carregar modelo:", e);
            // mantém placeholder
        }
    }
    

// ---------- API única para Vessel | Container ----------
    private async importModel(m: VesselDto | ContainerDto | StorageAreaDto) {
        if (this.isVessel(m)) {
            await this.importWith(
                () => makeVesselPlaceholder(m),
                () => makeVesselNode(m, ASSETS_MODELS.vessels.ship_ocean, null),
                this.gVessels
            );
            return;
        }

        if (this.isContainer(m)) {
            await this.importWith(
                () => makeContainerPlaceholder(m),
                () => makeContainerNode(m, ASSETS_MODELS.containers.container, null),
                this.gContainers
            );
            return;
        }
        
        if(this.isStorageArea(m)){
            await this.importWith(
                () => makeStorageAreaPlaceholder(m),
                () => makeStorageAreaNode(m,ASSETS_MODELS.storageArea.wareHouser),          
                this.gStorage
            );
            return;
        }

        console.warn("Tipo de modelo desconhecido:", m);
    }
    
}
