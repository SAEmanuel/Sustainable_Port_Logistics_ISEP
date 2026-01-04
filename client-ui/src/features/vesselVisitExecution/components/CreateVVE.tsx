/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    Container, Title, Text, Card, Group, Button,
    TextInput, Modal, Stack, Box, Center, Loader,
    Avatar, ThemeIcon, Paper, Stepper, Grid, Badge,
    Collapse, Divider, ActionIcon, ScrollArea, Select
} from '@mantine/core';
import { DatePicker, TimeInput } from '@mantine/dates';
import '@mantine/dates/styles.css';

import {
    IconSearch, IconCalendarEvent, IconCheck, IconShip,
    IconAnchor, IconClockHour4, IconPlus,
    IconUsers, IconBox, IconChevronDown, IconChevronUp,
    IconInfoCircle, IconX, IconArrowLeft, IconUser, IconDeviceFloppy
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import { notifySuccess, notifyError } from "../../../utils/notify";

import VvnService from '../../vesselVisitNotification/service/vvnService';
import { VesselVisitExecutionService } from '../services/vesselVisitExecutionService';
import { apiGetVesselByIMO } from '../../vessels/services/vesselService';
import type { VesselVisitNotificationDto, FilterAcceptedVvnStatusDto } from '../../vesselVisitNotification/dto/vvnTypesDtos';
import type { VesselVisitExecution } from '../domain/vesselVisitExecution';
import { getDocks } from '../../docks/services/dockService';
import { updateBerthDockVVE } from "../services/vveBerthDockService";

import { useAppStore } from "../../../app/store";
import { ExecutedOperationsEditor } from "../components/ExecutedOperationsEditor";

const GLOBAL_VESSEL_CACHE: Record<string, string> = {};

const formatDateOnly = (date: any) => {
    if (!date) return "Selecione uma data";
    const dObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dObj.getTime())) return "Data Inválida";
    return dObj.toLocaleDateString('pt-PT');
};

const formatNumericDateTime = (date: any, timeStr?: string) => {
    if (!date) return "--/--/----";
    const dObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dObj.getTime())) return "Data Inválida";

    try {
        const dStr = dObj.toLocaleDateString('pt-PT');
        let t = timeStr;
        if (!t) {
            t = `${dObj.getHours().toString().padStart(2, '0')}:${dObj.getMinutes().toString().padStart(2, '0')}`;
        }
        return `${dStr} ${t}`;
    } catch {
        return "Erro Data";
    }
};

