import { useTranslation } from "react-i18next";
import type { StorageArea } from "../domain/storageArea";

function classNames(...xs: (string | false | null | undefined)[]) {
    return xs.filter(Boolean).join(" ");
}

type Props = {
    items: StorageArea[];
    loading: boolean;
    selectedId: string | null;
    onSelect: (sa: StorageArea) => void;
};

export function StorageAreaStrip({ items, loading, selectedId, onSelect }: Props) {
    const { t } = useTranslation();

    return (
        <div className="sa-strip">
            <div className="sa-strip-inner">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div className="sa-strip-skeleton" key={i} />
                    ))
                ) : items.length === 0 ? (
                    <div className="sa-empty" style={{ padding: 10 }}>
                        {t("storageAreas.list.noResults")}
                    </div>
                ) : (
                    items.map(x => {
                        const active = selectedId === x.id;
                        return (
                            <button
                                key={x.id}
                                className={classNames("sa-card-mini", active && "active")}
                                onClick={() => onSelect(x)}
                            >
                                <div className="sa-card-mini-top">
                                    <span className="sa-card-mini-name">{x.name}</span>
                                    <span
                                        className={`sa-badge-modern ${x.type.toLowerCase()}`}
                                    >
                                        {x.type}
                                    </span>
                                </div>
                                <div className="sa-card-mini-bottom">
                                    {x.currentCapacityTeu}/{x.maxCapacityTeu} TEU
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}
