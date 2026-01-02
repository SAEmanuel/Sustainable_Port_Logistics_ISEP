import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from "../../../app/store";
import {
    Container, Title, Text, Group, Button, Stack, Grid, ThemeIcon, Paper,
    LoadingOverlay, Box, RingProgress, Center, ActionIcon, Modal, Table, ScrollArea, Badge, Divider
} from '@mantine/core';
import {
    IconRocket, IconAnalyze, IconScale, IconTrendingUp, IconArrowLeft, IconDeviceFloppy, IconHistory
} from '@tabler/icons-react';

import { getDockRebalanceProposal, createDockReassignmentLog, getAllDockReassignmentLog } from '../services/dockRebalanceService';
import { mapToDockRebalanceDomain } from '../mappers/dockRebalanceMapper';
import type { DockRebalanceFinal } from '../domain/dockRebalance';
import { RebalanceTable } from '../components/RebalanceTable';
import { LoadComparisonTable } from '../components/LoadComparisonTable';
import { notifyError, notifySuccess, notifyInfo } from '../../../utils/notify';
import type { UpdateVesselVisitNotificationDto } from "../../vesselVisitNotification/types/vvnTypes.ts";
import { updateVvn } from "../../vesselVisitNotification/service/vvnService.ts";
import type { DockReassignmentLogDTO } from '../dto/dockReassignmentLogDTO';
import type { DockReassignmentLog } from '../domain/dockReassignmentLog';

const PRIMARY_COLOR = "#2a9d8f";

