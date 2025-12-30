import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    Container, Title, Text, Card, Grid, TextInput, Button,
    Table, Badge, Group, ActionIcon, Stack, Box, Center, Loader,
    ThemeIcon, Collapse, Tooltip, UnstyledButton
} from '@mantine/core';
import {
    IconSearch, IconShip, IconChevronDown,
    IconChevronUp, IconHistory, IconUser, IconCalendarEvent,
    IconClockHour3, IconCrane, IconX, IconArrowLeft, IconCalendarTime,
    IconSelector
} from '@tabler/icons-react';
import { useTranslation } from "react-i18next";
import { SchedulingService } from '../services/SchedulingService';
import type { SaveScheduleDto, OperationPlanFilterDTO } from '../dtos/scheduling.dtos';
import { notifyError } from "../../../utils/notify";
const SmartTimeDisplay = ({ hours, baseDateStr }: { hours: number, baseDateStr: string }) => {
    if (hours === undefined || hours === null) return <Text size="sm" c="dimmed">-</Text>;

    const daysToAdd = Math.floor(hours / 24);
    const displayHour = hours % 24;
    const timeString = `${displayHour.toString().padStart(2, '0')}:00`;

    const getFullDateString = () => {
        if (!baseDateStr) return "Data desconhecida";
        const base = new Date(baseDateStr);
        const realDate = new Date(base.getTime() + hours * 60 * 60 * 1000);
        return realDate.toLocaleDateString(undefined, {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <Tooltip label={getFullDateString()} color="dark" withArrow transitionProps={{ duration: 200 }}>
            <Group gap={6} style={{ cursor: 'help' }}>
                <Text fw={600} style={{ color: daysToAdd > 0 ? '#fa5252' : '#228be6' }}>
                    {timeString}
                </Text>
                {daysToAdd > 0 && (
                    <Badge size="xs" variant="filled" color="orange" radius="sm" tt="lowercase">+{daysToAdd}d</Badge>
                )}
            </Group>
        </Tooltip>
    );
};
interface ThProps {
    children: React.ReactNode;
    reversed: boolean;
    sorted: boolean;
    onSort(): void;
    style?: React.CSSProperties;
}

function Th({ children, reversed, sorted, onSort, style }: ThProps) {
    const Icon = sorted ? (reversed ? IconChevronUp : IconChevronDown) : IconSelector;
    return (
        <Table.Th style={style}>
            <UnstyledButton onClick={onSort} style={{ width: '100%' }}>
                <Group justify="space-between">
                    <Text fw={700} size="sm">{children}</Text>
                    <Center>
                        <Icon size={16} stroke={1.5} color={sorted ? 'var(--mantine-color-blue-6)' : 'var(--mantine-color-gray-5)'} />
                    </Center>
                </Group>
            </UnstyledButton>
        </Table.Th>
    );
}

export default function OperationPlanHistoryPage() {
    const { t } = useTranslation();
    const [plans, setPlans] = useState<SaveScheduleDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [openedPlan, setOpenedPlan] = useState<string | null>(null);

    // Filtros
    const [vesselFilter, setVesselFilter] = useState('');
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');

    // --- ESTADOS DE ORDENAÇÃO ---
    const [sortBy, setSortBy] = useState<keyof SaveScheduleDto | null>(null);
    const [reverseSortDirection, setReverseSortDirection] = useState(false);

    const fetchHistory = async (overrideFilters?: OperationPlanFilterDTO) => {
        setLoading(true);
        setOpenedPlan(null);
        try {
            const filters: OperationPlanFilterDTO = overrideFilters || {};
            if (!overrideFilters) {
                if (vesselFilter) filters.vessel = vesselFilter;
                if (dateStart) filters.startDate = dateStart;
                if (dateEnd) filters.endDate = `${dateEnd}T23:59:59`;
            }
            const data = await SchedulingService.getHistoryPlans(filters);
            setPlans(data);
        } catch (e) {
            console.error(e);
            notifyError(t('planningScheduling.errorHistory') || "Erro ao carregar histórico.");
        } finally {
            setLoading(false);
        }
    };

    const clearFilters = () => {
        setVesselFilter('');
        setDateStart('');
        setDateEnd('');
        fetchHistory({});
    };

    useEffect(() => { fetchHistory(); }, []);
    const setSorting = (field: keyof SaveScheduleDto) => {
        const reversed = field === sortBy ? !reverseSortDirection : false;
        setReverseSortDirection(reversed);
        setSortBy(field);
    };

    const getDelay = (plan: any) => plan.total_delay ?? plan.totalDelay ?? 0;

    const sortedPlans = useMemo(() => {
        if (!sortBy) return plans;

        return [...plans].sort((a, b) => {
            let valA: any = a[sortBy];
            let valB: any = b[sortBy];

            if (sortBy === 'total_delay') {
                valA = getDelay(a);
                valB = getDelay(b);
            }

            if (reverseSortDirection) {
                return valB < valA ? -1 : valB > valA ? 1 : 0;
            }
            return valA < valB ? -1 : valA > valB ? 1 : 0;
        });
    }, [plans, sortBy, reverseSortDirection]);

    const toggleDetails = (id: string) => setOpenedPlan(openedPlan === id ? null : id);
    const formatDate = (dateStr: string) => (!dateStr ? "-" : new Date(dateStr).toLocaleDateString());

    return (
        <Container size="xl" py="xl" className="bg-gray-50 min-h-screen">
            <Stack gap="lg">

                {/* Cabeçalho */}
                <Group justify="space-between" align="center">
                    <Group gap="md">
                        <ActionIcon component={Link} to="/dashboard" variant="subtle" color="gray" size="xl" radius="xl">
                            <IconArrowLeft size={28} />
                        </ActionIcon>
                        <ThemeIcon size={44} radius="md" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                            <IconHistory size={26} />
                        </ThemeIcon>
                        <Stack gap={0}>
                            <Title order={2} c="dark.7">{t('planningScheduling.historyTitle') || "Histórico de Planos"}</Title>
                            <Text size="sm" c="dimmed">Consulte os agendamentos passados</Text>
                        </Stack>
                    </Group>
                </Group>

                {/* Filtros */}
                <Card withBorder radius="md" shadow="sm" p="lg" bg="white">
                    <Text fw={600} mb="sm" size="sm" tt="uppercase" c="dimmed">Filtros de Pesquisa</Text>
                    <Grid align="flex-end" gutter="md">
                        <Grid.Col span={{ base: 12, md: 3 }}>
                            <TextInput
                                label={t('planningScheduling.vessel') || "Navio"}
                                placeholder="Ex: Atlantic Trader"
                                leftSection={<IconShip size={16} />}
                                value={vesselFilter}
                                onChange={(e) => setVesselFilter(e.currentTarget.value)}
                            />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 3 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <Text size="sm" fw={500}>{t('planningScheduling.startDate') || "Data Início"}</Text>
                                <input type="date" className="date-input-modern" style={{ padding: '7px', borderRadius: '4px', border: '1px solid #ced4da', height: 36, width: '100%' }} value={dateStart} onChange={(e) => setDateStart(e.target.value)} />
                            </div>
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 3 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <Text size="sm" fw={500}>{t('planningScheduling.endDate') || "Data Fim"}</Text>
                                <input type="date" className="date-input-modern" style={{ padding: '7px', borderRadius: '4px', border: '1px solid #ced4da', height: 36, width: '100%' }} value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} />
                            </div>
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 3 }}>
                            <Group gap="xs" wrap="nowrap">
                                <Tooltip label="Limpar filtros">
                                    <ActionIcon variant="light" color="gray" size="lg" radius="md" style={{ height: 36, width: 36 }} onClick={clearFilters}>
                                        <IconX size={18} />
                                    </ActionIcon>
                                </Tooltip>
                                {/* --- 1. BOTÃO DE PESQUISA COM NOVO DESIGN (GRADIENTE E SOMBRA) --- */}
                                <Button
                                    fullWidth
                                    leftSection={<IconSearch size={18} />}
                                    onClick={() => fetchHistory()}
                                    loading={loading}
                                    variant="gradient"
                                    gradient={{ from: 'blue', to: 'cyan' }}
                                    style={{ height: 36, boxShadow: '0 4px 12px rgba(34, 184, 207, 0.3)' }}
                                >
                                    {t('common.search') || "Pesquisar"}
                                </Button>
                                {/* ----------------------------------------------------------------- */}
                            </Group>
                        </Grid.Col>
                    </Grid>
                </Card>

                {/* Tabela */}
                <Card withBorder radius="md" p={0} shadow="sm" style={{ overflow: 'hidden' }}>
                    <Table verticalSpacing="md" highlightOnHover>
                        <Table.Thead bg="gray.1">
                            <Table.Tr>
                                <Table.Th style={{ width: 40 }} />
                                {/* --- COLUNAS ORDENÁVEIS --- */}
                                <Th
                                    sorted={sortBy === 'planDate'}
                                    reversed={reverseSortDirection}
                                    onSort={() => setSorting('planDate')}
                                >
                                    {t('planningScheduling.planDate') || "Data do Plano"}
                                </Th>
                                <Th
                                    sorted={sortBy === 'algorithm'}
                                    reversed={reverseSortDirection}
                                    onSort={() => setSorting('algorithm')}
                                >
                                    {t('planningScheduling.algorithm') || "Algoritmo"}
                                </Th>
                                <Table.Th style={{textAlign: 'center'}}>{t('planningScheduling.totalOperations') || "Operações"}</Table.Th>
                                <Th
                                    sorted={sortBy === 'total_delay'}
                                    reversed={reverseSortDirection}
                                    onSort={() => setSorting('total_delay')}
                                >
                                    {t('planningScheduling.total_Delay')}
                                </Th>
                                <Th
                                    sorted={sortBy === 'author'}
                                    reversed={reverseSortDirection}
                                    onSort={() => setSorting('author')}
                                >
                                    {t('planningScheduling.author') || "Gerado Por"}
                                </Th>
                                <Table.Th>{t('planningScheduling.status2')}</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {loading ? (
                                <Table.Tr><Table.Td colSpan={7}><Center py={50}><Loader size="md" /></Center></Table.Td></Table.Tr>
                            ) : sortedPlans.length === 0 ? (
                                <Table.Tr><Table.Td colSpan={7}><Center py={50} style={{flexDirection: 'column'}}><IconCalendarEvent size={40} color="#adb5bd" /><Text c="dimmed" mt="sm">Nenhum plano encontrado.</Text></Center></Table.Td></Table.Tr>
                            ) : (
                                sortedPlans.map((plan: any, index: number) => {
                                    const uniqueKey = plan.domainId || plan._id || `plan-${index}`;
                                    const isOpen = openedPlan === uniqueKey;
                                    const delayValue = getDelay(plan);
                                    const isOk = plan.status?.toLowerCase() === 'ok' || plan.status?.toLowerCase() === 'success';

                                    return (
                                        <React.Fragment key={uniqueKey}>
                                            <Table.Tr onClick={() => toggleDetails(uniqueKey)} style={{ cursor: 'pointer', backgroundColor: isOpen ? 'var(--mantine-color-blue-0)' : undefined }}>
                                                <Table.Td><ActionIcon variant="subtle" color="gray">{isOpen ? <IconChevronUp size={16}/> : <IconChevronDown size={16}/>}</ActionIcon></Table.Td>
                                                <Table.Td fw={600} style={{ fontSize: '1.05rem' }}>{formatDate(plan.planDate)}</Table.Td>
                                                <Table.Td><Badge color="blue" variant="light" size="sm" radius="sm">{plan.algorithm}</Badge></Table.Td>
                                                <Table.Td style={{textAlign: 'center'}}><Badge color="gray" variant="outline">{plan.operations?.length || 0}</Badge></Table.Td>
                                                <Table.Td>
                                                    <Group gap={6}>
                                                        <IconClockHour3 size={16} color={delayValue > 0 ? '#fa5252' : '#40c057'} />
                                                        <Text fw={700} c={delayValue > 0 ? 'red.8' : 'green.8'}>{delayValue}h</Text>
                                                    </Group>
                                                </Table.Td>

                                                {/* --- 2. AUTOR COM TOOLTIP NOVO --- */}
                                                <Table.Td>
                                                    <Group gap="xs">
                                                        <IconUser size={14} color="gray" />
                                                        <Tooltip label={plan.author} withArrow>
                                                            <Text size="sm" c="dimmed" style={{ cursor: 'help' }}>
                                                                {plan.author?.split('@')[0] || 'System'}
                                                            </Text>
                                                        </Tooltip>
                                                    </Group>
                                                </Table.Td>

                                                {/* --- 3. STATUS --- */}
                                                <Table.Td>
                                                    <Group gap={8}>
                                                        <Box
                                                            style={{
                                                                width: 8, height: 8, borderRadius: '50%',
                                                                backgroundColor: isOk ? 'var(--mantine-color-green-6)' : 'var(--mantine-color-orange-6)',
                                                                boxShadow: isOk ? '0 0 8px var(--mantine-color-green-4)' : '0 0 8px var(--mantine-color-orange-4)'
                                                            }}
                                                        />
                                                        <Text size="sm" fw={600} c={isOk ? 'green.8' : 'orange.8'} tt="uppercase" style={{ fontSize: '0.75rem' }}>
                                                            {plan.status || 'OK'}
                                                        </Text>
                                                    </Group>
                                                </Table.Td>
                                                {/* ------------------------------------------ */}

                                            </Table.Tr>
                                            <Table.Tr style={{ display: isOpen ? 'table-row' : 'none' }}>
                                                <Table.Td colSpan={7} p={0} style={{ borderBottom: isOpen ? '1px solid #dee2e6' : 'none' }}>
                                                    <Collapse in={isOpen}>
                                                        <Box p="lg" bg="gray.0" style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
                                                            <Group mb="sm">
                                                                <ThemeIcon size="sm" color="blue" variant="light"><IconCalendarTime size={14} /></ThemeIcon>
                                                                <Text size="sm" fw={700} tt="uppercase" c="dimmed">Execução Real Estimada</Text>
                                                            </Group>
                                                            <Card withBorder radius="md">
                                                                <Table striped withColumnBorders>
                                                                    <Table.Thead>
                                                                        <Table.Tr>
                                                                            <Table.Th>Navio</Table.Th>
                                                                            <Table.Th>Doca</Table.Th>
                                                                            <Table.Th>Chegada Real</Table.Th>
                                                                            <Table.Th>Partida Real</Table.Th>
                                                                            <Table.Th>Grua</Table.Th>
                                                                            <Table.Th>Atraso</Table.Th>
                                                                        </Table.Tr>
                                                                    </Table.Thead>
                                                                    <Table.Tbody>
                                                                        {plan.operations?.map((op: any, idx: number) => (
                                                                            <Table.Tr key={idx}>
                                                                                <Table.Td fw={500}>{op.vessel || op.Vessel}</Table.Td>
                                                                                <Table.Td>{op.dock || op.Dock}</Table.Td>
                                                                                <Table.Td><SmartTimeDisplay hours={op.realArrivalTime ?? op.RealArrivalTime} baseDateStr={plan.planDate} /></Table.Td>
                                                                                <Table.Td><SmartTimeDisplay hours={op.realDepartureTime ?? op.RealDepartureTime} baseDateStr={plan.planDate} /></Table.Td>
                                                                                <Table.Td><Group gap={4}><IconCrane size={14} color="gray"/><Text size="sm">{op.crane || op.Crane}</Text></Group></Table.Td>
                                                                                <Table.Td>{(op.departureDelay ?? op.DepartureDelay) > 0 ? (<Badge color="red" size="sm">+{op.departureDelay ?? op.DepartureDelay}h</Badge>) : (<Text size="sm" c="dimmed">-</Text>)}</Table.Td>
                                                                            </Table.Tr>
                                                                        ))}
                                                                    </Table.Tbody>
                                                                </Table>
                                                            </Card>
                                                        </Box>
                                                    </Collapse>
                                                </Table.Td>
                                            </Table.Tr>
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </Table.Tbody>
                    </Table>
                </Card>
            </Stack>
        </Container>
    );
}