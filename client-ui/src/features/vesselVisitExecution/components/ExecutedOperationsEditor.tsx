import { useEffect, useMemo, useState } from "react";
import {
    Accordion,
    ActionIcon,
    Badge,
    Button,
    Divider,
    Group,
    NumberInput,
    Paper,
    Select,
    Stack,
    Text,
    TextInput,
    Title,
} from "@mantine/core";
import { DatePicker, TimeInput } from "@mantine/dates";
import { IconCheck, IconClockHour4, IconPlus, IconTrash, IconRefresh } from "@tabler/icons-react";
import { notifyError, notifySuccess } from "../../../utils/notify";
import type { IOperationDTO, IOperationPlanDTO } from "../services/operationPlanService";
import { getLatestPlanWithVvnOps } from "../services/operationPlanService";
import { updateExecutedOperationsVVE } from "../services/vveExecutedOperationsService";
import { operationsApi } from "../../../services/api.tsx";

/* ===========================
   Tipos
=========================== */

type ResourceUsedDto = {
    resourceId: string;
    hours?: number;
    quantity?: number;
};

type ExecutedOperationDraft = {
    plannedOperationId: string;
    actualStart?: string; // ISO
    actualEnd?: string; // ISO
    status?: "started" | "completed" | "delayed";
    note?: string;
    resourcesUsed: ResourceUsedDto[];
};

type ExecutedOperationFromBackend = {
    plannedOperationId: string;
    actualStart?: string;
    actualEnd?: string;
    status?: "started" | "completed" | "delayed";
    note?: string;
    resourcesUsed?: ResourceUsedDto[];
    updatedAt?: string;
    updatedBy?: string;
};

type VVEBackend = {
    id?: string;
    _id?: string;
    executedOperations?: ExecutedOperationFromBackend[];
};

/* ===========================
   Helpers de datas
=========================== */

