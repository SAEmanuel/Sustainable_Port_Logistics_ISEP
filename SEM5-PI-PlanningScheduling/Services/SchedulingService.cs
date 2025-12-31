using SEM5_PI_DecisionEngineAPI.DTOs;
using SEM5_PI_DecisionEngineAPI.Exceptions;

namespace SEM5_PI_DecisionEngineAPI.Services;

public class SchedulingService
{
    const float MinP = 0.4f;
    const float MaxP = 0.4f;

    private readonly QualificationServiceClient _qualificationService;
    private readonly VesselVisitNotificationServiceClient _vvnClient;
    private readonly StaffMemberServiceClient _staffClient;
    private readonly VesselServiceClient _vesselSClient;
    private readonly DockServiceClient _dockClient;
    private readonly PrologClient _prologClient;

    // =================================================================================
    // CACHE FIELDS
    // =================================================================================
    private readonly Dictionary<string, List<PhysicalResourceDto>> _cacheDockCranes = new();
    private readonly Dictionary<Guid, QualificationDto> _cacheQualifications = new();
    private readonly Dictionary<string, List<StaffMemberDto>> _cacheStaff = new();
    private readonly Dictionary<string, VesselDto> _cacheVessels = new();

    public SchedulingService(
        VesselVisitNotificationServiceClient vvnClient,
        StaffMemberServiceClient staffClient,
        DockServiceClient dockClient,
        QualificationServiceClient qualificationService,
        VesselServiceClient vesselClient,
        PrologClient prologClient)
    {
        _vvnClient = vvnClient;
        _staffClient = staffClient;
        _dockClient = dockClient;
        _qualificationService = qualificationService;
        _vesselSClient = vesselClient;
        _prologClient = prologClient;
    }

    private void ClearCaches()
    {
        _cacheDockCranes.Clear();
        _cacheQualifications.Clear();
        _cacheStaff.Clear();
        _cacheVessels.Clear();
    }

    public Task<DailyScheduleResultDto> ComputeDailyScheduleAsync(DateOnly day)
    {
        ClearCaches();
        return ComputeDailyScheduleInternalAsync(day, useMultiCrane: false);
    }

    // =================================================================================
    // MULTI CRANE COMPARISON (Lógica "Perfeita")
    // =================================================================================
    public async Task<MultiCraneComparisonResultDto> ComputeDailyScheduleWithPrologComparisonAsync(
        DateOnly day,
        string algorithmType)
    {
        ClearCaches();

        // 1. Fetch Basic Data
        var vvns = await _vvnClient.GetVisitNotifications();
        var vvnsForDay = vvns
            .Where(v => DateOnly.FromDateTime(v.EstimatedTimeArrival.Date) == day)
            .ToList();

        if (vvnsForDay.Count == 0)
            throw new PlanningSchedulingException($"No visits for {day}");

        // 2. Fetch Dock Capacities
        var realDockCapacities = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        foreach (var vvn in vvnsForDay.DistinctBy(v => v.Dock))
        {
            var dockCranes = await GetCachedDockCranesAsync(vvn.Dock);
            realDockCapacities[vvn.Dock.Trim()] = dockCranes.Count;
        }

        // 3. Pre-calculate Work Durations
        var preCalculatedWork = new Dictionary<string, (int Load, int Unload)>();
        foreach (var vvn in vvnsForDay)
        {
            preCalculatedWork[vvn.Id] = GenerateFixedDurationsForVvn(vvn);
        }

        // 4. Select Strategy
        Func<DailyScheduleResultDto, Task<PrologFullResultDto?>> sendToProlog = algorithmType.ToLower() switch
        {
            "greedy" => SendScheduleToPrologGreedy,
            "local_search" => SendScheduleToPrologLocalSearch,
            "optimal" => SendScheduleToPrologOptimal,
            _ => SendScheduleToPrologGreedy
        };

        var (realSchedule, realProlog, realAllocations, realSteps) = await RunOptimizationLoop(
            day,
            vvnsForDay,
            realDockCapacities,
            preCalculatedWork,
            sendToProlog,
            algorithmType,
            ignoreConstraints: false
        );

        // Single Crane Baseline
        var singleCraneSchedule = await ComputeScheduleFromAllocationsAsync(
            day,
            vvnsForDay,
            vvnsForDay.ToDictionary(v => v.Id, v => 1),
            preCalculatedWork,
            realDockCapacities
        );

        var singleCraneProlog = await sendToProlog(singleCraneSchedule);

        UpdateScheduleFromPrologResult(realSchedule, realProlog);
        UpdateScheduleFromPrologResult(singleCraneSchedule, singleCraneProlog);

        await AssignStaffToScheduleAsync(realSchedule, day, vvnsForDay);
        await AssignStaffToScheduleAsync(singleCraneSchedule, day, vvnsForDay);

        var singleDelay = ExtractTotalDelay(singleCraneProlog);
        var realTotalDelay = ExtractTotalDelay(realProlog);
        var virtualDockCapacities =
            realDockCapacities.Keys.ToDictionary(k => k, k => 99, StringComparer.OrdinalIgnoreCase);

        var (idealSchedule, _, idealAllocations, _) = await RunOptimizationLoop(
            day,
            vvnsForDay,
            virtualDockCapacities,
            preCalculatedWork,
            sendToProlog,
            algorithmType,
            ignoreConstraints: true
        );

        foreach (var realOp in realSchedule.Operations)
        {
            string dockKey = realOp.Dock.Trim();
            int physicalLimit = realDockCapacities.ContainsKey(dockKey) ? realDockCapacities[dockKey] : 0;
            realOp.TotalCranesOnDock = physicalLimit;

            if (idealAllocations.TryGetValue(realOp.VvnId, out int idealCranes))
            {
                realOp.TheoreticalRequiredCranes = idealCranes;
                if (idealCranes > realOp.CraneCountUsed)
                    realOp.ResourceSuggestion =
                        $"Optimal: {idealCranes} cranes. Dock Limit: {physicalLimit}. Used: {realOp.CraneCountUsed}.";
                else
                    realOp.ResourceSuggestion = $"Optimal: {idealCranes}. Dock Limit: {physicalLimit}. (Maximizado)";
            }
        }

        var singleCraneHours = singleCraneSchedule.Operations.Sum(o => o.OptimizedOperationDuration * 1);
        var multiCraneHours = realSchedule.Operations.Sum(o => o.OptimizedOperationDuration * o.CraneCountUsed);

        return new MultiCraneComparisonResultDto
        {
            SingleCraneSchedule = singleCraneSchedule,
            SingleCraneProlog = singleCraneProlog!,
            MultiCraneSchedule = realSchedule,
            MultiCraneProlog = realProlog!,
            SingleTotalDelay = singleDelay,
            MultiTotalDelay = realTotalDelay,
            SingleCraneHours = singleCraneHours,
            MultiCraneHours = multiCraneHours,
            OptimizationSteps = realSteps
        };
    }

