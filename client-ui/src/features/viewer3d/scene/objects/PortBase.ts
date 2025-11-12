// src/features/viewer3d/scene/objects/PortBase.ts
import * as THREE from "three";

export type PortBaseOptions = {
    /** tamanho do cais (metros) */
    width: number;     // X (ex: 1200)
    depth: number;     // Z (ex: 1200)
    /** margem de água em volta (ex: 100) */
    waterMargin: number;
    /** largura das vias internas (ex: 12) */
    roadWidth: number;
    /** snap da grelha (ex: 10 m) */
    gridStep: number;

    /** cota do topo do cais (y) */
    slabHeight?: number;        // default 0
    /** espessura do bloco do cais */
    slabThickness?: number;     // default 10
    /** distância topo do cais → superfície da água */
    waterGap?: number;          // default 8
    /** espessura do volume de água */
    waterThickness?: number;    // default 40

    /** overlays A/B/C visíveis */
    showZones?: boolean;        // default true
    /** grelha técnica visível */
    showGrid?: boolean;         // default true
    /** mostrar traços brancos nas estradas (se não houver textura) */
    showRoadDashes?: boolean;

    /** texturas opcionais (sRGB) */
    textures?: {
        water?: string;           // textura visível da água
        paving?: string;          // textura do piso do cais
        road_vertical?: string;   // textura das vias verticais
        road_horizontal?: string; // textura das vias horizontais
    };

    /** tamanho (m) de um tile do piso; menor => mais repetições (default 24) */
    pavingTileMeters?: number;
};

export type ZoneBounds = {
    center: THREE.Vector3;
    rect: { minX: number; maxX: number; minZ: number; maxZ: number };
    size: { w: number; d: number };
};

export type PortLayout = {
    zoneA: ZoneBounds; // Storage Areas
    zoneB: ZoneBounds; // Containers / PR soltos
    zoneC: ZoneBounds; // Vessels / Docks junto ao cais
    roads: {
        north: ZoneBounds; south: ZoneBounds; east: ZoneBounds; west: ZoneBounds;
        crossX: ZoneBounds; crossZ: ZoneBounds;
    };
    /** linha do cais (borda norte do bloco do cais) */
    quayEdgeZ: number;
};

// helpers
function makeEdgeBox(w: number, d: number, h: number, color: number) {
    const g = new THREE.BoxGeometry(w, h, d);
    const m = new THREE.MeshStandardMaterial({ color, metalness: 0.15, roughness: 0.85 });
    const mesh = new THREE.Mesh(g, m);
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    return mesh;
}

function mkBounds(cx: number, cz: number, w: number, d: number): ZoneBounds {
    return {
        center: new THREE.Vector3(cx, 0, cz),
        rect: { minX: cx - w / 2, maxX: cx + w / 2, minZ: cz - d / 2, maxZ: cz + d / 2 },
        size: { w, d },
    };
}

