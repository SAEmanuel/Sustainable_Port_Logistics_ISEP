namespace SEM5_PI_DecisionEngineAPI.DTOs;

public class DailyScheduleResultDto
{
    public List<SchedulingOperationDto> Operations { get; set; } = new();
}

public class SchedulingOperationDto
{
    public string VvnId { get; set; }
    public string Vessel { get; set; }
    public string Dock { get; set; }
    public int StartTime { get; set; }      
    public int EndTime { get; set; }        
    public int LoadingDuration { get; set; }
    public int UnloadingDuration { get; set; }
    public string Crane { get; set; }
    public List<StaffAssignmentDto> StaffAssignments { get; set; }
}

public class StaffAssignmentDto
{
    public string StaffMemberName { get; set; }
    public DateTime IntervalStart { get; set; }
    public DateTime IntervalEnd { get; set; }
}