    // =================================================================================
    // GENERIC ALGORITHM SCHEDULING (Recuperado para o Controller)
    // =================================================================================
    public async Task<(DailyScheduleResultDto Schedule, PrologFullResultDto Prolog)> ComputeScheduleWithAlgorithmAsync(
        DateOnly day,
        string algorithmType)
    {
        var vvns = await _vvnClient.GetVisitNotifications();
        var vvnsForDay = vvns
            .Where(v => DateOnly.FromDateTime(v.EstimatedTimeArrival.Date) == day)
            .ToList();

        if (vvnsForDay.Count == 0)
            throw new PlanningSchedulingException($"No visits for {day}");

        var schedule = await ComputeDailyScheduleAsync(day);

        Func<DailyScheduleResultDto, Task<PrologFullResultDto?>> sendToProlog = algorithmType.ToLower() switch
        {
            "greedy" => SendScheduleToPrologGreedy,
            "local_search" => SendScheduleToPrologLocalSearch,
            "optimal" => SendScheduleToPrologOptimal,
            _ => SendScheduleToPrologGreedy
        };

        var prologResult = await sendToProlog(schedule);

        schedule = UpdateScheduleFromPrologResult(schedule, prologResult);

        await AssignStaffToScheduleAsync(schedule, day, vvnsForDay);

        return (schedule, prologResult!);
    }

    // =================================================================================
    // CORE LOGIC
    // =================================================================================

