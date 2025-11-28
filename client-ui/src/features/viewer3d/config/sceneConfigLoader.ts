import rawJson from "./portSceneConfig.json";
import type { PortSceneConfig } from "./sceneConfig";

// defaults para o caso de o JSON não ter algumas secções
const defaultConfig: PortSceneConfig = {
    roadLights: {},
    roadTrees: {},
    bridges: {},
    traffic: {},
    parking: {},
    workshops: {},
    extras: {},
    yards: {},
};

// merge “raso”: base + patch → patch ganha
function mergeOpts<T extends object>(base: T, patch?: Partial<T>): T {
    if (!patch) return base;
    return { ...base, ...patch } as T;
}

// rawJson é any, por isso fazemos cast leve
const json = rawJson as Partial<PortSceneConfig>;

export const portSceneConfig: PortSceneConfig = {
    roadLights: mergeOpts(defaultConfig.roadLights, json.roadLights),
    roadTrees: mergeOpts(defaultConfig.roadTrees, json.roadTrees),
    bridges: mergeOpts(defaultConfig.bridges, json.bridges),
    traffic: mergeOpts(defaultConfig.traffic, json.traffic),
    parking: mergeOpts(defaultConfig.parking, json.parking),
    workshops: mergeOpts(defaultConfig.workshops, json.workshops),
    extras: mergeOpts(defaultConfig.extras, json.extras),
    yards: mergeOpts(defaultConfig.yards, json.yards),
};
