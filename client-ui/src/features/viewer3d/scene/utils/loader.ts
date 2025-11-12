import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import * as THREE from "three";

let sharedLoader: GLTFLoader | null = null;

export function getGLTFLoader(): GLTFLoader {
    if (sharedLoader) return sharedLoader;
    const loader = new GLTFLoader();
    const draco = new DRACOLoader();
    draco.setDecoderPath("/draco/");
    loader.setDRACOLoader(draco);
    sharedLoader = loader;
    return loader;
}

const __glbCache = new Map<string, THREE.Object3D>();

export async function loadGLB(url: string): Promise<THREE.Object3D> {
    if (__glbCache.has(url)) return __glbCache.get(url)!.clone(true);

    const loader = getGLTFLoader();
    const gltf = await loader.loadAsync(url);
    const root = gltf.scene || gltf.scenes?.[0];
    if (!root) throw new Error(`GLB sem scene: ${url}`);

    // normalizar materiais e flags
    root.traverse((o: any) => {
        if (o.isMesh) {
            o.castShadow = true;
            o.receiveShadow = true;
            o.frustumCulled = true;
            const m = o.material;
            if (Array.isArray(m)) m.forEach(mm => { if ("map" in mm && mm.map) mm.map.colorSpace = THREE.SRGBColorSpace; });
            else if (m && "map" in m && m.map) m.map.colorSpace = THREE.SRGBColorSpace;
        }
    });

    __glbCache.set(url, root);     
    return root.clone(true);       
}

