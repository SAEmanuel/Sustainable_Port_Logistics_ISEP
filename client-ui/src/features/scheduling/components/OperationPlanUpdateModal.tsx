import React, { useEffect, useMemo, useState } from "react";
import {
    Modal,
    Group,
    Stack,
    Text,
    Select,
    Textarea,
    Button,
    Divider,
    Badge,
    Table,
    NumberInput,
    ScrollArea,
    Alert,
    Box,
    TextInput,
} from "@mantine/core";
import { IconAlertTriangle, IconCheck } from "@tabler/icons-react";

import { SchedulingService } from "../services/SchedulingService";
import type {
    SaveScheduleDto,
    SchedulingOperationDto,
    UpdateOperationPlanForVvnDto,
    UpdateOperationPlanResultDto,
} from "../dtos/scheduling.dtos";

import { useAppStore } from "../../../app/store";
import "../style/operationPlanUpdateModal.css";

type Props = {
    opened: boolean;
    onClose: () => void;

    plan: (SaveScheduleDto & { domainId?: string; _id?: string }) | null;
    defaultVvnId?: string;

    token?: string;
    onUpdated?: (result: UpdateOperationPlanResultDto) => void;
};

function normalizePlanId(plan: any): string | null {
    return plan?.domainId || plan?._id || null;
}

function uniqueVvns(ops: SchedulingOperationDto[]) {
    const map = new Map<string, { vvnId: string; label: string }>();

    for (const op of ops || []) {
        const vvnId = op.vvnId;
        if (!vvnId) continue;

        const vessel = (op.vessel || "Unknown").trim();
        const dock = (op.dock || "").trim();
        const label = dock ? `${vessel} • ${dock}` : vessel;

        if (!map.has(vvnId)) map.set(vvnId, { vvnId, label });
    }

    return Array.from(map.values());
}

function cloneOps(list: SchedulingOperationDto[]): SchedulingOperationDto[] {
    return (list || []).map((op) => ({
        ...op,
        staffAssignments: (op.staffAssignments || []).map((s: any) => ({ ...s })),
    }));
}

function formatHourWithDayOffset(hours?: number) {
    if (hours === undefined || hours === null || Number.isNaN(Number(hours))) return "-";
    const raw = Number(hours);
    const day = raw >= 0 ? Math.floor(raw / 24) : 0;
    const h = ((raw % 24) + 24) % 24;
    const hhmm = `${String(Math.floor(h)).padStart(2, "0")}:00`;
    return day > 0 ? `${hhmm} +${day}d` : hhmm;
}

function dedupeBlockingCodesFromMessage(msg: string) {
    // Ex: "Plano ...: CRANE_CAPACITY_EXCEEDED, CRANE_OVERLAP, CRANE_CAPACITY_EXCEEDED"
    const parts = msg.split(":");
    if (parts.length < 2) return msg;

    const prefix = parts[0].trim();
    const rest = parts.slice(1).join(":").trim();

    const codes = rest
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);

    if (codes.length === 0) return msg;

    const uniq = Array.from(new Set(codes));
    return `${prefix}: ${uniq.join(", ")}`;
}

