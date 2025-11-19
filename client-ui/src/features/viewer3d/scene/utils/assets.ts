// src/features/viewer3d/scene/utils/assets.ts
const BASE = import.meta.env.BASE_URL || "/"; // funciona em subpath

const MODELS = `${BASE}3Dmodels`;
const TEX    = `${BASE}3Dtextures`;

export const ASSETS_MODELS = {
    vessels: {
        containerShip: `${MODELS}/physicalResources/vessels/Container_Ship.glb`,
        tugBoat: `${MODELS}/physicalResources/vessels/tugBoat.glb`,
    },
    containers: {
        containerRealistic: `${MODELS}/containers/realistics/Container.glb`,
        container: `${MODELS}/containers/Container.glb`,
        container2: `${MODELS}/containers/Shi.glb`,
    },
    cranes: {
        mcCrane: `${MODELS}/physicalResources/cranes/MCrane.glb`,
        stsCrane: `${MODELS}/physicalResources/cranes/STSCrane.glb`,
        ygcCrane: `${MODELS}/physicalResources/cranes/YGCrane.glb`,
        bigCrane: `${MODELS}/physicalResources/cranes/BigCraneUnloading.glb`,
    },
    vehicles: {
        truck: `${MODELS}/physicalResources/vehicles/truck.glb`,
        truckCarrier: `${MODELS}/physicalResources/vehicles/SCarrier.glb`,
        garbagetruck: `${MODELS}/physicalResources/vehicles/garbage-truck.glb`,
        fireTuck: `${MODELS}/physicalResources/vehicles/firetruck.glb`,

        sedan: `${MODELS}/physicalResources/vehicles/sedan.glb`,
        suv: `${MODELS}/physicalResources/vehicles/suv.glb`,
        taxi: `${MODELS}/physicalResources/vehicles/taxi.glb`,
        sedanSport: `${MODELS}/physicalResources/vehicles/sedan-sports.glb`,
        suvluxury: `${MODELS}/physicalResources/vehicles/suv-luxury.glb`,
        
        forklift: `${MODELS}/physicalResources/vehicles/forklift.glb`,
    },
    storageArea: {
        wareHouser: `${MODELS}/storageAreas/StorageArea.glb`,
    },
    buildings:{
        bigOffice: `${MODELS}/props/buildings/BigOffice.glb`,
        chillBuilding: `${MODELS}/props/buildings/extras/chillBuilding.glb`,
        midleBuilding: `${MODELS}/props/buildings/extras/midleBuilding.glb`,
        smallBuilding: `${MODELS}/props/buildings/extras/smallBuilding.glb`,
        factoryBuilding: `${MODELS}/props/buildings/extras/FactoryBuilding.glb`,
    },
    docks: {
        straight: `${MODELS}/Dock.glb`,
    },
    props: {
        cone: `${MODELS}/physicalResources/Traffic_Cone.glb`,
        worker: `${MODELS}/props/people/Worker.glb`
    },
    greens: {
        pine: `${MODELS}/props/green/Pine.glb`,
        fallTree: `${MODELS}/props/green/FallTree.glb`,
        tree: `${MODELS}/props/green/Tree.glb`,
    },
    extras:{
        city: `${MODELS}/extras/city.glb`,
        RioJaneiro: `${MODELS}/extras/RioJaneiro.glb`,
    }
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
    hdri: {
        skybox: `${TEX}/skybox.hdr`,
    },
    
} as const;
