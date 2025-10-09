using SEM5_PI_WEBAPI.Domain.CargoManifestEntries;

namespace SEM5_PI_WEBAPI.Domain.CargoManifests
{
    public class CreatingCargoManifestDto
    {
        public string Code { get; set; }
        public CargoManifestType Type { get; set; }
        public DateTime CreatedAt { get; set; }
        public string CreatedBy { get; set; }
        public List<CreatingCargoManifestEntryDto> Entries { get; set; }

        public CreatingCargoManifestDto(string code, CargoManifestType type, DateTime createdAt, string createdBy, List<CreatingCargoManifestEntryDto> entries)
        {
            Code = code;
            Type = type;
            CreatedAt = createdAt;
            CreatedBy = createdBy;
            Entries = entries;
        }
    }
    
}