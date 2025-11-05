using SEM5_PI_WEBAPI.Domain.CargoManifestEntries;
using SEM5_PI_WEBAPI.Domain.CargoManifests.DTOs;

namespace SEM5_PI_WEBAPI.Domain.CargoManifests;

public class CargoManifestMapper
{
    public static CargoManifestDto ToDto(
        CargoManifest manifest,
        List<CargoManifestEntryDto> entryDtos)
    {
        return new CargoManifestDto(
            manifest.Id.AsGuid(),
            manifest.Code,
            manifest.Type,
            manifest.CreatedAt,
            manifest.SubmittedBy.Address,
            entryDtos
        );
    }

    public static List<CargoManifestDto> ToDtoList(
        List<CargoManifest> manifests,
        Dictionary<Guid, List<CargoManifestEntryDto>> entriesByManifestId)
    {
        return manifests.Select(manifest =>
        {
            var entryDtos = entriesByManifestId.TryGetValue(manifest.Id.AsGuid(), out var entries)
                ? entries
                : new List<CargoManifestEntryDto>();

            return ToDto(manifest, entryDtos);
        }).ToList();
    }
}