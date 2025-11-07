// src/features/viewer3d/scene/assets.ts
const BASE = import.meta.env.BASE_URL || "/"; // funciona em subpath

const MODELS = `${BASE}3Dmodels`;
const TEX    = `${BASE}3Dtextures`;

export const ASSETS_MODELS = {
    vessels: {
        vessel: `${MODELS}/ships/Boat.glb`,
        vesseltug: `${MODELS}/physicalResources/vessels/tugBoat.glb`,
        cruise: `${MODELS}/ships/Cruise_ship.glb`,
        cargo: `${MODELS}/ships/ship-cargo-a.glb`,
        ship_ocean: `${MODELS}/ships/ship-ocean-liner.glb`,
        containerShip: `${MODELS}/ships/Container_Ship.glb`,
    },
    containers: {
        container: `${MODELS}/containers/Container.glb`,
        container2: `${MODELS}/containers/Container2.glb`,
        container3: `${MODELS}/containers/Container3.glb`,
    },
    cranes: {
        mcCrane: `${MODELS}/physicalResources/cranes/MCrane.glb`,
        stsCrane: `${MODELS}/physicalResources/cranes/STSCrane.glb`,
        ygcCrane: `${MODELS}/physicalResources/cranes/YGCrane.glb`,
        bigCrane: `${MODELS}/physicalResources/cranes/BigCraneUnloading.glb`,
    },
    vehicles: {
        truck: `${MODELS}/physicalResources/vehicles/truck.glb`,
        sCarrier: `${MODELS}/physicalResources/vehicles/SCarrier.glb`,
        forklift: `${MODELS}/physicalResources/vehicles/forklift.glb`,
    },
    storageArea:{
        wareHouser: `${MODELS}/storageAreas/WareHouse.glb`,
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
