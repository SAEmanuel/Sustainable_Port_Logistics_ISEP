import { deleteSAR } from "../services/sarService";
import type { sar } from "../domain/sar";
import toast from "react-hot-toast";

interface DeleteModalProps {
  deleteModel: sar;
  closeDelete: () => void;
  refresh: () => Promise<void>;
  t: any;
}

export default function DeleteModal({
  deleteModel,
  closeDelete,
  refresh,
  t,
}: DeleteModalProps) {
  const model = deleteModel;

  async function handleDelete() {
    await deleteSAR(model.id);
    toast.success(t("sar.deleted"));
    await refresh();
    closeDelete();
  }

  return (
    <div className="vt-modal-overlay">
      <div className="vt-modal vt-modal-delete">
        <h3>{t("sar.delete")}</h3>
        <p>
          {t("sar.name")}: <strong>{model.name}</strong>
          <br />
          {t("sar.email")}: <strong>{model.email.address}</strong>
          <br />
          {t("sar.phone")}: <strong>{model.phoneNumber.number}</strong>
          <br />
          {t("sar.sao")}: <strong>{model.sao}</strong>
        </p>

        <div className="vt-modal-actions">
          <button className="vt-btn-cancel" onClick={closeDelete}>
            {t("sar.cancel")}
          </button>
          <button className="vt-btn-delete" onClick={handleDelete}>
            {t("sar.delete")}
          </button>
        </div>
      </div>
    </div>
  );
}