/** cria bloco do cais + volume de água + zonas/estradas/grelha */
export function makePortBase(opts: PortBaseOptions): { group: THREE.Group; layout: PortLayout } {
    const {
        width: W, depth: D, waterMargin: M, roadWidth: RW, gridStep,
        slabHeight = 0, slabThickness = 10,
        waterGap = 8, waterThickness = 40,
        showZones = true, showGrid = true,
        textures, pavingTileMeters = 24,
    } = opts;

    const G = new THREE.Group();
    G.name = "PortBase";

    const halfW = W / 2, halfD = D / 2;

    // ---------- loader + utils ----------
    const loader = new THREE.TextureLoader();

    const setupMap = (tex: THREE.Texture | null, repeatX: number, repeatZ: number): THREE.Texture | null => {
        if (!tex) return null;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(repeatX, repeatZ);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 12;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = true;
        return tex;
    };

    // ---------- ÁGUA ----------
    const waterW = W + M ;
    const waterD = D + M ;
    const waterTopY = slabHeight - waterGap;
    const waterCenterY = waterTopY - waterThickness / 2;

    const waterTex: THREE.Texture | null = textures?.water ? loader.load(textures.water) : null;
    setupMap(waterTex, Math.max(1, waterW / 200), Math.max(1, waterD / 200));

    const waterBox = makeEdgeBox(waterW, waterD, waterThickness, 0xffffff);
    waterBox.position.set(0, waterCenterY, 0);
    const waterMat = waterBox.material as THREE.MeshStandardMaterial;
    waterMat.color.set(waterTex ? 0xffffff : 0x0b44ff);
    waterMat.map = waterTex ?? null;
    waterMat.metalness = 0.05;
    waterMat.roughness = 0.35;
    waterBox.renderOrder = 0;
    G.add(waterBox);

    // ---------- CAIS ----------
    const slabCenterY = slabHeight - slabThickness / 2;

    const pavingTex: THREE.Texture | null = textures?.paving ? loader.load(textures.paving) : null;
    setupMap(pavingTex, Math.max(1, W / pavingTileMeters), Math.max(1, D / pavingTileMeters));

    const slabBox = makeEdgeBox(W, D, slabThickness, 0xd9dde6);
    slabBox.position.set(0, slabCenterY, 0);
    const slabMat = slabBox.material as THREE.MeshStandardMaterial;
    slabMat.color.set(pavingTex ? 0xffffff : 0xd9dde6);
    slabMat.map = pavingTex ?? null;
    slabMat.metalness = 0;
    slabMat.roughness = 0.95;
    slabBox.renderOrder = 1;
    G.add(slabBox);

    // ---------- CORDÕES ----------
    const curbT = 1.2, curbW = 1.2, edgeTopY = slabHeight + curbT / 2, edgeColor = 0x2e2f33;
    const north = makeEdgeBox(W + curbW * 2, curbW, curbT, edgeColor); north.position.set(0, edgeTopY, (D / 2) + curbW / 2);
    const south = makeEdgeBox(W + curbW * 2, curbW, curbT, edgeColor); south.position.set(0, edgeTopY, -(D / 2) - curbW / 2);
    const east  = makeEdgeBox(curbW, D + curbW * 2, curbT, edgeColor); east.position.set((W / 2) + curbW / 2, edgeTopY, 0);
    const west  = makeEdgeBox(curbW, D + curbW * 2, curbT, edgeColor); west.position.set(-(W / 2) - curbW / 2, edgeTopY, 0);
    [north, south, east, west].forEach(b => (b.renderOrder = 2));
    G.add(north, south, east, west);

    // ---------- ZONAS (overlays) ----------
    const quadW = W / 2, quadD = D / 2;
    if (showZones) {
        const mkOverlay = (w: number, d: number, color: number, x: number, z: number) => {
            const g = new THREE.PlaneGeometry(w, d);
            const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({
                color, transparent: true, opacity: 0.2, metalness: 0, roughness: 1,
            }));
            m.rotation.x = -Math.PI / 2;
            m.position.set(x, slabHeight + 0.8, z);
            (m.material as THREE.MeshStandardMaterial).depthWrite = true;
            m.renderOrder = 3;
            G.add(m);
        };
        // C (Z+)
        mkOverlay(W, quadD, 0x8e5af7, 0, +quadD / 2);
        // A (X+, Z-)
        mkOverlay(quadW, quadD, 0xffd44d, +quadW / 2, -quadD / 2);
        // B (X-, Z-)
        mkOverlay(quadW, quadD, 0x5ad4ff, -quadW / 2, -quadD / 2);
    }

    // ---------- ESTRADAS ----------
    const roadColor = 0xbfc3c9;
    const roadY = slabHeight + 0.03;

    // texturas base
    const baseRoadTexV: THREE.Texture | null = textures?.road_vertical ? loader.load(textures.road_vertical) : null;
    const baseRoadTexH: THREE.Texture | null = textures?.road_horizontal ? loader.load(textures.road_horizontal) : null;

    // helpers de estrada
    function setupTexClone(base: THREE.Texture | null, sizeX: number, sizeZ: number) {
        if (!base) return null;
        const t = base.clone();
        t.wrapS = THREE.RepeatWrapping;
        t.wrapT = THREE.RepeatWrapping;
        const tileLen = 80; // controla frequência de repetição na direção do comprimento
        const repU = Math.max(1, sizeX / tileLen);
        const repV = Math.max(1, sizeZ / tileLen);
        if (sizeX >= sizeZ) t.repeat.set(repU, 1); else t.repeat.set(1, repV);
        t.colorSpace = THREE.SRGBColorSpace;
        t.minFilter = THREE.LinearMipmapLinearFilter;
        t.magFilter = THREE.LinearFilter;
        t.generateMipmaps = true;
        t.anisotropy = 16;
        t.needsUpdate = true;
        return t;
    }

    function makeMat(tex: THREE.Texture | null) {
        return new THREE.MeshStandardMaterial({
            color: tex ? 0xffffff : roadColor,
            map: tex ?? null,
            metalness: 0,
            roughness: 1,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -1,
        });
    }


    const H_LIFT = 0.0006;

    function addHorizontalFull(zLine: number) {
        const geom = new THREE.PlaneGeometry(W, RW);
        const tex  = setupTexClone(baseRoadTexH, W, RW);
        const mat  = makeMat(tex);
        mat.polygonOffset = true;
        mat.polygonOffsetFactor = -2;  
        mat.polygonOffsetUnits  = -2;

        const mesh = new THREE.Mesh(geom, mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(0, roadY + H_LIFT, zLine); 
        mesh.receiveShadow = true;
        mesh.renderOrder = 3.0; 
        G.add(mesh);
    }

    function addHorizontalSpan(xMin: number, xMax: number, zLine: number) {
        const wspan = Math.max(0, xMax - xMin);
        if (wspan <= 0.01) return;

        const geom = new THREE.PlaneGeometry(wspan, RW);
        const tex  = setupTexClone(baseRoadTexH, wspan, RW);
        const mat  = makeMat(tex);
        mat.polygonOffset = true;
        mat.polygonOffsetFactor = -2;
        mat.polygonOffsetUnits  = -2;

        const mesh = new THREE.Mesh(geom, mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set((xMin + xMax) / 2, roadY + H_LIFT, zLine); 
        mesh.receiveShadow = true;
        mesh.renderOrder = 3.0; 
        G.add(mesh);
    }

    function addVertical(xCut: number, zMin: number, zMax: number) {
        const len = Math.max(0, zMax - zMin);
        if (len <= 0.01) return;

        const geom = new THREE.PlaneGeometry(RW, len);
        const tex  = setupTexClone(baseRoadTexV, RW, len);
        const mat  = makeMat(tex);
        mat.polygonOffset = true;
        mat.polygonOffsetFactor = -1; 
        mat.polygonOffsetUnits  = -1;

        const mesh = new THREE.Mesh(geom, mat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(xCut, roadY, (zMin + zMax) / 2);
        mesh.receiveShadow = true;
        mesh.renderOrder = 2.0; 
        G.add(mesh);
    }


    // ===== Zona roxa (C) = metade superior, centrada em X =====
    const zoneMinX = -W / 4, zoneMaxX = +W / 4;
    const zoneMinZ = 0,      zoneMaxZ = +D / 2;

    const zoneCX = (zoneMinX + zoneMaxX) / 2;
    const zoneCZ = (zoneMinZ + zoneMaxZ) / 2;
    
    const zoneCZ2 = (zoneCZ + zoneMinZ) / 2;

    // horizontais contínuas
    addHorizontalFull(zoneMaxZ -5); // topo da roxa
    addHorizontalFull(zoneCZ);   // meio da roxa
    addHorizontalFull(zoneMinZ); // base da roxa
    
    addHorizontalSpan(zoneMinX, zoneMaxX, zoneCZ2);
    
    const abCZ = -quadD / 2;     // == -D/4
    addHorizontalFull(abCZ);
    // verticais confinadas à zona roxa (inclui a central)
    addVertical(zoneMinX, zoneMinZ, zoneMaxZ); // esquerda
    addVertical(zoneCX,   -halfD,   +halfD);   // meio: TODO o cais
    addVertical(zoneMaxX, zoneMinZ, zoneMaxZ); // direita

    // ---------- GRELHA técnica (opcional) ----------
    if (showGrid) {
        const grid = new THREE.GridHelper(Math.max(W, D), Math.max(W, D) / gridStep);
        (grid.material as THREE.Material).depthWrite = false;
        grid.position.y = slabHeight + 0.01;
        grid.renderOrder = 1.5;
        G.add(grid);
    }

    // ---------- LAYOUT ----------
    const layout: PortLayout = {
        zoneA: mkBounds(+quadW / 2, -quadD / 2, quadW, quadD),
        zoneB: mkBounds(-quadW / 2, -quadD / 2, quadW, quadD),
        zoneC: mkBounds(0, +quadD / 2, W, quadD),
        roads: {
            north: mkBounds(0, +halfD - RW / 2, W, RW),
            south: mkBounds(0, -halfD + RW / 2, W, RW),
            east:  mkBounds(+halfW - RW / 2, 0, RW, D),
            west:  mkBounds(-halfW + RW / 2, 0, RW, D),
            crossX: mkBounds(0, 0, W, RW),
            crossZ: mkBounds(0, 0, RW, D),
        },
        quayEdgeZ: +halfD,
    };

    return { group: G, layout };
}
