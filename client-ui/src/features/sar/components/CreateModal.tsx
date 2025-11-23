import { useState, useEffect } from "react";
import { createSAR } from "../services/sarService";
import { getSAOs } from "../../sao/services/saoService";
import type { SAO } from "../../sao/domain/sao";
import type { CreateSARRequest} from "../domain/sar";
import type { Status} from "../domain/valueObjects"
import { NATIONALITIES } from "../constants/nationalities";
import toast from "react-hot-toast";

interface CreateModalProps {
  setIsCreateOpen: (v: boolean) => void;
  refresh: () => Promise<void>;
  t: any;
}

/* ---------- Form interno para criação ---------- */

function CreateSARForm({
  form,
  setForm,
  t,
}: {
  form: CreateSARRequest;
  setForm: (
    f:
      | CreateSARRequest
      | ((prev: CreateSARRequest) => CreateSARRequest)
  ) => void;
  t: any;
}) {
  const [saoList, setSaoList] = useState<SAO[]>([]);

  useEffect(() => {
    getSAOs()
      .then((res) => setSaoList(res))
      .catch((err) => console.error("Failed to load SAOs", err));
  }, []);

  const updateField = (
    field: keyof CreateSARRequest,
    value: string,
    nestedKey?: string
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: nestedKey
        ? { ...(prev as any)[field], [nestedKey]: value }
        : value,
    }));
  };

  return (
    <>
      <label>{t("sar.name")} *</label>
      <input
        className="vt-input"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />

      <label>{t("sar.citizenId")} *</label>
      <input
        className="vt-input"
        value={form.citizenId.passportNumber}
        onChange={(e) =>
          updateField("citizenId", e.target.value, "passportNumber")
        }
      />

      <label>{t("sar.nationality")} *</label>
      <select
        className="vt-input"
        value={form.nationality}
        onChange={(e) =>
          setForm((prev) => ({
            ...prev,
            nationality: e.target.value,
          }))
        }
      >
        <option value="">{}</option>
        {NATIONALITIES.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>

      <label>{t("sar.sao")} *</label>
      <select
        className="vt-input"
        value={form.Sao}
        onChange={(e) => updateField("Sao", e.target.value)}
      >
        <option value="">{t("")}</option>
        {saoList.map((sao) => (
          <option
            key={sao.shippingOrganizationCode.value}
            value={sao.legalName}
          >
            {sao.legalName}
          </option>
        ))}
      </select>

      <label>{t("sar.email")} *</label>
      <input
        type="email"
        className="vt-input"
        value={form.email.address}
        onChange={(e) =>
          setForm({ ...form, email: { address: e.target.value } })
        }
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
          setForm((prev) => ({
            ...prev,
            status: e.target.value as Status,
          }))
        }
      >
        <option value="activated">{t("sar.active")}</option>
        <option value="deactivated">{t("sar.inactive")}</option>
      </select>
    </>
  );
}


export default function CreateModal({
  setIsCreateOpen,
  refresh,
  t,
}: CreateModalProps) {
  const [form, setForm] = useState<CreateSARRequest>({
    name: "",
    citizenId: { passportNumber: "" },
    nationality: "",
    email: { address: "" },
    phoneNumber: { number: "" },
    status: "activated",
    Sao: "",
  });

  const submit = async (e: React.FormEvent) => {
  e.preventDefault();

  const errors: string[] = [];

  if (!form.name.trim()) {
    errors.push(t("sar.nameRequired"));
  }

  if (!form.citizenId.passportNumber.trim()) {
    errors.push(t("sar.idRequired"));
  }

  if (!form.phoneNumber.number.trim()) {
    errors.push(t("sar.phoneRequired"));
  }

  if (!form.nationality.trim()) {
    errors.push(t("sar.nationalityRequired"));
  }

  if (!form.Sao.trim()) {
    errors.push(t("sar.saoRequired"));
  }

  if (!form.email.address.trim()) {
    errors.push(t("sar.emailRequired"));
  }

  if (errors.length > 0) {
    errors.forEach((err) => toast.error(err));
    return;
  }

  await createSAR(form);
  toast.success(t("sar.created"));
  await refresh();
  setIsCreateOpen(false);
};

  return (
    <div className="vt-modal-overlay">
      <div className="vt-modal">
        <h3>{t("sar.add")}</h3>
        <form onSubmit={submit}>
          <CreateSARForm form={form} setForm={setForm} t={t} />
          <div className="vt-modal-actions">
            <button
              className="vt-btn-cancel"
              type="button"
              onClick={() => setIsCreateOpen(false)}
            >
              {t("sar.cancel")}
            </button>
            <button className="vt-btn-save" type="submit">
              {t("sar.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
