import { useState } from "react";
import { updateSAR } from "../services/sarService";
import type { sar, UpdateSARRequest } from "../domain/sar";
import toast from "react-hot-toast";

interface EditModalProps {
  editModel: sar;
  closeEdit: () => void;
  refresh: () => Promise<void>;
  t: any;
}

/* ---------- Form interno de edição ---------- */

function EditSARForm({
  form,
  setForm,
  t,
}: {
  form: UpdateSARRequest;
  setForm: (
    f:
      | UpdateSARRequest
      | ((prev: UpdateSARRequest) => UpdateSARRequest)
  ) => void;
  t: any;
}) {
  return (
    <>
      <label>{t("sar.email")} *</label>
      <input
        type="email"
        className="vt-input"
        value={form.email.address}
        onChange={(e) => setForm({ ...form, email: { address: e.target.value } })}
      />

      <label>{t("sar.phone")} *</label>
      <input
        className="vt-input"
        value={form.phoneNumber.number}
        onChange={(e) =>
          setForm({ ...form, phoneNumber: { number: e.target.value } })
        }
      />

      <label>{t("sar.status")} *</label>
      <select
        className="vt-input"
        value={form.status}
        onChange={(e) =>
          setForm({
            ...form,
            status: e.target.value as UpdateSARRequest["status"],
          })
        }
      >
        <option value="activated">{t("sar.active")}</option>
        <option value="deactivated">{t("sar.inactive")}</option>
      </select>
    </>
  );
}

/* ---------- Modal de edição ---------- */

export default function EditModal({
  editModel,
  closeEdit,
  refresh,
  t,
}: EditModalProps) {
  const [form, setForm] = useState<UpdateSARRequest>({
    email: editModel.email,
    phoneNumber: editModel.phoneNumber,
    status: editModel.status,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSAR(editModel.email.address, form);
    toast.success(t("sar.updated"));
    await refresh();
    closeEdit();
  };

  return (
    <div className="vt-modal-overlay">
      <div className="vt-modal">
        <h3>{t("sar.edit")}</h3>
        <form onSubmit={submit}>
          <EditSARForm form={form} setForm={setForm} t={t} />
          <div className="vt-modal-actions">
            <button
              className="vt-btn-cancel"
              type="button"
              onClick={closeEdit}
            >
              {t("sar.cancel")}
            </button>
            <button className="vt-btn-save" type="submit">
              {t("sar.update")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
