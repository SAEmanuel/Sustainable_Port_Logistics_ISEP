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

    public async Task<DailyScheduleResultDto> ComputeDailyScheduleAsync(DateOnly day)
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
                var (load, unload) = GenerateLoadingAndUnloading(vvn.EstimatedTimeArrival, vvn.EstimatedTimeDeparture);
                loadingDuration = load;
                unloadingDuration = unload;
            }

            var staffAssignments = BuildStaffAssignmentsForVvn(vvn, staff);

            var eta = DateTimeToInteger(day, vvn.EstimatedTimeArrival);
            var etd = DateTimeToInteger(day, vvn.EstimatedTimeDeparture);
            var loadDuration = TimeSpanToInteger(loadingDuration);
            var unloadDuration = TimeSpanToInteger(unloadingDuration);

            var op = new SchedulingOperationDto
            {
                VvnId = vvn.Id,
                Vessel = vessel!.Name,
                Dock = vvn.Dock,
                StartTime = eta,
                EndTime = etd,
                LoadingDuration = loadDuration,
                UnloadingDuration = unloadDuration,
                Crane = crane.Code.Value,
                StaffAssignments = staffAssignments
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

    // Staff for VVN by qualifications
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

    // Shift windows
    private (DateTime Start, DateTime End) GetShiftWindow(DateOnly day, string shift)
    {
        var dayStart = day.ToDateTime(TimeOnly.MinValue);

        return shift switch
        {
            "Night"   => (dayStart,          dayStart.AddHours(8)),
            "Morning" => (dayStart.AddHours(8),  dayStart.AddHours(16)),
            "Evening" => (dayStart.AddHours(16), dayStart.AddDays(1)),
            _ => throw new ArgumentOutOfRangeException(nameof(shift), shift, null)
        };
    }

    // Staff assignments
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