import toast from "react-hot-toast";
import type { SAO } from "../domain/sao";
import { deleteSAO } from "../services/saoService";

interface SAODeleteModalProps {
    isOpen: boolean;
    deleteModel: SAO | null;
    closeDelete: () => void;
    refresh: () => Promise<void>;
    t: any;
}

export default function SAODeleteModal({
    isOpen,
    deleteModel,
    closeDelete,
    refresh,
    t
}: SAODeleteModalProps) {
    if (!isOpen || !deleteModel) return null;

    const model = deleteModel;

    async function handleDelete() {
        await deleteSAO(model.legalName);
        toast.success(t("sao.deleted"));
        await refresh();
        closeDelete();
    }

    return (
        <div className="sao-modal-overlay">
            <div className="sao-modal sao-modal-delete">
                <h3>{t("sao.delete")}</h3>
                <p>
                    {t("sao.details.legalName")}:{" "}
                    <strong>{model.legalName}</strong>
                    <br />
                    {t("sao.details.altName")}:{" "}
                    <strong>{model.altName}</strong>
                    <br />
                    {t("sao.details.address")}:{" "}
                    <strong>{model.address}</strong>
                    <br />
                    {t("sao.details.taxnumber")}:{" "}
                    <strong>{model.taxnumber.value}</strong>
                </p>

                <div className="sao-modal-actions">
                    <button className="vt-btn-cancel" onClick={closeDelete}>
                        {t("sao.cancel")}
                    </button>
                    <button className="vt-btn-delete" onClick={handleDelete}>
                        {t("sao.delete")}
                    </button>
                </div>
            </div>
        </div>
    );
}
