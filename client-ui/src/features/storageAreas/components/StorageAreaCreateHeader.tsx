import { useTranslation } from "react-i18next";

type Props = {
    onBack: () => void;
};

export function StorageAreaCreateHeader({ onBack }: Props) {
    const { t } = useTranslation();

    return (
        <div className="sa-create-header">
            <h2 className="sa-create-title">
                ➕ {t("storageAreas.create.title")}
            </h2>
            <button className="sa-btn sa-btn-cancel" onClick={onBack}>
                ← {t("storageAreas.create.btnBack")}
            </button>
        </div>
    );
}
