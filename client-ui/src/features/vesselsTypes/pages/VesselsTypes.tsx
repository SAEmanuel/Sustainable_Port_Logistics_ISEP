import { useEffect, useState } from "react";
import {
    getVesselTypes,
    getVesselTypesByID,
    getVesselTypesByName,
    updateVesselType,
    deleteVesselType,
    createVesselType
} from "../services/vesselTypeService";

import type { VesselType } from "../types/vesselType";

import { notifyError, notifyLoading, notifySuccess } from "../../../utils/notify";
import "../style/vesselTypeList.css";

import { FaShip, FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

export default function VesselTypeList() {
    const [items, setItems] = useState<VesselType[]>([]);
    const [filtered, setFiltered] = useState<VesselType[]>([]);
    const [selected, setSelected] = useState<VesselType | null>(null);
    const [loading, setLoading] = useState(true);

    const [editModel, setEditModel] = useState<VesselType | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    // === CREATE MODAL STATES ===
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [maxBays, setMaxBays] = useState<number>(0);
    const [maxRows, setMaxRows] = useState<number>(0);
    const [maxTiers, setMaxTiers] = useState<number>(0);

    const [searchMode, setSearchMode] = useState<"local" | "id" | "name">("local");
    const [searchValue, setSearchValue] = useState("");

    const { t } = useTranslation();

    useEffect(() => {
        async function load() {
            notifyLoading(t("vesselTypes.loading"));

            try {
                const data = await getVesselTypes();
                setItems(data);
                setFiltered(data);

                toast.dismiss("loading-global");
                notifySuccess(t("vesselTypes.loadSuccess", { count: data.length }));
            } catch {
                toast.dismiss("loading-global");
                notifyError(t("vesselTypes.loadError"));
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [t]);

    const executeSearch = async () => {
        if (!searchValue.trim()) {
            setFiltered(items);
            return;
        }

        if (searchMode === "local") {
            const q = searchValue.toLowerCase();
            setFiltered(
                items.filter(
                    (v) =>
                        v.name.toLowerCase().includes(q) ||
                        v.description.toLowerCase().includes(q)
                )
            );
            return;
        }

        notifyLoading(t("vesselTypes.loading"));

        try {
            if (searchMode === "id") {
                const data = await getVesselTypesByID(searchValue);
                setFiltered([data]);
            }

            if (searchMode === "name") {
                const data = await getVesselTypesByName(searchValue);
                setFiltered([data]);
            }

            toast.dismiss("loading-global");
            notifySuccess(t("vesselTypes.loadSuccess", { count: filtered.length }));
        } catch {
            toast.dismiss("loading-global");
            setFiltered([]);
            notifyError(t("vesselTypes.loadError"));
        }
    };

    const openEdit = () => {
        if (!selected) return;
        setEditModel({ ...selected });
        setSelected(null);
        setIsEditOpen(true);
        document.body.classList.add("no-scroll");
    };

    const closeEdit = () => {
        setIsEditOpen(false);
        document.body.classList.remove("no-scroll");
        setEditModel(null);
    };

    const saveEdit = async () => {
        if (!editModel) return;

        notifyLoading("Saving...");

        try {
            const updated = await updateVesselType(editModel.id!, editModel);

            toast.dismiss("loading-global");

            toast.success(
                <div style={{ fontSize: "14px" }}>
                    <strong>Vessel updated</strong><br />
                    {updated.name} — {updated.capacity} TEU
                </div>
            );

            const data = await getVesselTypes();
            setItems(data);
            setFiltered(data);

            closeEdit();
            setSelected(updated);

        } catch (err: any) {
            toast.dismiss("loading-global");

            const backendMessage =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                JSON.stringify(err?.response?.data) ||
                "Failed to update";

            notifyError(backendMessage);
        }
    };

    const openDelete = () => setIsDeleteOpen(true);
    const closeDelete = () => setIsDeleteOpen(false);

    const confirmDelete = async () => {
        if (!selected) return;

        notifyLoading("Deleting...");

        try {
            await deleteVesselType(selected.id);
            toast.dismiss("loading-global");
            notifySuccess(`Deleted ${selected.name}`);

            const data = await getVesselTypes();
            setItems(data);
            setFiltered(data);

            setSelected(null);
            closeDelete();
        } catch (err: any) {
            toast.dismiss("loading-global");

            const backendMessage =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                JSON.stringify(err?.response?.data) ||
                "Failed to delete";

            notifyError(backendMessage);
        }
    };

    // === CREATE HANDLER ===
    const handleCreate = async () => {
        if (!name.trim()) return toast.error(t("vesselTypes.errors.nameRequired"));
        if (maxBays <= 0 || maxRows <= 0 || maxTiers <= 0)
            return toast.error(t("vesselTypes.errors.invalidStructure"));

        toast.loading(t("vesselTypes.loading"));

        try {
            await createVesselType({
                name,
                description,
                maxBays,
                maxRows,
                maxTiers,
            });

            toast.dismiss();
            toast.success(t("vesselTypes.created"));

            const data = await getVesselTypes();
            setItems(data);
            setFiltered(data);

            // Close modal & reset fields
            setIsCreateOpen(false);
            setName("");
            setDescription("");
            setMaxBays(0);
            setMaxRows(0);
            setMaxTiers(0);

        } catch (err: any) {
            toast.dismiss();

            const error = err?.response?.data;

            // Try to extract the message from ProblemDetails or fallback
            const msg =
                error?.detail ||
                error?.message || // caso algum endpoint ainda use
                error?.title ||
                (typeof error === "string" ? error : null) ||
                "Error creating vessel type";

            toast.error(msg);
        }

    };

    return (
        <div className="vt-page">
            {selected && <div className="vt-overlay" />}

            <div className="vt-title-area">
                <div className="vt-title-box">
                    <h2 className="vt-title">
                        <FaShip className="vt-icon" /> {t("vesselTypes.title")}
                    </h2>
                    <p className="vt-sub">
                        {t("vesselTypes.count", { count: items.length })}
                    </p>
                </div>

                <button
                    className="vt-create-btn-top"
                    onClick={() => setIsCreateOpen(true)}
                >
                    + {t("vesselTypes.add")}
                </button>
            </div>

            {/* SEARCH SECTION */}
            <div className="vt-search-mode">
                <button
                    className={searchMode === "local" ? "active" : ""}
                    onClick={() => setSearchMode("local")}
                >
                    Local
                </button>
                <button
                    className={searchMode === "id" ? "active" : ""}
                    onClick={() => setSearchMode("id")}
                >
                    ID
                </button>
                <button
                    className={searchMode === "name" ? "active" : ""}
                    onClick={() => setSearchMode("name")}
                >
                    Name
                </button>
            </div>

            <div className="vt-search-box">
                <div className="vt-search-wrapper">
                    <input
                        placeholder={t("vesselTypes.searchPlaceholder")}
                        className="vt-search"
                        value={searchValue}
                        onChange={(e) => {
                            const value = e.target.value;
                            setSearchValue(value);
                            if (value === "") setFiltered(items);
                        }}
                        onKeyDown={(e) => e.key === "Enter" && executeSearch()}
                    />

                    {searchValue !== "" && (
                        <button
                            className="vt-clear-input"
                            onClick={() => {
                                setSearchValue("");
                                setFiltered(items);
                            }}
                        >
                            ✕
                        </button>
                    )}
                </div>

                <button className="vt-search-btn" onClick={executeSearch} title="Search">
                    ↵
                </button>
            </div>

            {/* TABLE */}
            {loading ? null : filtered.length === 0 ? (
                <p>{t("vesselTypes.empty")}</p>
            ) : (
                <div className="vt-table-wrapper">
                    <table className="vt-table">
                        <thead>
                        <tr>
                            <th>{t("vesselTypes.details.name")}</th>
                            <th>{t("vesselTypes.details.description")}</th>
                            <th>{t("vesselTypes.details.bays")}</th>
                            <th>{t("vesselTypes.details.rows")}</th>
                            <th>{t("vesselTypes.details.tiers")}</th>
                            <th>{t("vesselTypes.details.capacity")}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filtered.map((v) => (
                            <tr key={v.id} className="vt-row" onClick={() => setSelected(v)}>
                                <td><span className="vt-badge">{v.name}</span></td>
                                <td>{v.description}</td>
                                <td>{v.maxBays}</td>
                                <td>{v.maxRows}</td>
                                <td>{v.maxTiers}</td>
                                <td>{v.capacity}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* SLIDE PANEL */}
            {selected && (
                <div className="vt-slide">
                    <button className="vt-slide-close" onClick={() => setSelected(null)}>
                        <FaTimes />
                    </button>

                    <h3>{selected.name}</h3>

                    <p><strong>{t("vesselTypes.details.description")}:</strong> {selected.description}</p>
                    <p><strong>{t("vesselTypes.details.bays")}:</strong> {selected.maxBays}</p>
                    <p><strong>{t("vesselTypes.details.rows")}:</strong> {selected.maxRows}</p>
                    <p><strong>{t("vesselTypes.details.tiers")}:</strong> {selected.maxTiers}</p>
                    <p><strong>{t("vesselTypes.details.capacity")}:</strong> {selected.capacity}</p>

                    <div className="vt-slide-actions">
                        <button className="vt-btn-edit" onClick={openEdit}>{t("vesselTypes.edit")}</button>
                        <button className="vt-btn-delete" onClick={openDelete}>{t("vesselTypes.delete")}</button>
                    </div>
                </div>
            )}

            {/* EDIT MODAL */}
            {isEditOpen && editModel && (
                <div className="vt-modal-overlay">
                    <div className="vt-modal">
                        <h3>{t("vesselTypes.edit")}</h3>

                        <label>{t("vesselTypes.details.name")}</label>
                        <input
                            className="vt-input"
                            value={editModel.name}
                            onChange={(e) => setEditModel({ ...editModel, name: e.target.value })}
                        />

                        <label>{t("vesselTypes.details.description")}</label>
                        <input
                            className="vt-input"
                            value={editModel.description}
                            onChange={(e) => setEditModel({ ...editModel, description: e.target.value })}
                        />

                        <label>{t("vesselTypes.details.bays")}</label>
                        <input
                            type="number"
                            className="vt-input"
                            value={editModel.maxBays}
                            onChange={(e) => setEditModel({ ...editModel, maxBays: Number(e.target.value) })}
                        />

                        <label>{t("vesselTypes.details.rows")}</label>
                        <input
                            type="number"
                            className="vt-input"
                            value={editModel.maxRows}
                            onChange={(e) => setEditModel({ ...editModel, maxRows: Number(e.target.value) })}
                        />

                        <label>{t("vesselTypes.details.tiers")}</label>
                        <input
                            type="number"
                            className="vt-input"
                            value={editModel.maxTiers}
                            onChange={(e) => setEditModel({ ...editModel, maxTiers: Number(e.target.value) })}
                        />

                        <label>{t("vesselTypes.details.capacity")}</label>
                        <input
                            className="vt-input"
                            value={editModel.capacity}
                            readOnly
                        />

                        <div className="vt-modal-actions">
                            <button className="vt-btn-cancel" onClick={closeEdit}>{t("vesselTypes.cancel")}</button>
                            <button className="vt-btn-save" onClick={saveEdit}>{t("vesselTypes.save")}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE MODAL */}
            {isDeleteOpen && selected && (
                <div className="vt-modal-overlay">
                    <div className="vt-modal vt-modal-delete">
                        <h3>{t("vesselTypes.delete")}</h3>
                        <p>
                            {t("vesselTypes.details.name")}: <strong>{selected.name}</strong><br />
                            {t("vesselTypes.details.capacity")}: <strong>{selected.capacity} TEU</strong>
                        </p>

                        <div className="vt-modal-actions">
                            <button className="vt-btn-cancel" onClick={closeDelete}>{t("vesselTypes.cancel")}</button>
                            <button className="vt-btn-delete" onClick={confirmDelete}>{t("vesselTypes.delete")}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* CREATE MODAL */}
            {isCreateOpen && (
                <div className="vt-modal-overlay">
                    <div className="vt-modal">
                        <h3>{t("vesselTypes.add")}</h3>

                        <label>{t("vesselTypes.details.name")} *</label>
                        <input className="vt-input" value={name} onChange={(e) => setName(e.target.value)} />

                        <label>{t("vesselTypes.details.description")}</label>
                        <input className="vt-input" value={description} onChange={(e) => setDescription(e.target.value)} />

                        <label>{t("vesselTypes.details.bays")}</label>
                        <input type="number" className="vt-input" value={maxBays} onChange={(e) => setMaxBays(Number(e.target.value))} />

                        <label>{t("vesselTypes.details.rows")}</label>
                        <input type="number" className="vt-input" value={maxRows} onChange={(e) => setMaxRows(Number(e.target.value))} />

                        <label>{t("vesselTypes.details.tiers")}</label>
                        <input type="number" className="vt-input" value={maxTiers} onChange={(e) => setMaxTiers(Number(e.target.value))} />

                        <div className="vt-modal-actions">
                            <button className="vt-btn-cancel" onClick={() => setIsCreateOpen(false)}>
                                {t("vesselTypes.cancel")}
                            </button>
                            <button className="vt-btn-save" onClick={handleCreate}>
                                {t("vesselTypes.save")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
