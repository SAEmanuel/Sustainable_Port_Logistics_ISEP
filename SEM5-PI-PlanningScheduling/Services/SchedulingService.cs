using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using SEM5_PI_DecisionEngineAPI.DTOs;
using SEM5_PI_DecisionEngineAPI.Exceptions;

namespace SEM5_PI_DecisionEngineAPI.Services;

public class SchedulingService
{
    const float MinP = 0.4f;
    const float MaxP = 0.8f;

    private readonly QualificationServiceClient _qualificationService;
    private readonly VesselVisitNotificationServiceClient _vvnClient;
    private readonly StaffMemberServiceClient _staffClient;
    private readonly VesselServiceClient _vesselSClient;
    private readonly DockServiceClient _dockClient;
    private readonly PrologClient _prologClient;


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
    
    // =================================================================================
    // PUBLIC METHODS
    // =================================================================================

    public Task<DailyScheduleResultDto> ComputeDailyScheduleAsync(DateOnly day)
    {
        return ComputeDailyScheduleInternalAsync(day, useMultiCrane: false);
    }
    
    public async Task<MultiCraneComparisonResultDto> ComputeDailyScheduleWithPrologComparisonAsync(
        DateOnly day, 
        string algorithmType)
    {
        // 1. Fetch Basic Data
        var vvns = await _vvnClient.GetVisitNotifications();
        var vvnsForDay = vvns
            .Where(v => DateOnly.FromDateTime(v.EstimatedTimeArrival.Date) == day)
            .ToList();

        if (vvnsForDay.Count == 0)
            throw new PlanningSchedulingException($"No visits for {day}");

        // 2. Fetch Dock Capacities (Physical Limit)
        var realDockCapacities = new Dictionary<string, int>();
        foreach (var vvn in vvnsForDay.DistinctBy(v => v.Dock))
        {
            var dockCranes = await _dockClient.GetDockCranesAsync(vvn.Dock);
            realDockCapacities[vvn.Dock] = dockCranes.Count;
        }

        // 3. Pre-calculate Work Durations
        var preCalculatedWork = new Dictionary<string, (int Load, int Unload)>();
        foreach (var vvn in vvnsForDay)
        {
            preCalculatedWork[vvn.Id] = GenerateFixedDurationsForVvn(vvn);
        }

        // 4. Select Strategy
        Func<DailyScheduleResultDto, Task<object?>> sendToProlog = algorithmType.ToLower() switch
        {
            "greedy" => SendScheduleToPrologGreedy,
            "local_search" => SendScheduleToPrologLocalSearch,
            "optimal" => SendScheduleToPrologOptimal,
            _ => SendScheduleToPrologGreedy
        };

        // =============================================================================
        // PHASE 1: REAL OPTIMIZATION (Respecting Physical Constraints)
        // =============================================================================
        
        var (realSchedule, realProlog, realAllocations, realSteps) = await RunOptimizationLoop(
            day, 
            vvnsForDay, 
            realDockCapacities, 
            preCalculatedWork, 
            sendToProlog, 
            algorithmType, 
            ignoreConstraints: false
        );

        // Get the Single Crane Baseline (Step 0 of the real process)
        var singleCraneSchedule = await ComputeScheduleFromAllocationsAsync(day, vvnsForDay, vvnsForDay.ToDictionary(v => v.Id, v => 1), preCalculatedWork);
        var singleCraneProlog = await sendToProlog(singleCraneSchedule);
        var singleDelay = ExtractTotalDelay(singleCraneProlog);

        // =============================================================================
        // PHASE 2: HYPOTHETICAL OPTIMIZATION (What if we had infinite cranes?)
        // =============================================================================
        
        // We create a "Virtual" capacity map with 99 cranes everywhere
        var virtualDockCapacities = realDockCapacities.Keys.ToDictionary(k => k, k => 99);
        
        var (idealSchedule, _, idealAllocations, _) = await RunOptimizationLoop(
            day, 
            vvnsForDay, 
            virtualDockCapacities, 
            preCalculatedWork, 
            sendToProlog, 
            algorithmType, 
            ignoreConstraints: true 
        );

        // =============================================================================
        // PHASE 3: MERGE & ANALYZE GAP
        // =============================================================================

        // We return the REAL schedule to the user, but annotated with IDEAL suggestions
        foreach (var realOp in realSchedule.Operations)
        {
            if (idealAllocations.TryGetValue(realOp.VvnId, out int idealCranes))
            {
                realOp.TheoreticalRequiredCranes = idealCranes;
                
                // If ideal needs more than what we used physically
                if (idealCranes > realOp.CraneCountUsed)
                {
                    int physicalLimit = realDockCapacities.ContainsKey(realOp.Dock) ? realDockCapacities[realOp.Dock] : 0;
                    
                    realOp.ResourceSuggestion = 
                        $"Requires {idealCranes} cranes for zero/min delay. " +
                        $"Dock limit is {physicalLimit}. Used {realOp.CraneCountUsed}.";
                }
            }
        }

        // Calculate Aggregates
        var singleCraneHours = singleCraneSchedule.Operations.Sum(o => o.OptimizedOperationDuration * 1);
        var multiCraneHours = realSchedule.Operations.Sum(o => o.OptimizedOperationDuration * o.CraneCountUsed);
        var realTotalDelay = ExtractTotalDelay(realProlog);

        return new MultiCraneComparisonResultDto
        {
            SingleCraneSchedule = singleCraneSchedule,
            SingleCraneProlog   = singleCraneProlog!,
            
            MultiCraneSchedule  = realSchedule,
            MultiCraneProlog    = realProlog!,
            
            SingleTotalDelay    = singleDelay,
            MultiTotalDelay     = realTotalDelay,
            
            SingleCraneHours    = singleCraneHours,
            MultiCraneHours     = multiCraneHours,
            
            OptimizationSteps   = realSteps // We show the history of the REAL optimization
        };
    }

