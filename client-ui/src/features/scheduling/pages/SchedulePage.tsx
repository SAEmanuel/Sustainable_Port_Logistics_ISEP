import React, {useState, useCallback} from 'react';
import {Link} from 'react-router-dom';
import {useTranslation} from "react-i18next";
import toast from "react-hot-toast";

import {
    Box,
    Card,
    Flex,
    Title,
    Text,
    Button,
    Group,
    Stack,
    Grid,
    Badge,
    SegmentedControl,
    Notification,
    Space,
    Container,
    Center,
    Select,
    Table,
    NumberInput,
    Collapse,
    Alert
} from '@mantine/core';

import {
    IconCalendar,
    IconStar,
    IconBolt,
    IconSearch,
    IconAlertTriangle,
    IconClockHour3,
    IconShip,
    IconCpu,
    IconSettings,
    IconListDetails,
    IconDna,
    IconAdjustmentsHorizontal,
    IconBrain,
    IconInfoCircle
} from '@tabler/icons-react';

import {notifyLoading, notifySuccess, notifyError} from "../../../utils/notify";
import {
    SchedulingService,
    type AlgorithmType,
    type ScheduleResponse,
    type GeneticParams,
    type SmartParams
} from '../services/SchedulingService';

import type {
    SchedulingOperationDto,
    StaffAssignmentDto,
    PrologOperationResultDto
} from '../dtos/scheduling.dtos.ts';

import AlgorithmComparisonTable from '../components/AlgorithmComparisonTable';



export type ScheduleResponseWithTime = ScheduleResponse & { executionTime?: number };

type TFunc = (key: string, options?: Record<string, unknown>) => string;

function HtmlDateInput({
                           value,
                           onChange,
                           label
                       }: {
    value: string | null;
    onChange: (v: string | null) => void;
    label: string;
}) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        onChange(val || null);
    };

    return (
        <div style={{display: "flex", flexDirection: "column", gap: 6}}>
            <Text size="lg" fw={600}>{label}</Text>
            <input
                type="date"
                value={value ?? ""}
                onChange={handleChange}
                style={{
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #ccc",
                    fontSize: "16px",
                    height: "45px"
                }}
            />
        </div>
    );
}

const OperationRow = ({op, t, locale}: { op: SchedulingOperationDto, t: TFunc, locale: string }) => {
    const isDelayed = op.departureDelay > 0;

    const formatTimeOnly = (isoString: string): string => {
        try {
            return new Date(isoString).toLocaleTimeString(locale === "pt" ? "pt-PT" : "en-US", {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'UTC'
            });
        } catch {
            return 'N/A';
        }
    };

    const formatTimeInterval = (startIso: string, endIso: string): string => {
        const startTime = formatTimeOnly(startIso);
        const endTime = formatTimeOnly(endIso);
        return `${startTime} - ${endTime}`;
    }

    return (
        <Card withBorder radius="md" p="md" shadow="sm" mb="lg">
            <Group justify="space-between" mb="xs">
                <Flex align="center" gap="sm">
                    <IconShip size={20} color='var(--mantine-color-indigo-6)'/>
                    <Title order={4}>{op.vessel}</Title>
                </Flex>
                <Badge variant="light" color="indigo" size="lg">
                    {t('planningScheduling.dock')}: {op.dock}
                </Badge>
            </Group>

            <Grid gutter="xs">
                <Grid.Col span={{base: 6, md: 3}}>
                    <Text size="xs" c="dimmed">{t('planningScheduling.window')}</Text>
                    <Text fw={600}>{op.startTime} - {op.endTime}</Text>
                </Grid.Col>
                <Grid.Col span={{base: 6, md: 3}}>
                    <Text size="xs" c="dimmed">{t('planningScheduling.optimizedDuration')}</Text>
                    <Text fw={700} c="indigo">{op.optimizedOperationDuration}h</Text>
                </Grid.Col>
                <Grid.Col span={{base: 6, md: 3}}>
                    <Text size="xs" c="dimmed">{t('planningScheduling.craneUsed')}</Text>
                    <Group gap={4}>
                        <Text>{op.crane}</Text>
                        {op.craneCountUsed > 1 && (
                            <Badge size="xs" color="teal">x{op.craneCountUsed}</Badge>
                        )}
                    </Group>
                </Grid.Col>
                <Grid.Col span={{base: 6, md: 3}}>
                    <Text size="xs" c="dimmed">{t('planningScheduling.work')}</Text>
                    <Text>{op.loadingDuration}h / {op.unloadingDuration}h</Text>
                </Grid.Col>
            </Grid>

            <Space h="md"/>

            <Card p="xs" radius="sm" withBorder bg={isDelayed ? 'red.0' : 'green.0'}>
                <Group justify="space-between">
                    <Flex align="center" gap="xs">
                        <IconClockHour3 size={18}/>
                        <Text fw={600} c={isDelayed ? 'red.7' : 'green.7'}>
                            {t('planningScheduling.realDeparture')}: {op.realDepartureTime}
                        </Text>
                    </Flex>
                    <Badge color={isDelayed ? 'red' : 'green'} size="lg">
                        {t('planningScheduling.delay')}: {op.departureDelay}h
                    </Badge>
                </Group>
            </Card>

            {op.staffAssignments && op.staffAssignments.length > 0 && (
                <Stack mt="md">
                    <Text fw={600}>{t('planningScheduling.staffAssignments')}</Text>
                    <Grid gutter="xs">
                        {op.staffAssignments.map((s: StaffAssignmentDto, idx: number) => (
                            <Grid.Col span={6} key={idx}>
                                <Badge fullWidth variant="light">
                                    {s.staffMemberName}: {formatTimeInterval(s.intervalStart, s.intervalEnd)}
                                </Badge>
                            </Grid.Col>
                        ))}
                    </Grid>
                </Stack>
            )}
        </Card>
    );
};

