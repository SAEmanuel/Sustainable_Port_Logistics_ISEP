import type {
    SceneData,
    DockDto,
    StorageAreaDto,
    VesselDto,
    ContainerDto,
    PhysicalResourceDTO,
} from "../types";

export type UserRole = string;

export type SelectedKind =
    | "dock"
    | "storageArea"
    | "vessel"
    | "container"
    | "resource"
    | "decorativeCrane"
    | "decorativeStorage"
    | "unknown";

interface SelectedBase<K extends SelectedKind, Dto> {
    kind: K;
    id: string;
    label: string;
    dto: Dto;
}

export type SelectedDock = SelectedBase<"dock", DockDto>;
export type SelectedStorage = SelectedBase<"storageArea", StorageAreaDto>;
export type SelectedVessel = SelectedBase<"vessel", VesselDto>;
export type SelectedContainer = SelectedBase<"container", ContainerDto>;
export type SelectedResource = SelectedBase<"resource", PhysicalResourceDTO>;

export type SelectedEntityInfo =
    | SelectedDock
    | SelectedStorage
    | SelectedVessel
    | SelectedContainer
    | SelectedResource
    | {
    kind: "decorativeCrane" | "decorativeStorage" | "unknown";
    id: string;
    label: string;
    dto: any;
};

/**
 * Converte o payload simples vindo do ThreeScene ({type,id,label})
 * no DTO completo correspondente.
 */
export function mapPickedToSelection(
    picked: { type: string; id: string; label: string },
    data: SceneData,
): SelectedEntityInfo | null {
    const { type, id, label } = picked;

    switch (type) {
        case "Dock":
        case "dock": {
            const dto = data.docks.find((d) => d.id === id);
            if (!dto) return null;
            return { kind: "dock", id: dto.id, label: dto.code, dto };
        }
        case "StorageArea":
        case "storageArea": {
            const dto = data.storageAreas.find((s) => s.id === id);
            if (!dto) return null;
            return { kind: "storageArea", id: dto.id, label: dto.name, dto };
        }
        case "Vessel":
        case "vessel": {
            const dto = data.vessels.find((v) => v.id === id);
            if (!dto) return null;
            return { kind: "vessel", id: dto.id, label: dto.name, dto };
        }
        case "Container":
        case "container": {
            const dto = data.containers.find((c) => c.id === id);
            if (!dto) return null;
            return {
                kind: "container",
                id: dto.id,
                label: dto.isoCode,
                dto,
            };
        }
        case "PhysicalResource":
        case "resource": {
            const dto = data.resources.find((r) => r.id === id);
            if (!dto) return null;
            return {
                kind: "resource",
                id: dto.id,
                label: dto.code,
                dto,
            };
        }
        case "DecorativeCrane":
            return {
                kind: "decorativeCrane",
                id,
                label,
                dto: { dockId: (picked as any).dockId },
            };
        case "DecorativeStorage":
            return {
                kind: "decorativeStorage",
                id,
                label,
                dto: { zone: (picked as any).zone },
            };
        default:
            return {
                kind: "unknown",
                id,
                label,
                dto: picked,
            };
    }
}
