import * as THREE from "three";

export type Rect = { minX: number; maxX: number; minZ: number; maxZ: number };
export type Cell = Rect & { center: THREE.Vector3; r: number; c: number };
export type Grid = { rect: Rect; rows: number; cols: number; cells: Cell[] };

export type GridsResult = {
    C: Record<`C.${1|2|3|4|5|6|7|8|9|10}`, Grid>;
    A: { "A.1": Grid; "A.2": Grid };
    B: { "B.1": Grid; "B.2": Grid };
};

/** Cria uma grelha rectangular com passo “step” (aproximado). */
function makeGrid(rect: Rect, step: number): Grid {
    const width = rect.maxX - rect.minX;
    const depth = rect.maxZ - rect.minZ;

    const cols = Math.max(1, Math.floor(width / step));
    const rows = Math.max(1, Math.floor(depth / step));

    const cellW = width / cols;
    const cellD = depth / rows;

    const cells: Cell[] = [];
    for (let r = 0; r < rows; r++) {
        const z0 = rect.maxZ - (r + 1) * cellD;
        const z1 = z0 + cellD;
        for (let c = 0; c < cols; c++) {
            const x0 = rect.minX + c * cellW;
            const x1 = x0 + cellW;
            cells.push({
                minX: x0, maxX: x1, minZ: z0, maxZ: z1,
                r, c,
                center: new THREE.Vector3((x0 + x1) / 2, 0, (z0 + z1) / 2),
            });
        }
    }
    return { rect, rows, cols, cells };
}

/**
 * Grelhas das zonas:
 *  - Zona C (roxa) ocupa z ∈ [0, +D/2] e tem 4 colunas (x): [-W/2,-W/4], [-W/4,0], [0,+W/4], [+W/4,+W/2]
 *    e 3 faixas (z): [D/4,D/2], [D/8,D/4], [0,D/8].
 *
 *    Mapeamento exacto (do teu desenho):
 *      Topo (z: D/4→D/2):      C.7 | C.6 | C.5 | C.8
 *      Meio (z: D/8→D/4):      C.9 | C.4 | C.3 | C.10
 *      Base fina (z: 0→D/8):         C.2 | C.1
 *      (Sem células nas colunas mais à esquerda/direita nesta faixa.)
 *
 *  - Zona A (amarela): x ∈ [0, +W/2], z ∈ [-D/2, 0], dividida em duas bandas: A.1 (topo), A.2 (base)
 *  - Zona B (verde/azul): x ∈ [-W/2, 0], z ∈ [-D/2, 0], dividida em duas bandas: B.1 (topo), B.2 (base)
 */
export function computePortGrids(W: number, D: number, gridStep: number): GridsResult {
    // Cortes em X (4 colunas)
    const x0 = -W / 2, x1 = -W / 4, x2 = 0, x3 = +W / 4, x4 = +W / 2;
    // Cortes em Z (3 faixas para C)
    const z0 = 0, z1 = D / 8, z2 = D / 4, z3 = D / 2;

    // ---------- ZONA C ----------
    const C: GridsResult["C"] = {
        // Topo: C.7 | C.6 | C.5 | C.8
        "C.7":  makeGrid({ minX: x0, maxX: x1, minZ: z2, maxZ: z3 }, gridStep),
        "C.6":  makeGrid({ minX: x1, maxX: x2, minZ: z2, maxZ: z3 }, gridStep),
        "C.5":  makeGrid({ minX: x2, maxX: x3, minZ: z2, maxZ: z3 }, gridStep),
        "C.8":  makeGrid({ minX: x3, maxX: x4, minZ: z2, maxZ: z3 }, gridStep),

        // Meio: C.9 | C.4 | C.3 | C.10
        "C.9":  makeGrid({ minX: x0, maxX: x1, minZ: z0, maxZ: z2 }, gridStep),
        "C.4":  makeGrid({ minX: x1, maxX: x2, minZ: z1, maxZ: z2 }, gridStep),
        "C.3":  makeGrid({ minX: x2, maxX: x3, minZ: z1, maxZ: z2 }, gridStep),
        "C.10": makeGrid({ minX: x3, maxX: x4, minZ: z0, maxZ: z2 }, gridStep),

        // Base fina (só colunas centrais):      C.2 | C.1
        "C.2":  makeGrid({ minX: x1, maxX: x2, minZ: z0, maxZ: z1 }, gridStep),
        "C.1":  makeGrid({ minX: x2, maxX: x3, minZ: z0, maxZ: z1 }, gridStep),
    };

    // ---------- ZONA A ----------
    const zAB = -D / 4; // linha intermédia da metade sul
    const A1: Rect = { minX: 0,   maxX: +W / 2, minZ: zAB,  maxZ: 0    }; // topo
    const A2: Rect = { minX: 0,   maxX: +W / 2, minZ: -D/2, maxZ: zAB  }; // base
    const A = { "A.1": makeGrid(A1, gridStep), "A.2": makeGrid(A2, gridStep) };

    // ---------- ZONA B ----------
    const B1: Rect = { minX: -W/2, maxX: 0,     minZ: zAB,  maxZ: 0    }; // topo
    const B2: Rect = { minX: -W/2, maxX: 0,     minZ: -D/2, maxZ: zAB  }; // base
    const B = { "B.1": makeGrid(B1, gridStep), "B.2": makeGrid(B2, gridStep) };

    return { C, A, B };
}

