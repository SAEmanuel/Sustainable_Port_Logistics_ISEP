// src/features/viewer3d/scene/objects/Bridges.ts
import * as THREE from "three";
import type { PortLayout } from "./PortBase";
import { ASSETS_MODELS, ASSETS_TEXTURES } from "../utils/assets";
import { loadGLBNormalized } from "../utils/loadGLBNormalized";

export type BridgesOpts = {
    deckWidth?: number;     // largura útil da faixa (X)
    deckLength?: number;    // comprimento TOTAL da ponte (Z)
    deckHeight?: number;    // espessura do deck
    separationX?: number;   // distância entre as duas pontes (centros em X)
    baseY?: number;         // Y do topo do deck (para alinhar com a rua)
    insetLeft?: number;     // afastamento da ponta ESQUERDA à borda do cais
    insetRight?: number;    // afastamento da ponta DIREITA à borda do cais
};

/* ---------- Materiais ---------- */

const MAT_STEEL = new THREE.MeshStandardMaterial({
    color: 0xc6322b,
    metalness: 0.4,
    roughness: 0.6,
});

const MAT_PIER = new THREE.MeshStandardMaterial({
    color: 0xb4bac8,
    metalness: 0.05,
    roughness: 0.95,
});

const texLoader = new THREE.TextureLoader();
let DECK_MAT: THREE.MeshStandardMaterial | null = null;

/** Material do deck com APENAS o color map corrugado. */
function getDeckMaterial(deckWidth: number, deckLength: number): THREE.MeshStandardMaterial {
    if (DECK_MAT) return DECK_MAT;

    const corr = ASSETS_TEXTURES.containers.corrugated;
    const colorMap = texLoader.load(corr.color);

    // tiling aproximado em função do tamanho da ponte
    const tile = 4; // “tamanho” do tile em metros
    const repX = Math.max(1, deckLength / tile); // ao longo de Z
    const repY = Math.max(1, deckWidth / tile);  // ao longo de X

    colorMap.wrapS = THREE.RepeatWrapping;
    colorMap.wrapT = THREE.RepeatWrapping;
    colorMap.repeat.set(repX, repY);
    colorMap.anisotropy = 8;
    colorMap.minFilter = THREE.LinearMipmapLinearFilter;
    colorMap.magFilter = THREE.LinearFilter;
    colorMap.generateMipmaps = true;
    colorMap.colorSpace = THREE.SRGBColorSpace;

    DECK_MAT = new THREE.MeshStandardMaterial({
        map: colorMap,
        metalness: 0.2,
        roughness: 0.7,
    });

    return DECK_MAT;
}

/**
 * Cria um modelo de ponte simples (deck + guarda + pórticos + pilares),
 * com origem no CENTRO DO TOPO do deck (0,0,0).
 */
function makeBridgeModel(deckWidth: number, deckLength: number, deckHeight: number): THREE.Group {
    const g = new THREE.Group();
    g.name = "Bridge:model";

    /* ---- Deck ---- */
    const deckGeom = new THREE.BoxGeometry(deckWidth, deckHeight, deckLength);
    const deck = new THREE.Mesh(deckGeom, getDeckMaterial(deckWidth, deckLength));
    // topo do deck a y=0  → centro em -deckHeight/2
    deck.position.set(0, -deckHeight / 2, 0);
    deck.castShadow = true;
    deck.receiveShadow = true;
    g.add(deck);

    /* ---- Guards (rails) ---- */
    const railH = 1.1;
    const railT = 0.12;
    const innerW = deckWidth * 0.96;
    const sideOffset = innerW / 2;

    const railGeom = new THREE.BoxGeometry(railT, railH, deckLength);
    const railLeft = new THREE.Mesh(railGeom, MAT_STEEL);
    railLeft.position.set(-sideOffset, railH / 2, 0);
    const railRight = railLeft.clone();
    railRight.position.x = +sideOffset;
    railLeft.castShadow = railRight.castShadow = true;
    railLeft.receiveShadow = railRight.receiveShadow = true;
    g.add(railLeft, railRight);

    /* ---- Pórticos vermelhos (tipo “treliça”) ---- */
    const frameH = 3.4;
    const frameT = 0.12;
    const frameW = innerW;

    const nFrames = Math.max(3, Math.round(deckLength / 10)); // ~10m entre pórticos
    for (let i = 0; i < nFrames; i++) {
        const t = i / (nFrames - 1);
        const z = -deckLength / 2 + t * deckLength;

        // travessa superior
        const topGeom = new THREE.BoxGeometry(frameW, frameT, frameT);
        const topBar = new THREE.Mesh(topGeom, MAT_STEEL);
        topBar.position.set(0, frameH, z);

        // montantes laterais
        const postGeom = new THREE.BoxGeometry(frameT, frameH, frameT);
        const postL = new THREE.Mesh(postGeom, MAT_STEEL);
        const postR = postL.clone();
        postL.position.set(-frameW / 2, frameH / 2, z);
        postR.position.set(+frameW / 2, frameH / 2, z);

        [topBar, postL, postR].forEach(m => {
            m.castShadow = true;
            m.receiveShadow = true;
        });

        g.add(topBar, postL, postR);

        // diagonais entre este pórtico e o próximo (menos no último)
        if (i < nFrames - 1) {
            const zNext = -deckLength / 2 + ((i + 1) / (nFrames - 1)) * deckLength;
            const dz = zNext - z;
            const diagLen = Math.sqrt(dz * dz + frameH * frameH);

            const diagGeom = new THREE.BoxGeometry(frameT, diagLen, frameT);

            const diagL = new THREE.Mesh(diagGeom, MAT_STEEL);
            const diagR = new THREE.Mesh(diagGeom, MAT_STEEL);

            const midZ = (z + zNext) / 2;
            const midY = frameH / 2;

            const angle = Math.atan2(dz, frameH); // inclinação no plano YZ

            diagL.position.set(-frameW / 2, midY, midZ);
            diagR.position.set(+frameW / 2, midY, midZ);

            diagL.rotation.x = angle;
            diagR.rotation.x = -angle;

            [diagL, diagR].forEach(m => {
                m.castShadow = true;
                m.receiveShadow = true;
            });

            g.add(diagL, diagR);
        }
    }

    /* ---- Pilares ---- */
    const pierW = deckWidth * 0.7;
    const pierD = deckWidth * 0.5;
    const pierH = 6;
    const baseH = 1.0;

    const pierStep = 18;
    const nPiers = Math.max(2, Math.round(deckLength / pierStep));
    for (let i = 0; i < nPiers; i++) {
        const t = i / (nPiers - 1);
        const z = -deckLength / 2 + t * deckLength;

        const colGeom = new THREE.BoxGeometry(pierW, pierH, pierD);
        const col = new THREE.Mesh(colGeom, MAT_PIER);
        col.position.set(0, -deckHeight - pierH / 2, z);

        const baseGeom = new THREE.BoxGeometry(pierW * 1.25, baseH, pierD * 1.4);
        const base = new THREE.Mesh(baseGeom, MAT_PIER);
        base.position.set(0, -deckHeight - pierH - baseH / 2, z);

        col.castShadow = base.castShadow = true;
        col.receiveShadow = base.receiveShadow = true;

        g.add(col, base);
    }

    return g;
}