    // =================================================================================
    // OPTIMIZATION CORE (Refactored to be reusable)
    // =================================================================================

    private async Task<(
        DailyScheduleResultDto BestSchedule, 
        object BestProlog, 
        Dictionary<string, int> BestAllocations,
        List<OptimizationStepDto> Steps
    )> RunOptimizationLoop(
        DateOnly day,
        List<VesselVisitNotificationPSDto> vvnsForDay,
        Dictionary<string, int> capacities,
        Dictionary<string, (int, int)> preCalcWork,
        Func<DailyScheduleResultDto, Task<object?>> sendToProlog,
        string algorithmType,
        bool ignoreConstraints)
    {
        // Initial State: 1 crane per vessel
        var currentAllocations = vvnsForDay.ToDictionary(v => v.Id, v => 1);
        
        var bestSchedule = await ComputeScheduleFromAllocationsAsync(day, vvnsForDay, currentAllocations, preCalcWork);
        var bestProlog = await sendToProlog(bestSchedule);
        var bestDelay = ExtractTotalDelay(bestProlog);
        
        var steps = new List<OptimizationStepDto>();
        if (!ignoreConstraints) // Only record steps for the real run to keep UI clean
        {
            steps.Add(new OptimizationStepDto { 
                StepNumber = 0, 
                TotalDelay = bestDelay, 
                TotalCranesUsed = currentAllocations.Values.Sum(), 
                AlgorithmUsed = algorithmType,
                ChangeDescription = "Initial State (Single Crane)" 
            });
        }

        bool improved = true;
        int maxIterations = 20;
        int iteration = 0;

        while (improved && bestDelay > 0 && iteration < maxIterations)
        {
            improved = false;
            iteration++;

            var bottleneckCandidates = bestSchedule.Operations
                .OrderByDescending(op => op.OptimizedOperationDuration)
                .ToList();

            string? bestCandidateVvn = null;
            int currentBestDelay = bestDelay;
            DailyScheduleResultDto? currentBestSchedule = null;
            object? currentBestProlog = null;

            // Try to boost top 3 bottlenecks
            foreach (var op in bottleneckCandidates.Take(3)) 
            {
                int currentCranes = currentAllocations[op.VvnId];
                int maxCranes = capacities.ContainsKey(op.Dock) ? capacities[op.Dock] : 1;

                if (currentCranes < maxCranes)
                {
                    // SIMULATION
                    currentAllocations[op.VvnId]++; 

                    var testSchedule = await ComputeScheduleFromAllocationsAsync(day, vvnsForDay, currentAllocations, preCalcWork);
                    var testProlog = await sendToProlog(testSchedule);
                    var testDelay = ExtractTotalDelay(testProlog);

                    if (testDelay < currentBestDelay)
                    {
                        currentBestDelay = testDelay;
                        bestCandidateVvn = op.VvnId;
                        currentBestSchedule = testSchedule;
                        currentBestProlog = testProlog;
                    }

                    currentAllocations[op.VvnId]--; // Backtrack
                }
            }

            if (bestCandidateVvn != null)
            {
                currentAllocations[bestCandidateVvn]++;
                bestDelay = currentBestDelay;
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
                        ChangeDescription = $"Added crane to {vesselName} (Total: {currentAllocations[bestCandidateVvn]})"
                    });
                }
            }
        }

        return (bestSchedule, bestProlog!, currentAllocations, steps);
    }

    // =================================================================================
    // CORE CALCULATION
    // =================================================================================

    private async Task<DailyScheduleResultDto> ComputeDailyScheduleInternalAsync(
        DateOnly day,
        bool useMultiCrane)
    {
        var vvns = await _vvnClient.GetVisitNotifications();
        var vvnsForDay = vvns
            .Where(v => DateOnly.FromDateTime(v.EstimatedTimeArrival.Date) == day)
            .ToList();

        var preCalc = new Dictionary<string, (int, int)>();
        foreach(var v in vvnsForDay) preCalc[v.Id] = GenerateFixedDurationsForVvn(v);

        var allocation = vvnsForDay.ToDictionary(v => v.Id, v => 1);
        return await ComputeScheduleFromAllocationsAsync(day, vvnsForDay, allocation, preCalc);
    }

    private async Task<DailyScheduleResultDto> ComputeScheduleFromAllocationsAsync(
        DateOnly day,
        List<VesselVisitNotificationPSDto> vvnsForDay,
        Dictionary<string, int> craneAllocations,
        Dictionary<string, (int Load, int Unload)> preCalculatedTimes)
    {
        var cranes = await GetCranesForVvnsAsync(vvnsForDay);
        var craneQualifications = await GetCraneQualificationsAsync(cranes);
        var staffByVvn = await GetQualifiedStaffForVvnsAsync(craneQualifications);

        var result = new DailyScheduleResultDto();

        foreach (var vvn in vvnsForDay)
        {
            var crane = cranes[vvn.Id];
            var staff = staffByVvn[vvn.Id];
            var vessel = await _vesselSClient.GetVesselByImo(vvn.VesselImo);

            var (loadHours, unloadHours) = preCalculatedTimes[vvn.Id];
            var totalDuration = loadHours + unloadHours;
            if (totalDuration <= 0) totalDuration = 1;

            int assignedCranes = craneAllocations.GetValueOrDefault(vvn.Id, 1);
            int optimizedDuration = (int)Math.Ceiling((double)totalDuration / assignedCranes);

            int etaHours = DateTimeToInteger(day, vvn.EstimatedTimeArrival);
            int plannedEtdHours = DateTimeToInteger(day, vvn.EstimatedTimeDeparture);
            
            int realDeparture = etaHours + optimizedDuration;
            int delay = Math.Max(0, realDeparture - plannedEtdHours);

            var op = new SchedulingOperationDto
            {
                VvnId = vvn.Id,
                Vessel = vessel!.Name,
                Dock = vvn.Dock,
                StartTime = etaHours,
                EndTime = plannedEtdHours,
                LoadingDuration = loadHours,
                UnloadingDuration = unloadHours,
                Crane = crane.Code.Value,
                StaffAssignments = BuildStaffAssignmentsForVvn(vvn, staff),

                CraneCountUsed = assignedCranes,
                OptimizedOperationDuration = optimizedDuration,
                RealDepartureTime = realDeparture,
                DepartureDelay = delay
            };

            result.Operations.Add(op);
        }

        return result;
    }

    // =================================================================================
    // PROLOG INTEGRATION
    // =================================================================================

    public async Task<object?> SendScheduleToPrologOptimal(DailyScheduleResultDto schedule)
    {
        return await _prologClient.SendToPrologAsync<object>("schedule/optimal", schedule);
    }

    public async Task<object?> SendScheduleToPrologGreedy(DailyScheduleResultDto schedule)
    {
        return await _prologClient.SendToPrologAsync<object>("schedule/greedy", schedule);
    }

    public async Task<object?> SendScheduleToPrologLocalSearch(DailyScheduleResultDto schedule)
    {
        return await _prologClient.SendToPrologAsync<object>("schedule/local_search", schedule);
    }

    private int ExtractTotalDelay(object? prologResponse)
    {
        if (prologResponse is JsonElement json &&
            json.ValueKind == JsonValueKind.Object &&
            json.TryGetProperty("total_delay", out var tdProp) &&
            tdProp.ValueKind == JsonValueKind.Number)
        {
            return tdProp.GetInt32();
        }
        return 0;
    }

    // =================================================================================
    // HELPERS & DURATION GEN
    // =================================================================================

    private (int Load, int Unload) GenerateFixedDurationsForVvn(VesselVisitNotificationPSDto vvn)
    {
        var loadingDuration = TimeSpan.Zero;
        var unloadingDuration = TimeSpan.Zero;

        if (vvn.LoadingCargoManifest is not null && vvn.UnloadingCargoManifest is null)
        {
            loadingDuration = GenerateRandomTime(vvn.EstimatedTimeArrival, vvn.EstimatedTimeDeparture);
        }
        else if (vvn.LoadingCargoManifest is null && vvn.UnloadingCargoManifest is not null)
        {
            unloadingDuration = GenerateRandomTime(vvn.EstimatedTimeArrival, vvn.EstimatedTimeDeparture);
        }
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

    // =================================================================================
    // RESOURCES & STAFF 
    // =================================================================================

    private async Task<Dictionary<string, PhysicalResourceDto>> GetCranesForVvnsAsync(List<VesselVisitNotificationPSDto> vvns)
    {
        var result = new Dictionary<string, PhysicalResourceDto>();
        foreach (var vvn in vvns)
        {
            var cranes = await _dockClient.GetDockCranesAsync(vvn.Dock);
            if (cranes.Count == 0) throw new PlanningSchedulingException($"Dock '{vvn.Dock}' has no available crane.");
            result[vvn.Id] = cranes.First();
        }
        return result;
    }

    private async Task<Dictionary<string, QualificationDto>> GetCraneQualificationsAsync(Dictionary<string, PhysicalResourceDto> cranes)
    {
        var result = new Dictionary<string, QualificationDto>();
        foreach (var (vvnId, crane) in cranes)
        {
            if (crane.QualificationID == null) throw new PlanningSchedulingException($"Crane '{crane.Code.Value}' has no QualificationID.");
            var q = await _qualificationService.GetQualificationAsync(crane.QualificationID.Value);
            if (q == null) throw new PlanningSchedulingException($"Qualification not found.");
            result[vvnId] = q;
        }
        return result;
    }

    private async Task<Dictionary<string, List<StaffMemberDto>>> GetQualifiedStaffForVvnsAsync(Dictionary<string, QualificationDto> craneQualifications)
    {
        var result = new Dictionary<string, List<StaffMemberDto>>();
        var qualificationCodes = craneQualifications.Values.Select(q => q.Code).Distinct().ToList();
        var staffByQualification = new Dictionary<string, List<StaffMemberDto>>();

        foreach (var code in qualificationCodes)
        {
            var staff = await _staffClient.GetStaffWithQualifications(new List<string> { code });
            staffByQualification[code] = staff ?? new List<StaffMemberDto>();
        }

        foreach (var (vvnId, qualification) in craneQualifications)
        {
            if (!staffByQualification.TryGetValue(qualification.Code, out var staffList) || staffList.Count == 0)
            {
                 result[vvnId] = new List<StaffMemberDto>();
            }
            else
            {
                 result[vvnId] = staffList;
            }
        }
        return result;
    }
    
    private List<StaffAssignmentDto> BuildStaffAssignmentsForVvn(VesselVisitNotificationPSDto vvn, List<StaffMemberDto> staffForVvn)
    {
        if (staffForVvn == null || staffForVvn.Count == 0) return new List<StaffAssignmentDto>();
        
        var assignments = new List<StaffAssignmentDto>();
        var eta = vvn.EstimatedTimeArrival;
        var etd = vvn.EstimatedTimeDeparture;
        var currentDay = DateOnly.FromDateTime(eta);
        var lastDay = DateOnly.FromDateTime(etd);

        while (currentDay <= lastDay)
        {
            var dayStart = currentDay.ToDateTime(TimeOnly.MinValue);
            var dayEnd = dayStart.AddDays(1);
            var opStart = eta < dayStart ? dayStart : eta;
            var opEnd = etd > dayEnd ? dayEnd : etd;

            if (opEnd > opStart)
            {
                var shifts = new[] { "Night", "Morning", "Evening" };
                foreach (var shift in shifts)
                {
                    var (shiftStart, shiftEnd) = GetShiftWindow(currentDay, shift);
                    var intervalStart = opStart > shiftStart ? opStart : shiftStart;
                    var intervalEnd = opEnd < shiftEnd ? opEnd : shiftEnd;

                    if (intervalEnd > intervalStart)
                    {
                        var assigned = staffForVvn.FirstOrDefault(s => WorksOnDay(s, currentDay) && IsStaffAvailableForShift(s, shift));
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
        return staff.Schedule != null && string.Equals(staff.Schedule.Shift, requiredShift, StringComparison.OrdinalIgnoreCase);
    }
    
    private bool WorksOnDay(StaffMemberDto staff, DateOnly day)
    {
        if (staff.Schedule == null || string.IsNullOrWhiteSpace(staff.Schedule.DaysOfWeek) || staff.Schedule.DaysOfWeek.Length != 7) return false;
        int offset = day.DayOfWeek switch { DayOfWeek.Monday => 0, DayOfWeek.Tuesday => 1, DayOfWeek.Wednesday => 2, DayOfWeek.Thursday => 3, DayOfWeek.Friday => 4, DayOfWeek.Saturday => 5, DayOfWeek.Sunday => 6, _ => 0 };
        return staff.Schedule.DaysOfWeek[staff.Schedule.DaysOfWeek.Length - 1 - offset] == '1';
    }
    
    
    public DailyScheduleResultDto UpdateScheduleFromPrologResult(
    DailyScheduleResultDto schedule, 
    object? prologResponse)
{
    if (prologResponse is JsonElement json)
    {
        try
        {
            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };
            
            
            var prologResult = json.Deserialize<PrologFullResultDto>(options);

            if (prologResult?.BestSequence == null) return schedule; 

            
            var scheduleOpsDict = schedule.Operations
                .ToDictionary(op => op.Vessel, op => op);

            
            var reorderedOperations = new List<SchedulingOperationDto>();

            foreach (var pOp in prologResult.BestSequence)
            {
                if (scheduleOpsDict.TryGetValue(pOp.Vessel, out var op))
                {
                    
                    op.StartTime = pOp.StartTime; 
                    op.RealDepartureTime = pOp.EndTime;
                    op.OptimizedOperationDuration = (pOp.EndTime - pOp.StartTime) + 1;
                    
                    op.DepartureDelay = Math.Max(0, op.RealDepartureTime - op.EndTime);
                    
                    if (op.DepartureDelay > 0)
                        op.DepartureDelay += 1;
                    
                    
                    reorderedOperations.Add(op);
                }
            }
            
            schedule.Operations = reorderedOperations;
        }
        catch (JsonException ex)
        {
            Console.WriteLine($"Erro ao desserializar resposta do Prolog: {ex.Message}");
        }
    }

    return schedule;
}
}