/* ================================
   DEBUG OVERLAY (opcional)
================================ */
export function drawPortGridsDebug(scene: THREE.Scene, grids: GridsResult, y = 0.06) {
    const old = scene.getObjectByName("__GridsDebug");
    if (old) scene.remove(old);

    const G = new THREE.Group(); G.name = "__GridsDebug";
    const Cc = 0x8e5af7, Ac = 0xffd44d, Bc = 0x5ad4ff;

    // C (labels maiores)
    (Object.keys(grids.C) as (keyof typeof grids.C)[]).forEach((k) => {
        const g = grids.C[k];
        G.add(makeRectFill(g.rect, y, Cc, 0.08));
        G.add(makeRectOutline(g.rect, y + 0.0002, 0x202020));
        G.add(labelAt(k, rectCenter(g.rect, y + 0.02), 36)); // tamanho ↑
        g.cells.forEach(cell => G.add(makeRectOutline(cell, y + 0.0001, 0x2b2b2b)));
    });

    // A
    (["A.1","A.2"] as const).forEach((k) => {
        const g = grids.A[k];
        G.add(makeRectFill(g.rect, y, Ac, 0.06));
        G.add(makeRectOutline(g.rect, y + 0.0002, 0x202020));
        G.add(labelAt(k, rectCenter(g.rect, y + 0.02), 34));
        g.cells.forEach(cell => G.add(makeRectOutline(cell, y + 0.0001, 0x2b2b2b)));
    });

    // B
    (["B.1","B.2"] as const).forEach((k) => {
        const g = grids.B[k];
        G.add(makeRectFill(g.rect, y, Bc, 0.06));
        G.add(makeRectOutline(g.rect, y + 0.0002, 0x202020));
        G.add(labelAt(k, rectCenter(g.rect, y + 0.02), 34));
        g.cells.forEach(cell => G.add(makeRectOutline(cell, y + 0.0001, 0x2b2b2b)));
    });

    scene.add(G);
    return G;
}

/* ---- helpers visuais ---- */
function rectCenter(r: Rect, y: number) {
    return new THREE.Vector3((r.minX + r.maxX)/2, y, (r.minZ + r.maxZ)/2);
}
function makeRectOutline(r: Rect, y: number, color = 0x3a3a3a) {
    const geom = new THREE.BufferGeometry();
    const verts = new Float32Array([
        r.minX, y, r.minZ,  r.maxX, y, r.minZ,
        r.maxX, y, r.minZ,  r.maxX, y, r.maxZ,
        r.maxX, y, r.maxZ,  r.minX, y, r.maxZ,
        r.minX, y, r.maxZ,  r.minX, y, r.minZ,
    ]);
    geom.setAttribute("position", new THREE.BufferAttribute(verts, 3));
    return new THREE.LineSegments(geom, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9 }));
}
function makeRectFill(r: Rect, y: number, color = 0x00ff00, alpha = 0.12) {
    const w = r.maxX - r.minX, d = r.maxZ - r.minZ;
    const m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, d),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: alpha, depthWrite: false })
    );
    m.rotation.x = -Math.PI / 2;
    m.position.set((r.minX + r.maxX)/2, y, (r.minZ + r.maxZ)/2);
    m.renderOrder = 10;
    return m;
}
function labelAt(text: string, pos: THREE.Vector3, px = 36) {
    const size = 512; const canvas = document.createElement("canvas");
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0,0,size,size);
    ctx.fillStyle = "rgba(0,0,0,0)";
    ctx.fillRect(0,0,size,size);
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `bold ${px * 2}px Poppins, Arial, sans-serif`;
    ctx.fillText(text, size/2, size/2);

    const tex = new THREE.CanvasTexture(canvas);
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
    const s = px; // escala aproximada em metros
    spr.scale.set(s, s, 1);
    spr.position.copy(pos);
    return spr;
}
