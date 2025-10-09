using SEM5_PI_WEBAPI.Domain.CargoManifestEntries;

namespace SEM5_PI_WEBAPI.Domain.CargoManifests
{
    public class CreatingCargoManifestDto
    {
        public CargoManifestType Type { get; set; }
        public string CreatedBy { get; set; }
        public List<CreatingCargoManifestEntryDto> Entries { get; set; }

        public CreatingCargoManifestDto(CargoManifestType type, string createdBy, List<CreatingCargoManifestEntryDto> entries)
        {
            Type = type;
            CreatedBy = createdBy;
            Entries = entries;
        }
    }
    
}