namespace SEM5_PI_DecisionEngineAPI.DTOs
{
    public class DockRebalanceCandidateDto
    {
        public string VvnId { get; set; } = default!;
        public string VesselName { get; set; } = default!;
        public string CurrentDock { get; set; } = default!;

        public DateTime EstimatedTimeArrival { get; set; }
        public DateTime EstimatedTimeDeparture { get; set; }

        public double OperationDurationHours { get; set; }
        public List<string> AllowedDocks { get; set; } = new();
    }


    public class DockRebalanceAssignmentDto
    {
        public string Id { get; set; } = default!;
        public string Dock { get; set; } = default!;
    }


    public class DockRebalanceResultDto
    {
        public string Status { get; set; } = default!;
        public string Algorithm { get; set; } = default!;
        public double BalanceScore { get; set; }

        public List<DockRebalanceAssignmentDto> Assignments { get; set; } = new();
    }


    public class DockLoadInfoDto
    {
        public string Dock { get; set; } = default!;
        public double TotalDurationHours { get; set; }
    }


    public class DockLoadChangeDto
    {
        public string Dock { get; set; } = default!;
        public double Before { get; set; }
        public double After { get; set; }

        public double Difference => After - Before;
    }


    public class DockRebalanceFinalDto
    {
        public DateOnly Day { get; set; }

        public List<DockLoadInfoDto> LoadsBefore { get; set; } = new();
        public List<DockLoadInfoDto> LoadsAfter { get; set; } = new();
        public List<DockLoadChangeDto> LoadDifferences { get; set; } = new();

        public List<DockRebalanceCandidateDto> Candidates { get; set; } = new();
        public List<DockRebalanceAssignmentDto> Assignments { get; set; } = new();


        public double BalanceScore { get; set; }


        public double VarianceBefore { get; set; }


        public double ImprovementPercent { get; set; }


        public double StdDevBefore { get; set; }
        public double StdDevAfter { get; set; }
    }
}