export default function OperationPlanUpdateModal({
                                                     opened,
                                                     onClose,
                                                     plan,
                                                     defaultVvnId,
                                                     token,
                                                     onUpdated,
                                                 }: Props) {
    const userEmail = useAppStore((s) => s.user?.email) || "Unknown";
    const author = userEmail;

    const planId = useMemo(() => normalizePlanId(plan), [plan]);

    // base ops (imutável) por VVN
    const baseOpsByVvn = useMemo(() => {
        const ops = (plan?.operations || []) as SchedulingOperationDto[];
        const map: Record<string, SchedulingOperationDto[]> = {};
        for (const op of ops) {
            if (!op?.vvnId) continue;
            if (!map[op.vvnId]) map[op.vvnId] = [];
            map[op.vvnId].push(op);
        }
        return map;
    }, [plan]);

    // opções base do select (sem sufixos)
    const baseVvnOptions = useMemo(() => {
        const ops = (plan?.operations || []) as SchedulingOperationDto[];
        return uniqueVvns(ops).map((x) => ({ value: x.vvnId, label: x.label }));
    }, [plan]);

    // drafts por VVN (persistem ao trocar no Select)
    const [draftOpsByVvn, setDraftOpsByVvn] = useState<Record<string, SchedulingOperationDto[]>>({});

    // vvns com alterações pendentes
    const [dirtyVvns, setDirtyVvns] = useState<Set<string>>(new Set());

    const [vvnId, setVvnId] = useState<string | null>(null);
    const [reason, setReason] = useState("");
    const [savingCurrent, setSavingCurrent] = useState(false);
    const [savingAll, setSavingAll] = useState(false);

    const [warnings, setWarnings] = useState<{ code: string; message: string; severity: string }[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // garantir draft carregado (cópia do base) quando seleccionas uma VVN
    const ensureDraft = (id: string) => {
        setDraftOpsByVvn((prev) => {
            if (prev[id]) return prev;
            const base = cloneOps(baseOpsByVvn[id] || []);
            return { ...prev, [id]: base };
        });
    };

    const markDirty = (id: string, isDirty: boolean) => {
        setDirtyVvns((prev) => {
            const next = new Set(prev);
            if (isDirty) next.add(id);
            else next.delete(id);
            return next;
        });
    };

    // quando abre modal: reset de estado e seleção inicial
    useEffect(() => {
        if (!opened) return;

        setError(null);
        setSuccessMsg(null);
        setWarnings([]);
        setReason("");

        // recomeçar drafts do zero ao abrir (evita “leaks” entre planos diferentes)
        setDraftOpsByVvn({});
        setDirtyVvns(new Set());

        const initial = defaultVvnId || baseVvnOptions[0]?.value || null;
        setVvnId(initial);

        if (initial) ensureDraft(initial);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [opened, defaultVvnId, planId, baseVvnOptions.length]);

    // ao trocar vvn no Select: garantir draft
    const handleChangeVvn = (next: string | null) => {
        setVvnId(next);
        if (next) ensureDraft(next);
        setError(null);
        setSuccessMsg(null);
        setWarnings([]);
    };

    // draft atual
    const currentOpsDraft = useMemo(() => {
        if (!vvnId) return [];
        return draftOpsByVvn[vvnId] || [];
    }, [vvnId, draftOpsByVvn]);

    // select com sufixo "(editado)" para vvns dirty
    const vvnOptions = useMemo(() => {
        return baseVvnOptions.map((o) => {
            const edited = dirtyVvns.has(o.value);
            return { value: o.value, label: edited ? `${o.label} (editado)` : o.label };
        });
    }, [baseVvnOptions, dirtyVvns]);

    // atualizar operação na VVN atual
    const updateCurrentOp = (localIdx: number, patch: Partial<SchedulingOperationDto>) => {
        if (!vvnId) return;

        setDraftOpsByVvn((prev) => {
            const list = prev[vvnId] ? [...prev[vvnId]] : cloneOps(baseOpsByVvn[vvnId] || []);
            const existing = list[localIdx];
            if (!existing) return prev;

            list[localIdx] = { ...existing, ...patch };
            return { ...prev, [vvnId]: list };
        });

        markDirty(vvnId, true);
    };

    const resetCurrentVvn = () => {
        if (!vvnId) return;
        setDraftOpsByVvn((prev) => ({
            ...prev,
            [vvnId]: cloneOps(baseOpsByVvn[vvnId] || []),
        }));
        markDirty(vvnId, false);
        setError(null);
        setSuccessMsg(null);
        setWarnings([]);
    };

    const pendingCount = dirtyVvns.size;

    // =========================
    // TABELA: mostrar também VVNs já editadas
    // =========================
    type Row = SchedulingOperationDto & {
        __vvnId: string;
        __vvnLabel: string;
        __editable: boolean;
        __localIndex?: number; // índice dentro da VVN atual
    };

    const labelById = useMemo(() => {
        const m = new Map<string, string>();
        for (const o of baseVvnOptions) m.set(o.value, o.label);
        return m;
    }, [baseVvnOptions]);

    const tableRows: Row[] = useMemo(() => {
        if (!vvnId) return [];

        const currentLabel = labelById.get(vvnId) ?? vvnId;

        const currentRows: Row[] = (currentOpsDraft || []).map((op, i) => ({
            ...op,
            __vvnId: vvnId,
            __vvnLabel: currentLabel,
            __editable: true,
            __localIndex: i,
        }));

        // outras vvns dirty (read-only), vindas do draft
        const otherEdited = Array.from(dirtyVvns).filter((id) => id !== vvnId);

        const otherRows: Row[] = otherEdited.flatMap((id) => {
            const label = labelById.get(id) ?? id;
            const ops = draftOpsByVvn[id] || [];
            return ops.map((op) => ({
                ...op,
                __vvnId: id,
                __vvnLabel: label,
                __editable: false,
            }));
        });

        // junta tudo e ordena por start planeado (para parecer “timeline”)
        const all = [...currentRows, ...otherRows];
        all.sort((a, b) => Number(a.startTime) - Number(b.startTime));

        return all;
    }, [vvnId, currentOpsDraft, dirtyVvns, draftOpsByVvn, labelById]);

    // =========================
    // validação
    // =========================
    const validateOps = (ops: SchedulingOperationDto[]) => {
        if (!ops || ops.length === 0) return false;
        for (const op of ops) {
            const st = Number(op.startTime);
            const en = Number(op.endTime);
            if (!Number.isFinite(st) || !Number.isFinite(en)) return false;
            if (en <= st) return false;
            if (!op.crane || op.crane.trim().length === 0) return false;
        }
        return true;
    };

    const canSaveCurrent = useMemo(() => {
        if (!planId || !vvnId) return false;
        if (!author || author.trim().length < 3) return false;
        if (!reason || reason.trim().length < 3) return false;
        if (!dirtyVvns.has(vvnId)) return false;
        return validateOps(currentOpsDraft);
    }, [planId, vvnId, author, reason, dirtyVvns, currentOpsDraft]);

    const canSaveAll = useMemo(() => {
        if (!planId) return false;
        if (pendingCount === 0) return false;
        if (!author || author.trim().length < 3) return false;
        if (!reason || reason.trim().length < 3) return false;

        for (const id of Array.from(dirtyVvns)) {
            const ops = draftOpsByVvn[id] || [];
            if (!validateOps(ops)) return false;
        }
        return true;
    }, [planId, pendingCount, author, reason, dirtyVvns, draftOpsByVvn]);

    const buildPayload = (id: string): UpdateOperationPlanForVvnDto => {
        const ops = draftOpsByVvn[id] || [];
        return {
            planDomainId: planId as string,
            vvnId: id,
            reasonForChange: reason.trim(),
            author: author.trim(),
            operations: ops.map((op) => ({
                ...op,
                startTime: Number(op.startTime),
                endTime: Number(op.endTime),
            })),
        };
    };

    const handleSaveCurrent = async () => {
        if (!vvnId) return;

        setSavingCurrent(true);
        setError(null);
        setSuccessMsg(null);
        setWarnings([]);

        try {
            const payload = buildPayload(vvnId);
            const result = await SchedulingService.updateOperationPlanForVvn(payload, token);

            setWarnings((result.warnings || []) as any);
            setSuccessMsg("VVN atual guardada com sucesso.");
            onUpdated?.(result);

            // após guardar com sucesso: deixar de estar “dirty”
            markDirty(vvnId, false);
        } catch (e: any) {
            const msg = e?.message || "Erro ao atualizar o plano.";
            setError(dedupeBlockingCodesFromMessage(msg));
        } finally {
            setSavingCurrent(false);
        }
    };

    const handleSaveAll = async () => {
        setSavingAll(true);
        setError(null);
        setSuccessMsg(null);
        setWarnings([]);

        try {
            if (!planId) throw new Error("Plano inválido.");

            const updates = Array.from(dirtyVvns).map((id) => ({
                vvnId: id,
                operations: (draftOpsByVvn[id] || []).map((op) => ({
                    ...op,
                    startTime: Number(op.startTime),
                    endTime: Number(op.endTime),
                })),
            }));

            const payload = {
                planDomainId: planId,
                reasonForChange: reason.trim(),
                author: author.trim(),
                updates,
            };

            const result = await SchedulingService.updateOperationPlanBatch(payload, token);

            setWarnings(result.warnings || []);
            setSuccessMsg(`Guardado com sucesso (${updates.length} VVN).`);
            onUpdated?.(result);

            setDirtyVvns(new Set()); // limpar pendências
        } catch (e: any) {
            setError(e?.message || "Erro ao atualizar o plano.");
        } finally {
            setSavingAll(false);
        }
    };


    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title="Atualizar Operation Plan (VVN)"
            centered
            overlayProps={{ blur: 2 }}
            size={1120}
            classNames={{
                content: "opUpdateModal__content",
                header: "opUpdateModal__header",
                title: "opUpdateModal__title",
                body: "opUpdateModal__body",
                close: "opUpdateModal__close",
            }}
        >
            <Stack gap="md" className="opUpdateModal">
                {!plan && (
                    <Alert icon={<IconAlertTriangle size={16} />} color="red" title="Sem plano selecionado">
                        Selecione um plano para editar.
                    </Alert>
                )}

                {plan && (
                    <>
                        <Group justify="space-between" align="flex-end" className="opUpdateModal__topRow">
                            <Select
                                label="VVN"
                                placeholder="Selecione a VVN"
                                data={vvnOptions}
                                value={vvnId}
                                onChange={handleChangeVvn}
                                searchable
                                className="opUpdateModal__vvnSelect"
                            />

                            <TextInput label="Autor" value={author} readOnly className="opUpdateModal__author" />
                        </Group>

                        <Group justify="space-between" align="center">
                            <Text size="sm" c="dimmed">
                                Alterações pendentes: {pendingCount}
                            </Text>

                            <Button
                                variant="light"
                                onClick={resetCurrentVvn}
                                disabled={!vvnId || !dirtyVvns.has(vvnId)}
                            >
                                Repor VVN atual
                            </Button>
                        </Group>

                        <Textarea
                            label="Motivo da alteração (obrigatório)"
                            placeholder="Ex: Ajuste de planeamento para remover conflito de grua/capacidade"
                            value={reason}
                            onChange={(e) => setReason(e.currentTarget.value)}
                            minRows={2}
                            autosize
                            className="opUpdateModal__reason"
                        />

                        <Divider />

                        <Group justify="space-between" align="center">
                            <Text fw={700}>Operações</Text>
                            <Text size="sm" c="dimmed">
                                Edite apenas o planeado (Start/End) e a grua. Chegada/Partida real são informativas.
                            </Text>
                        </Group>

                        <Box className="opUpdateModal__tableWrap">
                            <ScrollArea h={420} type="auto">
                                <Table withColumnBorders striped highlightOnHover className="opUpdateModal__table">
                                    <Table.Thead>
                                        <Table.Tr>
                                            <Table.Th>VVN</Table.Th>
                                            <Table.Th>Navio</Table.Th>
                                            <Table.Th>Doca</Table.Th>
                                            <Table.Th className="opUpdateModal__colSmall">Start Planeado (h)</Table.Th>
                                            <Table.Th className="opUpdateModal__colSmall">End Planeado (h)</Table.Th>
                                            <Table.Th className="opUpdateModal__colTime">Chegada Real</Table.Th>
                                            <Table.Th className="opUpdateModal__colTime">Partida Real</Table.Th>
                                            <Table.Th className="opUpdateModal__colCrane">Grua</Table.Th>
                                            <Table.Th>Staff</Table.Th>
                                        </Table.Tr>
                                    </Table.Thead>

                                    <Table.Tbody>
                                        {tableRows.map((op, idx) => {
                                            const editable = op.__editable;
                                            const li = op.__localIndex;

                                            return (
                                                <Table.Tr
                                                    key={`${op.__vvnId}-${op.vessel}-${idx}`}
                                                    style={{ opacity: editable ? 1 : 0.65, cursor: editable ? "default" : "pointer" }}
                                                    onClick={() => {
                                                        if (!editable) handleChangeVvn(op.__vvnId);
                                                    }}
                                                >
                                                    <Table.Td>
                                                        <Group gap="xs" wrap="nowrap">
                                                            <Text size="sm">{op.__vvnLabel}</Text>
                                                            {!editable && <Badge variant="light">editado</Badge>}
                                                        </Group>
                                                    </Table.Td>

                                                    <Table.Td className="opUpdateModal__cellStrong">{op.vessel}</Table.Td>
                                                    <Table.Td>{op.dock}</Table.Td>

                                                    <Table.Td>
                                                        {editable ? (
                                                            <NumberInput
                                                                value={op.startTime}
                                                                onChange={(v) => {
                                                                    if (li === undefined) return;
                                                                    updateCurrentOp(li, {
                                                                        startTime: v === null ? (undefined as any) : Number(v),
                                                                    });
                                                                }}
                                                                min={0}
                                                                step={1}
                                                                hideControls
                                                                className="opUpdateModal__numberInput"
                                                            />
                                                        ) : (
                                                            <Text>{op.startTime}</Text>
                                                        )}
                                                    </Table.Td>

                                                    <Table.Td>
                                                        {editable ? (
                                                            <NumberInput
                                                                value={op.endTime}
                                                                onChange={(v) => {
                                                                    if (li === undefined) return;
                                                                    updateCurrentOp(li, {
                                                                        endTime: v === null ? (undefined as any) : Number(v),
                                                                    });
                                                                }}
                                                                min={0}
                                                                step={1}
                                                                hideControls
                                                                className="opUpdateModal__numberInput"
                                                            />
                                                        ) : (
                                                            <Text>{op.endTime}</Text>
                                                        )}
                                                    </Table.Td>

                                                    <Table.Td>
                                                        <Text className="opUpdateModal__realTime">{formatHourWithDayOffset(op.realArrivalTime)}</Text>
                                                    </Table.Td>

                                                    <Table.Td>
                                                        <Text className="opUpdateModal__realTime">{formatHourWithDayOffset(op.realDepartureTime)}</Text>
                                                    </Table.Td>

                                                    <Table.Td>
                                                        <TextInput
                                                            value={op.crane}
                                                            onChange={(e) => {
                                                                if (!editable || li === undefined) return;
                                                                updateCurrentOp(li, { crane: e.currentTarget.value });
                                                            }}
                                                            disabled={!editable}
                                                            placeholder="Ex: MCRAN-0001"
                                                            className="opUpdateModal__textInput"
                                                        />
                                                    </Table.Td>

                                                    <Table.Td>
                                                        <TextInput
                                                            value={(op.staffAssignments || []).map((s: any) => s.staffMemberName).join(", ")}
                                                            onChange={() => {}}
                                                            disabled
                                                            className="opUpdateModal__textInput"
                                                        />
                                                    </Table.Td>
                                                </Table.Tr>
                                            );
                                        })}
                                    </Table.Tbody>
                                </Table>
                            </ScrollArea>
                        </Box>

                        {warnings.length > 0 && (
                            <Stack gap={6} className="opUpdateModal__warnings">
                                <Text fw={700}>Avisos de consistência</Text>

                                <Group gap="xs" wrap="wrap">
                                    {warnings.map((w, i) => (
                                        <Badge
                                            key={`${w.code}-${i}`}
                                            color={w.severity === "blocking" ? "red" : w.severity === "warning" ? "orange" : "blue"}
                                            variant="light"
                                        >
                                            {w.code}
                                        </Badge>
                                    ))}
                                </Group>

                                <Stack gap={4}>
                                    {warnings.map((w, i) => (
                                        <Text key={i} size="sm" c="dimmed">
                                            • [{w.severity}] {w.message}
                                        </Text>
                                    ))}
                                </Stack>
                            </Stack>
                        )}

                        {error && (
                            <Alert icon={<IconAlertTriangle size={16} />} color="red" title="Erro">
                                {error}
                            </Alert>
                        )}

                        {successMsg && (
                            <Alert icon={<IconCheck size={16} />} color="green" title="Sucesso">
                                {successMsg}
                            </Alert>
                        )}

                        <Group justify="flex-end" className="opUpdateModal__footer">
                            <Button variant="default" onClick={onClose}>
                                Cancelar
                            </Button>

                            <Button
                                onClick={handleSaveCurrent}
                                loading={savingCurrent}
                                disabled={!canSaveCurrent || savingAll}
                            >
                                Guardar VVN atual
                            </Button>

                            <Button
                                onClick={handleSaveAll}
                                loading={savingAll}
                                disabled={!canSaveAll || savingCurrent}
                                variant="light"
                            >
                                Guardar tudo ({pendingCount})
                            </Button>
                        </Group>
                    </>
                )}
            </Stack>
        </Modal>
    );
}
