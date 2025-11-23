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
    
    //PARA A US 3.4.5
    public int CraneCountUsed { get; set; }              
    public int OptimizedOperationDuration { get; set; }  
    public int RealDepartureTime { get; set; }           
    public int DepartureDelay { get; set; }     
}

public class MultiCraneComparisonResultDto
{
    public DailyScheduleResultDto SingleCraneSchedule { get; set; }
    public object SingleCraneProlog { get; set; }

    public DailyScheduleResultDto MultiCraneSchedule { get; set; }
    public object MultiCraneProlog { get; set; }

    public int SingleTotalDelay { get; set; }
    public int MultiTotalDelay { get; set; }
    public int DelayImprovement => SingleTotalDelay - MultiTotalDelay;

    public int SingleCraneHours { get; set; }
    public int MultiCraneHours { get; set; }
}

public class StaffAssignmentDto
{
    public string StaffMemberName { get; set; }
    public DateTime IntervalStart { get; set; }
    public DateTime IntervalEnd { get; set; }
}