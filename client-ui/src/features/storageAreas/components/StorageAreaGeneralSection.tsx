import { useTranslation } from "react-i18next";
import type { CreatingStorageArea } from "../domain/storageArea";

type Props = {
    form: CreatingStorageArea;
    setField: (k: keyof CreatingStorageArea, v: any) => void;
};

export function StorageAreaGeneralSection({ form, setField }: Props) {
    const { t } = useTranslation();

    return (
        <div className="sa-section">
            <div className="sa-section-title">
                {t("storageAreas.create.generalInfo")}
            </div>

            <div className="sa-field">
                <label>{t("storageAreas.create.name")} *</label>
                <input
                    className="sa-input"
                    placeholder={t("storageAreas.create.name_PH")}
                    value={form.name ?? ""}
                    onChange={e => setField("name", e.target.value)}
                />
            </div>

            <div className="sa-field">
                <label>{t("storageAreas.create.description")}</label>
                <textarea
                    className="sa-textarea"
                    placeholder={t("storageAreas.create.description_PH")}
                    value={form.description ?? ""}
                    onChange={e => setField("description", e.target.value)}
                />
            </div>

            <div className="sa-field">
                <label>{t("storageAreas.create.type")} *</label>
                <select
                    className="sa-select"
                    value={form.type ?? "Yard"}
                    onChange={e => setField("type", e.target.value)}
                >
                    <option value="Yard">
                        {t("storageAreas.create.yard")}
                    </option>
                    <option value="Warehouse">
                        {t("storageAreas.create.warehouse")}
                    </option>
                </select>
            </div>

            <div className="sa-grid-3">
                <div className="sa-field">
                    <label>{t("storageAreas.create.bays")} *</label>
                    <input
                        className="sa-input"
                        type="number"
                        min={1}
                        value={form.maxBays ?? 1}
                        onChange={e =>
                            setField("maxBays", Number(e.target.value))
                        }
                    />
                </div>

                <div className="sa-field">
                    <label>{t("storageAreas.create.rows")} *</label>
                    <input
                        className="sa-input"
                        type="number"
                        min={1}
                        value={form.maxRows ?? 1}
                        onChange={e =>
                            setField("maxRows", Number(e.target.value))
                        }
                    />
                </div>

                <div className="sa-field">
                    <label>{t("storageAreas.create.tiers")} *</label>
                    <input
                        className="sa-input"
                        type="number"
                        min={1}
                        value={form.maxTiers ?? 1}
                        onChange={e =>
                            setField("maxTiers", Number(e.target.value))
                        }
                    />
                </div>
            </div>
        </div>
    );
}