    private async Task<(
        DailyScheduleResultDto BestSchedule,
        PrologFullResultDto? BestProlog,
        Dictionary<string, int> BestAllocations,
        List<OptimizationStepDto> Steps
        )> RunOptimizationLoop(
        DateOnly day,
        List<VesselVisitNotificationPSDto> vvnsForDay,
        Dictionary<string, int> capacities,
        Dictionary<string, (int, int)> preCalcWork,
        Func<DailyScheduleResultDto, Task<PrologFullResultDto?>> sendToProlog,
        string algorithmType,
        bool ignoreConstraints)
    {
        var currentAllocations = vvnsForDay.ToDictionary(v => v.Id, v => 1);

        var bestSchedule =
            await ComputeScheduleFromAllocationsAsync(day, vvnsForDay, currentAllocations, preCalcWork, capacities);
        var bestProlog = await sendToProlog(bestSchedule);
        var bestDelay = ExtractTotalDelay(bestProlog);

        long bestDurationScore = bestSchedule.Operations.Sum(op => (long)op.OptimizedOperationDuration);

        var steps = new List<OptimizationStepDto>();
        if (!ignoreConstraints)
        {
            var capsLog = string.Join("; ", capacities.Select(kv => $"{kv.Key}={kv.Value}"));
            steps.Add(new OptimizationStepDto
            {
                StepNumber = 0,
                TotalDelay = bestDelay,
                TotalCranesUsed = currentAllocations.Values.Sum(),
                AlgorithmUsed = algorithmType,
                ChangeDescription = $"Initial. Detected Caps: [{capsLog}]"
            });
        }

        bool improved = true;
        int maxIterations = 20;
        int iteration = 0;

        while (improved && iteration < maxIterations)
        {
            improved = false;
            iteration++;

            var bottleneckCandidates = bestSchedule.Operations
                .OrderByDescending(op => op.DepartureDelay)
                .ThenByDescending(op => op.OptimizedOperationDuration)
                .ToList();

            string? bestCandidateVvn = null;
            int currentBestDelay = bestDelay;
            long currentBestDuration = bestDurationScore;

            DailyScheduleResultDto? currentBestSchedule = null;
            PrologFullResultDto? currentBestProlog = null;

            foreach (var op in bottleneckCandidates.Take(5))
            {
                int currentCranes = currentAllocations[op.VvnId];
                string dockKey = op.Dock.Trim();
                int maxCranes = capacities.ContainsKey(dockKey) ? capacities[dockKey] : 1;

                if (currentCranes < maxCranes)
                {
                    currentAllocations[op.VvnId]++;

                    var testSchedule = await ComputeScheduleFromAllocationsAsync(day, vvnsForDay, currentAllocations,
                        preCalcWork, capacities);
                    var testProlog = await sendToProlog(testSchedule);
                    var testDelay = ExtractTotalDelay(testProlog);

                    long testDuration = testSchedule.Operations.Sum(o => (long)o.OptimizedOperationDuration);

                    bool isBetter = false;
                    if (testDelay < currentBestDelay) isBetter = true;
                    else if (testDelay == currentBestDelay && testDuration < currentBestDuration) isBetter = true;

                    if (isBetter)
                    {
                        currentBestDelay = testDelay;
                        currentBestDuration = testDuration;
                        bestCandidateVvn = op.VvnId;
                        currentBestSchedule = testSchedule;
                        currentBestProlog = testProlog;
                    }

                    currentAllocations[op.VvnId]--;
                }
            }

            if (bestCandidateVvn != null)
            {
                currentAllocations[bestCandidateVvn]++;
                bestDelay = currentBestDelay;
                bestDurationScore = currentBestDuration;
                bestSchedule = currentBestSchedule!;
                bestProlog = currentBestProlog;
                improved = true;

                if (!ignoreConstraints)
                {
                    var vesselName = bestSchedule.Operations.First(o => o.VvnId == bestCandidateVvn).Vessel;
                    steps.Add(new OptimizationStepDto
                    {
                        StepNumber = iteration,
                        TotalDelay = bestDelay,
                        TotalCranesUsed = currentAllocations.Values.Sum(),
                        AlgorithmUsed = algorithmType,
                        ChangeDescription = $"Added crane to {vesselName}. Delay: {bestDelay}"
                    });
                }
            }
        }

        return (bestSchedule, bestProlog!, currentAllocations, steps);
    }

    private async Task<DailyScheduleResultDto> ComputeDailyScheduleInternalAsync(DateOnly day, bool useMultiCrane)
    {
        var vvns = await _vvnClient.GetVisitNotifications();
        var vvnsForDay = vvns
            .Where(v => DateOnly.FromDateTime(v.EstimatedTimeArrival.Date) == day)
            .ToList();

        var preCalc = new Dictionary<string, (int, int)>();
        foreach (var v in vvnsForDay) preCalc[v.Id] = GenerateFixedDurationsForVvn(v);

        var capacities = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        foreach (var vvn in vvnsForDay.DistinctBy(v => v.Dock))
        {
            var dockCranes = await GetCachedDockCranesAsync(vvn.Dock);
            capacities[vvn.Dock.Trim()] = dockCranes.Count;
        }

        var allocation = vvnsForDay.ToDictionary(v => v.Id, v => 1);

        var result = await ComputeScheduleFromAllocationsAsync(day, vvnsForDay, allocation, preCalc, capacities);

        await AssignStaffToScheduleAsync(result, day, vvnsForDay);

        return result;
    }

    private async Task<DailyScheduleResultDto> ComputeScheduleFromAllocationsAsync(
        DateOnly day,
        List<VesselVisitNotificationPSDto> vvnsForDay,
        Dictionary<string, int> craneAllocations,
        Dictionary<string, (int Load, int Unload)> preCalculatedTimes,
        Dictionary<string, int> dockCapacities)
    {
        var cranes = await GetCranesForVvnsAsync(vvnsForDay);

        var result = new DailyScheduleResultDto();

        foreach (var vvn in vvnsForDay)
        {
            var crane = cranes[vvn.Id];
            var vessel = await GetCachedVesselAsync(vvn.VesselImo);

            var (loadHours, unloadHours) = preCalculatedTimes[vvn.Id];
            var totalDuration = loadHours + unloadHours;
            if (totalDuration <= 0) totalDuration = 1;

            int assignedCranes = craneAllocations.GetValueOrDefault(vvn.Id, 1);
            int optimizedDuration = (int)Math.Ceiling((double)totalDuration / assignedCranes);

            int scaledLoad = (int)Math.Floor((double)loadHours / assignedCranes);
            int scaledUnload = optimizedDuration - scaledLoad;

            int etaHours = DateTimeToInteger(day, vvn.EstimatedTimeArrival);
            int plannedEtdHours = DateTimeToInteger(day, vvn.EstimatedTimeDeparture);
            int realDeparture = etaHours + optimizedDuration;
            int delay = Math.Max(0, realDeparture - plannedEtdHours + 1);

            string dockKey = vvn.Dock.Trim();
            int limitOnDock = dockCapacities.ContainsKey(dockKey) ? dockCapacities[dockKey] : 1;

            var op = new SchedulingOperationDto
            {
                VvnId = vvn.Id,
                Vessel = vessel!.Name,
                Dock = vvn.Dock,
                StartTime = etaHours,
                RealArrivalTime = etaHours,
                EndTime = plannedEtdHours,
                LoadingDuration = scaledLoad,
                UnloadingDuration = scaledUnload,
                Crane = crane.Code.Value,
                StaffAssignments = new List<StaffAssignmentDto>(),
                CraneCountUsed = assignedCranes,
                TotalCranesOnDock = limitOnDock,
                OptimizedOperationDuration = optimizedDuration,
                RealDepartureTime = realDeparture,
                DepartureDelay = delay
            };

            result.Operations.Add(op);
        }

        return result;
    }

