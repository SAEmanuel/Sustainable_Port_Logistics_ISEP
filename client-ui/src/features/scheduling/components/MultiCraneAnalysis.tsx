import React, { useState, useMemo } from 'react';
import {
    Card,
    Group,
    Text,
    Badge,
    Table,
    Tabs,
    Grid,
    ThemeIcon,
    Paper,
    Stack,
    Timeline,
    Alert,
    Tooltip
} from '@mantine/core';
import {
    IconArrowDownRight,
    IconCrane,
    IconChartBar,
    IconBulb,
    IconTrendingUp,
    IconInfoCircle,
    IconAlertTriangle,
    IconClock
} from '@tabler/icons-react';
import type { MultiCraneComparisonResultDto, SchedulingOperationDto } from '../dtos/scheduling.dtos';

interface MultiCraneAnalysisProps {
    data: MultiCraneComparisonResultDto;
}

interface SmartSuggestion {
    vvnId: string;
    isBottleneck: boolean;
    reason: 'DIRECT' | 'CASCADING' | 'NONE';
    suggestedCranes: number;
    timeSavedMinutes: number;
    message: string;
}

export const MultiCraneAnalysis: React.FC<MultiCraneAnalysisProps> = ({ data }) => {
    const [activeTab, setActiveTab] = useState<string | null>('prediction');

    const delayDiff = data.singleTotalDelay - data.multiTotalDelay;

    const smartSuggestions = useMemo(() => {
        const suggestions: Record<string, SmartSuggestion> = {};

        const opsByDock: Record<string, SchedulingOperationDto[]> = {};
        data.multiCraneSchedule.operations.forEach(op => {
            if (!opsByDock[op.dock]) opsByDock[op.dock] = [];
            opsByDock[op.dock].push(op);
        });

        Object.keys(opsByDock).forEach(dock => {
            const ops = opsByDock[dock].sort((a, b) => a.startTime - b.startTime);

            for (let i = 0; i < ops.length; i++) {
                const currentOp = ops[i];
                const nextOp = ops[i + 1];

                const currentCranes = currentOp.craneCountUsed || 1;
                const availableCranes = currentOp.totalCranesOnDock || 1;

                const workLoad = currentOp.optimizedOperationDuration * currentCranes;
                const durationWithMoreCranes = Math.ceil(workLoad / (currentCranes + 1));
                const timeSaved = currentOp.optimizedOperationDuration - durationWithMoreCranes;

                let status: SmartSuggestion = {
                    vvnId: currentOp.vvnId,
                    isBottleneck: false,
                    reason: 'NONE',
                    suggestedCranes: currentCranes,
                    timeSavedMinutes: 0,
                    message: `Recursos suficientes (${currentCranes}/${availableCranes} usados).`
                };

                if (currentOp.departureDelay > 0) {
                    status = {
                        vvnId: currentOp.vvnId,
                        isBottleneck: true,
                        reason: 'DIRECT',
                        suggestedCranes: currentCranes + 1,
                        timeSavedMinutes: timeSaved * 60,
                        message: `Atraso direto. Usando ${currentCranes} de ${availableCranes} gruas disponíveis.`
                    };
                }
                else if (nextOp && nextOp.departureDelay > 0 && timeSaved > 0) {
                    status = {
                        vvnId: currentOp.vvnId,
                        isBottleneck: true,
                        reason: 'CASCADING',
                        suggestedCranes: currentCranes + 1,
                        timeSavedMinutes: timeSaved * 60,
                        message: `Bloqueando cais para próximo navio. Usando ${currentCranes}/${availableCranes} gruas.`
                    };
                }

                suggestions[currentOp.vvnId] = status;
            }
        });

        return suggestions;
    }, [data]);


    return (
        <Card withBorder radius="md" p="xl" mt="lg" bg="gray.0">
            <Group justify="space-between" mb="lg">
                <Group>
                    <ThemeIcon size={40} radius="md" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                        <IconChartBar size={24} />
                    </ThemeIcon>
                    <div>
                        <Text fw={700} size="xl">Relatório de Otimização Multi-Crane</Text>
                        <Text size="sm" c="dimmed">Análise de Gargalos e Cascatas</Text>
                    </div>
                </Group>

                <Tabs value={activeTab} onChange={setActiveTab} variant="pills" radius="md">
                    <Tabs.List>
                        <Tabs.Tab value="prediction" leftSection={<IconBulb size={16}/>}>
                            Sugestão
                        </Tabs.Tab>
                        <Tabs.Tab value="comparison" leftSection={<IconChartBar size={16}/>}>
                            Comparação Direta
                        </Tabs.Tab>
                        <Tabs.Tab value="history" leftSection={<IconTrendingUp size={16}/>}>
                            Histórico
                        </Tabs.Tab>
                    </Tabs.List>
                </Tabs>
            </Group>

            <Grid mb="xl">
                <Grid.Col span={{ base: 12, sm: 4 }}>
                    <Paper withBorder p="md" radius="md" bg="white">
                        <Group justify="space-between">
                            <Text size="xs" c="dimmed" fw={700} tt="uppercase">Atraso Global</Text>
                            <ThemeIcon color={delayDiff > 0 ? "green" : "red"} variant="light"><IconArrowDownRight size={16}/></ThemeIcon>
                        </Group>
                        <Group align="flex-end" gap="xs" mt="xs">
                            <Text fw={700} size="xl">{data.multiTotalDelay}h</Text>
                            {delayDiff !== 0 && (
                                <Badge color={delayDiff > 0 ? "teal" : "red"} variant="light">
                                    {delayDiff > 0 ? `-${delayDiff}h melhoria` : `+${Math.abs(delayDiff)}h piora`}
                                </Badge>
                            )}
                        </Group>
                        <Text size="xs" c="dimmed" mt={4}>vs {data.singleTotalDelay}h (Single Crane)</Text>
                    </Paper>
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 4 }}>
                    <Paper withBorder p="md" radius="md" bg="white">
                        <Group justify="space-between">
                            <Text size="xs" c="dimmed" fw={700} tt="uppercase">Custo Operacional</Text>
                            <ThemeIcon color="blue" variant="light"><IconCrane size={16}/></ThemeIcon>
                        </Group>
                        <Group align="flex-end" gap="xs" mt="xs">
                            <Text fw={700} size="xl">{data.multiCraneHours}h</Text>
                            <Text size="xs" c="dimmed" mb={4}>horas-grua</Text>
                        </Group>
                    </Paper>
                </Grid.Col>
            </Grid>

            {activeTab === 'prediction' && (
                <Stack>
                    <Alert variant="light" color="indigo" title="Análise de Recursos do Cais" icon={<IconInfoCircle />}>
                        Visualização da utilização real vs capacidade física detectada no banco de dados.
                    </Alert>

                    <Grid gutter="lg">
                        {data.multiCraneSchedule.operations.map((op, i) => {
                            const suggestion = smartSuggestions[op.vvnId];
                            const isCascading = suggestion?.reason === 'CASCADING';
                            const isDirect = suggestion?.reason === 'DIRECT';
                            const needsAction = suggestion?.isBottleneck;

                            const available = op.totalCranesOnDock || 1;
                            const used = op.craneCountUsed || 1;
                            const isMaxedOut = used >= available;

                            return (
                                <Grid.Col span={{base: 12, md: 6}} key={i}>
                                    <Paper
                                        withBorder
                                        p="md"
                                        radius="md"
                                        style={{ position: 'relative', overflow: 'hidden', transition: 'all 0.2s' }}
                                        bg={isDirect ? 'red.0' : isCascading ? 'orange.0' : 'white'}
                                    >
                                        <Group justify="space-between" mb="xs">
                                            <Group gap="xs">
                                                <Text fw={700}>{op.vessel}</Text>
                                                <Badge size="xs" variant="outline">{op.dock}</Badge>
                                            </Group>

                                            {isDirect && <Badge color="red" leftSection={<IconAlertTriangle size={12}/>}>Atraso Crítico</Badge>}
                                            {isCascading && <Badge color="orange" leftSection={<IconClock size={12}/>}>Gargalo em Cascata</Badge>}
                                            {!needsAction && <Badge color="green">Otimizado</Badge>}
                                        </Group>

                                        <Group mb="md" align="stretch" grow>
                                            <Stack gap={0} align="center" style={{borderRight: '1px solid #eee'}}>
                                                <Text size="xs" c="dimmed">Alocação Real</Text>
                                                <Group gap={4}>
                                                    <IconCrane size={20} color="gray"/>
                                                    <Text fw={700} size="xl">{used} <span style={{fontSize: 12, color: '#999'}}>/ {available}</span></Text>
                                                </Group>
                                                {isMaxedOut && <Text size="xs" c="red">Máx. Atingido</Text>}
                                            </Stack>

                                            <Stack gap={0} align="center">
                                                <Text size="xs" c="dimmed">Sugestão Ideal</Text>
                                                <Group gap={4}>
                                                    <IconCrane size={20} color={needsAction ? (isDirect ? "red" : "orange") : "green"}/>
                                                    <Text fw={700} size="xl" c={needsAction ? (isDirect ? "red" : "orange") : "green"}>
                                                        {suggestion?.suggestedCranes || used}
                                                    </Text>
                                                </Group>
                                            </Stack>
                                        </Group>

                                        {needsAction ? (
                                            <Paper bg="white" p="xs" radius="sm" withBorder style={{borderColor: isDirect ? 'pink' : 'orange'}}>
                                                <Group gap="xs" align="start" wrap="nowrap">
                                                    <ThemeIcon size="sm" color={isDirect ? 'red' : 'orange'} variant="transparent" mt={2}>
                                                        <IconBulb />
                                                    </ThemeIcon>
                                                    <Text size="sm" c="dark" style={{lineHeight: 1.3}}>
                                                        {suggestion?.message}
                                                    </Text>
                                                </Group>
                                            </Paper>
                                        ) : (
                                            <Text size="sm" c="dimmed" ta="center">
                                                {used < available
                                                    ? `Operação eficiente com ${used} gruas. (Ainda restam ${available - used})`
                                                    : `Capacidade máxima atingida (${available} gruas).`
                                                }
                                            </Text>
                                        )}

                                        <Group mt="xs" justify="flex-end">
                                            <Text size="xs" c="dimmed">Partida: {op.realDepartureTime}h</Text>
                                        </Group>
                                    </Paper>
                                </Grid.Col>
                            )
                        })}
                    </Grid>
                </Stack>
            )}

            {activeTab === 'comparison' && (
                <Table horizontalSpacing="md" verticalSpacing="sm" bg="white" style={{borderRadius: 8}} withTableBorder>
                    <Table.Thead>
                        <Table.Tr bg="gray.1">
                            <Table.Th>Navio</Table.Th>
                            <Table.Th>Dock</Table.Th>
                            <Table.Th>Duração (Multi)</Table.Th>
                            <Table.Th>Partida Real</Table.Th>
                            <Table.Th>Status</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {data.multiCraneSchedule.operations.map(multiOp => (
                            <Table.Tr key={multiOp.vvnId}>
                                <Table.Td fw={500}>{multiOp.vessel}</Table.Td>
                                <Table.Td><Badge variant="outline" size="xs" color="gray">{multiOp.dock}</Badge></Table.Td>
                                <Table.Td>
                                    <Group gap={6}>
                                        <Text fw={700} c="blue">{multiOp.optimizedOperationDuration}h</Text>
                                        <Badge size="xs" color="blue" variant="filled">x{multiOp.craneCountUsed}</Badge>
                                    </Group>
                                </Table.Td>
                                <Table.Td>{multiOp.realDepartureTime}h</Table.Td>
                                <Table.Td>
                                    {multiOp.departureDelay <= 0
                                        ? <Badge color="green" variant="light">No Prazo</Badge>
                                        : <Badge color="red" variant="light">+{multiOp.departureDelay}h</Badge>
                                    }
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            )}

            {activeTab === 'history' && (
                <Paper withBorder p="xl" radius="md">
                    <Text fw={700} mb="xl">Passos do Algoritmo (Backend)</Text>
                    <Timeline active={data.optimizationSteps.length - 1} bulletSize={24} lineWidth={2}>
                        {data.optimizationSteps.map((step, idx) => (
                            <Timeline.Item
                                key={idx}
                                bullet={<Text size="xs">{step.stepNumber}</Text>}
                                title={`Iteração ${step.stepNumber}`}
                            >
                                <Text c="dimmed" size="sm">{step.changeDescription}</Text>
                                <Group mt={4}>
                                    <Badge size="xs" variant="outline">Delay Global: {step.totalDelay}h</Badge>
                                    <Badge size="xs" variant="outline" color="gray">Total Gruas: {step.totalCranesUsed}</Badge>
                                </Group>
                            </Timeline.Item>
                        ))}
                    </Timeline>
                </Paper>
            )}
        </Card>
    );
};