import "../style/dataRightsStyle.css";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { useAuth0 } from "@auth0/auth0-react";

import adminDataRightsService from "../service/dataRightsAdminService";
import { mapRequestsDto } from "../mappers/dataRightsMapper";
import type { DataRightsRequest } from "../domain/dataRights";

import { AdminDataRightsHeader } from "../components/admin/AdminDataRightsHeader";
import { AdminDataRightsStrip } from "../components/admin/AdminDataRightsStrip";
import { AdminRequestDetailsModal } from "../components/admin/AdminRequestDetailsModal";

export default function DataRightsAdminPage() {
    const { t } = useTranslation();
    const { user } = useAuth0();

    const [items, setItems] = useState<DataRightsRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [busyAction, setBusyAction] = useState(false);

    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState<DataRightsRequest | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const email = user?.email ?? "";

    async function reload() {
        if (!email) return;
        try {
            setLoading(true);

            const [waitingDtos, mineDtos] = await Promise.all([
                adminDataRightsService.getWaitingForAssignment(),
                adminDataRightsService.getForResponsible(email),
            ]);

            const allDtos = [...waitingDtos, ...mineDtos];
            const byId = new Map<string, DataRightsRequest>();
            mapRequestsDto(allDtos).forEach(r => {
                byId.set(r.id, r);
            });

            const list = Array.from(byId.values()).sort((a, b) =>
                a.createdOn.value.localeCompare(b.createdOn.value),
            );

            setItems(list);
            if (list.length && !selected) {
                setSelected(list[0]);
            }
        } catch (e: any) {
            const msg =
                e?.response?.data?.detail ??
                e?.response?.data?.message ??
                e?.message ??
                t(
                    "dataRights.admin.loadError",
                    "Error loading admin data rights requests",
                );
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (email) void reload();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [email]);

    const filtered = useMemo(() => {
        if (!query.trim()) return items;
        const q = query.toLowerCase();
        return items.filter(r => {
            const txt = `${r.requestId} ${r.userEmail} ${r.type} ${r.status} ${
                r.processedBy ?? ""
            }`.toLowerCase();
            return txt.includes(q);
        });
    }, [items, query]);

    const stats = useMemo(() => {
        const total = items.length;
        const waiting = items.filter(
            r => r.status === "WaitingForAssignment",
        ).length;
        const inProgress = items.filter(
            r => r.status === "InProgress",
        ).length;
        const completed = items.filter(
            r => r.status === "Completed",
        ).length;
        const rejected = items.filter(
            r => r.status === "Rejected",
        ).length;

        return { total, waiting, inProgress, completed, rejected };
    }, [items]);

    function handleSelect(r: DataRightsRequest) {
        setSelected(r);
        setIsDetailsOpen(true);
    }

    async function handleAssignToMe() {
        if (!selected || !email) return;
        try {
            setBusyAction(true);
            const updated = await adminDataRightsService.assignResponsible(
                selected.requestId,
                email,
            );
            toast.success(
                t(
                    "dataRights.admin.assignSuccess",
                    "Request assigned to you",
                ),
            );

            await reload();
            setSelected(prev =>
                prev && prev.requestId === updated.requestId
                    ? { ...prev, ...updated }
                    : prev,
            );
        } catch (e: any) {
            const msg =
                e?.response?.data?.detail ??
                e?.response?.data?.message ??
                e?.message ??
                t(
                    "dataRights.admin.assignError",
                    "Error assigning request",
                );
            toast.error(msg);
        } finally {
            setBusyAction(false);
        }
    }

    async function handleRespond() {
        if (!selected) return;

        try {
            setBusyAction(true);

            if (selected.type === "Access") {
                await adminDataRightsService.respondAccess(
                    selected.requestId,
                );
                toast.success(
                    t(
                        "dataRights.admin.respondAccessSuccess",
                        "Access response generated and emailed",
                    ),
                );
            } else if (selected.type === "Deletion") {
                await adminDataRightsService.respondDeletion(
                    selected.requestId,
                );
                toast.success(
                    t(
                        "dataRights.admin.respondDeletionSuccess",
                        "Deletion request processed",
                    ),
                );
            }

            await reload();
            setIsDetailsOpen(false);
        } catch (e: any) {
            const msg =
                e?.response?.data?.detail ??
                e?.response?.data?.message ??
                e?.message ??
                t(
                    "dataRights.admin.respondError",
                    "Error responding to request",
                );
            toast.error(msg);
        } finally {
            setBusyAction(false);
        }
    }

    return (
        <div className="dr-wrapper dr-admin-wrapper">
            <AdminDataRightsHeader
                stats={stats}
                query={query}
                onQueryChange={setQuery}
            />

            <div className="dr-metrics-row">
                <div className="dr-metric-card">
                    <span className="label">
                        {t("dataRights.metrics.total", "Total")}
                    </span>
                    <span className="value">{stats.total}</span>
                </div>
                <div className="dr-metric-card">
                    <span className="label">
                        {t(
                            "dataRights.metrics.waiting",
                            "Waiting for assignment",
                        )}
                    </span>
                    <span className="value">{stats.waiting}</span>
                </div>
                <div className="dr-metric-card">
                    <span className="label">
                        {t(
                            "dataRights.metrics.inProgress",
                            "In progress",
                        )}
                    </span>
                    <span className="value">{stats.inProgress}</span>
                </div>
                <div className="dr-metric-card">
                    <span className="label">
                        {t(
                            "dataRights.metrics.completed",
                            "Completed",
                        )}
                    </span>
                    <span className="value success">
                        {stats.completed}
                    </span>
                </div>
                <div className="dr-metric-card">
                    <span className="label">
                        {t(
                            "dataRights.metrics.rejected",
                            "Rejected",
                        )}
                    </span>
                    <span className="value danger">
                        {stats.rejected}
                    </span>
                </div>
            </div>

            <AdminDataRightsStrip
                items={filtered}
                loading={loading}
                selectedId={selected?.id ?? null}
                onSelect={handleSelect}
            />

            <AdminRequestDetailsModal
                request={selected}
                open={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                onAssignToMe={handleAssignToMe}
                onRespond={handleRespond}
                isBusy={busyAction}
            />
        </div>
    );
}