const PrologSequenceTable: React.FC<{ sequence: PrologOperationResultDto[] }> = ({ sequence }) => {
    const { t } = useTranslation();
    const rows = sequence.map((item, index) => (
        <Table.Tr key={item.vessel}>
            <Table.Td>{index + 1}</Table.Td>
            <Table.Td fw={500}>{item.vessel}</Table.Td>
            <Table.Td c="blue.7" fw={600}>{item.start}</Table.Td>
            <Table.Td c="green.7">{item.end}</Table.Td>
            <Table.Td c="orange.7">{item.end - item.start}</Table.Td>
        </Table.Tr>
    ));
    return (
        <Box my="xl">
            <Title order={4} mb="md">
                <Group gap="xs">
                    <IconListDetails size={20} />
                    {t('planningScheduling.prologSequenceTitle')}
                </Group>
            </Title>
            <Card withBorder radius="md" p="md" shadow="sm">
                <Table horizontalSpacing="md" verticalSpacing="xs" striped highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>#</Table.Th>
                            <Table.Th>{t('planningScheduling.vessel')}</Table.Th>
                            <Table.Th>{t('planningScheduling.startTime')}</Table.Th>
                            <Table.Th>{t('planningScheduling.endTime')}</Table.Th>
                            <Table.Th>{t('planningScheduling.duration')}</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>{rows}</Table.Tbody>
                </Table>
            </Card>
        </Box>
    );
};

