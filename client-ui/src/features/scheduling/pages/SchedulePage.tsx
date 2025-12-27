import React, {useState, useCallback} from 'react';
import {Link} from 'react-router-dom';
import {useTranslation} from "react-i18next";
import toast from "react-hot-toast";
import { useAppStore } from "../../../app/store";
import { Roles } from "../../../app/types";

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
    Alert,
    ThemeIcon,
} from '@mantine/core';

import {
    IconCalendar,
    IconStar,
    IconBolt,
    IconSearch,
    IconAlertTriangle,
    IconClockHour3,
    IconShip,
    IconSettings,
    IconListDetails,
    IconDna,
    IconAdjustmentsHorizontal,
    IconBrain,
    IconInfoCircle,
    IconDeviceFloppy,
    IconClipboardCheck,
    IconRocket,
    IconCheck
} from '@tabler/icons-react';

import {notifyLoading, notifySuccess, notifyError} from "../../../utils/notify";
import {
    SchedulingService,
    type AlgorithmType,
    type ScheduleResponse,
    type GeneticParams,
    type SmartParams,
    type SaveScheduleDto
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
                    height: "45px",
                    transition: "border-color 0.2s"
                }}
                className="date-input-modern"
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
        <Card withBorder radius="md" p="md" shadow="sm" mb="lg" style={{ transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
            <Group justify="space-between" mb="xs">
                <Flex align="center" gap="sm">
                    <ThemeIcon size="lg" radius="md" variant="light" color="indigo">
                        <IconShip size={20} />
                    </ThemeIcon>
                    <Title order={4}>{op.vessel}</Title>
                </Flex>
                <Badge variant="outline" color="indigo" size="lg" radius="sm">
                    {t('planningScheduling.dock')}: {op.dock}
                </Badge>
            </Group>

            <Grid gutter="xs">
                <Grid.Col span={{base: 6, md: 3}}>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>{t('planningScheduling.window')}</Text>
                    <Text fw={600}>{op.startTime} - {op.endTime}</Text>
                </Grid.Col>
                <Grid.Col span={{base: 6, md: 3}}>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>{t('planningScheduling.optimizedDuration')}</Text>
                    <Text fw={700} c="indigo">{op.optimizedOperationDuration} min</Text>
                </Grid.Col>
                <Grid.Col span={{base: 6, md: 3}}>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>{t('planningScheduling.craneUsed')}</Text>
                    <Group gap={4}>
                        <Text fw={500}>{op.crane}</Text>
                        {op.craneCountUsed > 1 && (
                            <Badge size="xs" color="teal" variant="filled">x{op.craneCountUsed}</Badge>
                        )}
                    </Group>
                </Grid.Col>
                <Grid.Col span={{base: 6, md: 3}}>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>{t('planningScheduling.work')}</Text>
                    <Text>{op.loadingDuration}m / {op.unloadingDuration}m</Text>
                </Grid.Col>
            </Grid>

            <Space h="md"/>

            <Card p="xs" radius="sm" withBorder bg={isDelayed ? 'red.0' : 'green.0'} style={{ border: isDelayed ? '1px solid #ffc9c9' : '1px solid #b2f2bb' }}>
                <Group justify="space-between">
                    <Flex align="center" gap="xs">
                        <IconClockHour3 size={18} color={isDelayed ? '#fa5252' : '#40c057'}/>
                        <Text fw={600} c={isDelayed ? 'red.7' : 'green.7'}>
                            {t('planningScheduling.realDeparture')}: {op.realDepartureTime}
                        </Text>
                    </Flex>
                    <Badge color={isDelayed ? 'red' : 'green'} size="lg" variant="filled">
                        {t('planningScheduling.delay')}: {op.departureDelay} min
                    </Badge>
                </Group>
            </Card>

            {op.staffAssignments && op.staffAssignments.length > 0 && (
                <Stack mt="md">
                    <Text fw={600} size="sm" c="dimmed">{t('planningScheduling.staffAssignments')}</Text>
                    <Grid gutter="xs">
                        {op.staffAssignments.map((s: StaffAssignmentDto, idx: number) => (
                            <Grid.Col span={6} key={idx}>
                                <Badge fullWidth variant="dot" size="lg" color="gray">
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
            <Table.Td fw={600}>{item.vessel}</Table.Td>
            <Table.Td c="blue.7" fw={600}>{item.start}</Table.Td>
            <Table.Td c="green.7">{item.end}</Table.Td>
            <Table.Td c="orange.7" fw={700}>{item.end - item.start}</Table.Td>
        </Table.Tr>
    ));
    return (
        <Box my="xl">
            <Title order={5} mb="md" c="dimmed" tt="uppercase">
                <Group gap="xs">
                    <IconListDetails size={18} />
                    {t('planningScheduling.prologSequenceTitle')}
                </Group>
            </Title>
            <Card withBorder radius="md" p="0" shadow="sm" style={{ overflow: 'hidden' }}>
                <Table horizontalSpacing="md" verticalSpacing="sm" striped highlightOnHover>
                    <Table.Thead bg="gray.1">
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
    const user = useAppStore((state) => state.user);
    const canSave = user?.role === Roles.LogisticsOperator;

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
    const [isSaving, setIsSaving] = useState(false);
    const [isPlanSaved, setIsPlanSaved] = useState(false);
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
        setIsPlanSaved(false);
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

    const handleSavePlan = async () => {
        if (!scheduleToDisplay || !selectedDate) return;
        if (isPlanSaved) return;

        let finalAlgorithmName = selectedAlgorithm;
        if (selectedAlgorithm === 'smart' && scheduleToDisplay.smartData) {
            finalAlgorithmName = scheduleToDisplay.smartData.selectedAlgorithm as AlgorithmType;
        }

        const dto: SaveScheduleDto = {
            planDate: selectedDate,
            author: user?.email,
            algorithm: getAlgoName(finalAlgorithmName as AlgorithmType),
            total_delay: scheduleToDisplay.prolog?.total_delay || 0,
            status: scheduleToDisplay.prolog?.status || "Generated",
            operations: scheduleToDisplay.schedule?.operations || []
        };

        setIsSaving(true);
        const loadingId = notifyLoading(t('planningScheduling.savingPlan') || "A guardar plano...");

        try {
            await SchedulingService.saveSchedule(dto);
            toast.dismiss(loadingId);
            notifySuccess(t('planningScheduling.saveSuccess') || "Plano guardado com sucesso!");

            setIsPlanSaved(true);

        } catch (e) {
            console.error(e);
            toast.dismiss(loadingId);
            notifyError(t('planningScheduling.saveError') || "Erro ao guardar plano.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Container size="xl" py="xl" className="bg-gray-50 min-h-screen">
            {/* --- CABEÇALHO DA PÁGINA --- */}
            <Group justify="space-between" mb="xl" pb="md" style={{borderBottom: "1px solid #e0e0e0"}}>
                <Group gap="sm">
                    <Link to="/dashboard" className="pr-back-button" style={{ textDecoration: 'none', color: '#555', fontSize: '1.5rem', lineHeight: 1 }}>‹</Link>
                    <Stack gap={0}>
                        <Title order={2} c="dark.7">
                            <Group gap="sm">
                                <IconCalendar size={32} color="var(--mantine-color-indigo-6)"/>
                                {t('planningScheduling.title')}
                            </Group>
                        </Title>
                        <Text size="sm" c="dimmed">
                            {t('planningScheduling.totalOperations')}: {scheduleToDisplay?.schedule?.operations?.length ?? 0}
                        </Text>
                    </Stack>
                </Group>
            </Group>

            {/* --- CARD DE INPUTS E CONFIGURAÇÃO --- */}
            <Card shadow="md" radius="lg" p="xl" withBorder mb="xl">
                <Grid gutter="xl">
                    <Grid.Col span={{base: 12, md: 4}}>
                        <HtmlDateInput
                            value={selectedDate}
                            onChange={(v) => {
                                setSelectedDate(v);
                                setError(null);
                                setAllResults({});
                                setIsPlanSaved(false);
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
                                    size="md"
                                    value={selectedAlgorithm}
                                    onChange={(v) => {
                                        setSelectedAlgorithm(v as AlgorithmType);
                                        setIsPlanSaved(false);
                                    }}
                                    data={algorithms.map(a => ({
                                        value: a.value,
                                        label: (
                                            <Center style={{display: "flex", flexDirection: "column", padding: 8, gap: 4}}>
                                                <a.icon size={22} color={a.value === 'smart' ? 'var(--mantine-color-indigo-6)' : undefined}/>
                                                <Text size="sm" fw={500}>
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

                {/* --- CONFIGURAÇÕES AVANÇADAS (Collapsibles) --- */}
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

                {/* --- BOTÃO DE CALCULAR --- */}
                <Button
                    onClick={fetchSchedule}
                    size="lg"
                    fullWidth
                    mt="xl"
                    loading={isLoading}
                    disabled={!selectedDate}
                    leftSection={selectedAlgorithm === 'smart' ? <IconBrain size={22}/> : selectedAlgorithm === 'multi_crane' ? <IconRocket size={22} /> : <IconBolt size={22}/>}
                    variant={selectedAlgorithm === 'multi_crane' ? "gradient" : "filled"}
                    gradient={selectedAlgorithm === 'multi_crane' ? {from: "blue", to: "cyan"} : undefined}
                    color={selectedAlgorithm === 'smart' ? "indigo" : selectedAlgorithm !== 'multi_crane' ? "indigo" : undefined}
                    radius="md"
                    style={{ transition: 'all 0.2s', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                >
                    {selectedAlgorithm === 'multi_crane'
                        ? t('planningScheduling.runMultiCrane', {algo: algorithms.find(a=>a.value === multiCraneAlgorithm)?.label || multiCraneAlgorithm})
                        : t('planningScheduling.computeScheduleFor', {algo: getAlgoName(selectedAlgorithm)})
                    }
                </Button>
            </Card>

            {/* --- NOTIFICAÇÃO DE ERRO --- */}
            {error && (
                <Notification icon={<IconAlertTriangle size={20}/>} color="red" radius="md" mb="xl">
                    {error}
                </Notification>
            )}

            {/* --- ÁREA DE RESULTADOS --- */}
            {Object.keys(allResults).length > 0 && !isLoading && (
                <Box mt="xl">
                    {/* Seletor de Comparação (se aplicável) */}
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

                    {!showComparisonAnalysis && lastComputedAlgorithm !== 'smart' && (
                        <AlgorithmComparisonTable allResults={allResults} t={t as TFunc} />
                    )}

                    {!showComparisonAnalysis && scheduleToDisplay && scheduleToDisplay.schedule && (
                        <>
                            {}
                            {canSave ? (
                                <Box
                                    mb="xl"
                                    mt="xl"
                                    p="lg"
                                    style={{
                                        background: isPlanSaved ? "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)" : "linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)",
                                        borderRadius: "16px",
                                        border: isPlanSaved ? "1px solid #10b981" : "1px solid #bbf7d0",
                                        boxShadow: isPlanSaved ? "0 0 15px rgba(16, 185, 129, 0.2)" : "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                                        transition: "all 0.5s ease"
                                    }}
                                >
                                    <Group justify="space-between" align="center">
                                        <Group>
                                            <ThemeIcon
                                                size={48}
                                                radius="xl"
                                                variant={isPlanSaved ? "filled" : "light"}
                                                color={isPlanSaved ? "green" : "teal"}
                                                style={{ transition: "all 0.5s ease" }}
                                            >
                                                {isPlanSaved ? <IconCheck size={28} /> : <IconClipboardCheck size={28} />}
                                            </ThemeIcon>
                                            <Stack gap={2}>
                                                <Text size="xs" c={isPlanSaved ? "green.8" : "teal.7"} fw={800} tt="uppercase">
                                                    {t('planningScheduling.status') || "STATUS"}: {isPlanSaved ? (t('planningScheduling.saved') || "PLAN SAVED") : (t('planningScheduling.readyToSave') || "READY TO SAVE")}
                                                </Text>
                                                <Title order={3} c="dark.7">
                                                    {t('planningScheduling.scheduleResult', {algo: getAlgoName(lastComputedAlgorithm!)})}
                                                </Title>
                                            </Stack>
                                        </Group>

                                        <Button
                                            onClick={handleSavePlan}
                                            loading={isSaving}
                                            disabled={isPlanSaved}
                                            leftSection={isPlanSaved ? <IconCheck size={24} stroke={3}/> : <IconDeviceFloppy size={22} />}
                                            variant="gradient"
                                            gradient={isPlanSaved
                                                ? { from: 'green', to: 'teal', deg: 105 }
                                                : { from: 'teal', to: 'green', deg: 105 }
                                            }
                                            size="lg"
                                            radius="md"
                                            style={{
                                                transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                                transform: isPlanSaved ? 'scale(1.05)' : 'scale(1)',
                                                boxShadow: isPlanSaved ? '0 0 0 0 rgba(0,0,0,0)' : '0 4px 14px 0 rgba(0, 150, 136, 0.39)',
                                                opacity: isPlanSaved ? 0.9 : 1
                                            }}
                                            styles={{
                                                root: {
                                                    '&:disabled': {
                                                        opacity: 1,
                                                        color: 'white',
                                                        cursor: 'default',
                                                        backgroundImage: 'linear-gradient(105deg, #10b981 0%, #059669 100%)'
                                                    }
                                                }
                                            }}
                                        >
                                            {isPlanSaved
                                                ? (t('planningScheduling.savedSuccessfully') || "Plano Guardado!")
                                                : (t('planningScheduling.savePlan') || "Guardar Plano")
                                            }
                                        </Button>
                                    </Group>
                                </Box>
                            ) : (
                                <Group mb="xl" mt="xl" style={{borderBottom: "1px solid #e0e0e0", paddingBottom: "15px"}}>
                                    <Title order={3} c="dark.7">
                                        {t('planningScheduling.scheduleResult', {algo: getAlgoName(lastComputedAlgorithm!)})}
                                    </Title>
                                </Group>
                            )}

                            {}
                            {scheduleToDisplay.smartData && (
                                <Alert icon={<IconInfoCircle size={20}/>} title={t('planningScheduling.smartReasonTitle')} color="indigo" radius="md" mb="xl" variant="light">
                                    <Text size="sm" fw={500}>
                                        {t('planningScheduling.smartSelectionPerformed')}: <Badge color="indigo" variant="filled" ml={5}>{scheduleToDisplay.smartData.selectedAlgorithm.toUpperCase()}</Badge>
                                    </Text>
                                    <Text size="xs" mt={5} c="dimmed">
                                        {scheduleToDisplay.smartData.selectionReason}
                                    </Text>
                                </Alert>
                            )}

                            {/* --- CARD DE RESUMO ESTATÍSTICO --- */}
                            <Card shadow="md" radius="lg" p="lg" withBorder mb="xl" bg="indigo.8" c="white" style={{ background: "linear-gradient(45deg, #3b5bdb 0%, #4c6ef5 100%)" }}>
                                <Group justify="space-between">
                                    <Stack gap={4}>
                                        <Text fw={500} c="indigo.1" tt="uppercase" size="xs">{t('planningScheduling.totalOperations')}</Text>
                                        <Text size="xl" fw={800}>{scheduleToDisplay.schedule.operations?.length || 0}</Text>
                                    </Stack>
                                    <Stack gap={4} align="flex-end">
                                        <Text fw={500} c="indigo.1" tt="uppercase" size="xs">{t('planningScheduling.totalDelay')}</Text>
                                        <Badge size="xl" radius="md" variant="white" c={(scheduleToDisplay.prolog?.total_delay || 0) > 0 ? "red.7" : "green.7"}>
                                            {scheduleToDisplay.prolog?.total_delay || 0} {t('planningScheduling.hours')}
                                        </Badge>
                                    </Stack>
                                </Group>
                            </Card>

                            {/* --- TABELA DA SEQUÊNCIA DO PROLOG --- */}
                            {scheduleToDisplay.prolog?.best_sequence && (
                                <PrologSequenceTable sequence={scheduleToDisplay.prolog.best_sequence} />
                            )}

                            {/* --- LISTA DE OPERAÇÕES (CARDS) --- */}
                            <Stack gap="md">
                                {scheduleToDisplay.schedule.operations?.map((op) => (
                                    <OperationRow key={op.vvnId} op={op} t={t as TFunc} locale={locale}/>
                                ))}
                            </Stack>

                            {/* --- DADOS CRUS (DEBUG) --- */}
                            <Box mt="xl" pt="xl" style={{borderTop: "1px solid #ddd"}}>
                                <Title order={4} mb="md" c="dimmed">{t('planningScheduling.prologRaw')}</Title>
                                <Box component="pre" style={{
                                    background: "#1a1b1e", color: "#69db7c", padding: 20, borderRadius: 12, maxHeight: 400, overflowX: "auto", fontSize: '0.85rem'
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