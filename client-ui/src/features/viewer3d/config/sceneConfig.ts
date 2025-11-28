import type { RoadLightOpts } from "../scene/objects/roadLights";
import type { RoadTreeOpts } from "../scene/objects/roadTrees";
import type { BridgesOpts } from "../scene/objects/Bridges";
import type { TrafficOpts } from "../services/placement/addRoadTraffic";
import type { ParkingOpts } from "../services/placement/addParking";
import type { WorkshopsOpts } from "../services/placement/addWorkshopsC34";
import type { ExtrasRowOpts } from "../services/placement/addExtrasRowC34";
import type { StacksYardOpts } from "../services/placement/addStacksYardC78910";

export type PortSceneConfig = {
    roadLights: Partial<RoadLightOpts>;
    roadTrees: Partial<RoadTreeOpts>;
    bridges: Partial<BridgesOpts>;
    traffic: Partial<TrafficOpts>;
    parking: Partial<ParkingOpts>;
    workshops: Partial<WorkshopsOpts>;
    extras: Partial<ExtrasRowOpts>;
    yards: Partial<StacksYardOpts>;
};
