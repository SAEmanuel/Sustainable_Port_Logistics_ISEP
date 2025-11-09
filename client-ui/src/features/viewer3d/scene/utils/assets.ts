// src/features/viewer3d/scene/utils/assets.ts
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
        containerRealistic: `${MODELS}/containers/realistics/Container.glb`,
        container: `${MODELS}/containers/Container.glb`,
        container2: `${MODELS}/containers/Container2.glb`,
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
        extras:{
            
        }
    },
    storageArea: {
        wareHouser: `${MODELS}/storageAreas/building-s.glb`,
    },
    docks: {
        straight: `${MODELS}/Dock.glb`,
    },
    props: {},
} as const;

export const ASSETS_TEXTURES = {
    port: {
        paving: { paving: `${TEX}/paving.jpg` },
        water:  { water: `${TEX}/water.jpg` },
        road: {
            road: `${TEX}/road.jpg`,
            roadhorizontal: `${TEX}/road_horizontal.jpg`,
        },
    },
    vessels: {
        containerShip: `${TEX}/ships/colormap.png`,
    },
    containers: {
        corrugated: {
            color:      `${TEX}/containers/3/CorrugatedSteel002_2K-JPG_Color.jpg`,
            normalGL:   `${TEX}/containers/3/CorrugatedSteel002_2K-JPG_NormalGL.jpg`,
            roughness:  `${TEX}/containers/3/CorrugatedSteel002_2K-JPG_Roughness.jpg`,
            metalness:  `${TEX}/containers/3/CorrugatedSteel002_2K-JPG_Metalness.jpg`,
            ao:         `${TEX}/containers/3/CorrugatedSteel002_2K-JPG_AmbientOcclusion.jpg`,
            // opcional: se quiseres displacement no futuro:
            displacement:`${TEX}/containers/corrugated/CorrugatedSteel002_2K-JPG_Displacement.jpg`,
        },
    },
    cranes: {},
    vehicles: {},
    props: {},
} as const;
