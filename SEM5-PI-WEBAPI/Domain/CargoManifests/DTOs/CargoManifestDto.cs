using SEM5_PI_WEBAPI.Domain.CargoManifestEntries;

namespace SEM5_PI_WEBAPI.Domain.CargoManifests.DTOs;

public class CargoManifestDto
{
    public Guid Id { get; set; }
    public string Code { get; set; }
    public CargoManifestType Type { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; }
    public List<CargoManifestEntryDto> Entries { get; set; }

    public CargoManifestDto(Guid id, string code, CargoManifestType type, DateTime createdAt, string createdBy,
        List<CargoManifestEntryDto> entries)
    {
        Id = id;
        Code = code;
        Type = type;
        CreatedAt = createdAt;
        CreatedBy = createdBy;
        Entries = entries;
    }
}