    // =================================================================================
    // STAFF ASSIGNMENT 
    // =================================================================================

    public async Task AssignStaffToScheduleAsync(
        DailyScheduleResultDto schedule,
        DateOnly day,
        List<VesselVisitNotificationPSDto> vvns)
    {
        var cranes = await GetCranesForVvnsAsync(vvns);
        var craneQualifications = await GetCraneQualificationsAsync(cranes);
        var staffByVvn = await GetQualifiedStaffForVvnsAsync(craneQualifications);

        foreach (var op in schedule.Operations)
        {
            if (staffByVvn.TryGetValue(op.VvnId, out var staffList))
            {
                int startHour = op.RealArrivalTime;
                int endHour = op.RealDepartureTime;

                // Fallback caso não tenha sido inicializado
                if (startHour == 0 && endHour == 0)
                {
                    startHour = op.StartTime;
                    endHour = op.EndTime;
                }

                var startDt = IntegerToDateTime(day, startHour);
                var endDt = IntegerToDateTime(day, endHour);

                op.StaffAssignments = BuildStaffAssignments(startDt, endDt, staffList);
            }
        }
    }

    private List<StaffAssignmentDto> BuildStaffAssignments(
        DateTime opStart,
        DateTime opEnd,
        List<StaffMemberDto> staffForVvn)
    {
        if (staffForVvn == null || staffForVvn.Count == 0) return new List<StaffAssignmentDto>();

        var assignments = new List<StaffAssignmentDto>();
        var currentDay = DateOnly.FromDateTime(opStart);
        var lastDay = DateOnly.FromDateTime(opEnd);

        while (currentDay <= lastDay)
        {
            var dayStart = currentDay.ToDateTime(TimeOnly.MinValue);
            var dayEnd = dayStart.AddDays(1);

            var effectiveStart = opStart > dayStart ? opStart : dayStart;
            var effectiveEnd = opEnd < dayEnd ? opEnd : dayEnd;

            if (effectiveEnd > effectiveStart)
            {
                var shifts = new[] { "Night", "Morning", "Evening" };
                foreach (var shift in shifts)
                {
                    var (shiftStart, shiftEnd) = GetShiftWindow(currentDay, shift);
                    var intervalStart = effectiveStart > shiftStart ? effectiveStart : shiftStart;
                    var intervalEnd = effectiveEnd < shiftEnd ? effectiveEnd : shiftEnd;

                    if (intervalEnd > intervalStart)
                    {
                        var assigned = staffForVvn.FirstOrDefault(s =>
                            WorksOnDay(s, currentDay) && IsStaffAvailableForShift(s, shift));
                        if (assigned != null)
                        {
                            assignments.Add(new StaffAssignmentDto
                            {
                                StaffMemberName = assigned.ShortName,
                                IntervalStart = intervalStart,
                                IntervalEnd = intervalEnd
                            });
                        }
                    }
                }
            }

            currentDay = currentDay.AddDays(1);
        }

        return assignments;
    }

    // =================================================================================
    // PROLOG INTEGRATION
    // =================================================================================

    public async Task<PrologFullResultDto?> SendScheduleToPrologOptimal(DailyScheduleResultDto schedule)
    {
        return await _prologClient.SendToPrologAsync<PrologFullResultDto>("schedule/optimal", schedule);
    }

    public async Task<PrologFullResultDto?> SendScheduleToPrologGreedy(DailyScheduleResultDto schedule)
    {
        return await _prologClient.SendToPrologAsync<PrologFullResultDto>("schedule/greedy", schedule);
    }

    public async Task<PrologFullResultDto?> SendScheduleToPrologLocalSearch(DailyScheduleResultDto schedule)
    {
        return await _prologClient.SendToPrologAsync<PrologFullResultDto>("schedule/local_search", schedule);
    }

