import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import * as storageAreaService from "../service/storageAreaService";
import type {
    StorageAreaDto,
    StorageAreaGridDto,
    ContainerDto,
} from "../dto/storageAreaDtos";

const GUID_RE =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

type CellPos = { bay: number; row: number; tier: number };

export function useStorageAreas() {
    const { t } = useTranslation();

    const [items, setItems] = useState<StorageAreaDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");

    const [, setGrid] = useState<StorageAreaGridDto | null>(null);
    const [slices, setSlices] = useState<boolean[][][]>([]);
    const [selected, setSelected] = useState<StorageAreaDto | null>(null);

    const [isDistancesOpen, setIsDistancesOpen] = useState(false);

    // MODAL CONTAINER
    const [isCellOpen, setIsCellOpen] = useState(false);
    const [cellLoading, setCellLoading] = useState(false);
    const [cellError, setCellError] = useState<string | null>(null);
    const [cellInfo, setCellInfo] = useState<ContainerDto | null>(null);
    const [cellPos, setCellPos] = useState<CellPos | null>(null);

    /** Carrega TODAS as storage areas */
    const reload = async () => {
        try {
            setLoading(true);
            const data = await storageAreaService.getAllStorageAreas();
            setItems(data);
            if (data.length) setSelected(data[0]);
            toast.success(t("storageAreas.list.loaded", { count: data.length }));
        } catch (e: any) {
            toast.error(
                e?.response?.data ?? t("storageAreas.toast.listLoadingError")
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        reload();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [t]);

    /** Carrega grid real para uma storage area */
    async function loadGrid(area: StorageAreaDto) {
        try {
            const g = await storageAreaService.getStorageAreaGrid(area.id);
            setGrid(g);

            const generatedSlices: boolean[][][] = [];

            for (let tIdx = 0; tIdx < g.maxTiers; tIdx++) {
                const tier: boolean[][] = [];
                for (let r = 0; r < g.maxRows; r++) {
                    const row: boolean[] = [];
                    for (let b = 0; b < g.maxBays; b++) {
                        const occ = g.slots.some(
                            s =>
                                s.tier === tIdx &&
                                s.row === r &&
                                s.bay === b &&
                                s.iso !== null
                        );
                        row.push(occ);
                    }
                    tier.push(row);
                }
                generatedSlices.push(tier);
            }
            setSlices(generatedSlices);
        } catch {
            toast.error(t("storageAreas.errors.loadGrid"));
        }
    }

    useEffect(() => {
        if (selected) loadGrid(selected);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected]);

    /** Lista filtrada pelo search */
    const filtered = useMemo(() => {
        if (!query.trim()) return items;
        const q = query.toLowerCase().trim();

        return items.filter(x => {
            const matchesText =
                x.name.toLowerCase().includes(q) ||
                x.type.toLowerCase().includes(q) ||
                x.physicalResources.some(p => p.toLowerCase().includes(q));

            const matchesId = GUID_RE.test(q) && x.id.toLowerCase() === q;
            return matchesText || matchesId;
        });
    }, [items, query]);

    /** Abre modal de célula e tenta buscar o contentor ao backend */
    async function openCellModal(bay: number, row: number, tier: number) {
        if (!selected) return;

        setIsCellOpen(true);
        setCellLoading(true);
        setCellError(null);
        setCellInfo(null);
        setCellPos({ bay, row, tier });

        try {
            const data = await storageAreaService.getContainerAtPosition(
                selected.id,
                bay,
                row,
                tier
            );
            setCellInfo(data);
        } catch (e: any) {
            setCellError(
                e?.response?.data ?? t("storageAreas.modal.container.error")
            );
        } finally {
            setCellLoading(false);
        }
    }

    return {
        // data
        items,
        loading,
        query,
        setQuery,
        filtered,
        selected,
        setSelected,
        slices,

        // modais
        isDistancesOpen,
        setIsDistancesOpen,

        isCellOpen,
        setIsCellOpen,
        cellLoading,
        cellError,
        cellInfo,
        cellPos,
        openCellModal,

        // util
        reload,
    };
}