const formatRelativeTime = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "-";

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 1) return "Agora";
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours} h`;

    return formatNumericDateTime(date);
};

type VesselVisitExecutionExtended =
    Omit<VesselVisitExecution, "vvnId" | "actualBerthTime" | "actualDockId" | "auditLog"> & {
    vvnId: string;
    creatorEmail?: string;

    actualBerthTime?: string;
    actualDockId?: string;

    dockDiscrepancyNote?: string;
    note?: string;

    updatedAt?: string;
    auditLog?: Array<{
        at: string;
        by: string;
        action: string;
        note?: string;
        changes?: unknown;
        _id?: string;
    }>;
};

export default function VesselVisitExecutionPage() {
    const { t } = useTranslation();
    const user = useAppStore((state) => state.user);

    const isMounted = useRef(true);
    const effectRan = useRef(false);
    const timeInputRef = useRef<HTMLInputElement>(null);

    const [history, setHistory] = useState<VesselVisitExecutionExtended[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [vesselNames, setVesselNames] = useState<Record<string, string>>(GLOBAL_VESSEL_CACHE);

    const [detailsModalOpen, { open: openDetails, close: closeDetails }] = useDisclosure(false);
    const [selectedHistoryItem, setSelectedHistoryItem] = useState<VesselVisitExecutionExtended | null>(null);
    const [selectedHistoryVvn, setSelectedHistoryVvn] = useState<VesselVisitNotificationDto | null>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const [wizardOpen, { open: openWizard, close: closeWizard }] = useDisclosure(false);
    const [activeStep, setActiveStep] = useState(0);
    const [candidates, setCandidates] = useState<VesselVisitNotificationDto[]>([]);
    const [loadingCandidates, setLoadingCandidates] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [selectedVvn, setSelectedVvn] = useState<VesselVisitNotificationDto | null>(null);
    const [dateVal, setDateVal] = useState<Date | null>(new Date());
    const [timeVal, setTimeVal] = useState<string>("");
    const [submitting, setSubmitting] = useState(false);
    const [expandedVvnId, setExpandedVvnId] = useState<string | null>(null);

    const [editBerthOpen, { open: openEditBerth, close: closeEditBerth }] = useDisclosure(false);
    const [berthDate, setBerthDate] = useState<Date | null>(new Date());
    const [berthTime, setBerthTime] = useState<string>("");
    const [dockId, setDockId] = useState<string>("");
    const [savingBerth, setSavingBerth] = useState(false);
    const berthTimeRef = useRef<HTMLInputElement>(null);

    const [dockOptions, setDockOptions] = useState<Array<{ value: string; label: string }>>([]);
    const [loadingDockOptions, setLoadingDockOptions] = useState(false);

    const [auditOpen, setAuditOpen] = useState(false);
    const [loadingAudit, setLoadingAudit] = useState(false);
    const [auditFetchedByVveId, setAuditFetchedByVveId] = useState<Record<string, boolean>>({});

    const [executedOpsOpen, { open: openExecutedOps, close: closeExecutedOps }] = useDisclosure(false);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        if (!detailsModalOpen) return;

        if (dockOptions.length === 0 && !loadingDockOptions) {
            void fetchDockOptions();
        }
    }, [detailsModalOpen, dockOptions.length, loadingDockOptions]);

    const updateCache = (id: string, name: string) => {
        GLOBAL_VESSEL_CACHE[id] = name;
        if (isMounted.current) setVesselNames(prev => ({ ...prev, [id]: name }));
    };

    const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
            const data = await VesselVisitExecutionService.getAll() as unknown as VesselVisitExecutionExtended[];
            const sorted = data.sort((a, b) => new Date(b.actualArrivalTime as any).getTime() - new Date(a.actualArrivalTime as any).getTime());

            if (isMounted.current) {
                setHistory(sorted);
                setLoadingHistory(false);
            }

            for (const vve of sorted) {
                if (!isMounted.current) break;
                if (GLOBAL_VESSEL_CACHE[vve.vvnId]) continue;
                try {
                    const vvn = await VvnService.getVvnById(vve.vvnId);
                    if (vvn && (vvn as any).vesselImo) {
                        const imo = (vvn as any).vesselImo as string;
                        if (GLOBAL_VESSEL_CACHE[imo]) {
                            updateCache(vve.vvnId, GLOBAL_VESSEL_CACHE[imo]);
                        } else {
                            const vessel = await apiGetVesselByIMO(imo);
                            if (vessel?.name) {
                                updateCache(vve.vvnId, vessel.name);
                                updateCache(imo, vessel.name);
                            }
                        }
                    }
                } catch {
                    // ignore
                }
                await new Promise(r => setTimeout(r, 20));
            }
        } catch (error) {
            console.error(error);
            if (isMounted.current) notifyError(t('common.errorLoading') || "Error loading history");
        } finally {
            if (isMounted.current) setLoadingHistory(false);
        }
    };

    useEffect(() => {
        if (!effectRan.current) {
            void fetchHistory();
            effectRan.current = true;
        }
    }, []);

    const toStr = (x: any) => {
        if (x == null) return "";
        if (typeof x === "string") return x;
        if (typeof x === "number" || typeof x === "boolean") return String(x);
        if (typeof x === "object" && "value" in x) return String((x as any).value ?? "");
        return String(x);
    };

    const normalizeDockOptions = (docks: any[]) =>
        (docks ?? [])
            .map((d) => {
                const id = toStr(d?.id || d?.dockId || d?._id);
                const code = toStr(d?.code || d?.dockCode || d?.name);
                const label = (code || id).trim();
                if (!id || !label) return null;
                return { value: id, label };
            })
            .filter(Boolean) as Array<{ value: string; label: string }>;

    const fetchDockOptions = async () => {
        setLoadingDockOptions(true);
        try {
            const docks = await getDocks();
            const options = normalizeDockOptions(docks as any);
            if (isMounted.current) setDockOptions(options);
        } catch {
            notifyError("Erro ao carregar docks.");
        } finally {
            if (isMounted.current) setLoadingDockOptions(false);
        }
    };

    const dockCodeById = useMemo(() => {
        const m: Record<string, string> = {};
        dockOptions.forEach(o => { m[o.value] = o.label; });
        return m;
    }, [dockOptions]);

    const prettifyDockNote = (note?: string) => {
        if (!note) return note;

        const id = selectedHistoryItem?.actualDockId;
        if (!id) return note;

        const code = dockCodeById[id];
        if (!code) return note;

        return note.replaceAll(id, code);
    };

    const prettifyAnyDockNote = (note?: string) => {
        if (!note) return note;

        let out = note;
        for (const [id, code] of Object.entries(dockCodeById)) {
            if (!id || !code) continue;
            out = out.replaceAll(id, code);
        }
        return out;
    };

    const getPlannedDockRaw = () => {
        const anyVvn = selectedHistoryVvn as any;
        return (
            anyVvn?.dockId ??
            anyVvn?.plannedDockId ??
            anyVvn?.dock ??
            anyVvn?.assignedDockId ??
            anyVvn?.assignedDock ??
            anyVvn?.plannedDock ??
            ""
        );
    };

    const resolveDockCode = (raw?: string) => {
        if (!raw) return "";
        const s = String(raw).trim();
        if (!s) return "";
        if (/^DK-\d+/i.test(s)) return s.toUpperCase();
        const code = dockCodeById[s];
        return code ? String(code).toUpperCase() : "";
    };

    const getActualDockCode = () => resolveDockCode(selectedHistoryItem?.actualDockId ?? "");
    const getPlannedDockCode = () => resolveDockCode(getPlannedDockRaw());

    const shouldShowDockDiscrepancy = () => {
        const note = selectedHistoryItem?.dockDiscrepancyNote ?? selectedHistoryItem?.note;
        if (!note) return false;

        const plannedRaw = getPlannedDockRaw();
        const actualId = selectedHistoryItem?.actualDockId ?? "";

        if (plannedRaw && actualId && String(plannedRaw) === String(actualId)) return false;

        const plannedCode = getPlannedDockCode();
        const actualCode = getActualDockCode();
        if (plannedCode && actualCode && plannedCode === actualCode) return false;

        return true;
    };

    const auditEntries = useMemo(() => {
        const list = selectedHistoryItem?.auditLog ?? [];
        return list.slice().reverse();
    }, [selectedHistoryItem]);

    const fetchVveDetails = async (vveId: string) => {
        setLoadingAudit(true);
        try {
            const svc: any = VesselVisitExecutionService as any;

            const methodNames = [
                "getById",
                "getOne",
                "getDetails",
                "getVveById",
                "findById",
            ];

            let detailed: VesselVisitExecutionExtended | null = null;

            for (const name of methodNames) {
                if (typeof svc[name] === "function") {
                    detailed = await svc[name](vveId);
                    break;
                }
            }

            if (!detailed && typeof svc.getAll === "function") {
                const all = await svc.getAll();
                detailed = (all as VesselVisitExecutionExtended[]).find(x => x.id === vveId) ?? null;
            }

            if (!isMounted.current) return;

            setAuditFetchedByVveId(prev => ({ ...prev, [vveId]: true }));

            if (!detailed) return;

            setSelectedHistoryItem(prev => (prev ? { ...prev, ...detailed } : detailed));
            setHistory(prev => prev.map(x => x.id === vveId ? { ...x, ...detailed } : x));
        } catch (e) {
            console.error("Erro a carregar detalhes do VVE/auditLog:", e);
            if (isMounted.current) {
                setAuditFetchedByVveId(prev => ({ ...prev, [vveId]: true }));
            }
        } finally {
            if (isMounted.current) setLoadingAudit(false);
        }
    };

    useEffect(() => {
        if (!auditOpen) return;
        const vveId = selectedHistoryItem?.id;
        if (!vveId) return;

        const alreadyFetched = !!auditFetchedByVveId[vveId];
        const hasAudit = (selectedHistoryItem?.auditLog?.length ?? 0) > 0;

        if (!alreadyFetched && !hasAudit && !loadingAudit) {
            void fetchVveDetails(vveId);
        }
    }, [auditOpen, selectedHistoryItem?.id, auditFetchedByVveId, loadingAudit]);


    const handleCardClick = async (vve: VesselVisitExecutionExtended) => {
        setSelectedHistoryItem(vve);
        setAuditOpen(false);
        openDetails();
        setLoadingDetails(true);
        setSelectedHistoryVvn(null);

        if (!vve.auditLog || vve.auditLog.length === 0) {
            void fetchVveDetails(vve.id);
        }

        try {
            const vvn = await VvnService.getVvnById(vve.vvnId);
            if (isMounted.current) setSelectedHistoryVvn(vvn);

            const imo = (vvn as any)?.vesselImo;
            if (imo && !GLOBAL_VESSEL_CACHE[imo]) {
                const vessel = await apiGetVesselByIMO(imo);
                if (vessel?.name) updateCache(imo, vessel.name);
            }
        } catch {
            notifyError(t('common.errorLoading'));
        } finally {
            if (isMounted.current) setLoadingDetails(false);
        }
    };

    const fetchCandidates = async () => {
        setLoadingCandidates(true);
        try {
            const filter: FilterAcceptedVvnStatusDto = {};
            const approved = await VvnService.getAcceptedAll(filter);
            const processedVvnIds = new Set(history.map(h => h.vvnId));
            const pending = approved.filter(vvn => !processedVvnIds.has((vvn as any).id));

            if (isMounted.current) setCandidates(pending);

            await (async () => {
                for (const a of pending) {
                    if (!isMounted.current) break;
                    const imo = (a as any)?.vesselImo;
                    if (imo && !GLOBAL_VESSEL_CACHE[imo]) {
                        try {
                            const v = await apiGetVesselByIMO(imo);
                            if (v?.name) updateCache(imo, v.name);
                        } catch {
                            // ignore
                        }
                    }
                    await new Promise(r => setTimeout(r, 20));
                }
            })();
        } catch {
            notifyError(t('common.errorLoading'));
        } finally {
            if (isMounted.current) setLoadingCandidates(false);
        }
    };

    const handleOpenWizard = () => {
        setActiveStep(0);
        setSelectedVvn(null);

        const now = new Date();
        setDateVal(now);
        setTimeVal(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);

        void fetchCandidates();
        openWizard();
    };

    const filteredCandidates = useMemo(() => {
        return candidates.filter((c: any) =>
            (c.vesselImo && String(c.vesselImo).includes(searchTerm)) ||
            (c.code && String(c.code).toLowerCase().includes(searchTerm.toLowerCase())) ||
            (vesselNames[c.vesselImo]?.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [candidates, searchTerm, vesselNames]);

    const setQuickTime = (minutesToSubtract: number) => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - minutesToSubtract);
        setDateVal(now);
        setTimeVal(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
    };

    const handleRegister = async () => {
        if (!selectedVvn || !dateVal || !timeVal) return;
        const finalEmail = user?.email || "test@developer.com";

        const finalDate = new Date(dateVal);
        const [hours, minutes] = timeVal.split(':').map(Number);

        if (isNaN(finalDate.getTime()) || isNaN(hours) || isNaN(minutes)) {
            notifyError(t('vesselVisitExecution.errorInvalidDate'));
            return;
        }

        finalDate.setHours(hours);
        finalDate.setMinutes(minutes);

        setSubmitting(true);
        try {
            const payload = {
                vvnId: (selectedVvn as any).id,
                actualArrivalTime: finalDate.toISOString(),
                creatorEmail: finalEmail
            };

            const createdVVE = await VesselVisitExecutionService.create(payload as any);

            const newHistoryItem = {
                ...createdVVE,
                vvnId: (selectedVvn as any).id,
                creatorEmail: finalEmail
            } as unknown as VesselVisitExecutionExtended;

            setHistory(prev => [newHistoryItem, ...prev]);

            const imo = (selectedVvn as any).vesselImo;
            const knownName = imo ? vesselNames[imo] : "";
            if (knownName) updateCache((selectedVvn as any).id, knownName);

            notifySuccess(t('vesselVisitExecution.successRegister'));
            closeWizard();

        } catch (error: any) {
            console.error("VVE Create Error:", error);
            const backendMsg = error?.response?.data?.errors?.message || error?.response?.data?.message;
            notifyError(backendMsg || t('vesselVisitExecution.errorRegister'));
        } finally {
            if (isMounted.current) setSubmitting(false);
        }
    };

    const openEditBerthModal = async () => {
        if (!selectedHistoryItem) return;

        const current = selectedHistoryItem.actualBerthTime
            ? new Date(selectedHistoryItem.actualBerthTime)
            : new Date();

        setBerthDate(current);
        setBerthTime(`${current.getHours().toString().padStart(2, "0")}:${current.getMinutes().toString().padStart(2, "0")}`);
        setDockId(selectedHistoryItem.actualDockId ?? "");

        if (dockOptions.length === 0) {
            await fetchDockOptions();
        }

        openEditBerth();
    };

    const handleSaveBerthDock = async () => {
        if (!selectedHistoryItem?.id) return;
        if (!berthDate || !berthTime || !dockId) {
            notifyError("Preenche berth time e dock.");
            return;
        }
        if (!user?.email) {
            notifyError("Utilizador inválido.");
            return;
        }

        if (dockOptions.length > 0 && !dockOptions.some(o => o.value === dockId)) {
            notifyError("Dock inválido. Seleciona da lista.");
            return;
        }

        const d = new Date(berthDate);
        const [hh, mm] = berthTime.split(":").map(Number);

        if (isNaN(d.getTime()) || isNaN(hh) || isNaN(mm)) {
            notifyError("Data/hora inválida.");
            return;
        }

        d.setHours(hh);
        d.setMinutes(mm);
        d.setSeconds(0);
        d.setMilliseconds(0);

        setSavingBerth(true);
        try {
            const updated = await updateBerthDockVVE(selectedHistoryItem.id, {
                actualBerthTime: d.toISOString(),
                actualDockId: dockId,
                updaterEmail: user.email!,
            });

            const merged: VesselVisitExecutionExtended = {
                ...(selectedHistoryItem as any),
                ...(updated as any),
                dockDiscrepancyNote: (updated as any).dockDiscrepancyNote ?? (updated as any).note ?? selectedHistoryItem.dockDiscrepancyNote ?? selectedHistoryItem.note,
                updatedAt: (updated as any).updatedAt ?? (selectedHistoryItem as any).updatedAt,
                auditLog: (updated as any).auditLog ?? (selectedHistoryItem as any).auditLog,
            };

            setSelectedHistoryItem(merged);
            setHistory(prev => prev.map(x => x.id === merged.id ? merged : x));

            notifySuccess("Berço e cais atualizados.");
            closeEditBerth();
        } catch (error: any) {
            const backendMsg = error?.response?.data?.message || error?.response?.data?.errors?.message;
            notifyError(backendMsg || "Erro ao atualizar berço/cais.");
        } finally {
            setSavingBerth(false);
        }
    };

    return (
        <Container size="xl" py="xl" style={{ backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
            <Stack gap="xl">
                <Group justify="space-between" align="center">
                    <Group gap="sm">
                        <ActionIcon component={Link} to="/dashboard" variant="light" size="xl" radius="md" color="gray">
                            <IconArrowLeft size={24} />
                        </ActionIcon>
                        <Stack gap={0}>
                            <Title
                                order={1}
                                style={{
                                    fontWeight: 900,
                                    letterSpacing: '-1px',
                                    background: '-webkit-linear-gradient(45deg, #087f5b, #63e6be)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                }}
                            >
                                {t('vesselVisitExecution.title')}
                            </Title>
                            <Text c="dimmed" size="lg">{t('vesselVisitExecution.subtitle')}</Text>
                        </Stack>
                    </Group>
                    <Button
                        size="md"
                        radius="xl"
                        leftSection={<IconPlus size={20} />}
                        onClick={handleOpenWizard}
                        variant="gradient"
                        gradient={{ from: 'teal', to: 'lime' }}
                        style={{ boxShadow: '0 10px 20px rgba(9, 146, 104, 0.2)' }}
                    >
                        {t('vesselVisitExecution.registerNew')}
                    </Button>
                </Group>

                {loadingHistory ? (
                    <Center h={200}><Loader type="bars" color="teal" /></Center>
                ) : history.length === 0 ? (
                    <Paper p="xl" radius="lg" withBorder style={{ borderStyle: 'dashed', backgroundColor: 'transparent' }}>
                        <Center style={{ flexDirection: 'column' }} py={50}>
                            <ThemeIcon size={80} radius="100%" variant="light" color="gray"><IconAnchor size={40} /></ThemeIcon>
                            <Text size="xl" fw={700} mt="md" c="dimmed">{t('vesselVisitExecution.noActiveVisits')}</Text>
                            <Button mt="md" variant="subtle" color="teal" onClick={handleOpenWizard}>
                                {t('vesselVisitExecution.registerNow')}
                            </Button>
                        </Center>
                    </Paper>
                ) : (
                    <Grid gutter="lg">
                        {history.map((vve) => {
                            const vesselName = vesselNames[vve.vvnId] || "Loading...";
                            return (
                                <Grid.Col span={{ base: 12, md: 6, lg: 4 }} key={vve.id}>
                                    <Card
                                        padding="lg"
                                        radius="lg"
                                        withBorder
                                        style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                                        onClick={() => handleCardClick(vve)}
                                        className="hover-card-effect"
                                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                                    >
                                        <Group justify="space-between" mb="xs">
                                            <Badge variant="light" color="teal" size="lg" radius="sm">
                                                {t('vesselVisitExecution.inPort')}
                                            </Badge>
                                        </Group>
                                        <Group wrap="nowrap" mb="md">
                                            <Avatar size="lg" radius="md" variant="light" color="teal"><IconShip size={24} /></Avatar>
                                            <Stack gap={0}>
                                                <Text fw={700} size="lg" lineClamp={1}>{vesselName}</Text>
                                                <Text size="sm" c="dimmed">{t('vesselVisitExecution.clickDetails')}</Text>
                                            </Stack>
                                        </Group>
                                        <Card.Section inheritPadding py="xs" bg="gray.0">
                                            <Group gap="xs">
                                                <IconClockHour4 size={16} color="gray" />
                                                <Text size="sm" fw={500}>{formatRelativeTime((vve.actualArrivalTime as any).toString())}</Text>
                                            </Group>
                                        </Card.Section>
                                    </Card>
                                </Grid.Col>
                            );
                        })}
                    </Grid>
                )}
            </Stack>

            <Modal
                opened={detailsModalOpen}
                onClose={closeDetails}
                title={
                    <Group gap="xs">
                        <IconInfoCircle size={20} />
                        <Text fw={700}>{t('vesselVisitExecution.arrivalDetails')}</Text>
                    </Group>
                }
                centered
                radius="lg"
                size="md"
                overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
            >
                {loadingDetails || !selectedHistoryItem ? (
                    <Center py={50}><Loader color="teal" /></Center>
                ) : (
                    <Stack gap="md">
                        <Paper withBorder p="md" radius="md" bg="teal.0" style={{ borderColor: 'var(--mantine-color-teal-2)' }}>
                            <Group>
                                <ThemeIcon size={50} radius="xl" color="teal" variant="filled"><IconShip size={28} /></ThemeIcon>
                                <div>
                                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>{t('vesselVisitExecution.vesselName')}</Text>
                                    <Text size="xl" fw={800} style={{ lineHeight: 1 }}>
                                        {(selectedHistoryVvn as any)?.vesselImo && vesselNames[(selectedHistoryVvn as any).vesselImo]
                                            ? vesselNames[(selectedHistoryVvn as any).vesselImo]
                                            : ((selectedHistoryVvn as any)?.vesselImo || "Unknown")}
                                    </Text>
                                    {selectedHistoryItem.updatedAt ? (
                                        <Text size="xs" c="dimmed">
                                            Última atualização: {new Date(selectedHistoryItem.updatedAt).toLocaleString('pt-PT')}
                                        </Text>
                                    ) : null}
                                </div>
                            </Group>
                        </Paper>

                        {selectedHistoryItem.creatorEmail && (
                            <Paper withBorder p="sm" radius="md" bg="gray.0">
                                <Group>
                                    <Avatar radius="xl" color="blue" size="md"><IconUser size={20} /></Avatar>
                                    <div style={{ flex: 1 }}>
                                        <Text size="xs" c="dimmed" tt="uppercase" fw={700}>{t('vesselVisitExecution.registeredBy')}</Text>
                                        <Text size="sm" fw={500}>{selectedHistoryItem.creatorEmail}</Text>
                                    </div>
                                </Group>
                            </Paper>
                        )}

                        <Stack gap={4}>
                            <Text size="sm" c="dimmed" tt="uppercase" fw={700}>{t('vesselVisitExecution.timingInfo')}</Text>
                            <Card withBorder radius="md" padding="sm">
                                <Group justify="space-between" mb={4}>
                                    <Group gap="xs"><IconCalendarEvent size={16} /><Text size="sm">{t('vesselVisitExecution.actualArrival')}</Text></Group>
                                    <Badge color="green" variant="filled" size="sm">{t('vesselVisitExecution.confirmed')}</Badge>
                                </Group>
                                <Text size="lg" fw={600} c="dark">
                                    {formatNumericDateTime(new Date(selectedHistoryItem.actualArrivalTime as any))}
                                </Text>
                            </Card>
                        </Stack>

                        <Stack gap={6}>
                            <Group justify="space-between" align="center">
                                <Text size="sm" c="dimmed" tt="uppercase" fw={700}>Berço & Cais</Text>
                                <Button size="xs" variant="light" onClick={() => void openEditBerthModal()}>
                                    Atualizar
                                </Button>
                            </Group>

                            <Card withBorder radius="md" padding="sm">
                                <Group justify="space-between">
                                    <Text size="sm">Actual berth time</Text>
                                    <Text fw={600}>
                                        {selectedHistoryItem.actualBerthTime
                                            ? formatNumericDateTime(new Date(selectedHistoryItem.actualBerthTime))
                                            : "-"}
                                    </Text>
                                </Group>

                                <Divider my="xs" />

                                <Group justify="space-between">
                                    <Text size="sm">Dock usado</Text>
                                    <Text fw={600}>
                                        {selectedHistoryItem.actualDockId
                                            ? (dockCodeById[selectedHistoryItem.actualDockId] ?? (loadingDockOptions ? "A carregar..." : "—"))
                                            : "-"}
                                    </Text>
                                </Group>

                                {/* ✅ só mostra discrepância se planned != actual */}
                                {shouldShowDockDiscrepancy() ? (
                                    <>
                                        <Divider my="xs" />
                                        <Paper p="sm" radius="md" bg="orange.0" style={{ border: "1px solid var(--mantine-color-orange-3)" }}>
                                            <Group gap="xs" align="start">
                                                <IconInfoCircle size={18} color="var(--mantine-color-orange-7)" />
                                                <Text size="sm" c="orange.8">
                                                    {prettifyAnyDockNote(prettifyDockNote(selectedHistoryItem.dockDiscrepancyNote ?? selectedHistoryItem.note))}
                                                </Text>
                                            </Group>
                                        </Paper>
                                    </>
                                ) : null}
                            </Card>
                        </Stack>

                        <Stack gap={6}>
                            <Group justify="space-between" align="center">
                                <Text size="sm" c="dimmed" tt="uppercase" fw={700}>Operações executadas</Text>
                                <Button
                                    size="xs"
                                    variant="light"
                                    onClick={openExecutedOps}
                                    disabled={!selectedHistoryItem?.id || !selectedHistoryItem?.vvnId || !user?.email}
                                >
                                    Atualizar
                                </Button>
                            </Group>
                        </Stack>

                        <Stack gap={6}>
                            <Group justify="space-between" align="center">
                                <Text size="sm" c="dimmed" tt="uppercase" fw={700}>Auditoria</Text>
                                <Button
                                    size="xs"
                                    variant="light"
                                    onClick={() => setAuditOpen(v => !v)}
                                    disabled={false}
                                >
                                    {auditOpen ? "Esconder histórico" : "Ver histórico"}
                                </Button>
                            </Group>

                            <Collapse in={auditOpen}>
                                <Card withBorder radius="md" padding="sm">
                                    <Stack gap="sm">
                                        {(() => {
                                            const vveId = selectedHistoryItem?.id;
                                            const alreadyFetched = vveId ? !!auditFetchedByVveId[vveId] : false;

                                            if (loadingAudit) return <Text c="dimmed" size="sm">A carregar histórico...</Text>;

                                            if (auditEntries.length === 0 && !alreadyFetched) {
                                                return <Text c="dimmed" size="sm">A carregar histórico...</Text>;
                                            }

                                            if (auditEntries.length === 0) {
                                                return <Text c="dimmed" size="sm">Sem histórico.</Text>;
                                            }

                                            return auditEntries.map((log, idx) => (
                                                <Paper key={log._id ?? idx} withBorder p="sm" radius="md" bg="gray.0">
                                                    <Group justify="space-between" align="start">
                                                        <div>
                                                            <Text fw={700} size="sm">{log.action ?? "-"}</Text>
                                                            <Text size="xs" c="dimmed">
                                                                {log.at ? new Date(log.at).toLocaleString('pt-PT') : "-"}
                                                            </Text>
                                                        </div>
                                                        <Badge variant="light" color="teal">
                                                            {log.by ?? "-"}
                                                        </Badge>
                                                    </Group>

                                                    {log.note ? (
                                                        <>
                                                            <Divider my="xs" />
                                                            <Text size="sm">{prettifyAnyDockNote(log.note)}</Text>
                                                        </>
                                                    ) : null}
                                                </Paper>
                                            ));
                                        })()}
                                    </Stack>
                                </Card>
                            </Collapse>
                        </Stack>

                        <Stack gap={4}>
                            <Text size="sm" c="dimmed" tt="uppercase" fw={700}>{t('vesselVisitExecution.referenceData')}</Text>
                            <Grid>
                                <Grid.Col span={6}>
                                    <Card withBorder radius="md" p="xs" bg="gray.0">
                                        <Text size="xs" c="dimmed">{t('vesselVisitExecution.imoNumber')}</Text>
                                        <Text fw={600}>{(selectedHistoryVvn as any)?.vesselImo || "-"}</Text>
                                    </Card>
                                </Grid.Col>
                                <Grid.Col span={6}>
                                    <Card withBorder radius="md" p="xs" bg="gray.0">
                                        <Text size="xs" c="dimmed">{t('vesselVisitExecution.vvnCode')}</Text>
                                        <Text fw={600}>{(selectedHistoryVvn as any)?.code || "-"}</Text>
                                    </Card>
                                </Grid.Col>
                            </Grid>
                        </Stack>

                        <Group justify="flex-end" mt="md">
                            <Button variant="default" onClick={closeDetails}>Close</Button>
                        </Group>
                    </Stack>
                )}
            </Modal>

            <Modal
                opened={executedOpsOpen}
                onClose={closeExecutedOps}
                title="Operações executadas"
                centered
                size="xl"
                radius="lg"
                overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
            >
                {!selectedHistoryItem?.id || !selectedHistoryItem?.vvnId ? (
                    <Text c="dimmed">Sem VVE/VVN selecionado.</Text>
                ) : (
                    <ExecutedOperationsEditor
                        vveId={selectedHistoryItem.id}
                        vvnId={selectedHistoryItem.vvnId}
                        operatorId={user?.email ?? "unknown"}
                    />
                )}
            </Modal>

            <Modal
                opened={editBerthOpen}
                onClose={closeEditBerth}
                title={<Group gap="xs"><IconAnchor size={18} /><Text fw={700}>Atualizar Berço & Cais</Text></Group>}
                centered
                radius="lg"
            >
                <Stack>
                    <Paper withBorder p="xs" radius="md">
                        <DatePicker
                            value={berthDate as any}
                            onChange={(v: any) => setBerthDate(v ? new Date(v) : null)}
                            maxDate={new Date()}
                        />
                    </Paper>

                    <TimeInput
                        ref={berthTimeRef}
                        value={berthTime}
                        onChange={(e) => setBerthTime(e.currentTarget.value)}
                        label="Hora de atracação"
                        withSeconds={false}
                        leftSection={
                            <ActionIcon
                                variant="subtle"
                                color="teal"
                                onClick={() => {
                                    try { (berthTimeRef.current as any)?.showPicker?.(); }
                                    catch { berthTimeRef.current?.focus(); }
                                }}
                            >
                                <IconClockHour4 size={18} />
                            </ActionIcon>
                        }
                    />

                    <Select
                        label="Dock usado"
                        placeholder={loadingDockOptions ? "A carregar docks..." : "Seleciona um dock"}
                        data={dockOptions}
                        value={dockId}
                        onChange={(val) => setDockId(val ?? "")}
                        searchable
                        nothingFoundMessage="Nenhum dock encontrado"
                        disabled={loadingDockOptions}
                        rightSection={loadingDockOptions ? <Loader size="xs" /> : null}
                        filter={({ options, search }) => {
                            const s = (search ?? "").toLowerCase();
                            return options.filter((o) => String((o as any).label ?? "").toLowerCase().includes(s));
                        }}
                    />

                    <Group justify="flex-end" mt="sm">
                        <Button variant="default" onClick={closeEditBerth}>Cancelar</Button>
                        <Button color="teal" onClick={handleSaveBerthDock} loading={savingBerth}>
                            Guardar
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            <Modal
                opened={wizardOpen}
                onClose={closeWizard}
                size="xl"
                padding={0}
                radius="lg"
                withCloseButton={false}
                overlayProps={{ backgroundOpacity: 0.55, blur: 5 }}
            >
                <Box p="md" style={{ borderBottom: '1px solid #eee' }}>
                    <Group justify="space-between">
                        <Title order={3}>{t('vesselVisitExecution.wizardTitle')}</Title>
                        <ActionIcon variant="subtle" color="gray" onClick={closeWizard}><IconX size={20} /></ActionIcon>
                    </Group>
                    <Box mt="md">
                        <Stepper active={activeStep} color="teal" allowNextStepsSelect={false} size="sm">
                            <Stepper.Step label={t('vesselVisitExecution.step1')} description={t('vesselVisitExecution.step1Desc')} icon={<IconShip size={16} />} />
                            <Stepper.Step label={t('vesselVisitExecution.step2')} description={t('vesselVisitExecution.step2Desc')} icon={<IconClockHour4 size={16} />} />
                            <Stepper.Step label={t('vesselVisitExecution.step3')} description={t('vesselVisitExecution.step3Desc')} icon={<IconCheck size={16} />} />
                        </Stepper>
                    </Box>
                </Box>

                <ScrollArea.Autosize mah="70vh" type="auto" offsetScrollbars>
                    <Box p="md">
                        {activeStep === 0 && (
                            <Stack gap="md">
                                <TextInput
                                    placeholder={t('vesselVisitExecution.searchPlaceholder')}
                                    leftSection={<IconSearch size={16} />}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.currentTarget.value)}
                                    size="md"
                                    radius="md"
                                />
                                {loadingCandidates ? (
                                    <Center py={40}><Loader color="teal" /></Center>
                                ) : filteredCandidates.length === 0 ? (
                                    <Center py={40} c="dimmed">{t('vesselVisitExecution.noPending')}</Center>
                                ) : (
                                    <Stack gap="sm">
                                        {filteredCandidates.map((vvn: any) => {
                                            const isSelected = (selectedVvn as any)?.id === vvn.id;
                                            const name = vesselNames[vvn.vesselImo] || vvn.vesselImo;
                                            const isExpanded = expandedVvnId === vvn.id;
                                            return (
                                                <Paper
                                                    key={vvn.id}
                                                    withBorder
                                                    p="md"
                                                    radius="md"
                                                    style={{
                                                        borderColor: isSelected ? 'var(--mantine-color-teal-6)' : undefined,
                                                        backgroundColor: isSelected ? 'var(--mantine-color-teal-0)' : undefined,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onClick={() => setSelectedVvn(vvn)}
                                                >
                                                    <Group justify="space-between" align="start">
                                                        <Group>
                                                            <ThemeIcon size="lg" radius="xl" variant={isSelected ? "filled" : "light"} color={isSelected ? "teal" : "gray"}>
                                                                {isSelected ? <IconCheck size={20} /> : <IconShip size={20} />}
                                                            </ThemeIcon>
                                                            <div>
                                                                <Text fw={700} size="md">{name}</Text>
                                                                <Text size="xs" c="dimmed">IMO: {vvn.vesselImo}</Text>
                                                            </div>
                                                        </Group>
                                                        <ActionIcon
                                                            variant="subtle"
                                                            color="gray"
                                                            onClick={(e) => { e.stopPropagation(); setExpandedVvnId(isExpanded ? null : vvn.id); }}
                                                        >
                                                            {isExpanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                                                        </ActionIcon>
                                                    </Group>
                                                    <Collapse in={isExpanded}>
                                                        <Divider my="sm" variant="dashed" />
                                                        <Grid>
                                                            <Grid.Col span={4}>
                                                                <Group gap={4}><IconUsers size={14} color="gray" /><Text size="xs" c="dimmed">{t('vesselVisitExecution.crew')}</Text></Group>
                                                                <Text size="sm">{vvn.crewManifest ? 'Yes' : 'No'}</Text>
                                                            </Grid.Col>
                                                            <Grid.Col span={4}>
                                                                <Group gap={4}><IconBox size={14} color="gray" /><Text size="xs" c="dimmed">{t('vesselVisitExecution.volume')}</Text></Group>
                                                                <Text size="sm">{vvn.volume} m³</Text>
                                                            </Grid.Col>
                                                        </Grid>
                                                    </Collapse>
                                                </Paper>
                                            );
                                        })}
                                    </Stack>
                                )}
                            </Stack>
                        )}

                        {activeStep === 1 && (
                            <Stack gap="lg" align="center" pt={10}>
                                <Text size="lg" ta="center">
                                    {t('vesselVisitExecution.confirmTimeTitle')}<br />
                                    <Text span fw={800} c="teal.8">
                                        {(selectedVvn as any)?.vesselImo && vesselNames[(selectedVvn as any).vesselImo]
                                            ? vesselNames[(selectedVvn as any).vesselImo]
                                            : (selectedVvn as any)?.vesselImo}
                                    </Text>
                                </Text>

                                <Group align="flex-start" justify="center" wrap="wrap" gap="xl">
                                    <Stack gap="xs" align="center">
                                        <Badge size="xl" variant="light" color="blue" radius="md" fullWidth style={{ height: 36, fontSize: '0.95rem' }}>
                                            {formatDateOnly(dateVal)}
                                        </Badge>
                                        <Paper withBorder p="xs" radius="md" shadow="xs">
                                            <DatePicker
                                                value={dateVal as any}
                                                onChange={(v: any) => setDateVal(v ? new Date(v) : null)}
                                                maxDate={new Date()}
                                            />
                                        </Paper>
                                    </Stack>

                                    <Stack gap="md" align="center" style={{ minWidth: 200 }}>
                                        <Text size="sm" fw={600} c="dimmed">{t('vesselVisitExecution.timeLabel')}</Text>
                                        <TimeInput
                                            ref={timeInputRef}
                                            value={timeVal}
                                            onChange={(e) => setTimeVal(e.currentTarget.value)}
                                            leftSection={
                                                <ActionIcon
                                                    variant="subtle"
                                                    color="teal"
                                                    onClick={() => {
                                                        try { (timeInputRef.current as any).showPicker(); }
                                                        catch { timeInputRef.current?.focus(); }
                                                    }}
                                                >
                                                    <IconClockHour4 size={22} />
                                                </ActionIcon>
                                            }
                                            size="xl"
                                            radius="md"
                                            label={t('vesselVisitExecution.timePlaceholder')}
                                            withSeconds={false}
                                            onClick={() => {
                                                try { (timeInputRef.current as any).showPicker(); } catch {
                                                    // ignore
                                                }
                                            }}
                                        />
                                        <Divider label={t('vesselVisitExecution.quickSelect')} labelPosition="center" w="100%" />
                                        <Group gap="xs" justify="center">
                                            <Button size="xs" variant="light" onClick={() => setQuickTime(0)}>{t('vesselVisitExecution.now')}</Button>
                                            <Button size="xs" variant="default" onClick={() => setQuickTime(15)}>-15m</Button>
                                            <Button size="xs" variant="default" onClick={() => setQuickTime(30)}>-30m</Button>
                                            <Button size="xs" variant="default" onClick={() => setQuickTime(60)}>-1h</Button>
                                        </Group>
                                    </Stack>
                                </Group>
                            </Stack>
                        )}

                        {activeStep === 2 && (
                            <Center py={20}>
                                <Stack align="center" gap="md">
                                    <ThemeIcon color="green" size={80} radius="100%" variant="light"><IconDeviceFloppy size={40} /></ThemeIcon>
                                    <Title order={3}>{t('vesselVisitExecution.confirmRegTitle')}</Title>
                                    <Paper withBorder p="md" bg="gray.0" radius="md" w="100%" miw={300}>
                                        <Group justify="space-between">
                                            <Text c="dimmed">{t('vesselVisitExecution.vesselName')}:</Text>
                                            <Text fw={600}>{vesselNames[(selectedVvn as any)?.vesselImo || ''] || (selectedVvn as any)?.vesselImo}</Text>
                                        </Group>
                                        <Divider my="sm" />
                                        <Group justify="space-between">
                                            <Text c="dimmed">{t('vesselVisitExecution.arrivalLabel')}</Text>
                                            <Text fw={600}>{formatNumericDateTime(dateVal, timeVal)}</Text>
                                        </Group>
                                        <Divider my="sm" />
                                        <Group justify="space-between">
                                            <Text c="dimmed">{t('vesselVisitExecution.operatorLabel')}</Text>
                                            <Text fw={600}>{user?.email || "test@developer.com"}</Text>
                                        </Group>
                                    </Paper>
                                </Stack>
                            </Center>
                        )}
                    </Box>
                </ScrollArea.Autosize>

                <Box p="md" style={{ borderTop: '1px solid #eee', backgroundColor: '#fff' }}>
                    <Group justify="flex-end">
                        {activeStep === 0
                            ? <Button variant="subtle" color="gray" onClick={closeWizard}>{t('vesselVisitExecution.cancel')}</Button>
                            : <Button variant="default" onClick={() => setActiveStep(s => s - 1)}>{t('vesselVisitExecution.back')}</Button>}
                        {activeStep < 2
                            ? <Button onClick={() => setActiveStep(s => s + 1)} disabled={activeStep === 0 && !selectedVvn} color="teal">{t('vesselVisitExecution.next')}</Button>
                            : <Button onClick={handleRegister} loading={submitting} color="green" leftSection={<IconCheck size={18} />} size="md">{t('vesselVisitExecution.confirmBtn')}</Button>}
                    </Group>
                </Box>
            </Modal>
        </Container>
    );
}
