using SEM5_PI_WEBAPI.Domain.CrewManifests.DTOs;
using SEM5_PI_WEBAPI.Domain.CrewMembers;

namespace SEM5_PI_WEBAPI.Domain.CrewManifests;

public class CrewManifestMapper
{
    public static CrewManifestDto ToDto(CrewManifest crewManifest)
    {
        var crewMemberDtos = crewManifest.CrewMembers != null
            ? CrewMemberMapper.ToDtoList(crewManifest.CrewMembers)
            : null;

        return new CrewManifestDto(
            crewManifest.Id.AsGuid(),
            crewManifest.TotalCrew,
            crewManifest.CaptainName,
            crewMemberDtos
        );
    }

    public static List<CrewManifestDto> ToDtoList(List<CrewManifest> crewManifests)
    {
        return crewManifests
            .Select(ToDto)
            .ToList();
    }
}