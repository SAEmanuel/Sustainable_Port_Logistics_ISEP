import "../style/vesselspage.css";
import { useVessels } from "../hooks/useVessels";
import { VesselHeader } from "../components/VesselHeader";
import { VesselSearchBar } from "../components/VesselSearchBar";
import { VesselCardGrid } from "../components/VesselCardGrid";
import { VesselCreateModal } from "../components/modals/VesselCreateModal";
import { VesselEditModal } from "../components/modals/VesselEditModal";
import VesselDeleteModal from "../components/modals/VesselDeleteModal";
import { VesselStatsModal } from "../components/modals/VesselStatsModal";

export default function VesselsPage() {
    const {
        items,
        filtered,
        loading,
        vesselTypes,
        vesselTypeCounts,
        selected,
        setSelected,
        searchMode,
        setSearchMode,
        searchValue,
        setSearchValue,
        executeSearch,
        form,
        setForm,
        handleCreate,
        isCreateOpen,
        setIsCreateOpen,
        editData,
        setEditData,
        handleSaveEdit,
        isEditOpen,
        setIsEditOpen,
        setEditIMO,
        isStatsOpen,
        setIsStatsOpen,
        getVesselTypeNameById,
        val,
        isDeleteOpen,
        setIsDeleteOpen,
        reload,
    } = useVessels();

    const closeSlide = () => setSelected(null);

    return (
        <div className="vt-page">
            {selected && <div className="vt-overlay" onClick={closeSlide} />}

            {/* HEADER */}
            <VesselHeader
                count={items.length}
                onCreate={() => setIsCreateOpen(true)}
                onOpenStats={() => setIsStatsOpen(true)}
            />

            {/* SEARCH */}
            <VesselSearchBar
                searchMode={searchMode}
                setSearchMode={setSearchMode}
                searchValue={searchValue}
                setSearchValue={setSearchValue}
                onSearch={executeSearch}
                resetFilter={() => {
                    if (!loading) {
                        setSelected(null);
                    }
                }}
            />

            {/* GRID DE NAVIOS */}
            {!loading && (
                <VesselCardGrid
                    vessels={filtered}
                    onSelect={setSelected}
                    val={val}
                    getVesselTypeNameById={getVesselTypeNameById}
                />
            )}

            {/* SLIDE DETAILS */}
            {selected && (
                <div className="vt-slide">
                    <button className="vt-slide-close" onClick={closeSlide}>
                        ✕
                    </button>

                    <h3>{selected.name}</h3>

                    <p>
                        <strong>IMO:</strong> {val(selected.imoNumber)}
                    </p>
                    <p>
                        <strong>Owner:</strong> {selected.owner}
                    </p>
                    <p>
                        <strong>Type:</strong> {getVesselTypeNameById(selected.vesselTypeId)}
                    </p>

                    <div className="vt-slide-actions">
                        {/* EDITAR NAVIO */}
                        <button
                            className="vt-btn-edit"
                            onClick={() => {
                                setEditData({
                                    name: selected.name,
                                    owner: selected.owner,
                                });

                                const imo =
                                    typeof selected.imoNumber === "string"
                                        ? selected.imoNumber
                                        : selected.imoNumber.value;

                                setEditIMO(imo);
                                setIsEditOpen(true);
                                setSelected(null);
                            }}
                        >
                            Edit
                        </button>

                        {/* VER TIPO DE NAVIO */}
                        <button
                            className="vt-btn-edit"
                            onClick={() => {
                                const id =
                                    typeof selected.vesselTypeId === "string"
                                        ? selected.vesselTypeId
                                        : selected.vesselTypeId.value;

                                window.location.href = `/vessel-types?id=${id}`;
                            }}
                        >
                            View Type
                        </button>

                        {/* ELIMINAR NAVIO */}
                        <button
                            className="vt-btn-delete"
                            onClick={() => setIsDeleteOpen(true)}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            )}

            {/* CREATE MODAL */}
            <VesselCreateModal
                open={isCreateOpen}
                form={form}
                setForm={setForm}
                vesselTypes={vesselTypes}
                onSave={handleCreate}
                onClose={() => setIsCreateOpen(false)}
            />

            {/* EDIT MODAL */}
            <VesselEditModal
                open={isEditOpen}
                editData={editData}
                setEditData={setEditData}
                onSave={handleSaveEdit}
                onClose={() => setIsEditOpen(false)}
            />

            {/* DELETE MODAL */}
            <VesselDeleteModal
                open={isDeleteOpen}
                vessel={selected}
                onClose={() => setIsDeleteOpen(false)}
                onDeleted={reload}
            />

            {/* STATS MODAL */}
            <VesselStatsModal
                open={isStatsOpen}
                vesselTypeCounts={vesselTypeCounts}
                onClose={() => setIsStatsOpen(false)}
            />
        </div>
    );
}
