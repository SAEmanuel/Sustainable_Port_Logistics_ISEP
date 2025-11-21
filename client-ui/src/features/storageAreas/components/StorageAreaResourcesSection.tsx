import { useTranslation } from "react-i18next";
import type { CreatingStorageArea } from "../domain/storageArea";

type Props = {
    form: CreatingStorageArea;

    newRes: string;
    setNewRes: (v: string) => void;
    addRes: () => void;
    remRes: (v: string) => void;

    newDock: string;
    setNewDock: (v: string) => void;
    newDist: number | "";
    setNewDist: (v: number | "") => void;
    addDock: () => void;
    remDock: (code: string) => void;
};

export function StorageAreaResourcesSection({
                                                form,
                                                newRes,
                                                setNewRes,
                                                addRes,
                                                remRes,
                                                newDock,
                                                setNewDock,
                                                newDist,
                                                setNewDist,
                                                addDock,
                                                remDock,
                                            }: Props) {
    const { t } = useTranslation();

    return (
        <div className="sa-section">
            <div className="sa-section-title">
                {t("storageAreas.create.resourcesDocks")}
            </div>

            {/* Recursos físicos */}
            <div className="sa-field">
                <label>{t("storageAreas.create.addResource")}</label>
                <div className="sa-inline">
                    <input
                        className="sa-input"
                        placeholder={t("storageAreas.create.resource_PH")}
                        value={newRes ?? ""}
                        onChange={e => setNewRes(e.target.value)}
                    />
                    <button
                        type="button"
                        className="sa-chip-btn"
                        onClick={addRes}
                    >
                        +
                    </button>
                </div>
            </div>

            <div className="sa-box">
                {form.physicalResources.length === 0
                    ? t("storageAreas.create.noResources")
                    : form.physicalResources.map(r => (
                        <span
                            key={r}
                            className="sa-chip"
                            onClick={() => remRes(r)}
                        >
                              {r} ✕
                          </span>
                    ))}
            </div>

            {/* Distâncias a docks */}
            <div className="sa-field">
                <label>{t("storageAreas.create.dockDistance")} *</label>

                <input
                    className="sa-input"
                    placeholder={t("storageAreas.create.dock_PH")}
                    value={newDock ?? ""}
                    onChange={e => setNewDock(e.target.value)}
                />

                <input
                    className="sa-input"
                    type="number"
                    min={0}
                    placeholder={t("storageAreas.create.distance_PH")}
                    value={newDist === "" ? "" : String(newDist)}
                    onChange={e =>
                        setNewDist(
                            e.target.value === "" ? "" : Number(e.target.value)
                        )
                    }
                />

                <button
                    type="button"
                    className="sa-chip-btn"
                    onClick={addDock}
                >
                    +
                </button>
            </div>

            <div className="sa-box">
                {form.distancesToDocks.length === 0
                    ? t("storageAreas.create.noDistance")
                    : form.distancesToDocks.map(d => (
                        <span
                            key={d.dockCode}
                            className="sa-chip"
                            onClick={() => remDock(d.dockCode)}
                        >
                              {d.dockCode}: {d.distance}m ✕
                          </span>
                    ))}
            </div>
        </div>
    );
}