export const DockRebalancePage = () => {
    const { t, i18n } = useTranslation();

    const currentOfficerId = useAppStore((s) => s.user?.email) || "Unknown";

    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [data, setData] = useState<DockRebalanceFinal | null>(null);
    const [loading, setLoading] = useState(false);
    const [applying, setApplying] = useState(false);

    // Estados para o Modal de Histórico
    const [historyOpened, setHistoryOpened] = useState(false);
    const [logs, setLogs] = useState<DockReassignmentLog[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

    const handleCompute = async () => {
        setLoading(true);
        setData(null);
        try {
            const res = await getDockRebalanceProposal(date);
            setData(mapToDockRebalanceDomain(res));
            notifySuccess(t('dockRebalance.successNotify'));
        } catch {
            notifyError(t('dockRebalance.errorNotify'));
        } finally {
            setLoading(false);
        }
    };

    const handleViewHistory = async () => {
        setLoadingLogs(true);
        try {
            const res = await getAllDockReassignmentLog();
            setLogs(res);
            setHistoryOpened(true);
        } catch (err) {
            notifyError(t('dockRebalance.history.loadError'));
        } finally {
            setLoadingLogs(false);
        }
    };

    const handleApplyChanges = async () => {
        if (!data) return;

        const movesToApply = data.results.filter(item => item.isMoved);

        if (movesToApply.length === 0) {
            notifyInfo(t('dockRebalance.noMovesToApply'));
            return;
        }

        setApplying(true);
        let successCount = 0;
        let failCount = 0;

        try {
            for (const item of movesToApply) {
                try {
                    const updateDto: UpdateVesselVisitNotificationDto = {
                        dock: item.proposedDock
                    };
                    await updateVvn(item.vvnId, updateDto);

                    const logDto: DockReassignmentLogDTO = {
                        vvnId: item.vvnId,
                        vesselName: item.vesselName,
                        originalDock: item.originalDock,
                        updatedDock: item.proposedDock,
                        officerId: currentOfficerId,
                        timestamp: new Date().toISOString()
                    };
                    await createDockReassignmentLog(logDto);

                    successCount++;
                } catch (err: unknown) {
                    failCount++;
                    const axiosError = err as { response?: { data?: { error?: string } }; message?: string };
                    const errorMsg = axiosError.response?.data?.error || axiosError.message || String(err);
                    console.error(`Falha ao processar VVN ${item.vvnId}:`, errorMsg);
                }
            }

            if (failCount === 0) {
                notifySuccess(t('dockRebalance.applySuccessNotify', { count: successCount }));
                setData(null);
            } else if (successCount > 0) {
                notifyInfo(`Processamento parcial: ${successCount} aplicados, ${failCount} falhas.`);
            } else {
                notifyError(t('dockRebalance.applyErrorNotify'));
            }
        } finally {
            setApplying(false);
        }
    };

    const hasMovesToApply = data?.results.some(item => item.isMoved);

    return (
        <Container size="xl" py="xl">
            {/* MODAL DE HISTÓRICO */}
            <Modal
                opened={historyOpened}
                onClose={() => setHistoryOpened(false)}
                title={
                    <Group gap="xs">
                        <IconHistory size={20} color={PRIMARY_COLOR} />
                        <Text fw={700} size="lg">{t('dockRebalance.history.title')}</Text>
                    </Group>
                }
                centered
                size={900}
                overlayProps={{ blur: 2 }}
            >
                <Stack gap="md">
                    <Text size="sm" c="dimmed">
                        {t('dockRebalance.history.description')}
                    </Text>

                    <Divider />

                    <Box style={{ border: '1px solid var(--mantine-color-default-border)', borderRadius: '8px', overflow: 'hidden' }}>
                        <ScrollArea h={450} type="auto">
                            <Table striped highlightOnHover>
                                <Table.Thead bg="var(--mantine-color-default-hover)">
                                    <Table.Tr>
                                        <Table.Th>{t('dockRebalance.history.timestamp')}</Table.Th>
                                        <Table.Th>{t('dockRebalance.history.vessel')}</Table.Th>
                                        <Table.Th>{t('dockRebalance.history.reassignment')}</Table.Th>
                                        <Table.Th>{t('dockRebalance.history.officer')}</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {logs.length > 0 ? logs.map((log, i) => (
                                        <Table.Tr key={log.id || i}>
                                            <Table.Td>
                                                <Text size="xs">
                                                    {new Date(log.timestamp).toLocaleString(i18n.language === 'pt' ? 'pt-PT' : 'en-US')}
                                                </Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text fw={700} size="sm">{log.vesselName}</Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Group gap={6} wrap="nowrap">
                                                    <Badge variant="light" color="gray" size="sm">{log.originalDock}</Badge>
                                                    <IconScale size={14} style={{ opacity: 0.5 }} />
                                                    <Badge variant="filled" color="teal" size="sm">{log.updatedDock}</Badge>
                                                </Group>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="xs" fw={500}>{log.officerId}</Text>
                                            </Table.Td>
                                        </Table.Tr>
                                    )) : (
                                        <Table.Tr>
                                            <Table.Td colSpan={4}>
                                                <Center py="xl">
                                                    <Text c="dimmed">{t('dockRebalance.history.empty')}</Text>
                                                </Center>
                                            </Table.Td>
                                        </Table.Tr>
                                    )}
                                </Table.Tbody>
                            </Table>
                        </ScrollArea>
                    </Box>

                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={() => setHistoryOpened(false)}>
                            {t('dockRebalance.history.close')}
                        </Button>
                    </Group>
                </Stack>
            </Modal>

            {/* HEADER */}
            <Group justify="space-between" mb="xl" pb="md" style={{ borderBottom: `1px solid var(--mantine-color-default-border)` }}>
                <Group gap="sm">
                    <ActionIcon component={Link} to="/dashboard" variant="subtle" color="gray" size="xl">
                        <IconArrowLeft size={30} />
                    </ActionIcon>
                    <ThemeIcon size={48} radius="md" variant="gradient" gradient={{ from: PRIMARY_COLOR, to: '#264653' }}>
                        <IconScale size={30} />
                    </ThemeIcon>
                    <Stack gap={0}>
                        <Title order={2}>{t('dockRebalance.title')}</Title>
                        <Text size="sm" c="dimmed">{t('dockRebalance.subtitle')}</Text>
                    </Stack>
                </Group>

                <Group align="flex-end" gap="sm">
                    <Stack gap={4}>
                        <Text size="xs" fw={700} tt="uppercase" c="dimmed">{t('dockRebalance.dateLabel')}</Text>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            disabled={loading || applying}
                            style={{
                                padding: '8px',
                                borderRadius: '8px',
                                border: '1px solid var(--mantine-color-default-border)',
                                backgroundColor: 'var(--mantine-color-default)',
                                color: 'var(--mantine-color-text)',
                                cursor: (loading || applying) ? 'not-allowed' : 'auto',
                                opacity: (loading || applying) ? 0.7 : 1
                            }}
                        />
                    </Stack>
                    <Button
                        leftSection={<IconRocket size={20} />}
                        style={{ backgroundColor: PRIMARY_COLOR }}
                        size="md"
                        onClick={handleCompute}
                        loading={loading}
                        disabled={applying}
                    >
                        {t('dockRebalance.computeButton')}
                    </Button>
                </Group>
            </Group>

            <Box style={{ position: 'relative', minHeight: 400 }}>
                <LoadingOverlay visible={loading || applying || loadingLogs} overlayProps={{ blur: 2 }} />

                {data && (
                    <Stack gap="xl">
                        <Paper withBorder p="md" radius="md" bg="var(--mantine-color-default-hover)">
                            <Group justify="space-between">
                                <div>
                                    <Text fw={700}>{t('dockRebalance.applyChangesTitle')}</Text>
                                    <Text size="sm" c="dimmed">
                                        {t('dockRebalance.applyChangesSubtitle', { count: data.results.filter(i => i.isMoved).length })}
                                    </Text>
                                </div>
                                <Button
                                    color="teal"
                                    size="md"
                                    leftSection={<IconDeviceFloppy size={20} />}
                                    onClick={handleApplyChanges}
                                    loading={applying}
                                    disabled={loading || !hasMovesToApply}
                                >
                                    {t('dockRebalance.applyButton')}
                                </Button>
                            </Group>
                        </Paper>

                        <Grid grow gutter="md">
                            <Grid.Col span={{ base: 12, md: 4 }}>
                                <Paper withBorder p="md" radius="md">
                                    <Group justify="space-between">
                                        <Stack gap={0}>
                                            <Text size="xs" c="dimmed" fw={700} tt="uppercase">{t('dockRebalance.improvement')}</Text>
                                            <Text fw={900} size="xl" style={{ color: PRIMARY_COLOR }}>
                                                {data.stats.improvementPercent.toFixed(1)}%
                                            </Text>
                                        </Stack>
                                        <RingProgress
                                            size={80}
                                            roundCaps
                                            thickness={8}
                                            sections={[{ value: data.stats.improvementPercent, color: PRIMARY_COLOR }]}
                                            label={<Center><IconTrendingUp size={20} color={PRIMARY_COLOR} /></Center>}
                                        />
                                    </Group>
                                </Paper>
                            </Grid.Col>

                            <Grid.Col span={{ base: 12, md: 8 }}>
                                <Paper withBorder p="md" radius="md" bg="var(--mantine-color-default-hover)">
                                    <Grid grow>
                                        <Grid.Col span={6}>
                                            <Text size="xs" c="dimmed" fw={700} tt="uppercase">{t('dockRebalance.stdDevBefore')}</Text>
                                            <Text fw={700} size="lg">{data.stats.stdDevBefore.toFixed(2)}</Text>
                                        </Grid.Col>
                                        <Grid.Col span={6}>
                                            <Text size="xs" c="dimmed" fw={700} tt="uppercase">{t('dockRebalance.stdDevAfter')}</Text>
                                            <Text fw={700} size="lg" c="teal">{data.stats.stdDevAfter.toFixed(2)}</Text>
                                        </Grid.Col>
                                    </Grid>
                                </Paper>
                            </Grid.Col>
                        </Grid>

                        <Stack gap="xs">
                            <Title order={4}>{t('dockRebalance.assignments')}</Title>
                            <RebalanceTable data={data.results} />
                        </Stack>

                        <Stack gap="xs">
                            <Title order={4}>{t('dockRebalance.loadComparison')}</Title>
                            <LoadComparisonTable data={data.loadDifferences} />
                        </Stack>
                    </Stack>
                )}

                {!data && !loading && !applying && (
                    <Paper withBorder p={100} radius="md" style={{ textAlign: 'center', borderStyle: 'dashed' }}>
                        <Stack align="center" gap="sm">
                            <IconAnalyze size={48} color="var(--mantine-color-gray-5)" />
                            <Text c="dimmed">{t('dockRebalance.emptyState')}</Text>
                            <Button
                                variant="outline"
                                color="gray"
                                mt="md"
                                leftSection={<IconHistory size={18} />}
                                onClick={handleViewHistory}
                                loading={loadingLogs}
                            >
                                {t('dockRebalance.history.viewHistory')}
                            </Button>
                        </Stack>
                    </Paper>
                )}
            </Box>
        </Container>
    );
};