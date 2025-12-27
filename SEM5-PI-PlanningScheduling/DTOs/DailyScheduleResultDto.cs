using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace SEM5_PI_DecisionEngineAPI.DTOs;

public class DailyScheduleResultDto
{
    public List<SchedulingOperationDto> Operations { get; set; } = new();
}

public class SchedulingOperationDto
{
    [JsonPropertyName("vvnId")]
    public string VvnId { get; set; }

    [JsonPropertyName("vessel")]
    public string Vessel { get; set; }

    [JsonPropertyName("dock")]
    public string Dock { get; set; }

    [JsonPropertyName("startTime")]
    public int StartTime { get; set; }

    [JsonPropertyName("endTime")]
    public int EndTime { get; set; }

    [JsonPropertyName("loadingDuration")]
    public int LoadingDuration { get; set; }

    [JsonPropertyName("unloadingDuration")]
    public int UnloadingDuration { get; set; }

    [JsonPropertyName("crane")]
    public string Crane { get; set; } = string.Empty;

    [JsonPropertyName("craneCountUsed")]
    public int CraneCountUsed { get; set; } = 1;

    [JsonPropertyName("totalCranesOnDock")]
    public int TotalCranesOnDock { get; set; }

    [JsonPropertyName("optimizedOperationDuration")]
    public int OptimizedOperationDuration { get; set; }

    [JsonPropertyName("realDepartureTime")]
    public int RealDepartureTime { get; set; }

    [JsonPropertyName("realArrivalTime")]
    public int RealArrivalTime { get; set; }

    [JsonPropertyName("departureDelay")]
    public int DepartureDelay { get; set; }
    
    [JsonPropertyName("staffAssignments")]
    public List<StaffAssignmentDto>? StaffAssignments { get; set; }
    
    public int? TheoreticalRequiredCranes { get; set; }
    public string? ResourceSuggestion { get; set; }
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

    public List<OptimizationStepDto> OptimizationSteps { get; set; } = new();
}

public class StaffAssignmentDto
{
    public string StaffMemberName { get; set; }
    public DateTime IntervalStart { get; set; }
    public DateTime IntervalEnd { get; set; }
}

public class OptimizationStepDto
{
    public int StepNumber { get; set; }
    public int TotalDelay { get; set; }
    public int TotalCranesUsed { get; set; }
    public string AlgorithmUsed { get; set; } = string.Empty;
    public string ChangeDescription { get; set; } = string.Empty;
}

public class PrologOperationResultDto
{
    [JsonPropertyName("vessel")]
    public string Vessel { get; set; } = string.Empty;

    [JsonPropertyName("start")]
    public int StartTime { get; set; }

    [JsonPropertyName("end")]
    public int EndTime { get; set; }
}

public class PrologFullResultDto
{
    [JsonPropertyName("algorithm")]
    public string Algorithm { get; set; } = string.Empty;
    
    [JsonPropertyName("total_delay")]
    public int TotalDelay { get; set; }
    
    [JsonPropertyName("best_sequence")]
    public List<PrologOperationResultDto> BestSequence { get; set; } = new();
    
    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;
}

public class GeneticScheduleResultDto
{
    public string Algorithm => "genetic";
    
    public DailyScheduleResultDto Schedule { get; set; } = new();
    public PrologFullResultDto? Prolog { get; set; }

    
    public int PopulationSize { get; set; }
    public int Generations { get; set; }
    public double MutationRate { get; set; }
    public double CrossoverRate { get; set; }
}

public class SmartScheduleResultDto
{
    public string SelectedAlgorithm { get; set; } = string.Empty;
    
    public DailyScheduleResultDto Schedule { get; set; } = new();
    public PrologFullResultDto? Prolog { get; set; }

    public int ProblemSize { get; set; }
    public int VesselCount { get; set; }
    public int CraneCount { get; set; }

    public string SelectionReason { get; set; } = string.Empty;
}