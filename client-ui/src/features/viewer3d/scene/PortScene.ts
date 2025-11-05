import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { SceneData ,VesselDto} from "../types";
import { makeDock } from "./objects/Dock";
import { makeStorageArea } from "./objects/StorageArea";
import { makeVesselPlaceholder, makeVesselNode } from "./objects/Vessel";
import { makeContainer } from "./objects/Container";
import { makePhysicalResource } from "./objects/PhysicalResource";
// @ts-ignore
import { ASSETS_MODELS,ASSETS_TEXTURES } from "./utils/assets";

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
        
        // lights
        this.scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 0.85));
        const dir = new THREE.DirectionalLight(0xffffff, 0.8);
        dir.position.set(100, 200, 100);
        this.scene.add(dir);

        
        
        
        // helpers
        this.scene.add(new THREE.GridHelper(2000, 200));
        const axes = new THREE.AxesHelper(20); axes.position.set(0, 0.01, 0); this.scene.add(axes);

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

        
        
        // events
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
        [this.gDocks, this.gStorage, this.gVessels, this.gContainers, this.gResources].forEach(g => {
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
        data.docks.forEach(d => {
            const m = makeDock(d);
            this.gDocks.add(m); this.pickables.push(m);
        });
        // storage
        data.storageAreas.forEach(sa => {
            const m = makeStorageArea(sa);
            this.gStorage.add(m); this.pickables.push(m);
        });
        // vessels
        data.vessels.forEach((v) => this.importVessel(v));
        // containers
        data.containers.forEach(c => {
            const m = makeContainer(c);
            this.gContainers.add(m); this.pickables.push(m);
        });
        // resources
        data.resources.forEach(r => {
            const m = makePhysicalResource(r);
            this.gResources.add(m); this.pickables.push(m);
        });

        // auto-frame
        const box = new THREE.Box3();
        this.pickables.forEach(o => box.expandByObject(o));
        if (!box.isEmpty()) {
            const size = new THREE.Vector3(), center = new THREE.Vector3();
            box.getSize(size); box.getCenter(center);
            const maxSize = Math.max(size.x, size.y, size.z);
            const distance = maxSize * 1.5 / Math.tan((this.camera.fov * Math.PI) / 360);
            const dir = new THREE.Vector3(1,1,1).normalize();
            this.controls.target.copy(center);
            this.camera.position.copy(center.clone().add(dir.multiplyScalar(distance)));
            this.camera.near = Math.max(0.1, maxSize / 1000);
            this.camera.far  = Math.max(2000, distance * 10);
            this.camera.updateProjectionMatrix();
        }
    }





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
        // dispose scene
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



    private async importVessel(v: VesselDto) {
        // 1) placeholder
        const ph = makeVesselPlaceholder(v);
        this.gVessels.add(ph);
        this.pickables.push(ph);

        try {
            // 2) carrega GLB via makeVesselNode (usa o loader utilitário)
            const node = await makeVesselNode(v, ASSETS_MODELS.vessels.boat,null /*, scaleMeters? */);

            // 3) copia pose/userData do placeholder
            node.position.copy(ph.position);
            node.rotation.copy(ph.rotation);
            node.userData = ph.userData;

            // 4) entra na cena e nos pickables
            this.gVessels.add(node);
            this.pickables.push(node);

            // 5) remove e liberta o placeholder
            this.gVessels.remove(ph);
            (ph.geometry as any)?.dispose?.();
            const pm = ph.material as THREE.Material | THREE.Material[] | undefined;
            if (Array.isArray(pm)) pm.forEach(m => (m as any)?.dispose?.());
            else (pm as any)?.dispose?.();

        } catch (e) {
            console.warn("Falha a carregar modelo do navio:", e);
            // mantém o placeholder para não “desaparecer”
        }
    }


}
