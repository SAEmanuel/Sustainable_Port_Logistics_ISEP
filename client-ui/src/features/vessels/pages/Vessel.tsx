import { useState, useEffect } from "react";
import { FaShip, FaSearch, FaPlus, FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";

import {
    getVessels,
    getVesselByIMO,
    getVesselById,
    getVesselByOwner,
    createVessel,
    patchVesselByIMO
} from "../services/vesselService";

import { getVesselTypes } from "../../vesselsTypes/services/vesselTypeService";
import type { VesselType } from "../../vesselsTypes/types/vesselType";
import type { Vessel, CreateVesselRequest, UpdateVesselRequest } from "../types/vessel";

import "../style/vesselspage.css";
import {useTranslation} from "react-i18next";

// === Chart.js imports ===
import { Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    BarElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend
} from "chart.js";
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function Vessel() {
    const [items, setItems] = useState<Vessel[]>([]);
    const [filtered, setFiltered] = useState<Vessel[]>([]);
    const [loading, setLoading] = useState(true);
    const [vesselTypes, setVesselTypes] = useState<VesselType[]>([]);
    const [selected, setSelected] = useState<Vessel | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editIMO, setEditIMO] = useState<string | null>(null);
    const [editData, setEditData] = useState<UpdateVesselRequest>({});
    const [searchMode, setSearchMode] = useState<"local" | "imo" | "id" | "owner">("local");
    const [searchValue, setSearchValue] = useState("");
    const [form, setForm] = useState<CreateVesselRequest>({imoNumber: "", name: "", owner: "", vesselTypeName: ""});
    const { t } = useTranslation();
    const imoRegex = /^\d{7}$/;
    const val = (x: any) => (typeof x === "string" ? x : x?.value);
    const MIN_LOADING_TIME = 500;
    const [isStatsOpen, setIsStatsOpen] = useState(false);

    async function runWithLoading<T>(promise: Promise<T>, text: string) {
        const id = toast.loading(text);
        const start = Date.now();
        try {
            return await promise;
        } finally {
            const elapsed = Date.now() - start;
            if (elapsed < MIN_LOADING_TIME)
                await new Promise(res => setTimeout(res, MIN_LOADING_TIME - elapsed));
            toast.dismiss(id);
        }
    }

    // ====== Load data ======
    useEffect(() => {
        async function load() {
            try {
                const data = await runWithLoading(getVessels(), t("Vessel.messages.loading"));
                setItems(data);
                setFiltered(data);
                toast.success(t("Vessel.messages.searchSuccess", { count: data.length }));

                const types = await runWithLoading(getVesselTypes(), t("Vessel.messages.loading"));
                setVesselTypes(types);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [t]);

    function getVesselTypeNameById(vesselTypeId: any) {
        const id = vesselTypeId?.value ?? vesselTypeId;
        const type = vesselTypes.find(t => t.id === id);
        return type?.name ?? "Unknown";
    }

    // ====== Prep chart data ======
    const vesselTypeCounts = vesselTypes.map(type => {
        const count = items.filter(v => {
            const id = typeof v.vesselTypeId === "string"
                ? v.vesselTypeId
                : v.vesselTypeId.value;
            return id === type.id;
        }).length;

        return { name: type.name, count };
    });

    // ====== Search ======
    async function executeSearch() {
        if (!searchValue.trim()) {
            setFiltered(items);
            return;
        }

        const q = searchValue.toLowerCase();

        if (searchMode === "local") {
            const results = items.filter(v =>
                v.name.toLowerCase().includes(q) ||
                v.owner.toLowerCase().includes(q) ||
                val(v.imoNumber)?.toLowerCase().includes(q)
            );

            setFiltered(results);
            toast.success(t("Vessel.messages.searchSuccess", { count: results.length }));
            return;
        }

        // Validate GUID
        if (searchMode === "id") {
            const guidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
            if (!guidRegex.test(searchValue)) {
                toast.error("Invalid ID format. Please enter a valid GUID.");
                return;
            }
        }

        // Validate IMO
        if (searchMode === "imo") {
            if (!imoRegex.test(searchValue)) {
                toast.error(t("Vessel.messages.invalidIMO"));
                return;
            }
        }

        // Wrap single object APIs so they return arrays
        let apiPromise: Promise<Vessel[]>;

        if (searchMode === "imo") {
            apiPromise = getVesselByIMO(searchValue).then(v => [v]);
        } else if (searchMode === "id") {
            apiPromise = getVesselById(searchValue).then(v => [v]);
        } else {
            apiPromise = getVesselByOwner(searchValue);
        }

        const result = await runWithLoading(apiPromise, t("Vessel.messages.loading"))
            .catch(() => null);

        if (!result || result.length === 0) {
            setFiltered([]);
            toast.error(t("Vessel.messages.noResults"));
            return;
        }

        setFiltered(result);
        toast.success(t("Vessel.messages.searchSuccess", { count: result.length }));
    }

    // ====== Create ======
    async function handleCreate() {
        if (!imoRegex.test(form.imoNumber))
            return toast.error(t("Vessel.messages.invalidIMO"));

        if (!form.name.trim() || !form.owner.trim() || !form.vesselTypeName.trim())
            return toast.error(t("Vessel.messages.fillAll"));

        const created = await runWithLoading(createVessel(form), t("Vessel.modal.addTitle")).catch(() => null);

        if (!created) return;

        const data = await getVessels();

        toast.success(t("Vessel.messages.created"));
        setItems(data)
        setFiltered(data);
        setIsCreateOpen(false);

        setForm({
            imoNumber: "",
            name: "",
            owner: "",
            vesselTypeName: ""
        });

    }

    // ====== Edit ======
    async function handleSaveEdit() {
        if (!editIMO) return;

        const payload: UpdateVesselRequest = {};
        if (editData.name?.trim()) payload.name = editData.name.trim();
        if (editData.owner?.trim()) payload.owner = editData.owner.trim();

        if (!payload.name && !payload.owner)
            return toast.error(t("Vessel.messages.fillAll"));

        const updated = await runWithLoading(
            patchVesselByIMO(editIMO, payload),
            t("Vessel.modal.editTitle")
        ).catch(() => null);

        if (!updated) return;

        toast.success(t("Vessel.messages.updated"));

        const data = await getVessels();

        setItems(data);setFiltered(data);
        setIsEditOpen(false);
        setEditIMO(null);

    }

    const closeSlide = () => setSelected(null);

    return (
        <div className="vt-page">
            {selected && <div className="vt-overlay" onClick={closeSlide} />}

            {/* HEADER */}
            <div className="vt-title-area">
                <div>
                    <h2 className="vt-title"><FaShip /> {t("Vessel.title")}</h2>
                    <p className="vt-sub">{t("Vessel.count", { count: items.length })}</p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button className="vt-create-btn-top" onClick={() => setIsCreateOpen(true)}>
                        <FaPlus /> {t("Vessel.buttons.add")}
                    </button>

                    <button className="vt-create-btn-top" style={{ background: "#444" }}
                            onClick={() => setIsStatsOpen(true)}>
                        📊 {t("Vessel.buttons.stats", { defaultValue: "Statistics" })}
                    </button>
                </div>

            </div>

            {/* SEARCH MODE */}
            <div className="vt-search-mode">
                {["local", "imo", "id", "owner"].map(m => (
                    <button
                        key={m}
                        className={searchMode === m ? "active" : ""}
                        onClick={() => setSearchMode(m as any)}
                    >
                        {t(`Vessel.modes.${m}`)}
                    </button>
                ))}
            </div>

            {/* SEARCH */}
            <div className="vt-search-box">
                <div className="vt-search-wrapper">
                    <input
                        placeholder={t("Vessel.searchPlaceholder")}
                        className="vt-search"
                        value={searchValue}
                        onChange={e => {
                            setSearchValue(e.target.value);
                            if (!e.target.value) setFiltered(items);
                        }}
                        onKeyDown={e => e.key === "Enter" && executeSearch()}
                    />
                    {searchValue !== "" && (
                        <button className="vt-clear-input" onClick={() => { setSearchValue(""); setFiltered(items); }}>
                            ✕
                        </button>
                    )}
                </div>
                <button className="vt-search-btn" onClick={executeSearch}>
                    <FaSearch />
                </button>
            </div>

            {/* CARDS */}
            <div className="vt-card-grid">
                {!loading && filtered.map(v => (
                    <div key={v.id} className="vt-card" onClick={() => setSelected(v)}>
                        <div className="vt-card-header">
                            <span className="vt-card-title">{v.name}</span>
                            <span className="vt-badge">{val(v.imoNumber)}</span>
                        </div>
                        <div className="vt-card-body">
                            <div className="vt-row-item">
                                <span className="vt-label">{t("Vessel.details.owner")}</span>
                                <span className="vt-chip">{v.owner}</span>
                            </div>
                            <div className="vt-row-item">
                                <span className="vt-label">{t("Vessel.details.type")}</span>
                                <span className="vt-chip vt-chip-type">
                                    {getVesselTypeNameById(v.vesselTypeId)}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* SLIDE PANEL */}
            {selected && (
                <div className="vt-slide">
                    <button className="vt-slide-close" onClick={closeSlide}>
                        <FaTimes />
                    </button>

                    <h3>{selected.name}</h3>

                    <p><strong>IMO:</strong> {val(selected.imoNumber)}</p>
                    <p><strong>{t("Vessel.details.owner")}:</strong> {selected.owner}</p>
                    <p><strong>{t("Vessel.details.type")}:</strong> {getVesselTypeNameById(selected.vesselTypeId)}</p>

                    <div className="vt-slide-actions">
                        <button
                            className="vt-btn-edit"
                            onClick={() => {
                                setEditData({ name: selected.name, owner: selected.owner });
                                setEditIMO(val(selected.imoNumber));
                                setIsEditOpen(true);
                                setSelected(null);
                            }}
                        >
                            Edit
                        </button>

                        <button
                            className="vt-btn-edit"
                            onClick={() => {
                                const id = typeof selected.vesselTypeId === "string"
                                    ? selected.vesselTypeId
                                    : selected.vesselTypeId.value;
                                window.location.href = `/vessel-types?id=${id}`;
                            }}
                        >
                            View Type
                        </button>
                    </div>
                </div>
            )}

            {/* CREATE MODAL */}
            {isCreateOpen && (
                <div className="vt-modal-overlay">
                    <div className="vt-modal">
                        <h3>{t("Vessel.modal.addTitle")}</h3>

                        <label>{t("Vessel.fields.imo")}</label>
                        <input
                            className="vt-input"
                            value={form.imoNumber}
                            onChange={e => setForm({ ...form, imoNumber: e.target.value })}
                        />

                        <label>{t("Vessel.fields.name")}</label>
                        <input
                            className="vt-input"
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                        />

                        <label>{t("Vessel.fields.owner")}</label>
                        <input
                            className="vt-input"
                            value={form.owner}
                            onChange={e => setForm({ ...form, owner: e.target.value })}
                        />

                        <label>{t("Vessel.fields.type")}</label>
                        <select
                            className="vt-input vt-input--vesseltype"
                            value={form.vesselTypeName}
                            onChange={e => setForm({ ...form, vesselTypeName: e.target.value })}
                        >
                            <option value="">Select Vessel Type</option>
                            {vesselTypes.map(t => (
                                <option key={t.id} value={t.name}>{t.name}</option>
                            ))}
                        </select>

                        <div className="vt-modal-actions">
                            <button className="vt-btn-cancel" onClick={() => setIsCreateOpen(false)}>Cancel</button>
                            <button className="vt-btn-save" onClick={handleCreate}>Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT MODAL */}
            {isEditOpen && (
                <div className="vt-modal-overlay">
                    <div className="vt-modal">
                        <h3>{t("Vessel.modal.editTitle")}</h3>

                        <label>{t("Vessel.fields.name")}</label>
                        <input
                            className="vt-input"
                            value={editData.name || ""}
                            onChange={e => setEditData({ ...editData, name: e.target.value })}
                        />

                        <label>{t("Vessel.fields.owner")}</label>
                        <input
                            className="vt-input"
                            value={editData.owner || ""}
                            onChange={e => setEditData({ ...editData, owner: e.target.value })}
                        />

                        <div className="vt-modal-actions">
                            <button className="vt-btn-cancel" onClick={() => setIsEditOpen(false)}>Cancel</button>
                            <button className="vt-btn-save" onClick={handleSaveEdit}>Save</button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* STATS MODAL */}
            {isStatsOpen && (
                <div className="vt-modal-overlay">
                    <div className="vt-modal-stats">
                        <h3 className="vt-modal-title">{t("Vessel.analytics.title", { defaultValue: "Vessel Statistics" })}</h3>

                        <div className="vt-stats-chart">
                            <Bar
                                data={{
                                    labels: vesselTypeCounts.map(v => v.name),
                                    datasets: [
                                        {
                                            label: t("Vessel.analytics.types", { defaultValue: "Count" }),
                                            data: vesselTypeCounts.map(v => v.count),
                                            backgroundColor: "#4e79a7"
                                        }
                                    ]
                                }}
                                options={{
                                    responsive: true,
                                    plugins: { legend: { display: false } },
                                    scales: { y: { ticks: { precision: 0 } } }
                                }}
                            />
                        </div>

                        <div className="vt-modal-actions">
                            <button className="vt-btn-cancel" onClick={() => setIsStatsOpen(false)}>
                                {t("Vessel.buttons.close", { defaultValue: "Close" })}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