    public async Task<DockRebalanceResultDto?> SendDockRebalanceToPrologAsync(
        IEnumerable<DockRebalanceCandidateDto> candidates,
        IEnumerable<string> docks)
    {
        var payload = new
        {
            docks = docks,
            candidates = candidates.Select(c => new
            {
                id = c.VvnId,

                eta = new DateTimeOffset(c.EstimatedTimeArrival)
                    .ToUnixTimeSeconds(),

                etd = new DateTimeOffset(c.EstimatedTimeDeparture)
                    .ToUnixTimeSeconds(),

                duration = c.OperationDurationHours,

                currentDock = c.CurrentDock,
                allowedDocks = c.AllowedDocks
            })
        };

        return await _prologClient.SendToPrologAsync<DockRebalanceResultDto>(
            "dock/rebalance",
            payload
        );
    }

    public DailyScheduleResultDto UpdateScheduleFromPrologResult(
        DailyScheduleResultDto schedule,
        PrologFullResultDto? prologResult)
    {
        if (prologResult?.BestSequence == null) return schedule;

        var scheduleOpsDict = schedule.Operations.ToDictionary(op => op.Vessel, op => op);
        var reorderedOperations = new List<SchedulingOperationDto>();

        foreach (var pOp in prologResult.BestSequence)
        {
            if (scheduleOpsDict.TryGetValue(pOp.Vessel, out var op))
            {
                op.RealArrivalTime = pOp.StartTime;
                Console.WriteLine($"Do metodo pica START {op.RealArrivalTime}");
                op.RealDepartureTime = pOp.EndTime;
                Console.WriteLine($"Do metodo pica END {op.RealDepartureTime}");
                op.OptimizedOperationDuration = (pOp.EndTime - pOp.StartTime) + 1;

                op.DepartureDelay = Math.Max(0, op.RealDepartureTime - op.EndTime);

                if (op.DepartureDelay > 0)
                    op.DepartureDelay += 1;

                reorderedOperations.Add(op);
            }
        }

        schedule.Operations = reorderedOperations;
        return schedule;
    }

    private int ExtractTotalDelay(PrologFullResultDto? prologResult)
    {
        return prologResult?.TotalDelay ?? 0;
    }

    // =================================================================================
    // CACHED GETTERS
    // =================================================================================

    private async Task<List<PhysicalResourceDto>> GetCachedDockCranesAsync(string dockCode)
    {
        if (_cacheDockCranes.TryGetValue(dockCode, out var cranes)) return cranes;
        cranes = await _dockClient.GetAllDockCranesAsync(dockCode);
        _cacheDockCranes[dockCode] = cranes;
        return cranes;
    }

    private async Task<QualificationDto?> GetCachedQualificationAsync(Guid qualificationId)
    {
        if (_cacheQualifications.TryGetValue(qualificationId, out var qual)) return qual;
        qual = await _qualificationService.GetQualificationAsync(qualificationId);
        if (qual != null) _cacheQualifications[qualificationId] = qual;
        return qual;
    }

    private async Task<List<StaffMemberDto>> GetCachedStaffByQualificationAsync(string qualificationCode)
    {
        if (_cacheStaff.TryGetValue(qualificationCode, out var staff)) return staff;
        staff = await _staffClient.GetStaffWithQualifications(new List<string> { qualificationCode });
        staff = staff ?? new List<StaffMemberDto>();
        _cacheStaff[qualificationCode] = staff;
        return staff;
    }

    private async Task<VesselDto?> GetCachedVesselAsync(string imo)
    {
        if (_cacheVessels.TryGetValue(imo, out var vessel)) return vessel;
        vessel = await _vesselSClient.GetVesselByImo(imo);
        if (vessel != null) _cacheVessels[imo] = vessel;
        return vessel;
    }

    private (int Load, int Unload) GenerateFixedDurationsForVvn(VesselVisitNotificationPSDto vvn)
    {
        var loadingDuration = TimeSpan.Zero;
        var unloadingDuration = TimeSpan.Zero;

        if (vvn.LoadingCargoManifest is not null && vvn.UnloadingCargoManifest is null)
            loadingDuration = GenerateRandomTime(vvn.EstimatedTimeArrival, vvn.EstimatedTimeDeparture);
        else if (vvn.LoadingCargoManifest is null && vvn.UnloadingCargoManifest is not null)
            unloadingDuration = GenerateRandomTime(vvn.EstimatedTimeArrival, vvn.EstimatedTimeDeparture);
        else if (vvn.LoadingCargoManifest is not null && vvn.UnloadingCargoManifest is not null)
        {
            var (load, unload) = GenerateLoadingAndUnloading(vvn.EstimatedTimeArrival, vvn.EstimatedTimeDeparture);
            loadingDuration = load;
            unloadingDuration = unload;
        }

        return (TimeSpanToInteger(loadingDuration), TimeSpanToInteger(unloadingDuration));
    }

    private TimeSpan GenerateRandomTime(DateTime start, DateTime end)
    {
        if (end <= start) throw new ArgumentException("End time must be after start time.");
        var totalDuration = end - start;
        var rng = new Random();
        double multiplier = rng.NextDouble() * (MaxP - MinP) + MinP;
        var raw = TimeSpan.FromTicks((long)(totalDuration.Ticks * multiplier));
        const int roundToMinutes = 5;
        int totalMinutes = (int)Math.Round(raw.TotalMinutes / roundToMinutes) * roundToMinutes;
        return TimeSpan.FromMinutes(totalMinutes);
    }