/**
 * Cria duas pontes no lado sul (Z negativo), com origem no topo do deck,
 * alinhadas com a rua principal (crossZ) e uma cidade no lado oposto.
 */
export function addBridges(parent: THREE.Group, layout: PortLayout, opts: BridgesOpts = {}) {
    const {
        deckWidth   = 9,
        deckLength  = 230,
        deckHeight  = 2.0,
        separationX = 8,
        baseY       = 0.03,   // topo do deck ao nível da estrada
        insetLeft   = 3.5,
        insetRight  = 2.0,
    } = opts;

    const bridgeGroup = new THREE.Group();
    bridgeGroup.name = "Bridges";
    parent.add(bridgeGroup);

    // Zona sul do cais (Z negativo)
    const southEdgeZ = -layout.quayEdgeZ;   // -D/2
    // rua principal vertical (posição X)
    const mainRoad = layout.roads.crossZ;
    const baseX = mainRoad.center.x;        // normalmente 0

    // modelo base da ponte
    const model = makeBridgeModel(deckWidth, deckLength, deckHeight);

    const makeOne = (isLeft: boolean) => {
        const inset = isLeft ? insetLeft : insetRight;
        const sign = isLeft ? -1 : +1;

        const g = new THREE.Group();
        g.name = isLeft ? "Bridge:left" : "Bridge:right";

        // centro em Z: face junto ao cais fica em southEdgeZ + inset
        const zCenter = (southEdgeZ + inset) - deckLength / 2;
        const xCenter = baseX + sign * (separationX / 2);

        g.position.set(xCenter, baseY, zCenter);

        const core = model.clone(true);
        g.add(core);

        bridgeGroup.add(g);
    };

    makeOne(true);   // esquerda
    makeOne(false);  // direita

    /* ---------- Cidade no fim da ponte (lado oposto ao porto) ---------- */
    (async () => {
        try {
            const baseCity = await loadGLBNormalized(ASSETS_MODELS.extras.RioJaneiro, {
                centerXZ: true,
                baseY0: true,   // põe a base do modelo em y=0 antes de escalar
            });

            // 1) medir cidade original
            const box0 = new THREE.Box3().setFromObject(baseCity);
            const size0 = box0.getSize(new THREE.Vector3());

            // dimensões do porto (para escalar a cidade >> porto)
            const portWidth = layout.zoneC.size.w;        // W
            const portDepth = layout.zoneC.size.d * 2;    // ~D

            const targetWidth  = portWidth * 2.0;         // cidade bem mais larga
            const targetDepth  = portDepth * 2.0;         // e mais profunda

            const scaleFromWidth  = targetWidth  / size0.x;
            const scaleFromDepth  = targetDepth  / size0.z;
            const CITY_SCALE = Math.max(scaleFromWidth, scaleFromDepth);

            baseCity.scale.setScalar(CITY_SCALE);

            baseCity.rotation.y = Math.PI ; 

            // 2) medir cidade já escalada + rodada
            const boxScaled = new THREE.Box3().setFromObject(baseCity);
            const size = boxScaled.getSize(new THREE.Vector3());
            const cityDepth = size.z;

            // fim comum da ponte (lado da cidade)
            const avgInset = (insetLeft + insetRight) / 2;
            const zFarCommon = southEdgeZ + avgInset ;

            // centro da cidade um pouco para além do fim da ponte
            const zCity = zFarCommon - cityDepth * 0.5;

            const cityGroup = new THREE.Group();
            cityGroup.name = "CityCluster";

            // *** apenas UMA cidade, alinhada com a rua principal ***
            const inst = baseCity.clone(true);
            inst.position.set(baseX, 0, zCity); // y provisório = 0
            cityGroup.add(inst);

            // 3) descer o cluster para NÃO flutuar
            const desiredBaseY = -40;
            const clusterBox = new THREE.Box3().setFromObject(cityGroup);
            const deltaY = desiredBaseY - clusterBox.min.y;
            cityGroup.position.y += deltaY;

            bridgeGroup.add(cityGroup);
        } catch (err) {
            console.warn("[Bridges] Falha ao carregar city.glb:", err);
        }
    })();

    return bridgeGroup;
}
