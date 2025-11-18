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
    public float StartTime { get; set; }      
    public float EndTime { get; set; }        
    public float LoadingDuration { get; set; }
    public float UnloadingDuration { get; set; }
    public string Crane { get; set; }
    public List<StaffAssignmentDto> StaffAssignments { get; set; }
}

public class StaffAssignmentDto
{
    public string StaffMemberName { get; set; }
    public DateTime IntervalStart { get; set; }
    public DateTime IntervalEnd { get; set; }
}