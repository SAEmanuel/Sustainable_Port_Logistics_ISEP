// src/features/viewer3d/scene/objects/Worker.ts
import * as THREE from "three";
import { loadGLB } from "../utils/loader";
import { ASSETS_MODELS } from "../utils/assets";

export type WorkerOpts = {
    heightM?: number;   // altura dos "olhos"
    bodyH?: number;     // altura do corpo alvo (modelo/placeholder)
    bodyR?: number;     // raio do placeholder (capsule)
    yBase?: number;     // piso (offset do chão)
    tint?: number;      // cor do placeholder
    hideHead?: boolean; // esconder cabeça em 1ª pessoa para não “cortar” a câmara
};

const DEF: Required<WorkerOpts> = {
    heightM: 1.7,
    bodyH: 1.7,
    bodyR: 0.32,
    yBase: 0.03,
    tint: 0xcccccc,
    hideHead: true,
};

function makePlaceholder(h: number, r: number, yBase: number, tint: number) {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: tint, metalness: 0.1, roughness: 0.9 });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(h - 2 * r, 0.2), 6, 12), mat);
    body.position.y = yBase + h / 2;
    body.castShadow = body.receiveShadow = true;
    g.add(body);
    return g;
}

export class WorkerAvatar {
    root = new THREE.Group();          // mover o boneco (transform raiz)
    model: THREE.Object3D | null = null;
    camAnchor = new THREE.Object3D();  // onde a câmara 1ª pessoa encaixa
    heightM: number;
    yBase: number;
    private _hideHead: boolean = true; // <-- inicialização para satisfazer TS

    constructor(opts: WorkerOpts = {}) {
        const O = { ...DEF, ...opts };
        this.heightM = O.heightM;
        this.yBase = O.yBase;
        this._hideHead = O.hideHead;

        this.root.name = "WorkerAvatar";

        // placeholder imediato
        const ph = makePlaceholder(O.bodyH, O.bodyR, O.yBase, O.tint);
        ph.name = "Worker:placeholder";
        this.root.add(ph);

        // âncora dos “olhos” (ligeiramente abaixo do topo para ver corpo ao olhar para baixo)
        this.camAnchor.position.set(0, O.yBase + O.heightM * 0.93, 0);
        this.root.add(this.camAnchor);

        // carregar modelo GLB e substituir placeholder
        (async () => {
            try {
                // usa a chave correta do assets
                const raw = await loadGLB(ASSETS_MODELS.props.worker);

                // preparar materiais / sRGB
                raw.traverse((o: any) => {
                    if (o.isMesh) {
                        o.castShadow = o.receiveShadow = true;
                        const m = o.material;
                        if (Array.isArray(m)) m.forEach(mm => { if (mm?.map) mm.map.colorSpace = THREE.SRGBColorSpace; });
                        else if (m?.map) m.map.colorSpace = THREE.SRGBColorSpace;
                    }
                });

                // normalizar: base em y=0 e escala para altura alvo
                const box = new THREE.Box3().setFromObject(raw);
                const size = box.getSize(new THREE.Vector3());
                const center = box.getCenter(new THREE.Vector3());

                // colocar base do modelo em 0
                raw.position.sub(new THREE.Vector3(center.x, box.min.y, center.z));

                // escalar para altura alvo
                const s = O.bodyH / Math.max(size.y, 1e-6);
                raw.scale.setScalar(s);

                // garantir novamente base = 0 e subir para piso
                const box2 = new THREE.Box3().setFromObject(raw);
                raw.position.y -= box2.min.y;
                raw.position.y += O.yBase;

                // opcional: esconder cabeça para 1ª pessoa
                if (this._hideHead) {
                    const headNames = ["Head", "head", "Cabeça", "mixamorigHead", "HeadTop_End"];
                    raw.traverse((o: any) => {
                        if (o.isMesh && headNames.some(n => (o.name || "").includes(n))) {
                            o.visible = false;
                        }
                    });
                }

                this.model = raw;
                this.root.remove(ph);
                this.root.add(raw);
            } catch (e) {
                console.warn("Worker GLB failed; keeping placeholder", e);
            }
        })();
    }

    /** ponto para anexar a câmara 1ª pessoa */
    getCameraAnchor(): THREE.Object3D {
        return this.camAnchor;
    }

    /** move em X/Z mantendo os pés no solo */
    setXZ(x: number, z: number) {
        this.root.position.set(x, this.yBase, z);
    }
}