    private TimeSpan GenerateRandomTimeFromSpan(TimeSpan total)
    {
        if (total <= TimeSpan.Zero) throw new ArgumentException("Total duration must be positive.");
        var rng = new Random();
        double multiplier = rng.NextDouble() * (MaxP - MinP) + MinP;
        var raw = TimeSpan.FromTicks((long)(total.Ticks * multiplier));
        const int roundToMinutes = 5;
        int totalMinutes = (int)Math.Round(raw.TotalMinutes / roundToMinutes) * roundToMinutes;
        return TimeSpan.FromMinutes(totalMinutes);
    }

    private (TimeSpan loading, TimeSpan unloading) GenerateLoadingAndUnloading(DateTime start, DateTime end)
    {
        var total = end - start;
        var unloading = GenerateRandomTimeFromSpan(total);
        var remaining = total - unloading;
        if (remaining <= TimeSpan.Zero)
        {
            unloading = TimeSpan.FromTicks((long)(total.Ticks * MinP));
            remaining = total - unloading;
        }

        var loading = GenerateRandomTimeFromSpan(remaining);
        return (loading, unloading);
    }

    private int DateTimeToInteger(DateOnly init, DateTime actual)
    {
        var baseDt = init.ToDateTime(TimeOnly.MinValue);
        var diff = actual - baseDt;
        return (int)Math.Floor(diff.TotalHours);
    }

    private int TimeSpanToInteger(TimeSpan span)
    {
        return (int)Math.Floor(span.TotalHours);
    }

    private async Task<Dictionary<string, PhysicalResourceDto>> GetCranesForVvnsAsync(
        List<VesselVisitNotificationPSDto> vvns)
    {
        var result = new Dictionary<string, PhysicalResourceDto>();
        foreach (var vvn in vvns)
        {
            var cranes = await GetCachedDockCranesAsync(vvn.Dock);
            if (cranes.Count == 0) throw new PlanningSchedulingException($"Dock '{vvn.Dock}' has no available crane.");
            result[vvn.Id] = cranes.First();
        }

        return result;
    }

    private async Task<Dictionary<string, QualificationDto>> GetCraneQualificationsAsync(
        Dictionary<string, PhysicalResourceDto> cranes)
    {
        var result = new Dictionary<string, QualificationDto>();
        foreach (var (vvnId, crane) in cranes)
        {
            if (crane.QualificationID == null)
                throw new PlanningSchedulingException($"Crane '{crane.Code.Value}' has no QualificationID.");
            var q = await GetCachedQualificationAsync(crane.QualificationID.Value);
            if (q == null) throw new PlanningSchedulingException($"Qualification not found.");
            result[vvnId] = q;
        }

        return result;
    }

    private async Task<Dictionary<string, List<StaffMemberDto>>> GetQualifiedStaffForVvnsAsync(
        Dictionary<string, QualificationDto> craneQualifications)
    {
        var result = new Dictionary<string, List<StaffMemberDto>>();
        var qualificationCodes = craneQualifications.Values.Select(q => q.Code).Distinct().ToList();
        var staffByQualification = new Dictionary<string, List<StaffMemberDto>>();

        foreach (var code in qualificationCodes)
        {
            var staff = await GetCachedStaffByQualificationAsync(code);
            staffByQualification[code] = staff ?? new List<StaffMemberDto>();
        }

        foreach (var (vvnId, qualification) in craneQualifications)
        {
            if (!staffByQualification.TryGetValue(qualification.Code, out var staffList) || staffList.Count == 0)
                result[vvnId] = new List<StaffMemberDto>();
            else
                result[vvnId] = staffList;
        }

        return result;
    }

    private (DateTime Start, DateTime End) GetShiftWindow(DateOnly day, string shift)
    {
        var dayStart = day.ToDateTime(TimeOnly.MinValue);
        return shift switch
        {
            "Night" => (dayStart, dayStart.AddHours(8)),
            "Morning" => (dayStart.AddHours(8), dayStart.AddHours(16)),
            "Evening" => (dayStart.AddHours(16), dayStart.AddDays(1)),
            _ => (dayStart, dayStart)
        };
    }

    private bool IsStaffAvailableForShift(StaffMemberDto staff, string requiredShift)
    {
        return staff.Schedule != null &&
               string.Equals(staff.Schedule.Shift, requiredShift, StringComparison.OrdinalIgnoreCase);
    }

    private bool WorksOnDay(StaffMemberDto staff, DateOnly day)
    {
        if (staff.Schedule == null || string.IsNullOrWhiteSpace(staff.Schedule.DaysOfWeek) ||
            staff.Schedule.DaysOfWeek.Length != 7) return false;
        int offset = day.DayOfWeek switch
        {
            DayOfWeek.Monday => 0, DayOfWeek.Tuesday => 1, DayOfWeek.Wednesday => 2, DayOfWeek.Thursday => 3,
            DayOfWeek.Friday => 4, DayOfWeek.Saturday => 5, DayOfWeek.Sunday => 6, _ => 0
        };
        return staff.Schedule.DaysOfWeek[staff.Schedule.DaysOfWeek.Length - 1 - offset] == '1';
    }

