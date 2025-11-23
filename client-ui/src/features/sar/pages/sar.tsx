import { useState, useEffect } from "react";
import {
  getSARs,
  getByName,
  getByEmail,
} from "../services/sarService";
import type { sar } from "../domain/sar";

import { mapSARDto } from "../mappers/sarMapper";

import { notifySuccess } from "../../../utils/notify";
import "../style/sarpage.css";
import { useTranslation } from "react-i18next";
import { FaUser } from "react-icons/fa";
import toast from "react-hot-toast";

import CreateModal from "../components/CreateModal";
import EditModal from "../components/EditModal";
import DeleteModal from "../components/DeleteModal";
import SARHeader from "../components/SARHeader";
import SARSearchBar from "../components/SARSearchBar";

export default function SARPage() {
  const { t } = useTranslation();

  const [items, setItems] = useState<sar[]>([]);
  const [filtered, setFiltered] = useState<sar[]>([]);
  const [selected, setSelected] = useState<sar | null>(null);

  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editModel, setEditModel] = useState<sar | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteModel, setDeleteModel] = useState<sar | null>(null);

  const [searchMode, setSearchMode] = useState<"email" | "name">("email");
  const [searchValue, setSearchValue] = useState("");

  async function runWithLoading<T>(promise: Promise<T>, loadingText: string) {
  const id = toast.loading(loadingText);
  try {
    const result = await promise;
    return result;
  } finally {
    toast.dismiss(id);
  }
}

  const loadData = async () => {
    setLoading(true);
    try {
      const sarDtos = await getSARs();
      const sars = sarDtos.map(mapSARDto);

      setItems(sars);
      setFiltered(sars);

      notifySuccess(t("sar.loadSuccess", { count: sars.length }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runWithLoading(loadData(), t("sar.loading"));
  }, [t]);

  const executeSearch = async () => {
    if (!searchValue.trim()) {
      setFiltered(items);
      return;
    }

    let result: sar[] = [];

    try {
      if (searchMode === "email") {
        const dto = await getByEmail({ address: searchValue });
        result = dto ? [mapSARDto(dto)] : [];
      } else if (searchMode === "name") {
        const dtos = await getByName(searchValue);
        result = dtos.map(mapSARDto);
      }
    } catch (err) {
      console.error(err);
      result = [];
    }

    setFiltered(result);
  };

  const refresh = async () => {
    await loadData();
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
    setEditModel(null);
    document.body.classList.remove("no-scroll");
  };

  const openDelete = () => {
    if (!selected) return;
    setDeleteModel({ ...selected });
    setSelected(null);
    setIsDeleteOpen(true);
    document.body.classList.add("no-scroll");
  };

  const closeDelete = () => {
    setIsDeleteOpen(false);
    setDeleteModel(null);
    document.body.classList.remove("no-scroll");
  };

  const handleSearchValueChange = (value: string) => {
    setSearchValue(value);
    if (!value) {
      setFiltered(items);
    }
  };

  const handleClearSearch = () => {
    setSearchValue("");
    setFiltered(items);
  };

  return (
    <div className="sar-page">
      {selected && <div className="vt-overlay" />}

      <SARHeader
        t={t}
        totalItems={items.length}
        onCreateClick={() => setIsCreateOpen(true)}
        icon={<FaUser />}
      />

      <SARSearchBar
        t={t}
        searchMode={searchMode}
        setSearchMode={setSearchMode}
        searchValue={searchValue}
        onSearchValueChange={handleSearchValueChange}
        onClearSearch={handleClearSearch}
        onExecuteSearch={executeSearch}
      />

      {/* Tabela */}
      {!loading && filtered.length === 0 ? (
        <p>{t("sar.empty")}</p>
      ) : (
        <div className="vt-table-wrapper">
          <table className="vt-table">
            <thead>
              <tr>
                <th>{t("sar.name") ?? "Name"}</th>
                <th>{t("sar.email") ?? "Email"}</th>
                <th>{t("sar.status") ?? "Status"}</th>
                <th>{t("sar.sao") ?? "SAO"}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => setSelected(s)}
                  className="vt-row"
                >
                  <td>{s.name}</td>
                  <td>{s.email.address}</td>
                  <td>
                    {s.status === "activated"
                      ? t("sar.active")
                      : s.status === "deactivated"
                      ? t("sar.inactive")
                      : s.status}
                  </td>
                  <td>{s.sao}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Slide detail */}
      {selected && (
        <div className="vt-slide">
          <button
            className="vt-slide-close"
            onClick={() => setSelected(null)}
          >
            ✕
          </button>

          <h3>{selected.name}</h3>
          <p>
            <strong>{t("sar.email")}:</strong> {selected.email.address}
          </p>
          <p>
            <strong>{t("sar.status")}: </strong>
            {selected.status === "activated"
              ? t("sar.active")
              : selected.status === "deactivated"
              ? t("sar.inactive")
              : selected.status}
          </p>
          <p>
            <strong>{t("sar.phone")}:</strong> {selected.phoneNumber.number}
          </p>
          <p>
            <strong>{t("sar.sao")}:</strong> {selected.sao}
          </p>

          <div className="vt-slide-actions">
            <button className="vt-btn-edit" onClick={openEdit}>
              {t("sar.edit")}
            </button>
            <button className="vt-btn-delete" onClick={openDelete}>
              {t("sar.delete")}
            </button>
          </div>
        </div>
      )}

      {isCreateOpen && (
        <CreateModal setIsCreateOpen={setIsCreateOpen} refresh={refresh} t={t} />
      )}
      {isEditOpen && editModel && (
        <EditModal
          editModel={editModel}
          closeEdit={closeEdit}
          refresh={refresh}
          t={t}
        />
      )}
      {isDeleteOpen && deleteModel && (
        <DeleteModal
          deleteModel={deleteModel}
          closeDelete={closeDelete}
          refresh={refresh}
          t={t}
        />
      )}
    </div>
  );
}