function hhmm(d: Date) {
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function safeDate(iso?: string): Date | null {
    if (!iso) return null;
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
}

function timeFromISO(iso?: string): string {
    const d = safeDate(iso);
    return d ? hhmm(d) : "";
}

function combineLocal(date: Date | null, time: string): Date | null {
    if (!date || !time) return null;
    const [h, m] = time.split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    const d = new Date(date);
    d.setHours(h, m, 0, 0);
    return d;
}

function plannedDateFromPlan(planDateISO: string | undefined, hourNumber: number): Date {
    const base = planDateISO ? new Date(planDateISO) : new Date();
    const d = new Date(base);
    d.setHours(0, 0, 0, 0);
    d.setHours(d.getHours() + (hourNumber ?? 0));
    return d;
}

// Mantine pode passar Date ou string dependendo da versão/typing.
// Aceitamos unknown e normalizamos.
function toDateValue(v: unknown): Date | null {
    if (!v) return null;
    if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
    if (typeof v === "string") {
        const d = new Date(v);
        return isNaN(d.getTime()) ? null : d;
    }
    return null;
}

function isSameDay(a: Date, b: Date) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

// pinta o dia selecionado
function selectedDayStyle(selected: Date | null) {
    return (day: unknown) => {
        const d = toDateValue(day);
        const isSelected = !!selected && !!d && isSameDay(d, selected);

        return {
            style: isSelected
                ? {
                    backgroundColor: "var(--mantine-color-teal-6)",
                    color: "var(--mantine-color-white)",
                    borderRadius: 999,
                    fontWeight: 700,
                }
                : undefined,
        };
    };
}

/* ===========================
   Backend: buscar VVE (para ler executedOperations)
=========================== */
async function getVVEByIdRaw(vveId: string): Promise<VVEBackend> {
    const res = await operationsApi.get(`/api/vve/${vveId}`);
    const data = Array.isArray(res.data) ? res.data[0] : res.data;
    if (!data) throw new Error("VVE not found");
    return data as VVEBackend;
}

/* ===========================
   Componente
=========================== */

export function ExecutedOperationsEditor(props: { vveId: string; vvnId: string; operatorId: string }) {
    const { vveId, vvnId, operatorId } = props;

    const [loading, setLoading] = useState(false);
    const [loadingExisting, setLoadingExisting] = useState(false);
    const [plan, setPlan] = useState<IOperationPlanDTO | null>(null);
    const [plannedOps, setPlannedOps] = useState<IOperationDTO[]>([]);
    const [drafts, setDrafts] = useState<Record<string, ExecutedOperationDraft>>({});
    const [saving, setSaving] = useState(false);

    // chave visual (accordion) – estável
    const opKey = (op: IOperationDTO, idx: number) => `${vvnId}-${idx}`;

    // ID que vai para o backend (tem de bater com o plannedOperationId que o backend guarda!)
    const plannedOperationIdOf = (op: IOperationDTO, idx: number) => {
        const anyOp = op as any;
        return String(anyOp.plannedOperationId ?? anyOp.id ?? anyOp._id ?? `${vvnId}-${idx}`);
    };

    /* ===========================
       Load plan + existing executed ops
    =========================== */

    const loadEverything = async () => {
        setLoading(true);
        try {
            // 1) carregar plan
            const p = await getLatestPlanWithVvnOps(vvnId, 120);

            const ops: IOperationDTO[] = (p?.operations ?? [])
                .filter((o) => (o as any).vvnId === vvnId)
                .sort((a: any, b: any) => (a.startTime ?? 0) - (b.startTime ?? 0));

            setPlan(p ?? null);
            setPlannedOps(ops);

            // 2) inicializar drafts por operação planeada
            const baseDrafts: Record<string, ExecutedOperationDraft> = {};
            ops.forEach((op, idx) => {
                const key = opKey(op, idx);
                baseDrafts[key] = {
                    plannedOperationId: plannedOperationIdOf(op, idx),
                    resourcesUsed: [],
                };
            });

            setDrafts(baseDrafts);

            // 3) carregar executedOperations já guardadas e fazer merge
            setLoadingExisting(true);
            try {
                const vve = await getVVEByIdRaw(vveId);
                const existing = vve.executedOperations ?? [];

                const byPlannedId = new Map<string, ExecutedOperationFromBackend>();
                existing.forEach((e) => {
                    if (e?.plannedOperationId) byPlannedId.set(String(e.plannedOperationId), e);
                });

                setDrafts((prev) => {
                    const next = { ...prev };
                    Object.keys(next).forEach((k) => {
                        const plannedId = next[k].plannedOperationId;
                        const hit = byPlannedId.get(plannedId);
                        if (!hit) return;

                        next[k] = {
                            ...next[k],
                            actualStart: hit.actualStart ?? next[k].actualStart,
                            actualEnd: hit.actualEnd ?? next[k].actualEnd,
                            status: hit.status ?? next[k].status,
                            note: hit.note ?? next[k].note,
                            resourcesUsed: hit.resourcesUsed ?? next[k].resourcesUsed ?? [],
                        };
                    });
                    return next;
                });
            } finally {
                setLoadingExisting(false);
            }
        } catch (e: any) {
            notifyError(e?.message ?? "Erro ao carregar Operation Plan / execuções.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let mounted = true;
        (async () => {
            if (!mounted) return;
            await loadEverything();
        })();
        return () => {
            mounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vvnId, vveId]);

    /* ===========================
       Draft helpers
    =========================== */

    const setDraft = (key: string, patch: Partial<ExecutedOperationDraft>) =>
        setDrafts((prev) => ({
            ...prev,
            [key]: { ...prev[key], ...patch },
        }));

    const addResource = (key: string) =>
        setDrafts((prev) => ({
            ...prev,
            [key]: {
                ...prev[key],
                resourcesUsed: [...(prev[key].resourcesUsed ?? []), { resourceId: "" }],
            },
        }));

    const setResource = (key: string, idx: number, patch: Partial<ResourceUsedDto>) =>
        setDrafts((prev) => {
            const list = [...(prev[key].resourcesUsed ?? [])];
            list[idx] = { ...list[idx], ...patch };
            return { ...prev, [key]: { ...prev[key], resourcesUsed: list } };
        });

    const removeResource = (key: string, idx: number) =>
        setDrafts((prev) => {
            const list = [...(prev[key].resourcesUsed ?? [])];
            list.splice(idx, 1);
            return { ...prev, [key]: { ...prev[key], resourcesUsed: list } };
        });

    const copyPlannedTimes = (key: string, op: IOperationDTO) => {
        const ps = plannedDateFromPlan(plan?.planDate, (op as any).startTime ?? 0);
        const pe = plannedDateFromPlan(plan?.planDate, (op as any).endTime ?? 0);

        setDraft(key, {
            actualStart: ps.toISOString(),
            actualEnd: pe.toISOString(),
        });
    };

    /* ===========================
       Save + refresh
    =========================== */

    const handleSave = async () => {
        const operations = Object.entries(drafts)
            .map(([key, d]) => ({
                plannedOperationId: d.plannedOperationId ?? key,
                actualStart: d.actualStart,
                actualEnd: d.actualEnd,
                status: d.status,
                note: d.note,
                resourcesUsed: (d.resourcesUsed ?? []).filter((r) => r.resourceId?.trim()?.length > 0),
            }))
            .filter(
                (d) =>
                    d.actualStart ||
                    d.actualEnd ||
                    d.status ||
                    (d.resourcesUsed?.length ?? 0) > 0 ||
                    (d.note?.trim()?.length ?? 0) > 0
            );

        if (operations.length === 0) {
            notifyError("Nada para guardar.");
            return;
        }

        setSaving(true);
        try {
            await updateExecutedOperationsVVE(vveId, { operatorId, operations });

            // refresh para confirmar e preencher o UI com o que ficou mesmo na BD
            await loadEverything();

            notifySuccess("Execução atualizada (confirmado por refresh).");
        } catch (e: any) {
            notifyError(e?.response?.data?.message || e?.message || "Erro ao guardar.");
        } finally {
            setSaving(false);
        }
    };

    /* ===========================
       UI helpers
    =========================== */

    const plannedLabel = (op: IOperationDTO) => {
        const ps = plannedDateFromPlan(plan?.planDate, (op as any).startTime ?? 0);
        const pe = plannedDateFromPlan(plan?.planDate, (op as any).endTime ?? 0);
        return `${ps.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}–${pe.toLocaleTimeString(
            "pt-PT",
            { hour: "2-digit", minute: "2-digit" }
        )}`;
    };

    const statusBadge = (status?: ExecutedOperationDraft["status"]) => {
        if (!status) return <Badge variant="light" color="gray">SEM ESTADO</Badge>;
        const color = status === "completed" ? "green" : status === "delayed" ? "orange" : "teal";
        return (
            <Badge variant="filled" color={color}>
                {status.toUpperCase()}
            </Badge>
        );
    };

    const headerBadge = useMemo(() => {
        if (loading) return <Badge variant="light" color="gray">A carregar…</Badge>;
        if (!plannedOps.length) return <Badge variant="light" color="orange">Sem operações</Badge>;
        return <Badge variant="light" color="teal">{plannedOps.length} planeadas</Badge>;
    }, [loading, plannedOps.length]);

    return (
        <Stack gap="md">
            <Group justify="space-between">
                <Title order={4}>Operações (Planeadas → Executadas)</Title>
                <Group gap="xs">
                    {headerBadge}
                    <ActionIcon
                        variant="light"
                        onClick={loadEverything}
                        disabled={loading || saving}
                        title="Recarregar"
                    >
                        <IconRefresh size={18} />
                    </ActionIcon>
                </Group>
            </Group>

            {!plannedOps.length && !loading ? (
                <Paper withBorder p="md" radius="md">
                    <Text c="dimmed" size="sm">
                        Não existem operações planeadas para este VVN.
                    </Text>
                </Paper>
            ) : (
                <Accordion variant="separated" radius="md">
                    {plannedOps.map((op, idx) => {
                        const key = opKey(op, idx);
                        const d =
                            drafts[key] ??
                            ({ plannedOperationId: plannedOperationIdOf(op, idx), resourcesUsed: [] } as ExecutedOperationDraft);

                        const plannedStart = plannedDateFromPlan(plan?.planDate, (op as any).startTime ?? 0);
                        const plannedEnd = plannedDateFromPlan(plan?.planDate, (op as any).endTime ?? 0);

                        const actualStartDate = safeDate(d.actualStart);
                        const actualEndDate = safeDate(d.actualEnd);
                        const actualStartTime = timeFromISO(d.actualStart);
                        const actualEndTime = timeFromISO(d.actualEnd);

                        return (
                            <Accordion.Item key={key} value={key}>
                                <Accordion.Control>
                                    <Group justify="space-between" w="100%">
                                        <Text fw={700}>Operação #{idx + 1}</Text>
                                        <Group gap="xs">
                                            {statusBadge(d.status)}
                                        </Group>
                                    </Group>
                                </Accordion.Control>

                                <Accordion.Panel>
                                    <Stack gap="sm">
                                        <Paper withBorder p="sm" radius="md" bg="gray.0">
                                            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                                                Dados planeados
                                            </Text>
                                            <Group justify="space-between" mt={4}>
                                                <Text size="sm">Load: {(op as any).loadingDuration}m</Text>
                                                <Text size="sm">Unload: {(op as any).unloadingDuration}m</Text>
                                                <Text size="sm">
                                                    Cranes: {(op as any).craneCountUsed}/{(op as any).totalCranesOnDock}
                                                </Text>
                                            </Group>
                                        </Paper>

                                        <Group justify="space-between" align="center">
                                            <Text fw={700}>Execução</Text>
                                            <Button
                                                size="xs"
                                                variant="light"
                                                leftSection={<IconClockHour4 size={16} />}
                                                onClick={() => copyPlannedTimes(key, op)}
                                            >
                                                Copiar tempos do planeado
                                            </Button>
                                        </Group>

                                        <Group grow align="start">
                                            <Stack gap={6}>
                                                <Text size="sm" fw={600}>
                                                    Actual start
                                                </Text>

                                                <DatePicker
                                                    value={actualStartDate}
                                                    getDayProps={selectedDayStyle(actualStartDate)}
                                                    onChange={(v) => {
                                                        const picked = toDateValue(v);
                                                        const dt = combineLocal(
                                                            picked,
                                                            actualStartTime || hhmm(plannedStart)
                                                        );
                                                        setDraft(key, { actualStart: dt ? dt.toISOString() : undefined });
                                                    }}
                                                />

                                                <TimeInput
                                                    value={actualStartTime}
                                                    onChange={(e) => {
                                                        const base = actualStartDate ?? plannedStart;
                                                        const dt = combineLocal(base, e.currentTarget.value);
                                                        setDraft(key, { actualStart: dt ? dt.toISOString() : undefined });
                                                    }}
                                                    withSeconds={false}
                                                />
                                            </Stack>

                                            <Stack gap={6}>
                                                <Text size="sm" fw={600}>
                                                    Actual end
                                                </Text>

                                                <DatePicker
                                                    value={actualEndDate}
                                                    getDayProps={selectedDayStyle(actualEndDate)}
                                                    onChange={(v) => {
                                                        const picked = toDateValue(v);
                                                        const dt = combineLocal(
                                                            picked,
                                                            actualEndTime || hhmm(plannedEnd)
                                                        );
                                                        setDraft(key, { actualEnd: dt ? dt.toISOString() : undefined });
                                                    }}
                                                />

                                                <TimeInput
                                                    value={actualEndTime}
                                                    onChange={(e) => {
                                                        const base = actualEndDate ?? plannedEnd;
                                                        const dt = combineLocal(base, e.currentTarget.value);
                                                        setDraft(key, { actualEnd: dt ? dt.toISOString() : undefined });
                                                    }}
                                                    withSeconds={false}
                                                />
                                            </Stack>
                                        </Group>

                                        <Select
                                            label="Estado"
                                            placeholder="Seleciona…"
                                            value={d.status ?? null}
                                            onChange={(val) => setDraft(key, { status: (val as any) ?? undefined })}
                                            data={[
                                                { value: "started", label: "started" },
                                                { value: "completed", label: "completed" },
                                                { value: "delayed", label: "delayed" },
                                            ]}
                                        />

                                        <TextInput
                                            label="Nota"
                                            placeholder="Opcional…"
                                            value={d.note ?? ""}
                                            onChange={(e) => setDraft(key, { note: e.currentTarget.value })}
                                        />

                                        <Divider label="Recursos usados" labelPosition="center" />

                                        <Stack gap="xs">
                                            {(d.resourcesUsed ?? []).map((r, rIdx) => (
                                                <Paper key={rIdx} withBorder p="sm" radius="md">
                                                    <Group align="end">
                                                        <TextInput
                                                            label="Resource ID"
                                                            placeholder="ex: crane-01"
                                                            value={r.resourceId}
                                                            onChange={(e) =>
                                                                setResource(key, rIdx, {
                                                                    resourceId: e.currentTarget.value,
                                                                })
                                                            }
                                                            style={{ flex: 2 }}
                                                        />
                                                        <NumberInput
                                                            label="Horas"
                                                            min={0}
                                                            value={r.hours ?? undefined}
                                                            onChange={(v) =>
                                                                setResource(key, rIdx, {
                                                                    hours: typeof v === "number" ? v : undefined,
                                                                })
                                                            }
                                                            style={{ flex: 1 }}
                                                        />
                                                        <NumberInput
                                                            label="Quantidade"
                                                            min={0}
                                                            value={r.quantity ?? undefined}
                                                            onChange={(v) =>
                                                                setResource(key, rIdx, {
                                                                    quantity: typeof v === "number" ? v : undefined,
                                                                })
                                                            }
                                                            style={{ flex: 1 }}
                                                        />
                                                        <ActionIcon
                                                            color="red"
                                                            variant="light"
                                                            onClick={() => removeResource(key, rIdx)}
                                                        >
                                                            <IconTrash size={16} />
                                                        </ActionIcon>
                                                    </Group>
                                                </Paper>
                                            ))}

                                            <Button
                                                size="xs"
                                                variant="light"
                                                leftSection={<IconPlus size={16} />}
                                                onClick={() => addResource(key)}
                                            >
                                                Adicionar recurso
                                            </Button>
                                        </Stack>

                                        {loadingExisting ? (
                                            <Text size="xs" c="dimmed">
                                                A sincronizar valores guardados…
                                            </Text>
                                        ) : null}
                                    </Stack>
                                </Accordion.Panel>
                            </Accordion.Item>
                        );
                    })}
                </Accordion>
            )}

            <Group justify="flex-end">
                <Button
                    color="teal"
                    leftSection={<IconCheck size={18} />}
                    onClick={handleSave}
                    loading={saving}
                    disabled={loading || plannedOps.length === 0}
                >
                    Guardar execução
                </Button>
            </Group>
        </Stack>
    );
}