    public DateTime IntegerToDateTime(DateOnly day, int hoursSinceStart)
    {
        var baseDateTime = day.ToDateTime(TimeOnly.MinValue);
        return baseDateTime.AddHours(hoursSinceStart);
    }

    public async Task<GeneticScheduleResultDto> ComputeDailyScheduleGeneticAsync(
        DateOnly day,
        int? populationSizeOverride = null,
        int? generationsOverride = null,
        double? mutationRateOverride = null,
        double? crossoverRateOverride = null)
    {
        ClearCaches();

        var vvns = await _vvnClient.GetVisitNotifications();
        var vvnsForDay = vvns
            .Where(v => DateOnly.FromDateTime(v.EstimatedTimeArrival.Date) == day)
            .ToList();

        if (vvnsForDay.Count == 0)
            throw new PlanningSchedulingException($"No visits for {day}");

        var baseSchedule = await ComputeDailyScheduleAsync(day);

        int n = vvnsForDay.Count;


        int populationSize =
            populationSizeOverride ??
            Math.Max(10, n * 2);

        int generations =
            generationsOverride ??
            40;

        double mutationRate =
            mutationRateOverride ??
            0.15;

        double crossoverRate =
            crossoverRateOverride ??
            0.8;


        var prologResult = await _prologClient.SendToPrologAsync<PrologFullResultDto>(
            "schedule/genetic",
            new
            {
                schedule = baseSchedule,
                population = populationSize,
                generations = generations,
                mutation_rate = mutationRate,
                crossover_rate = crossoverRate
            });


        var optimizedSchedule = UpdateScheduleFromPrologResult(baseSchedule, prologResult);

        await AssignStaffToScheduleAsync(optimizedSchedule, day, vvnsForDay);

        return new GeneticScheduleResultDto
        {
            Schedule = optimizedSchedule,
            Prolog = prologResult,

            PopulationSize = populationSize,
            Generations = generations,
            MutationRate = mutationRate,
            CrossoverRate = crossoverRate
        };
    }

    public async Task<SmartScheduleResultDto> ComputeDailyScheduleSmartAsync(
        DateOnly day,
        int? maxComputationSeconds = null)
    {
        ClearCaches();

        var vvns = await _vvnClient.GetVisitNotifications();
        var vvnsForDay = vvns
            .Where(v => DateOnly.FromDateTime(v.EstimatedTimeArrival.Date) == day)
            .ToList();

        if (vvnsForDay.Count == 0)
            throw new PlanningSchedulingException($"No visits for {day}");

        int vesselCount = vvnsForDay.Count;

        var docks = vvnsForDay.Select(v => v.Dock).Distinct().ToList();
        int craneCount = 0;

        foreach (var dock in docks)
        {
            var dockCranes = await GetCachedDockCranesAsync(dock);
            craneCount += dockCranes.Count;
        }

        int problemSize = vesselCount * Math.Max(1, craneCount);

        string chosen = "";
        string reason = "";


        if (maxComputationSeconds is not null && maxComputationSeconds <= 2)
        {
            chosen = "genetic";
            reason = "Time-constrained case";
        }
        else if (problemSize <= 8)
        {
            chosen = "optimal";
            reason = "Small instance — full search feasible";
        }
        else if (problemSize <= 20)
        {
            chosen = "greedy";
            reason = "Medium instance — heuristic selected";
        }
        else
        {
            chosen = "genetic";
            reason = "Large instance — wider exploration required";
        }


        (DailyScheduleResultDto schedule, PrologFullResultDto prolog) result;

        switch (chosen)
        {
            case "optimal":
                result = await ComputeScheduleWithAlgorithmAsync(day, "optimal");
                break;

            case "greedy":
                result = await ComputeScheduleWithAlgorithmAsync(day, "greedy");
                break;

            case "genetic":
                var genetic = await ComputeDailyScheduleGeneticAsync(day);
                return new SmartScheduleResultDto
                {
                    SelectedAlgorithm = "genetic",
                    Schedule = genetic.Schedule,
                    Prolog = genetic.Prolog,
                    ProblemSize = problemSize,
                    VesselCount = vesselCount,
                    CraneCount = craneCount,
                    SelectionReason = reason
                };

            default:
                throw new Exception("Unexpected algorithm selection.");
        }


        return new SmartScheduleResultDto
        {
            SelectedAlgorithm = chosen,
            Schedule = result.schedule,
            Prolog = result.prolog,
            ProblemSize = problemSize,
            VesselCount = vesselCount,
            CraneCount = craneCount,
            SelectionReason = reason
        };
    }

