import { FaShip, FaPlus, FaSearch } from "react-icons/fa";
import { useTranslation } from "react-i18next";

type Props = {
    count: number;
    query: string;
    onQueryChange: (q: string) => void;
    onCreate: () => void;
};

export function StorageAreaHeader({ count, query, onQueryChange, onCreate }: Props) {
    const { t } = useTranslation();

    return (
        <div className="vt-title-area" style={{ marginBottom: "20px" }}>
            <div>
                <h2 className="vt-title">
                    <FaShip /> {t("storageAreas.list.title")}
                </h2>
                <p className="vt-sub">
                    {t("storageAreas.list.registered", { count })}
                </p>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
                <div
                    className="sa-search"
                    style={{ background: "var(--card-bg)", padding: "6px 10px" }}
                >
                    <FaSearch style={{ opacity: 0.7 }} />
                    <input
                        value={query}
                        onChange={e => onQueryChange(e.target.value)}
                        placeholder={t("storageAreas.list.searchPlaceholder") ?? ""}
                    />
                </div>

                <button className="vt-create-btn-top" onClick={onCreate}>
                    <FaPlus />{" "}
                    {t("storageAreas.create.btnAdd") ||
                        t("storageAreas.buttons.new")}
                </button>
            </div>
        </div>
    );
}