export default function SchedulePage() {
    const {t, i18n} = useTranslation();

    const [selectedDate, setSelectedDate] = useState<string | null>(null);


    const [selectedAlgorithm, setSelectedAlgorithm] = useState<AlgorithmType>('smart');
    const [multiCraneAlgorithm, setMultiCraneAlgorithm] = useState<string>('greedy');

    const [geneticParams, setGeneticParams] = useState<GeneticParams>({
        populationSize: undefined,
        generations: undefined,
        mutationRate: undefined,
        crossoverRate: undefined
    });


    const [smartParams, setSmartParams] = useState<SmartParams>({
        maxComputationSeconds: undefined
    });

    const [showComparisonAnalysis, setShowComparisonAnalysis] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [allResults, setAllResults] = useState<Partial<Record<AlgorithmType, ScheduleResponseWithTime>>>({});
    const [lastComputedAlgorithm, setLastComputedAlgorithm] = useState<AlgorithmType | null>(null);

    const locale = i18n.language;

    const algorithms = [
        {value: 'smart', label: t('planningScheduling.smart'), icon: IconBrain},
        {value: 'optimal', label: t('planningScheduling.optimal'), icon: IconStar},
        {value: 'greedy', label: t('planningScheduling.greedy'), icon: IconBolt},
        {value: 'local_search', label: t('planningScheduling.localSearch'), icon: IconSearch},
        {value: 'genetic', label: t('planningScheduling.genetic'), icon: IconDna},
        {value: 'multi_crane', label: 'Multi Crane', icon: IconCpu},
    ];

    const getAlgoName = useCallback(
        (algo: AlgorithmType | null) =>
            algorithms.find(a => a.value === algo)?.label ?? "",
        [algorithms]
    );

    const scheduleToDisplay = allResults[lastComputedAlgorithm as AlgorithmType];

    const fetchSchedule = async () => {
        if (!selectedDate) {
            notifyError(t('planningScheduling.noDateSelected'));
            return;
        }

        const currentAlgo = selectedAlgorithm;
        const loadingId = notifyLoading(t('planningScheduling.scheduleLoading'));
        setIsLoading(true);
        setError(null);

        const startTime = performance.now();

        try {
            const response = await SchedulingService.getDailySchedule(
                selectedDate,
                currentAlgo,
                multiCraneAlgorithm,
                geneticParams,
                smartParams
            );

            const endTime = performance.now();
            const durationMs = endTime - startTime;

            const newResults = {
                ...allResults,
                [currentAlgo]: { ...response, executionTime: durationMs }
            };

            setAllResults(newResults);
            setLastComputedAlgorithm(currentAlgo);
            setShowComparisonAnalysis(currentAlgo === 'multi_crane');

            toast.dismiss(loadingId);
            notifySuccess(t('planningScheduling.scheduleSuccess'));
        } catch (e) {
            console.error(e);
            toast.dismiss(loadingId);
            setError(e instanceof Error ? e.message : t('planningScheduling.error'));
            notifyError(t('planningScheduling.scheduleFail'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container size="xl" py="xl" className="bg-gray-50 min-h-screen">
            <Group justify="space-between" mb="xl" pb="md" style={{borderBottom: "1px solid #ddd"}}>
                <Group gap="sm">
                    <Link to="/dashboard" className="pr-back-button">‹</Link>
                    <Stack gap={0}>
                        <Title order={2}>
                            <Group gap="sm">
                                <IconCalendar size={32}/>
                                {t('planningScheduling.title')}
                            </Group>
                        </Title>
                        <Text size="sm" c="gray.6">
                            {t('planningScheduling.totalOperations')}: {scheduleToDisplay?.schedule?.operations?.length ?? 0}
                        </Text>
                    </Stack>
                </Group>
            </Group>

            <Card shadow="lg" radius="xl" p="xl" withBorder mb="xl">
                <Grid gutter="xl">
                    <Grid.Col span={{base: 12, md: 4}}>
                        <HtmlDateInput
                            value={selectedDate}
                            onChange={(v) => {
                                setSelectedDate(v);
                                setError(null);
                                setAllResults({});
                            }}
                            label={t('planningScheduling.selectDay')}
                        />
                    </Grid.Col>

                    <Grid.Col span={{base: 12, md: 8}}>
                        <Text fw={600} mb="xs">{t('planningScheduling.selectAlgorithm')}</Text>
                        <Group align="flex-start">
                            <Box style={{ flex: 1 }}>
                                <SegmentedControl
                                    fullWidth
                                    radius="md"
                                    value={selectedAlgorithm}
                                    onChange={(v) => setSelectedAlgorithm(v as AlgorithmType)}
                                    data={algorithms.map(a => ({
                                        value: a.value,
                                        label: (
                                            <Center style={{display: "flex", flexDirection: "column", padding: 8}}>
                                                <a.icon size={20} color={a.value === 'smart' ? 'var(--mantine-color-indigo-6)' : a.value === 'multi_crane' ? 'var(--mantine-color-blue-6)' : undefined}/>
                                                <Text size="sm" fw={a.value === 'smart' || a.value === 'multi_crane' ? 700 : 400}>
                                                    {a.label}
                                                </Text>
                                            </Center>
                                        )
                                    }))}
                                />
                            </Box>
                            {selectedAlgorithm === 'multi_crane' && (
                                <Box w={200}>
                                    <Select
                                        label={t('planningScheduling.comparisonMethod')}
                                        placeholder={t('planningScheduling.choose')}
                                        radius="md"
                                        leftSection={<IconSettings size={16}/>}
                                        data={[
                                            { value: 'greedy', label: 'Greedy' },
                                            { value: 'local_search', label: 'Local Search' },
                                            { value: 'optimal', label: 'Optimal' }
                                        ]}
                                        value={multiCraneAlgorithm}
                                        onChange={(val) => setMultiCraneAlgorithm(val || 'greedy')}
                                    />
                                </Box>
                            )}
                        </Group>
                    </Grid.Col>
                </Grid>

                {/* PAINEL SMART */}
                <Collapse in={selectedAlgorithm === 'smart'}>
                    <Box mt="xl" p="md" style={{ backgroundColor: 'var(--mantine-color-indigo-0)', borderRadius: '12px', border: '1px dashed var(--mantine-color-indigo-2)' }}>
                        <Group mb="xs">
                            <IconAdjustmentsHorizontal size={18} color="var(--mantine-color-indigo-6)"/>
                            <Text fw={700} size="sm" c="indigo.9">{t('planningScheduling.smartSettings')}</Text>
                        </Group>
                        <Grid>
                            <Grid.Col span={{base: 12, md: 4}}>
                                <NumberInput
                                    label={t('planningScheduling.maxComputationSeconds')}
                                    placeholder={t('planningScheduling.smartDefaultSeconds')}
                                    min={1}
                                    value={smartParams.maxComputationSeconds}
                                    onChange={(val) => setSmartParams({ maxComputationSeconds: val as number })}
                                />
                            </Grid.Col>
                        </Grid>
                    </Box>
                </Collapse>

                <Collapse in={selectedAlgorithm === 'genetic'}>
                    <Box mt="xl" p="md" style={{ backgroundColor: 'var(--mantine-color-gray-0)', borderRadius: '12px', border: '1px dashed #ccc' }}>
                        <Group mb="xs">
                            <IconAdjustmentsHorizontal size={18} color="gray"/>
                            <Text fw={700} size="sm">{t('planningScheduling.advancedSettingsOptional')}</Text>
                        </Group>
                        <Grid>
                            <Grid.Col span={{base: 6, md: 3}}>
                                <NumberInput
                                    label={t('planningScheduling.population')}
                                    placeholder={t('planningScheduling.defaultPopulation')}
                                    min={2}
                                    value={geneticParams.populationSize}
                                    onChange={(val) => setGeneticParams({...geneticParams, populationSize: val as number})}
                                />
                            </Grid.Col>
                            <Grid.Col span={{base: 6, md: 3}}>
                                <NumberInput
                                    label={t('planningScheduling.generations')}
                                    placeholder={t('planningScheduling.defaultGenerations')}
                                    min={1}
                                    value={geneticParams.generations}
                                    onChange={(val) => setGeneticParams({...geneticParams, generations: val as number})}
                                />
                            </Grid.Col>
                            <Grid.Col span={{base: 6, md: 3}}>
                                <NumberInput
                                    label={t('planningScheduling.mutationRate')}
                                    placeholder={t('planningScheduling.exMutation')}
                                    decimalScale={2}
                                    min={0} max={1} step={0.01}
                                    value={geneticParams.mutationRate}
                                    onChange={(val) => setGeneticParams({...geneticParams, mutationRate: val as number})}
                                />
                            </Grid.Col>
                            <Grid.Col span={{base: 6, md: 3}}>
                                <NumberInput
                                    label={t('planningScheduling.crossoverRate')}
                                    placeholder={t('planningScheduling.exCrossover')}
                                    decimalScale={2}
                                    min={0} max={1} step={0.01}
                                    value={geneticParams.crossoverRate}
                                    onChange={(val) => setGeneticParams({...geneticParams, crossoverRate: val as number})}
                                />
                            </Grid.Col>
                        </Grid>
                    </Box>
                </Collapse>

                <Button
                    onClick={fetchSchedule}
                    size="lg"
                    fullWidth
                    mt="xl"
                    loading={isLoading}
                    disabled={!selectedDate}
                    leftSection={selectedAlgorithm === 'smart' ? <IconBrain size={20}/> : <IconBolt size={20}/>}
                    variant={selectedAlgorithm === 'multi_crane' ? "gradient" : "filled"}
                    gradient={selectedAlgorithm === 'multi_crane' ? {from: "blue", to: "cyan"} : undefined}
                    color={selectedAlgorithm === 'smart' ? "indigo" : selectedAlgorithm !== 'multi_crane' ? "indigo" : undefined}
                >
                    {selectedAlgorithm === 'multi_crane'
                        ? t('planningScheduling.runMultiCrane', {algo: algorithms.find(a=>a.value === multiCraneAlgorithm)?.label || multiCraneAlgorithm})
                        : t('planningScheduling.computeScheduleFor', {algo: getAlgoName(selectedAlgorithm)})
                    }
                </Button>
            </Card>

            {error && (
                <Notification icon={<IconAlertTriangle size={20}/>} color="red" radius="md" mb="xl">
                    {error}
                </Notification>
            )}

            {Object.keys(allResults).length > 0 && !isLoading && (
                <Box mt="xl">
                    {allResults['multi_crane']?.comparisonData && (
                        <Group justify="center" mb="lg">
                            <SegmentedControl
                                value={showComparisonAnalysis ? 'analysis' : 'standard'}
                                onChange={(v) => setShowComparisonAnalysis(v === 'analysis')}
                                data={[
                                    { value: 'standard', label: t('planningScheduling.standardView') },
                                    { value: 'analysis', label: (
                                            <Group gap={6}>
                                                <Text fw={700} c="blue">{t('planningScheduling.comparison')}</Text>
                                            </Group>
                                        )}
                                ]}
                            />
                        </Group>
                    )}

                    {/* Tabela de comparação oculta se for SMART, conforme pedido */}
                    {!showComparisonAnalysis && lastComputedAlgorithm !== 'smart' && (
                        <AlgorithmComparisonTable allResults={allResults} t={t as TFunc} />
                    )}

                    {!showComparisonAnalysis && scheduleToDisplay && scheduleToDisplay.schedule && (
                        <>
                            <Title order={3} mb="xl" mt="xl" style={{borderBottom: "2px solid #eef"}}>
                                {t('planningScheduling.scheduleResult', {algo: getAlgoName(lastComputedAlgorithm!)})}
                            </Title>

                            {/* Informação do Algoritmo Selecionado pela IA */}
                            {scheduleToDisplay.smartData && (
                                <Alert icon={<IconInfoCircle size={20}/>} title={t('planningScheduling.smartReasonTitle')} color="indigo" radius="md" mb="xl">
                                    <Text size="sm" fw={500}>
                                        {t('planningScheduling.smartSelectionPerformed')}: <Badge color="indigo" variant="outline" ml={5}>{scheduleToDisplay.smartData.selectedAlgorithm.toUpperCase()}</Badge>
                                    </Text>
                                    <Text size="xs" mt={5} c="dimmed">
                                        {scheduleToDisplay.smartData.selectionReason}
                                    </Text>
                                </Alert>
                            )}

                            <Card shadow="md" radius="lg" p="lg" withBorder mb="xl" bg="indigo.8" c="white">
                                <Group justify="space-between">
                                    <Stack gap={4}>
                                        <Text fw={500}>{t('planningScheduling.totalOperations')}</Text>
                                        <Text size="xl" fw={700}>{scheduleToDisplay.schedule.operations?.length || 0}</Text>
                                    </Stack>
                                    <Stack gap={4} align="flex-end">
                                        <Text fw={500}>{t('planningScheduling.totalDelay')}</Text>
                                        <Badge size="xl" radius="md" variant="filled"
                                               color={(scheduleToDisplay.prolog?.total_delay || 0) > 0 ? "red" : "green"}>
                                            {scheduleToDisplay.prolog?.total_delay || 0}{t('planningScheduling.hours')}
                                        </Badge>
                                    </Stack>
                                </Group>
                            </Card>

                            {scheduleToDisplay.prolog?.best_sequence && (
                                <PrologSequenceTable sequence={scheduleToDisplay.prolog.best_sequence} />
                            )}

                            <Stack gap="md">
                                {scheduleToDisplay.schedule.operations?.map((op) => (
                                    <OperationRow key={op.vvnId} op={op} t={t as TFunc} locale={locale}/>
                                ))}
                            </Stack>

                            <Box mt="xl" pt="xl" style={{borderTop: "1px solid #ddd"}}>
                                <Title order={4} mb="md">{t('planningScheduling.prologRaw')}</Title>
                                <Box component="pre" style={{
                                    background: "#111", color: "#4be34b", padding: 15, borderRadius: 8, maxHeight: 400, overflowX: "auto"
                                }}>
                                    {JSON.stringify(scheduleToDisplay.prolog, null, 2)}
                                </Box>
                            </Box>
                        </>
                    )}
                </Box>
            )}
        </Container>
    );
}