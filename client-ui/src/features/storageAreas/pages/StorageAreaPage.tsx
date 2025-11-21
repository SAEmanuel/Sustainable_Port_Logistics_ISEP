import "../style/storageAreaStyle.css";

import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { StorageAreaHeader } from "../components/StorageAreaHeader";
import { StorageAreaStrip } from "../components/StorageAreaStrip";
import { StorageAreaDistancesModal } from "../components/modals/StorageAreaDistancesModal";
import { StorageAreaContainerModal } from "../components/modals/StorageAreaContainerModal";
import { StorageAreaMainPanel } from "../components/StorageAreaMainPanel";
import { useStorageAreas } from "../hooks/useStorageAreas";

export default function StorageAreaPage() {
    const nav = useNavigate();
    const { t } = useTranslation();

    const {
        loading,
        query,
        setQuery,
        filtered,
        selected,
        setSelected,
        slices,
        isDistancesOpen,
        setIsDistancesOpen,
        isCellOpen,
        setIsCellOpen,
        cellLoading,
        cellError,
        cellInfo,
        cellPos,
        openCellModal,
    } = useStorageAreas();

    function goToCreate() {
        nav("/storage-areas/new");
    }

    return (
        <div className="sa-wrapper">
            {/* HEADER */}
            <StorageAreaHeader
                count={filtered.length}
                query={query}
                onQueryChange={setQuery}
                onCreate={goToCreate}
            />

            {/* LISTA + PAINEL */}
            <div className="sa-content-vertical">
                <StorageAreaStrip
                    items={filtered}
                    loading={loading}
                    selectedId={selected?.id ?? null}
                    onSelect={setSelected}
                />

                <StorageAreaMainPanel
                    selected={selected}
                    slices={slices}
                    t={t}
                    onOpenDistances={() => setIsDistancesOpen(true)}
                    onCellClick={openCellModal}
                />
            </div>

            {/* MODAL: DISTÂNCIAS */}
            <StorageAreaDistancesModal
                open={isDistancesOpen}
                storageArea={selected}
                onClose={() => setIsDistancesOpen(false)}
            />

            {/* MODAL: INFO DO CONTENTOR */}
            <StorageAreaContainerModal
                open={isCellOpen}
                loading={cellLoading}
                error={cellError}
                info={cellInfo}
                cellPos={cellPos}
                onClose={() => setIsCellOpen(false)}
            />
        </div>
    );
}
