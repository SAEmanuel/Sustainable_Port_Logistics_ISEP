// src/features/viewer3d/scene/assets.ts
const BASE = import.meta.env.BASE_URL || "/"; // funciona em subpath

const MODELS = `${BASE}3Dmodels`;
const TEX    = `${BASE}3Dtextures`;

export const ASSETS_MODELS = {
    vessels: {
        vessel: `${MODELS}/ships/ship-cargo-c.glb`,
        boat: `${MODELS}/ships/Boat.glb`,
    },
    containers: {},
    cranes: {},
    vehicles: {
        van:          `${MODELS}/vehicles/van.glb`,
        deliveryFlat: `${MODELS}/vehicles/delivery-flat.glb`,
    },
    props: {},
} as const;

export const ASSETS_TEXTURES = {
    vessels: {
        containerShip: `${TEX}/ships/colormap.png`,
    },
    containers: {},
    cranes: {},
    vehicles: {},
    props: {},
} as const;
