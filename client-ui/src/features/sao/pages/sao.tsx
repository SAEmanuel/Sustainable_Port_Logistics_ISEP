import { useState, useEffect } from "react";

import {
    getSAOs,
    getByLegalName,
    getByTaxNumber,
    createSAO
} from "../services/saoService";

import type { SAO } from "../domain/sao";
import type { saoDTO } from "../dto/saoDTOs";
import { mapSAODto } from "../mappers/saoMapper";

import { notifySuccess } from "../../../utils/notify";
import "../style/saopage.css";

import { useTranslation } from "react-i18next";
import { FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";

import {
    Chart as ChartJS,
    BarElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend
} from "chart.js";

import SAOHeader from "../components/SAOHeader";
import SAOSearchBar from "../components/SAOSearchBar";
import type { SearchMode } from "../components/SAOSearchBar";
import SAOCreateModal from "../components/SAOCreateModal";
import SAODeleteModal from "../components/SAODeleteModal";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function SAOPage() {
    const [items, setItems] = useState<SAO[]>([]);
    const [filtered, setFiltered] = useState<SAO[]>([]);
    const [selected, setSelected] = useState<SAO | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deleteModel, setDeleteModel] = useState<SAO | null>(null);

    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const { t } = useTranslation();

    const [legalName, setLegalName] = useState("");
    const [altName, setAltName] = useState("");
    const [address, setAddress] = useState("");
    const [taxnumber, setTaxnumber] = useState("");

    const [searchMode, setSearchMode] = useState<SearchMode>("legalName");
    const [searchValue, setSearchValue] = useState("");

    const MIN_LOADING_TIME = 800;

    async function runWithLoading<T>(
        promise: Promise<T>,
        loadingText: string
    ): Promise<T> {
        const id = toast.loading(loadingText);
        const start = Date.now();

        try {
            const result = await promise;
            return result;
        } finally {
            const elapsed = Date.now() - start;
            if (elapsed < MIN_LOADING_TIME) {
                await new Promise(res =>
                    setTimeout(res, MIN_LOADING_TIME - elapsed)
                );
            }
            toast.dismiss(id);
        }
    }

    // ---------- LOAD INICIAL ----------
    useEffect(() => {
        runWithLoading<saoDTO[]>(getSAOs(), t("sao.loading"))
            .then((dtoList: saoDTO[]) => {
                const data: SAO[] = dtoList.map(mapSAODto);
                setItems(data);
                setFiltered(data);
                notifySuccess(t("sao.loadSuccess", { count: data.length }));
            })
            .finally(() => setLoading(false));
    }, [t]);

    // ---------- PESQUISA ----------
    const executeSearch = async () => {
        if (!searchValue.trim()) {
            setFiltered(items);
            return;
        }

        const p: Promise<saoDTO> =
            searchMode === "legalName"
                ? getByLegalName(searchValue)
                : getByTaxNumber(searchValue);

        const dto = await runWithLoading<saoDTO>(p, t("sao.loading")).catch(
            () => null
        );

        if (!dto) {
            setFiltered([]);
            return;
        }

        const result: SAO = mapSAODto(dto);
        setFiltered([result]);
        toast.success(t("sao.loadSuccess", { count: 1 }));
    };

    const clearSearchResults = () => {
        setFiltered(items);
    };

    // ---------- CRIAÇÃO ----------
    const handleCreate = async () => {
        if (!legalName.trim())
            return toast.error(t("sao.errors.legalNameRequired"));

        if (!taxnumber.trim())
            return toast.error(t("sao.errors.taxRequired"));

        const payload = {
            legalName,
            altName,
            address,
            taxnumber
        };

        const createdDto = await runWithLoading<saoDTO>(
            createSAO(payload),
            t("sao.loading")
        ).catch(() => null);

        if (!createdDto) return;

        toast.success(t("sao.created"));

        const dtoList: saoDTO[] = await getSAOs();
        const data: SAO[] = dtoList.map(mapSAODto);
        setItems(data);
        setFiltered(data);

        setIsCreateOpen(false);

        // reset form
        setLegalName("");
        setAltName("");
        setAddress("");
        setTaxnumber("");
    };

    // ---------- DELETE ----------
    const openDelete = () => {
        if (!selected) return;
        setDeleteModel(selected);
        setSelected(null);
        setIsDeleteOpen(true);
        document.body.classList.add("no-scroll");
    };

    const closeDelete = () => {
        setIsDeleteOpen(false);
        setDeleteModel(null);
        document.body.classList.remove("no-scroll");
    };

    const closeSlide = () => setSelected(null);

    return (
        <div className="sao-page">
            {selected && <div className="sao-overlay" />}

            {/* HEADER */}
            <SAOHeader
                count={items.length}
                onOpenCreate={() => setIsCreateOpen(true)}
                t={t}
            />

            {/* SEARCH BAR */}
            <SAOSearchBar
                searchMode={searchMode}
                searchValue={searchValue}
                onChangeSearchMode={setSearchMode}
                onChangeSearchValue={setSearchValue}
                onSearch={executeSearch}
                onClearResults={clearSearchResults}
                t={t}
            />

            {/* TABLE */}
            {loading ? null : filtered.length === 0 ? (
                <p>{t("sao.empty")}</p>
            ) : (
                <div className="sao-table-wrapper">
                    <table className="sao-table">
                        <thead>
                            <tr>
                                <th>{t("sao.details.legalName")}</th>
                                <th>{t("sao.details.altName")}</th>
                                <th>{t("sao.details.address")}</th>
                                <th>{t("sao.details.taxnumber")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(s => (
                                <tr
                                    key={s.legalName}
                                    className="sao-row"
                                    onClick={() => setSelected(s)}
                                >
                                    <td>{s.legalName}</td>
                                    <td>{s.altName}</td>
                                    <td>{s.address}</td>
                                    <td>{s.taxnumber.value}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* SLIDE PANEL */}
            {selected && (
                <div className="sao-slide">
                    <button
                        className="sao-slide-close"
                        onClick={closeSlide}
                    >
                        <FaTimes />
                    </button>

                    <h3>{selected.legalName}</h3>

                    <p>
                        <strong>{t("sao.details.altName")}:</strong>{" "}
                        {selected.altName}
                    </p>
                    <p>
                        <strong>{t("sao.details.address")}:</strong>{" "}
                        {selected.address}
                    </p>
                    <p>
                        <strong>{t("sao.details.taxnumber")}:</strong>{" "}
                        {selected.taxnumber.value}
                    </p>
                    <div className="vt-slide-actions">
                        <button className="vt-btn-delete" onClick={openDelete}>
                            {t("sao.delete")}
                        </button>
                    </div>
                </div>
            )}

            {/* CREATE MODAL */}
            <SAOCreateModal
                isOpen={isCreateOpen}
                legalName={legalName}
                altName={altName}
                address={address}
                taxnumber={taxnumber}
                onChangeLegalName={setLegalName}
                onChangeAltName={setAltName}
                onChangeAddress={setAddress}
                onChangeTaxnumber={setTaxnumber}
                onSave={handleCreate}
                onCancel={() => setIsCreateOpen(false)}
                t={t}
            />

            {/* DELETE MODAL */}
            <SAODeleteModal
                isOpen={isDeleteOpen}
                deleteModel={deleteModel}
                closeDelete={closeDelete}
                refresh={async () => {
                    const dtoList: saoDTO[] = await getSAOs();
                    const data: SAO[] = dtoList.map(mapSAODto);
                    setItems(data);
                    setFiltered(data);
                }}
                t={t}
            />
        </div>
    );
}
