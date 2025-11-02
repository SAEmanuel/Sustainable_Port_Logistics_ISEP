import { useState, useEffect } from "react";
import { FaShip, FaSearch, FaPlus, FaTimes, FaEdit } from "react-icons/fa";
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

export default function Vessel() {
    const [items, setItems] = useState<Vessel[]>([]);
    const [filtered, setFiltered] = useState<Vessel[]>([]);
    const [loading, setLoading] = useState(true);

    const [vesselTypes, setVesselTypes] = useState<VesselType[]>([]);
    const [searchMode, setSearchMode] = useState<"local" | "imo" | "id" | "owner">("local");
    const [searchValue, setSearchValue] = useState("");

    const [selected, setSelected] = useState<Vessel | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const [form, setForm] = useState<CreateVesselRequest>({
        imoNumber: "",
        name: "",
        owner: "",
        vesselTypeName: ""
    });

    const [editData, setEditData] = useState<UpdateVesselRequest>({});

    const imoRegex = /^IMO\d{7}$/i;
    const val = (x: any) => (typeof x === "string" ? x : x?.value);

    useEffect(() => {
        load();
        loadTypes();
    }, []);

    async function load() {
        const data = await getVessels();
        setItems(data);
        setFiltered(data);
        setLoading(false);
    }

    async function loadTypes() {
        const data = await getVesselTypes();
        setVesselTypes(data);
    }

    function getVesselTypeNameById(vesselTypeId: any) {
        const id = vesselTypeId?.value ?? vesselTypeId;
        const type = vesselTypes.find(t => t.id === id);
        return type?.name ?? "Unknown Type";
    }

    async function executeSearch() {
        if (!searchValue.trim()) return setFiltered(items);
        const q = searchValue.toLowerCase();

        if (searchMode === "local") {
            return setFiltered(
                items.filter(v =>
                    v.name.toLowerCase().includes(q) ||
                    v.owner.toLowerCase().includes(q) ||
                    val(v.imoNumber)?.toLowerCase().includes(q)
                )
            );
        }

        try {
            switch (searchMode) {
                case "imo":
                    if (!imoRegex.test(searchValue)) return toast.error("IMO inválido (Ex: IMO1234567)");
                    setFiltered([await getVesselByIMO(searchValue)]);
                    break;
                case "id":
                    setFiltered([await getVesselById(searchValue)]);
                    break;
                case "owner":
                    setFiltered(await getVesselByOwner(searchValue));
                    break;
            }
        } catch {
            toast.error("Nenhum navio encontrado.");
            setFiltered([]);
        }
    }

    async function handleCreate() {
        if (!imoRegex.test(form.imoNumber)) return toast.error("Formato IMO inválido");
        if (!form.name.trim() || !form.owner.trim() || !form.vesselTypeName.trim())
            return toast.error("Preencha todos os campos");

        await createVessel(form);
        toast.success("Navio criado!");
        setIsCreateOpen(false);
        load();
    }

    async function handleSaveEdit() {
        if (!selected) return;
        await patchVesselByIMO(val(selected.imoNumber), editData);
        toast.success("Navio atualizado!");
        setIsEditOpen(false);
        load();
    }

    return (
        <div className="vt-page">

            {/* HEADER */}
            <div className="vt-title-area">
                <div>
                    <h2 className="vt-title"><FaShip /> Vessel Management</h2>
                    <p className="vt-sub">Total vessels: {items.length}</p>
                </div>
                <button className="vt-create-btn-top" onClick={() => setIsCreateOpen(true)}>
                    <FaPlus /> Add Vessel
                </button>
            </div>

            {/* SEARCH MODE */}
            <div className="vt-search-mode">
                {["local", "imo", "id", "owner"].map(m => (
                    <button
                        key={m}
                        className={searchMode === m ? "active" : ""}
                        onClick={() => setSearchMode(m as any)}
                    >
                        {m.toUpperCase()}
                    </button>
                ))}
            </div>

            {/* SEARCH BAR */}
            <div className="vt-search-box">
                <div className="vt-search-wrapper">
                    <input
                        placeholder="Search vessels..."
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

            {/* CARD GRID */}
            <div className="vt-card-grid">
                {!loading && filtered.map(v => (
                    <div key={v.id} className="vt-card" onClick={() => setSelected(v)}>
                        <div className="vt-card-header">
                            <span className="vt-card-title">{v.name}</span>
                            <span className="vt-badge">{val(v.imoNumber)}</span>
                        </div>

                        <div className="vt-card-body">
                            <div className="vt-row-item">
                                <span className="vt-label">Owner</span>
                                <span className="vt-chip">{v.owner}</span>
                            </div>
                            <div className="vt-row-item">
                                <span className="vt-label">Type</span>
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
                    <button className="vt-slide-close" onClick={() => setSelected(null)}>
                        <FaTimes />
                    </button>
                    <h3>{selected.name}</h3>
                    <p><strong>IMO:</strong> {val(selected.imoNumber)}</p>
                    <p><strong>Owner:</strong> {selected.owner}</p>
                    <p><strong>Type:</strong> {getVesselTypeNameById(selected.vesselTypeId)}</p>

                    <div className="vt-slide-actions">
                        <button
                            className="vt-btn-edit"
                            onClick={() => {
                                setEditData({ name: selected.name, owner: selected.owner });
                                setIsEditOpen(true);
                                setSelected(null);
                            }}
                        >
                            <FaEdit /> Edit
                        </button>

                        <button
                            className="vt-btn-secondary-info"
                            onClick={() => {
                                const id = typeof selected.vesselTypeId === "string"
                                    ? selected.vesselTypeId
                                    : selected.vesselTypeId.value;

                                window.location.href = `/vessel-types?id=${id}`;
                            }}
                        >
                            View Vessel Type Info
                        </button>
                    </div>
                </div>
            )}

            {/* CREATE MODAL */}
            {isCreateOpen && (
                <div className="vt-modal-overlay">
                    <div className="vt-modal">
                        <h3>Add Vessel</h3>

                        {Object.entries(form).map(([k, v]) => {
                            if (k === "vesselTypeName") {
                                return (
                                    <select
                                        key={k}
                                        className="vt-input"
                                        value={v}
                                        onChange={e => setForm({ ...form, vesselTypeName: e.target.value })}
                                    >
                                        <option value="">Select Vessel Type</option>
                                        {vesselTypes.map(t => (
                                            <option key={t.id} value={t.name}>{t.name}</option>
                                        ))}
                                    </select>
                                );
                            }

                            return (
                                <input
                                    key={k}
                                    placeholder={k}
                                    className="vt-input"
                                    value={v}
                                    onChange={e => setForm({ ...form, [k]: e.target.value })}
                                />
                            );
                        })}

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
                        <h3>Edit Vessel</h3>

                        {Object.entries(editData).map(([k, v]) => (
                            <input
                                key={k}
                                placeholder={k}
                                className="vt-input"
                                value={v}
                                onChange={e => setEditData({ ...editData, [k]: e.target.value })}
                            />
                        ))}

                        <div className="vt-modal-actions">
                            <button className="vt-btn-cancel" onClick={() => setIsEditOpen(false)}>Cancel</button>
                            <button className="vt-btn-save" onClick={handleSaveEdit}>Save</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
