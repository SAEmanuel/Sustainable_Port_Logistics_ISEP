using SEM5_PI_DecisionEngineAPI.DTOs;
using SEM5_PI_DecisionEngineAPI.Exceptions;

namespace SEM5_PI_DecisionEngineAPI.Services;

public class SchedulingService
{
    public const float MinP = 0.4f;
    public const float MaxP = 0.8f;

    private readonly QualificationServiceClient _qualificationService;
    private readonly VesselVisitNotificationServiceClient _vvnClient;
    private readonly PhysicalResourceServiceClient _resourceClient;
    private readonly StaffMemberServiceClient _staffClient;
    private readonly VesselServiceClient _vesselSClient;
    private readonly DockServiceClient _dockClient;
    private readonly PrologClient _prologClient;

    public SchedulingService(
        VesselVisitNotificationServiceClient vvnClient,
        PhysicalResourceServiceClient resourceClient,
        StaffMemberServiceClient staffClient,
        DockServiceClient dockClient,
        QualificationServiceClient qualificationService,
        VesselServiceClient vesselClient,
        PrologClient prologClient)
    {
        _vvnClient = vvnClient;
        _resourceClient = resourceClient;
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
                unloadingDuration = GenerateRandomTime(vvn.EstimatedTimeArrival, vvn.EstimatedTimeDeparture);
                loadingDuration = GenerateRandomTime(vvn.EstimatedTimeArrival - unloadingDuration, vvn.EstimatedTimeDeparture);
            }

            var staffAssignments = BuildStaffAssignmentsForVvn(vvn, staff, day);


            var op = new SchedulingOperationDto
            {
                VvnId = vvn.Id,
                Vessel = vessel!.Name,
                Dock = vvn.Dock,
                StartTime = vvn.EstimatedTimeArrival,
                EndTime = vvn.EstimatedTimeDeparture,
                LoadingDuration = loadingDuration,
                UnloadingDuration = unloadingDuration,
                Crane = crane.Code.Value,
                StaffAssignments = staffAssignments
            };

            result.Operations.Add(op);
        }

        return result;
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


    // Crane by VVN
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


    // Qualifications by Crane
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
            foreach (var s in staff)
            {
               Console.WriteLine(s.ShortName); 
            }

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
            "Night" => (dayStart, dayStart.AddHours(8)),
            "Morning" => (dayStart.AddHours(8), dayStart.AddHours(16)),
            "Evening" => (dayStart.AddHours(16), dayStart.AddDays(1)),
            _ => throw new ArgumentOutOfRangeException(nameof(shift), shift, null)
        };
    }


    // Staff assignments 
    private List<StaffAssignmentDto> BuildStaffAssignmentsForVvn(
        VesselVisitNotificationPSDto vvn,
        List<StaffMemberDto> staffForVvn,
        DateOnly day)
    {
        if (staffForVvn == null || staffForVvn.Count == 0)
            throw new PlanningSchedulingException($"No staff available for VVN {vvn.Id}.");

        var assignments = new List<StaffAssignmentDto>();

        var eta = vvn.EstimatedTimeArrival;
        var etd = vvn.EstimatedTimeDeparture;

        var dayStart = day.ToDateTime(TimeOnly.MinValue);
        var dayEnd = dayStart.AddDays(1);

        var operationStart = eta < dayStart ? dayStart : eta;
        var operationEnd = etd > dayEnd ? dayEnd : etd;

        if (operationEnd <= operationStart)
            return assignments;

        var shifts = new[] { "Night", "Morning", "Evening" };
        int staffIndex = 0;

        foreach (var shift in shifts)
        {
            var (shiftStart, shiftEnd) = GetShiftWindow(day, shift);

            var intervalStart = operationStart > shiftStart ? operationStart : shiftStart;
            var intervalEnd = operationEnd < shiftEnd ? operationEnd : shiftEnd;

            if (intervalEnd <= intervalStart)
                continue;

            var staff = staffForVvn[staffIndex % staffForVvn.Count];
            staffIndex++;

            assignments.Add(new StaffAssignmentDto
            {
                StaffMemberName = staff.ShortName,
                IntervalStart = intervalStart,
                IntervalEnd = intervalEnd
            });
        }

        return assignments;
    }
}