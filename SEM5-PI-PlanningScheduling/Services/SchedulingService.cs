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
    const float MinP = 6f;
    const float MaxP = 8f;

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
    public Task<DailyScheduleResultDto> ComputeDailyScheduleAsync(DateOnly day)
    {
        return ComputeDailyScheduleInternalAsync(day, useMultiCrane: true);
    }

private async Task<DailyScheduleResultDto> ComputeDailyScheduleInternalAsync(
    DateOnly day,
    bool useMultiCrane)
{
    var vvns = await _vvnClient.GetVisitNotifications();
    var vvnsForDay = vvns
        .Where(v => DateOnly.FromDateTime(v.EstimatedTimeArrival.Date) == day)
        .ToList();

    if (vvnsForDay.Count == 0)
        throw new PlanningSchedulingException(
            $"No accepted vessel visit notifications for chosen day: {day}"
        );

    if (vvnsForDay.Any(v => string.IsNullOrWhiteSpace(v.Dock)))
        throw new PlanningSchedulingException(
            "One or more vessel visit notifications have no assigned dock yet"
        );

    var cranes = await GetCranesForVvnsAsync(vvnsForDay);
    var craneQualifications = await GetCraneQualificationsAsync(cranes);
    var staffByVvn = await GetQualifiedStaffForVvnsAsync(craneQualifications);

    var result = new DailyScheduleResultDto();

    foreach (var vvn in vvnsForDay)
    {
        var crane = cranes[vvn.Id];
        var staff = staffByVvn[vvn.Id];
        var vessel = await _vesselSClient.GetVesselByImo(vvn.VesselImo);

        var loadingDuration = TimeSpan.Zero;
        var unloadingDuration = TimeSpan.Zero;

        // 1) Determinar tempos de loading/unloading
        if (vvn.LoadingCargoManifest is not null && vvn.UnloadingCargoManifest is null)
        {
            loadingDuration = GenerateRandomTime(vvn.EstimatedTimeArrival, vvn.EstimatedTimeDeparture);
        }

        if (vvn.LoadingCargoManifest is null && vvn.UnloadingCargoManifest is not null)
        {
            unloadingDuration = GenerateRandomTime(vvn.EstimatedTimeArrival, vvn.EstimatedTimeDeparture);
        }

        if (vvn.LoadingCargoManifest is not null && vvn.UnloadingCargoManifest is not null)
        {
            var (load, unload) = GenerateLoadingAndUnloading(
                vvn.EstimatedTimeArrival,
                vvn.EstimatedTimeDeparture);
            loadingDuration = load;
            unloadingDuration = unload;
        }

        var loadHours = TimeSpanToInteger(loadingDuration);
        var unloadHours = TimeSpanToInteger(unloadingDuration);
        var totalDuration = loadHours + unloadHours; // trabalho total

        if (totalDuration <= 0)
            totalDuration = 1;

        var etaHours = DateTimeToInteger(day, vvn.EstimatedTimeArrival);
        var plannedEtdHours = DateTimeToInteger(day, vvn.EstimatedTimeDeparture);

        if (plannedEtdHours <= etaHours)
            throw new PlanningSchedulingException(
                $"Invalid time window for VVN {vvn.Id}: ETD before or equal to ETA."
            );

        var availableWindow = plannedEtdHours - etaHours;
        if (availableWindow <= 0)
            availableWindow = 1;

        int craneCountUsed;
        int optimizedOperationDuration;

        if (useMultiCrane)
        {
          if (totalDuration <= availableWindow)
            {
                craneCountUsed = 1;
                optimizedOperationDuration = totalDuration;
            }
            else
            {
                var totalCranesAvailable = await GetTotalCranesForVvnAsync(vvn);

                if (totalCranesAvailable <= 1)
                {
                    craneCountUsed = 1;
                    optimizedOperationDuration = totalDuration;
                }
                else
                {
                    var requiredCranes = (int)Math.Ceiling((double)totalDuration / availableWindow);
                    craneCountUsed = Math.Min(requiredCranes, totalCranesAvailable);

                    optimizedOperationDuration =
                        (int)Math.Ceiling((double)totalDuration / craneCountUsed);
                }
            }
        }
        else
        {
            craneCountUsed = 1;
            optimizedOperationDuration = totalDuration;
        }

        // 3) Saída real e atraso
        var realDepartureTime = etaHours + optimizedOperationDuration;
        var departureDelay = Math.Max(0, realDepartureTime - plannedEtdHours);

        // 4) Staff assignments
        var staffAssignments = BuildStaffAssignmentsForVvn(vvn, staff);

        // 5) DTO final
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
            StaffAssignments = staffAssignments,

            CraneCountUsed = craneCountUsed,
            OptimizedOperationDuration = optimizedOperationDuration,
            RealDepartureTime = realDepartureTime,
            DepartureDelay = departureDelay
        };

        result.Operations.Add(op);
    }

    return result;
}

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

    public async Task<MultiCraneComparisonResultDto> ComputeDailyScheduleWithPrologComparisonAsync(DateOnly day)
    {
        // 1) Gerar UM ÚNICO schedule base, com 1 grua por definição
        var singleSchedule = await ComputeDailyScheduleInternalAsync(day, useMultiCrane: false);

        // 2) Construir o plano multi-crane EM CIMA do mesmo schedule base
        var multiCraneSchedule = await BuildMultiCraneScheduleFromSingleAsync(singleSchedule, day);

        // 3) Enviar ambos para o Prolog
        var singleProlog = await SendScheduleToPrologGreedy(singleSchedule);
        var multiProlog  = await SendScheduleToPrologGreedy(multiCraneSchedule);

        var singleTotalDelay = ExtractTotalDelay(singleProlog);
        var multiTotalDelay  = ExtractTotalDelay(multiProlog);

        // 4) Crane-hours agregados
        var singleCraneHours = singleSchedule.Operations
            .Sum(o => o.OptimizedOperationDuration * o.CraneCountUsed);

        var multiCraneHours = multiCraneSchedule.Operations
            .Sum(o => o.OptimizedOperationDuration * o.CraneCountUsed);

        return new MultiCraneComparisonResultDto
        {
            SingleCraneSchedule = singleSchedule,
            SingleCraneProlog   = singleProlog!,
            MultiCraneSchedule  = multiCraneSchedule,
            MultiCraneProlog    = multiProlog!,
            SingleTotalDelay    = singleTotalDelay,
            MultiTotalDelay     = multiTotalDelay,
            SingleCraneHours    = singleCraneHours,
            MultiCraneHours     = multiCraneHours
        };
    }
    
    private async Task<DailyScheduleResultDto> BuildMultiCraneScheduleFromSingleAsync(
    DailyScheduleResultDto singleSchedule,
    DateOnly day)
{
    var vvns = await _vvnClient.GetVisitNotifications();
    var vvnsForDay = vvns
        .Where(v => DateOnly.FromDateTime(v.EstimatedTimeArrival.Date) == day)
        .ToDictionary(v => v.Id, v => v);

    var multi = new DailyScheduleResultDto();

    foreach (var op in singleSchedule.Operations)
    {
        if (!vvnsForDay.TryGetValue(op.VvnId, out var vvn))
        {
            multi.Operations.Add(op);
            continue;
        }

        int work = op.LoadingDuration + op.UnloadingDuration;
        if (work <= 0) work = 1;

        int etaHours        = op.StartTime;
        int plannedEtdHours = op.EndTime;

        int availableWindow = plannedEtdHours - etaHours;
        if (availableWindow <= 0) availableWindow = 1;

        int singleDuration = work;
        int singleRealEnd  = etaHours + singleDuration;
        int singleDelay    = Math.Max(0, singleRealEnd - plannedEtdHours);

        int craneCountUsed;
        int optimizedOperationDuration;

        if (singleDelay == 0)
        {
            craneCountUsed = 1;
            optimizedOperationDuration = work;

            Console.WriteLine("===== MULTI-CRANE ANALYSIS (SKIPPED) =====");
            Console.WriteLine($"VVN: {op.VvnId} | Vessel: {op.Vessel} | Dock: {op.Dock}");
            Console.WriteLine($"Work (1 crane)............: {work} h");
            Console.WriteLine($"Available window..........: {availableWindow} h");
            Console.WriteLine("Situação: ✅ Sem atraso com 1 crane. Multi-crane não aplicado.");
            Console.WriteLine();
        }
        else
        {
            int requiredCranes = (int)Math.Ceiling((double)work / availableWindow);

            var cranesAtDock = await _dockClient.GetDockCranesAsync(vvn.Dock);
            int cranesAvailable = cranesAtDock.Count;

            if (cranesAvailable <= 1)
            {
                craneCountUsed = 1;
                optimizedOperationDuration = work;

                int idealTime = (int)Math.Ceiling((double)work / requiredCranes);
                int idealRealEnd = etaHours + idealTime;
                int idealDelay = Math.Max(0, idealRealEnd - plannedEtdHours);

                Console.WriteLine("===== MULTI-CRANE ANALYSIS (NO EXTRA RESOURCES) =====");
                Console.WriteLine($"VVN: {op.VvnId} | Vessel: {op.Vessel} | Dock: {op.Dock}");
                Console.WriteLine($"Work (1 crane)......................: {work} h");
                Console.WriteLine($"Available window....................: {availableWindow} h");
                Console.WriteLine();
                Console.WriteLine($"Cranes necessárias p/ zero atraso...: {requiredCranes}");
                Console.WriteLine($"Cranes disponíveis..................: {cranesAvailable}");
                Console.WriteLine();
                Console.WriteLine($"[SIMULAÇÃO IDEAL] Tempo com {requiredCranes} cranes: {idealTime} h");
                Console.WriteLine($"[SIMULAÇÃO IDEAL] Delay com {requiredCranes} cranes: {idealDelay} h (esperado 0)");
                Console.WriteLine();
                Console.WriteLine("Situação: ⚠ Apenas 1 crane disponível. Multi-crane real não é possível.");
                Console.WriteLine("          Usamos 1 crane, sem qualquer redução de atraso neste VVN.");
                Console.WriteLine();
            }
            else
            {
                craneCountUsed = Math.Min(requiredCranes, cranesAvailable);

                optimizedOperationDuration =
                    (int)Math.Ceiling((double)work / craneCountUsed);

                int multiRealEnd = etaHours + optimizedOperationDuration;
                int multiDelay   = Math.Max(0, multiRealEnd - plannedEtdHours);

                int savedDelay = singleDelay - multiDelay;

                Console.WriteLine("===== MULTI-CRANE ANALYSIS (APPLIED) =====");
                Console.WriteLine($"VVN: {op.VvnId} | Vessel: {op.Vessel} | Dock: {op.Dock}");
                Console.WriteLine($"Work (1 crane)......................: {work} h");
                Console.WriteLine($"Available window....................: {availableWindow} h");
                Console.WriteLine($"Delay com 1 crane...................: {singleDelay} h");
                Console.WriteLine();
                Console.WriteLine($"Cranes necessárias p/ zero atraso...: {requiredCranes} (X)");
                Console.WriteLine($"Cranes disponíveis no dock..........: {cranesAvailable} (limite físico)");
                Console.WriteLine($"Cranes usadas neste plano...........: {craneCountUsed} (Y)");
                Console.WriteLine();
                Console.WriteLine($"Duração com {craneCountUsed} cranes: {optimizedOperationDuration} h");
                Console.WriteLine($"Delay com multi-crane...............: {multiDelay} h");
                Console.WriteLine($"Redução de atraso (single - multi)..: {savedDelay} h");
                Console.WriteLine();
            }
        }

        var multiOp = new SchedulingOperationDto
        {
            VvnId = op.VvnId,
            Vessel = op.Vessel,
            Dock = op.Dock,
            StartTime = etaHours,
            EndTime = plannedEtdHours,
            LoadingDuration = op.LoadingDuration,
            UnloadingDuration = op.UnloadingDuration,
            Crane = op.Crane,
            StaffAssignments = op.StaffAssignments,

            CraneCountUsed = craneCountUsed,
            OptimizedOperationDuration = optimizedOperationDuration,
            RealDepartureTime = etaHours + optimizedOperationDuration,
            DepartureDelay = Math.Max(0, etaHours + optimizedOperationDuration - plannedEtdHours)
        };

        multi.Operations.Add(multiOp);
    }

    return multi;
}

    // ============================================================
    // Geração de tempos de loading/unloading
    // ============================================================

    private TimeSpan GenerateRandomTime(DateTime start, DateTime end)
    {
        if (end <= start)
            throw new ArgumentException("End time must be after start time.");

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
        if (total <= TimeSpan.Zero)
            throw new ArgumentException("Total duration must be positive.");

        var rng = new Random();
        double multiplier = rng.NextDouble() * (MaxP - MinP) + MinP;

        var raw = TimeSpan.FromTicks((long)(total.Ticks * multiplier));

        const int roundToMinutes = 5;
        int totalMinutes = (int)Math.Round(raw.TotalMinutes / roundToMinutes) * roundToMinutes;
        return TimeSpan.FromMinutes(totalMinutes);
    }

    private (TimeSpan loading, TimeSpan unloading) GenerateLoadingAndUnloading(
        DateTime start, DateTime end)
    {
        if (end <= start)
            throw new ArgumentException("End time must be after start time.");

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

    // ============================================================
    // Cranes & Qualificações
    // ============================================================

    private async Task<int> GetTotalCranesForVvnAsync(VesselVisitNotificationPSDto vvn)
    {
        var cranes = await _dockClient.GetDockCranesAsync(vvn.Dock);
        return cranes.Count;
    }

    
    private async Task<Dictionary<string, PhysicalResourceDto>> GetCranesForVvnsAsync
        (List<VesselVisitNotificationPSDto> vvns)
    {
        var result = new Dictionary<string, PhysicalResourceDto>();

        foreach (var vvn in vvns)
        {
            var cranes = await _dockClient.GetDockCranesAsync(vvn.Dock);

            if (cranes.Count == 0)
                throw new PlanningSchedulingException(
                    $"Dock '{vvn.Dock}' has no available crane."
                );

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
                throw new PlanningSchedulingException(
                    $"Crane '{crane.Code.Value}' has no QualificationID assigned."
                );

            var q = await _qualificationService.GetQualificationAsync(crane.QualificationID.Value);

            if (q == null)
                throw new PlanningSchedulingException(
                    $"Qualification '{crane.QualificationID}' for crane '{crane.Code.Value}' not found."
                );

            result[vvnId] = q;
        }

        return result;
    }

    private async Task<Dictionary<string, List<StaffMemberDto>>> GetQualifiedStaffForVvnsAsync(
        Dictionary<string, QualificationDto> craneQualifications)
    {
        var result = new Dictionary<string, List<StaffMemberDto>>();

        var qualificationCodes = craneQualifications
            .Values
            .Select(q => q.Code)
            .Distinct()
            .ToList();

        var staffByQualification = new Dictionary<string, List<StaffMemberDto>>();

        foreach (var code in qualificationCodes)
        {
            var staff = await _staffClient.GetStaffWithQualifications(new List<string> { code });

            if (staff == null || staff.Count == 0)
                throw new PlanningSchedulingException(
                    $"No staff members found with qualification '{code}'."
                );

            staffByQualification[code] = staff;
        }

        foreach (var (vvnId, qualification) in craneQualifications)
        {
            if (!staffByQualification.TryGetValue(qualification.Code, out var staffList)
                || staffList.Count == 0)
            {
                throw new PlanningSchedulingException(
                    $"No staff available for vessel visit notification '{vvnId}' with qualification '{qualification.Code}'."
                );
            }

            result[vvnId] = staffList;
        }

        return result;
    }

    // ============================================================
    // Shifts & Staff Assignments
    // ============================================================

    private (DateTime Start, DateTime End) GetShiftWindow(DateOnly day, string shift)
    {
        var dayStart = day.ToDateTime(TimeOnly.MinValue);

        return shift switch
        {
            "Night"   => (dayStart,             dayStart.AddHours(8)),
            "Morning" => (dayStart.AddHours(8), dayStart.AddHours(16)),
            "Evening" => (dayStart.AddHours(16), dayStart.AddDays(1)),
            _ => throw new ArgumentOutOfRangeException(nameof(shift), shift, null)
        };
    }

    private List<StaffAssignmentDto> BuildStaffAssignmentsForVvn(
        VesselVisitNotificationPSDto vvn,
        List<StaffMemberDto> staffForVvn)
    {
        if (staffForVvn == null || staffForVvn.Count == 0)
            throw new PlanningSchedulingException($"No staff available for VVN {vvn.Id}.");

        var assignments = new List<StaffAssignmentDto>();

        var eta = vvn.EstimatedTimeArrival;
        var etd = vvn.EstimatedTimeDeparture;

        if (etd <= eta)
            throw new PlanningSchedulingException(
                $"Invalid time window for VVN {vvn.Id}: ETD before ETA."
            );

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

                var activeShifts = new List<(string Name, DateTime Start, DateTime End)>();

                foreach (var shift in shifts)
                {
                    var (shiftStart, shiftEnd) = GetShiftWindow(currentDay, shift);

                    var intervalStart = opStart > shiftStart ? opStart : shiftStart;
                    var intervalEnd = opEnd < shiftEnd ? opEnd : shiftEnd;

                    if (intervalEnd > intervalStart)
                        activeShifts.Add((shift, intervalStart, intervalEnd));
                }

                if (activeShifts.Count == 0)
                {
                    currentDay = currentDay.AddDays(1);
                    continue;
                }

                var usedStaffIds = new HashSet<Guid>();

                foreach (var shiftInfo in activeShifts)
                {
                    var staffForShift = staffForVvn.FirstOrDefault(s =>
                        !usedStaffIds.Contains(s.Id) &&
                        WorksOnDay(s, currentDay) &&
                        IsStaffAvailableForShift(s, shiftInfo.Name));

                    if (staffForShift == null)
                    {
                        throw new PlanningSchedulingException(
                            $"No staff available for shift '{shiftInfo.Name}' " +
                            $"for VVN {vvn.Id} on {currentDay}."
                        );
                    }

                    usedStaffIds.Add(staffForShift.Id);

                    assignments.Add(new StaffAssignmentDto
                    {
                        StaffMemberName = staffForShift.ShortName,
                        IntervalStart = shiftInfo.Start,
                        IntervalEnd = shiftInfo.End
                    });
                }
            }

            currentDay = currentDay.AddDays(1);
        }

        return assignments;
    }

    private bool IsStaffAvailableForShift(StaffMemberDto staff, string requiredShift)
    {
        if (staff.Schedule == null || string.IsNullOrWhiteSpace(staff.Schedule.Shift))
            return false;

        return string.Equals(
            staff.Schedule.Shift,
            requiredShift,
            StringComparison.OrdinalIgnoreCase
        );
    }
    
    private bool WorksOnDay(StaffMemberDto staff, DateOnly day)
    {
        if (staff.Schedule == null || string.IsNullOrWhiteSpace(staff.Schedule.DaysOfWeek))
            return false;

        var bits = staff.Schedule.DaysOfWeek.Trim();

        if (bits.Length != 7)
            return false;
        
        int offset = day.DayOfWeek switch
        {
            DayOfWeek.Monday    => 0,
            DayOfWeek.Tuesday   => 1,
            DayOfWeek.Wednesday => 2,
            DayOfWeek.Thursday  => 3,
            DayOfWeek.Friday    => 4,
            DayOfWeek.Saturday  => 5,
            DayOfWeek.Sunday    => 6,
            _ => throw new Exception("Invalid day")
        };
        
        int indexFromRight = offset;                  
        int indexInString = bits.Length - 1 - indexFromRight; 

        return bits[indexInString] == '1';
    }

    // ============================================================
    // Utilitários de tempo
    // ============================================================

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
}