    public async Task<List<DockRebalanceCandidateDto>> BuildDockRebalanceCandidatesAsync(DateOnly day)
    {
        ClearCaches();

        var vvns = await _vvnClient.GetVisitNotifications();

        var vvnsForDay = vvns
            .Where(v => DateOnly.FromDateTime(v.EstimatedTimeArrival.Date) == day)
            .ToList();

        if (vvnsForDay.Count == 0)
            throw new PlanningSchedulingException($"No approved visits for {day}");

        var allDocks = await _dockClient.GetAllDocksAsync();

        var dockMeta = new Dictionary<string, List<PhysicalResourceDto>>();
        foreach (var dock in allDocks)
            dockMeta[dock.Code.Value] = await GetCachedDockCranesAsync(dock.Code.Value);

        var vessels = new Dictionary<string, VesselDto?>();
        foreach (var vvn in vvnsForDay)
            vessels[vvn.Id] = await GetCachedVesselAsync(vvn.VesselImo);

        var ordered = vvnsForDay
            .OrderByDescending(v =>
                (v.EstimatedTimeDeparture - v.EstimatedTimeArrival).TotalHours)
            .ToList();

        var candidates = new List<DockRebalanceCandidateDto>();

        foreach (var vvn in ordered)
        {
            var duration = Math.Max(
                0,
                (vvn.EstimatedTimeDeparture - vvn.EstimatedTimeArrival).TotalHours
            );

            var allowedDocks = new List<string>();

            foreach (var dock in allDocks)
            {
                var dockCode = dock.Code.Value;

                if (!dockMeta[dockCode].Any())
                    continue;

                allowedDocks.Add(dockCode);
            }

            candidates.Add(new DockRebalanceCandidateDto
            {
                VvnId = vvn.Id,
                VesselName = vessels[vvn.Id]?.Name ?? "Unknown",
                CurrentDock = vvn.Dock,
                EstimatedTimeArrival = vvn.EstimatedTimeArrival,
                EstimatedTimeDeparture = vvn.EstimatedTimeDeparture,
                OperationDurationHours = duration,
                AllowedDocks = allowedDocks.Distinct().ToList()
            });
        }

        return candidates;
    }

    public async Task<DockRebalanceFinalDto> BuildDockRebalancePlanAsync(DateOnly day)
    {
        var candidates = await BuildDockRebalanceCandidatesAsync(day);

        var docks = candidates
            .SelectMany(c => c.AllowedDocks)
            .Distinct()
            .ToList();

        var result = await SendDockRebalanceToPrologAsync(candidates, docks);

        if (result == null || result.Assignments.Count == 0)
            throw new PlanningSchedulingException("Prolog returned no assignments");

        var loadsBefore = candidates
            .GroupBy(c => c.CurrentDock)
            .Select(g => new DockLoadInfoDto
            {
                Dock = g.Key,
                TotalDurationHours = g.Sum(v => v.OperationDurationHours)
            })
            .ToList();

        var loadsAfter = result.Assignments
            .GroupBy(a => a.Dock)
            .Select(g =>
            {
                var assignedShips = candidates
                    .Where(c => g.Any(a => a.Id == c.VvnId));

                return new DockLoadInfoDto
                {
                    Dock = g.Key,
                    TotalDurationHours = assignedShips.Sum(v => v.OperationDurationHours)
                };
            })
            .ToList();

        foreach (var dock in docks)
        {
            if (!loadsBefore.Any(l => l.Dock == dock))
                loadsBefore.Add(new DockLoadInfoDto { Dock = dock, TotalDurationHours = 0 });

            if (!loadsAfter.Any(l => l.Dock == dock))
                loadsAfter.Add(new DockLoadInfoDto { Dock = dock, TotalDurationHours = 0 });
        }

        var differences = loadsAfter
            .Select(a =>
            {
                var before = loadsBefore.First(l => l.Dock == a.Dock);

                return new DockLoadChangeDto
                {
                    Dock = a.Dock,
                    Before = before.TotalDurationHours,
                    After = a.TotalDurationHours
                };
            })
            .ToList();

        var beforeValues = loadsBefore.Select(l => l.TotalDurationHours);
        var afterValues = loadsAfter.Select(l => l.TotalDurationHours);

        var varianceBefore = Variance(beforeValues);
        var varianceAfter = Variance(afterValues);

        var improvement = varianceBefore == 0
            ? 0
            : (varianceBefore - varianceAfter) / varianceBefore * 100;

        return new DockRebalanceFinalDto
        {
            Day = day,

            Candidates = candidates,
            Assignments = result.Assignments,

            LoadsBefore = loadsBefore,
            LoadsAfter = loadsAfter,
            LoadDifferences = differences,

            BalanceScore = varianceAfter,
            ImprovementPercent = improvement,
            StdDevBefore = StdDev(beforeValues),
            StdDevAfter = StdDev(afterValues)
        };
    }

    private static double Variance(IEnumerable<double> values)
    {
        var list = values.ToList();
        if (!list.Any()) return 0;

        var avg = list.Average();
        return list.Sum(v => Math.Pow(v - avg, 2)) / list.Count;
    }

    private static double StdDev(IEnumerable<double> values)
    {
        return Math.Sqrt(Variance(values));
    }
}