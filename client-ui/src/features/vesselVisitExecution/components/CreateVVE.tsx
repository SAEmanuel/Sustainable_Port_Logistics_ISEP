import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    Container, Title, Text, Card, Group, Button,
    TextInput, Modal, Stack, Box, Center, Loader,
    Avatar, ThemeIcon, Paper, Stepper, Grid, Badge,
    Collapse, Divider, ActionIcon, ScrollArea
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

// Services & DTOs
import VvnService from '../../vesselVisitNotification/service/vvnService';
import { VesselVisitExecutionService } from '../services/vesselVisitExecutionService';
import { apiGetVesselByIMO } from '../../vessels/services/vesselService';
import type { VesselVisitNotificationDto, FilterAcceptedVvnStatusDto } from '../../vesselVisitNotification/dto/vvnTypesDtos';
import type { VesselVisitExecution } from '../domain/vesselVisitExecution';

// STORE
import { useAppStore } from "../../../app/store";

// --- CACHE GLOBAL ---
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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
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

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
interface VesselVisitExecutionExtended extends VesselVisitExecution {
    vvnId: string;
    creatorEmail?: string;
}

export default function VesselVisitExecutionPage() {
    const { t } = useTranslation();
    const user = useAppStore((state) => state.user);

    // --- REFS & STATES ---
    const isMounted = useRef(true);
    const effectRan = useRef(false);
    const timeInputRef = useRef<HTMLInputElement>(null);

    const [history, setHistory] = useState<VesselVisitExecutionExtended[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [vesselNames, setVesselNames] = useState<Record<string, string>>(GLOBAL_VESSEL_CACHE);

    // Modals
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

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const updateCache = (id: string, name: string) => {
        GLOBAL_VESSEL_CACHE[id] = name;
        if (isMounted.current) setVesselNames(prev => ({ ...prev, [id]: name }));
    };

    // --- FETCH HISTORY ---
    const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
            const data = await VesselVisitExecutionService.getAll() as unknown as VesselVisitExecutionExtended[];
            const sorted = data.sort((a, b) => new Date(b.actualArrivalTime).getTime() - new Date(a.actualArrivalTime).getTime());

            if (isMounted.current) {
                setHistory(sorted);
                setLoadingHistory(false);
            }

            for (const vve of sorted) {
                if (!isMounted.current) break;
                if (GLOBAL_VESSEL_CACHE[vve.vvnId]) continue;
                try {
                    const vvn = await VvnService.getVvnById(vve.vvnId);
                    if (vvn && vvn.vesselImo) {
                        if (GLOBAL_VESSEL_CACHE[vvn.vesselImo]) {
                            updateCache(vve.vvnId, GLOBAL_VESSEL_CACHE[vvn.vesselImo]);
                        } else {
                            const vessel = await apiGetVesselByIMO(vvn.vesselImo);
                            if (vessel?.name) {
                                updateCache(vve.vvnId, vessel.name);
                                updateCache(vvn.vesselImo, vessel.name);
                            }
                        }
                    }
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (e) { /* ignore */ }
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
        if (effectRan.current === false) {
            fetchHistory();
            effectRan.current = true;
        }
    }, []);

    // --- HANDLERS ---
    const handleCardClick = async (vve: VesselVisitExecutionExtended) => {
        setSelectedHistoryItem(vve);
        openDetails();
        setLoadingDetails(true);
        setSelectedHistoryVvn(null);

        try {
            const vvn = await VvnService.getVvnById(vve.vvnId);
            if (isMounted.current) setSelectedHistoryVvn(vvn);
            if (vvn.vesselImo && !GLOBAL_VESSEL_CACHE[vvn.vesselImo]) {
                const vessel = await apiGetVesselByIMO(vvn.vesselImo);
                if (vessel?.name) updateCache(vvn.vesselImo, vessel.name);
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
            notifyError(t('common.errorLoading'));
        } finally {
            if (isMounted.current) setLoadingDetails(false);
        }
    };

    const handleOpenWizard = () => {
        setActiveStep(0);
        setSelectedVvn(null);

        const now = new Date();
        setDateVal(now);
        setTimeVal(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);

        fetchCandidates();
        openWizard();
    };

    const fetchCandidates = async () => {
        setLoadingCandidates(true);
        try {
            const filter: FilterAcceptedVvnStatusDto = {};
            const approved = await VvnService.getAcceptedAll(filter);
            const processedVvnIds = new Set(history.map(h => h.vvnId));
            const pending = approved.filter(vvn => !processedVvnIds.has(vvn.id));

            if (isMounted.current) setCandidates(pending);

            await (async () => {
                for (const a of pending) {
                    if (!isMounted.current) break;
                    if (a.vesselImo && !GLOBAL_VESSEL_CACHE[a.vesselImo]) {
                        try {
                            const v = await apiGetVesselByIMO(a.vesselImo);
                            if (v?.name) updateCache(a.vesselImo, v.name);
                        } catch { /* empty */ }
                    }
                    await new Promise(r => setTimeout(r, 20));
                }
            })();
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            notifyError(t('common.errorLoading'));
        } finally {
            if (isMounted.current) setLoadingCandidates(false);
        }
    };

    const filteredCandidates = useMemo(() => {
        return candidates.filter(c =>
            (c.vesselImo && c.vesselImo.includes(searchTerm)) ||
            (c.code && c.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
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
        if (!user?.email) {
            notifyError(t('vesselVisitExecution.errorUser'));
            return;
        }

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
                vvnId: selectedVvn.id,
                actualArrivalTime: finalDate.toISOString(),
                creatorEmail: user.email
            };

            const createdVVE = await VesselVisitExecutionService.create(payload as any);

            const newHistoryItem = {
                ...createdVVE,
                vvnId: selectedVvn.id,
                creatorEmail: user.email
            } as unknown as VesselVisitExecutionExtended;

            setHistory(prev => [newHistoryItem, ...prev]);

            const knownName = vesselNames[selectedVvn.vesselImo];
            if (knownName) updateCache(selectedVvn.id, knownName);

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

    return (
        <Container size="xl" py="xl" style={{ backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
            <Stack gap="xl">
                {/* HEADER */}
                <Group justify="space-between" align="center">
                    <Group gap="sm">
                        <ActionIcon component={Link} to="/dashboard" variant="light" size="xl" radius="md" color="gray">
                            <IconArrowLeft size={24} />
                        </ActionIcon>
                        <Stack gap={0}>
                            <Title order={1} style={{ fontWeight: 900, letterSpacing: '-1px', background: '-webkit-linear-gradient(45deg, #087f5b, #63e6be)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                {t('vesselVisitExecution.title')}
                            </Title>
                            <Text c="dimmed" size="lg">{t('vesselVisitExecution.subtitle')}</Text>
                        </Stack>
                    </Group>
                    <Button size="md" radius="xl" leftSection={<IconPlus size={20} />} onClick={handleOpenWizard} variant="gradient" gradient={{ from: 'teal', to: 'lime' }} style={{ boxShadow: '0 10px 20px rgba(9, 146, 104, 0.2)' }}>
                        {t('vesselVisitExecution.registerNew')}
                    </Button>
                </Group>

                {/* HISTÓRICO GRID */}
                {loadingHistory ? (
                    <Center h={200}><Loader type="bars" color="teal" /></Center>
                ) : history.length === 0 ? (
                    <Paper p="xl" radius="lg" withBorder style={{ borderStyle: 'dashed', backgroundColor: 'transparent' }}>
                        <Center style={{ flexDirection: 'column' }} py={50}>
                            <ThemeIcon size={80} radius="100%" variant="light" color="gray"><IconAnchor size={40} /></ThemeIcon>
                            <Text size="xl" fw={700} mt="md" c="dimmed">{t('vesselVisitExecution.noActiveVisits')}</Text>
                            <Button mt="md" variant="subtle" color="teal" onClick={handleOpenWizard}>{t('vesselVisitExecution.registerNow')}</Button>
                        </Center>
                    </Paper>
                ) : (
                    <Grid gutter="lg">
                        {history.map((vve) => {
                            const vesselName = vesselNames[vve.vvnId] || "Loading...";
                            return (
                                <Grid.Col span={{ base: 12, md: 6, lg: 4 }} key={vve.id}>
                                    <Card padding="lg" radius="lg" withBorder style={{ cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => handleCardClick(vve)} className="hover-card-effect" onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                                        <Group justify="space-between" mb="xs">
                                            <Badge variant="light" color="teal" size="lg" radius="sm">{t('vesselVisitExecution.inPort')}</Badge>
                                            <Text size="xs" c="dimmed" fw={700}>ID: {vve.id.substring(0, 6)}</Text>
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
                                                <Text size="sm" fw={500}>{formatRelativeTime(vve.actualArrivalTime.toString())}</Text>
                                            </Group>
                                        </Card.Section>
                                    </Card>
                                </Grid.Col>
                            );
                        })}
                    </Grid>
                )}
            </Stack>

            {/* DETALHES MODAL */}
            <Modal opened={detailsModalOpen} onClose={closeDetails} title={<Group gap="xs"><IconInfoCircle size={20}/><Text fw={700}>{t('vesselVisitExecution.arrivalDetails')}</Text></Group>} centered radius="lg" size="md" overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}>
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
                                        {selectedHistoryVvn?.vesselImo && vesselNames[selectedHistoryVvn.vesselImo]
                                            ? vesselNames[selectedHistoryVvn.vesselImo]
                                            : (selectedHistoryVvn?.vesselImo || "Unknown")}
                                    </Text>
                                </div>
                            </Group>
                        </Paper>

                        {selectedHistoryItem.creatorEmail && (
                            <Paper withBorder p="sm" radius="md" bg="gray.0">
                                <Group>
                                    <Avatar radius="xl" color="blue" size="md"><IconUser size={20}/></Avatar>
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
                                    <Group gap="xs"><IconCalendarEvent size={16}/><Text size="sm">{t('vesselVisitExecution.actualArrival')}</Text></Group>
                                    <Badge color="green" variant="filled" size="sm">{t('vesselVisitExecution.confirmed')}</Badge>
                                </Group>
                                <Text size="lg" fw={600} c="dark">
                                    {formatNumericDateTime(new Date(selectedHistoryItem.actualArrivalTime))}
                                </Text>
                            </Card>
                        </Stack>

                        <Stack gap={4}>
                            <Text size="sm" c="dimmed" tt="uppercase" fw={700}>{t('vesselVisitExecution.referenceData')}</Text>
                            <Grid>
                                <Grid.Col span={6}>
                                    <Card withBorder radius="md" p="xs" bg="gray.0">
                                        <Text size="xs" c="dimmed">{t('vesselVisitExecution.imoNumber')}</Text>
                                        <Text fw={600}>{selectedHistoryVvn?.vesselImo || "-"}</Text>
                                    </Card>
                                </Grid.Col>
                                <Grid.Col span={6}>
                                    <Card withBorder radius="md" p="xs" bg="gray.0">
                                        <Text size="xs" c="dimmed">{t('vesselVisitExecution.vvnCode')}</Text>
                                        <Text fw={600}>{selectedHistoryVvn?.code || "-"}</Text>
                                    </Card>
                                </Grid.Col>
                            </Grid>
                        </Stack>
                        <Group justify="flex-end" mt="md"><Button variant="default" onClick={closeDetails}>Close</Button></Group>
                    </Stack>
                )}
            </Modal>

            {/* WIZARD MODAL */}
            <Modal opened={wizardOpen} onClose={closeWizard} size="xl" padding={0} radius="lg" withCloseButton={false} overlayProps={{ backgroundOpacity: 0.55, blur: 5 }}>
                <Box p="md" style={{ borderBottom: '1px solid #eee' }}>
                    <Group justify="space-between">
                        <Title order={3}>{t('vesselVisitExecution.wizardTitle')}</Title>
                        <ActionIcon variant="subtle" color="gray" onClick={closeWizard}><IconX size={20}/></ActionIcon>
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
                        {/* Passo 0: Seleção */}
                        {activeStep === 0 && (
                            <Stack gap="md">
                                <TextInput placeholder={t('vesselVisitExecution.searchPlaceholder')} leftSection={<IconSearch size={16} />} value={searchTerm} onChange={(e) => setSearchTerm(e.currentTarget.value)} size="md" radius="md" />
                                {loadingCandidates ? (
                                    <Center py={40}><Loader color="teal" /></Center>
                                ) : filteredCandidates.length === 0 ? (
                                    <Center py={40} c="dimmed">{t('vesselVisitExecution.noPending')}</Center>
                                ) : (
                                    <Stack gap="sm">
                                        {filteredCandidates.map(vvn => {
                                            const isSelected = selectedVvn?.id === vvn.id;
                                            const name = vesselNames[vvn.vesselImo] || vvn.vesselImo;
                                            const isExpanded = expandedVvnId === vvn.id;
                                            return (
                                                <Paper key={vvn.id} withBorder p="md" radius="md" style={{ borderColor: isSelected ? 'var(--mantine-color-teal-6)' : undefined, backgroundColor: isSelected ? 'var(--mantine-color-teal-0)' : undefined, cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => setSelectedVvn(vvn)}>
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
                                                        <ActionIcon variant="subtle" color="gray" onClick={(e) => { e.stopPropagation(); setExpandedVvnId(isExpanded ? null : vvn.id); }}>
                                                            {isExpanded ? <IconChevronUp size={16}/> : <IconChevronDown size={16}/>}
                                                        </ActionIcon>
                                                    </Group>
                                                    <Collapse in={isExpanded}>
                                                        <Divider my="sm" variant="dashed" />
                                                        <Grid>
                                                            <Grid.Col span={4}><Group gap={4}><IconUsers size={14} color="gray"/><Text size="xs" c="dimmed">{t('vesselVisitExecution.crew')}</Text></Group><Text size="sm">{vvn.crewManifest ? 'Yes' : 'No'}</Text></Grid.Col>
                                                            <Grid.Col span={4}><Group gap={4}><IconBox size={14} color="gray"/><Text size="xs" c="dimmed">{t('vesselVisitExecution.volume')}</Text></Group><Text size="sm">{vvn.volume} m³</Text></Grid.Col>
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
                                    {t('vesselVisitExecution.confirmTimeTitle')}<br/>
                                    <Text span fw={800} c="teal.8">{selectedVvn?.vesselImo && vesselNames[selectedVvn.vesselImo] ? vesselNames[selectedVvn.vesselImo] : selectedVvn?.vesselImo}</Text>
                                </Text>

                                <Group align="flex-start" justify="center" wrap="wrap" gap="xl">
                                    <Stack gap="xs" align="center">
                                        {}
                                        <Badge size="xl" variant="light" color="blue" radius="md" fullWidth style={{ height: 36, fontSize: '0.95rem' }}>
                                            {formatDateOnly(dateVal)}
                                        </Badge>
                                        <Paper withBorder p="xs" radius="md" shadow="xs">
                                            <DatePicker value={dateVal} onChange={setDateVal} maxDate={new Date()} />
                                        </Paper>
                                    </Stack>

                                    <Stack gap="md" align="center" style={{ minWidth: 200 }}>
                                        <Text size="sm" fw={600} c="dimmed">{t('vesselVisitExecution.timeLabel')}</Text>
                                        {/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
                                        <TimeInput ref={timeInputRef} value={timeVal} onChange={(e) => setTimeVal(e.currentTarget.value)} leftSection={<ActionIcon variant="subtle" color="teal" onClick={() => { try { (timeInputRef.current as any).showPicker(); } catch (e) { timeInputRef.current?.focus(); } }}><IconClockHour4 size={22} /></ActionIcon>} size="xl" radius="md" label={t('vesselVisitExecution.timePlaceholder')} withSeconds={false} onClick={() => { try { (timeInputRef.current as any).showPicker(); } catch (e) { /* empty */ } }} />
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

                        {/* Passo 2: Confirmar */}
                        {activeStep === 2 && (
                            <Center py={20}>
                                <Stack align="center" gap="md">
                                    <ThemeIcon color="green" size={80} radius="100%" variant="light"><IconDeviceFloppy size={40} /></ThemeIcon>
                                    <Title order={3}>{t('vesselVisitExecution.confirmRegTitle')}</Title>
                                    <Paper withBorder p="md" bg="gray.0" radius="md" w="100%" miw={300}>
                                        <Group justify="space-between"><Text c="dimmed">{t('vesselVisitExecution.vesselName')}:</Text><Text fw={600}>{vesselNames[selectedVvn?.vesselImo || ''] || selectedVvn?.vesselImo}</Text></Group>
                                        <Divider my="sm" />
                                        <Group justify="space-between">
                                            <Text c="dimmed">{t('vesselVisitExecution.arrivalLabel')}</Text>
                                            <Text fw={600}>{formatNumericDateTime(dateVal, timeVal)}</Text>
                                        </Group>
                                        <Divider my="sm" />
                                        <Group justify="space-between"><Text c="dimmed">{t('vesselVisitExecution.operatorLabel')}</Text><Text fw={600}>{user?.email}</Text></Group>
                                    </Paper>
                                </Stack>
                            </Center>
                        )}
                    </Box>
                </ScrollArea.Autosize>

                <Box p="md" style={{ borderTop: '1px solid #eee', backgroundColor: '#fff' }}>
                    <Group justify="flex-end">
                        {activeStep === 0 ? <Button variant="subtle" color="gray" onClick={closeWizard}>{t('vesselVisitExecution.cancel')}</Button> : <Button variant="default" onClick={() => setActiveStep(s => s - 1)}>{t('vesselVisitExecution.back')}</Button>}
                        {activeStep < 2 ? <Button onClick={() => setActiveStep(s => s + 1)} disabled={activeStep === 0 && !selectedVvn} color="teal">{t('vesselVisitExecution.next')}</Button> : <Button onClick={handleRegister} loading={submitting} color="green" leftSection={<IconCheck size={18}/>} size="md">{t('vesselVisitExecution.confirmBtn')}</Button>}
                    </Group>
                </Box>
            </Modal>
        </Container>
    );
}