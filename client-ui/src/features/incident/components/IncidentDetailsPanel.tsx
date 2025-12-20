import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import type { Incident } from "../domain/incident";
import "../style/incidents.css";
import { addVVEToIncident, removeVVEFromIncident, resolveIncident, deleteIncident } from "../services/incidentService";

export default function IncidentDetailsPanel({
                                                 selected,
                                                 onChanged,
                                                 onDeleted,
                                                 onClose,
                                             }: {
    selected: Incident | null;
    onChanged: (next: Incident) => void;
    onDeleted: (code: string) => void;
    onClose: () => void;
}) {
    const { t } = useTranslation();
    const [vveInput, setVveInput] = useState("");
    const [busy, setBusy] = useState(false);

    const isResolved = useMemo(() => !!selected?.endTime, [selected]);

    const handleResolve = async () => {
        if (!selected) return;
        setBusy(true);
        try {
            const updated = await resolveIncident(selected.code);
            toast.success(t("incident.success.resolved"));
            onChanged(updated);
        } catch (e) {
            toast.error((e as Error).message || t("incident.errors.resolveFailed"));
        } finally {
            setBusy(false);
        }
    };

    const handleDelete = async () => {
        if (!selected) return;
        const ok = window.confirm(t("incident.confirm.delete", { code: selected.code }));
        if (!ok) return;

        setBusy(true);
        try {
            await deleteIncident(selected.code);
            toast.success(t("incident.success.deleted"));
            onDeleted(selected.code);
        } catch (e) {
            toast.error((e as Error).message || t("incident.errors.deleteFailed"));
        } finally {
            setBusy(false);
        }
    };

    const handleAddVVE = async () => {
        if (!selected) return;
        const vve = vveInput.trim();
        if (!vve) return;

        setBusy(true);
        try {
            const updated = await addVVEToIncident(selected.code, vve);
            toast.success(t("incident.success.vveAdded"));
            setVveInput("");
            onChanged(updated);
        } catch (e) {
            toast.error((e as Error).message || t("incident.errors.vveAddFailed"));
        } finally {
            setBusy(false);
        }
    };

    const handleRemoveVVE = async (vve: string) => {
        if (!selected) return;
        setBusy(true);
        try {
            const updated = await removeVVEFromIncident(selected.code, vve);
            toast.success(t("incident.success.vveRemoved"));
            onChanged(updated);
        } catch (e) {
            toast.error((e as Error).message || t("incident.errors.vveRemoveFailed"));
        } finally {
            setBusy(false);
        }
    };

    if (!selected) return null;

    return (
        <>
            {/* Header Fixo do Modal */}
            <div className="in-details-header">
                <div>
                    <div className="in-title" style={{ fontSize: "1.2rem" }}>
                        {t("incident.details.title")}
                    </div>
                    <div className="in-subtitle">
                        <span className="in-mono">{selected.code}</span>
                        <span style={{ margin: "0 6px", color: "#cbd5e1" }}>|</span>
                        <span className="in-mono">{selected.incidentTypeCode}</span>
                    </div>
                </div>

                {/* Botão Fechar (X) */}
                <button className="in-close-btn" onClick={onClose} title={t("actions.close")}>
                    ✕
                </button>
            </div>

            {/* Corpo com Scroll */}
            <div className="in-details-body">

                {/* Barra de Ações */}
                <div className="in-actions" style={{ marginBottom: "1.5rem" }}>
                    {!isResolved && (
                        <button className="in-btn in-btn-primary" disabled={busy} onClick={handleResolve}>
                            {t("incident.actions.resolve")}
                        </button>
                    )}
                    <button className="in-btn in-btn-danger" disabled={busy} onClick={handleDelete}>
                        {t("actions.delete")}
                    </button>
                </div>

                {/* Grid de Informações Principais */}
                <div className="in-kv-grid">
                    <div className="in-kv">
                        <div className="in-k">{t("incident.fields.severity")}</div>
                        <div className="in-v">
              <span className={`in-pill in-pill-${selected.severity.toLowerCase()}`}>
                {t(`incident.severity.${selected.severity}`)}
              </span>
                        </div>
                    </div>

                    <div className="in-kv">
                        <div className="in-k">{t("incident.fields.impactMode")}</div>
                        <div className="in-v">
                            <span className="in-pill in-pill-neutral">{t(`incident.impact.${selected.impactMode}`)}</span>
                        </div>
                    </div>

                    <div className="in-kv">
                        <div className="in-k">{t("incident.fields.startTime")}</div>
                        <div className="in-v">{new Date(selected.startTime).toLocaleString()}</div>
                    </div>

                    <div className="in-kv">
                        <div className="in-k">{t("incident.fields.endTime")}</div>
                        <div className="in-v">{selected.endTime ? new Date(selected.endTime).toLocaleString() : "-"}</div>
                    </div>
                </div>

                {/* Descrição */}
                <div className="in-block">
                    <div className="in-block-title">{t("incident.fields.description")}</div>
                    <div className="in-desc">{selected.description || <span className="in-muted">-</span>}</div>
                </div>

                {/* Gestão de VVEs */}
                <div className="in-block">
                    <div className="in-block-title">{t("incident.fields.vves")}</div>

                    <div className="in-vve-bar">
                        <input
                            className="in-input"
                            value={vveInput}
                            onChange={(e) => setVveInput(e.target.value)}
                            placeholder={t("incident.vve.placeholder")}
                            style={{ flex: 1 }}
                        />
                        <button className="in-btn in-btn-ghost" onClick={handleAddVVE} disabled={busy || vveInput.trim() === ""}>
                            {t("incident.actions.addVve")}
                        </button>
                    </div>

                    {selected.vveList.length === 0 ? (
                        <div className="in-muted" style={{ fontStyle: "italic", fontSize: "0.85rem" }}>
                            {t("incident.vve.empty")}
                        </div>
                    ) : (
                        <div className="in-chip-wrap">
                            {selected.vveList.map((vve) => (
                                <div key={vve} className="in-chip">
                                    <span className="in-mono">{vve}</span>
                                    <button
                                        type="button"
                                        className="in-chip-x"
                                        onClick={() => handleRemoveVVE(vve)}
                                        disabled={busy}
                                        title={t("incident.actions.removeVve")}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {selected.upcomingWindowStartTime && selected.upcomingWindowEndTime && (
                    <div className="in-block">
                        <div className="in-block-title">{t("incident.fields.upcomingWindow")}</div>
                        <div className="in-muted">
                            {new Date(selected.upcomingWindowStartTime).toLocaleString()} —{" "}
                            {new Date(selected.upcomingWindowEndTime).toLocaleString()}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}