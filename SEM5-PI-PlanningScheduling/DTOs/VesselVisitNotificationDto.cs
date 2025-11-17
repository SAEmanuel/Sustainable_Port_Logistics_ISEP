namespace SEM5_PI_DecisionEngineAPI.DTOs;

public class VesselVisitNotificationDto
{
    public string Id { get; set; }
    public string Code { get; set; }

    public DateTime EstimatedTimeArrival { get; set; }
    public DateTime EstimatedTimeDeparture { get; set; }
    public DateTime? ActualTimeArrival { get; set; }
    public DateTime? ActualTimeDeparture { get; set; }
    public DateTime? AcceptenceDate { get; set; }

    public int Volume { get; set; }
    public object Documents { get; set; }

    public string Status { get; set; }
    public string? Dock { get; set; }
    public CrewManifestDto? CrewManifest { get; set; }
    public CargoManifestDto? LoadingCargoManifest { get; set; }
    public CargoManifestDto? UnloadingCargoManifest { get; set; }
    public string VesselImo { get; set; }

    public IReadOnlyCollection<TaskDto> Tasks { get; set; }
}

public class CrewManifestDto
{
    public Guid Id { get; set; }
    public int TotalCrew { get; set; }
    public string CaptainName { get; set; }
    public List<CrewMemberDto>? CrewMembers { get; set; }
}

public class CrewMemberDto
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string Role { get; set; }
    public string Nationality { get; set; }
    public string CitizenId { get; set; }
}

public class CargoManifestDto
{
    public Guid Id { get; set; }
    public string Code { get; set; }
    public string Type { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; }
    public List<CargoManifestEntryDto> Entries { get; set; }
}

public class CargoManifestEntryDto
{
    public Guid Id { get; set; }
    public int Bay { get; set; }
    public int Row { get; set; }
    public int Tier { get; set; }
    public ContainerDto Container { get; set; }
    public string StorageAreaName { get; set; }
}

public class ContainerDto
{
    public Guid Id { get; set; }
    public Iso6346CodeDto IsoCode { get; set; }
    public string Description { get; set; }
    public string Type { get; set; }
    public string Status { get; set; }
    public double WeightKg { get; set; }
}

public class Iso6346CodeDto
{
    public string Value { get; set; }
}

public class TaskDto
{
    public Guid Id { get; set; }
    public string Code { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public string? Description { get; set; }
    public string Type { get; set; }
    public string Status { get; set; }
}