using SEM5_PI_WEBAPI.Domain.CargoManifestEntries;
using SEM5_PI_WEBAPI.Domain.CargoManifests;
using SEM5_PI_WEBAPI.Domain.CargoManifests.DTOs;
using SEM5_PI_WEBAPI.Domain.Containers;
using SEM5_PI_WEBAPI.Domain.CrewManifests;
using SEM5_PI_WEBAPI.Domain.CrewManifests.DTOs;
using SEM5_PI_WEBAPI.Domain.CrewMembers;
using SEM5_PI_WEBAPI.Domain.Tasks;
using SEM5_PI_WEBAPI.Domain.VVN.Docs;
using SEM5_PI_WEBAPI.Domain.VVN.DTOs;

namespace SEM5_PI_WEBAPI.Domain.VVN;

public static class VesselVisitNotificationMapper
{
    public static VesselVisitNotificationDto ToDto(VesselVisitNotification notification)
    {
        var crewManifestDto = MapCrewManifestToDto(notification.CrewManifest);
        var loadingCargoManifestDto = MapCargoManifestToDto(notification.LoadingCargoManifest);
        var unloadingCargoManifestDto = MapCargoManifestToDto(notification.UnloadingCargoManifest);
        var taskListDto = MapTaskListToDto(notification.Tasks);

        return new VesselVisitNotificationDto(
            notification.Id.Value,
            notification.Code.Code,
            notification.EstimatedTimeArrival?.Value ?? DateTime.MinValue,
            notification.EstimatedTimeDeparture?.Value ?? DateTime.MinValue,
            notification.ActualTimeArrival?.Value,
            notification.ActualTimeDeparture?.Value,
            notification.AcceptenceDate?.Value,
            notification.Volume,
            notification.Documents ?? new PdfDocumentCollection(),
            notification.Dock?.Value ?? string.Empty,
            notification.Status.ToString(true),
            crewManifestDto,
            loadingCargoManifestDto,
            unloadingCargoManifestDto,
            notification.VesselImo.Value,
            taskListDto
        );
    }

    public static List<VesselVisitNotificationDto> ToDtoList(List<VesselVisitNotification> list)
    {
        return list.Select(ToDto).ToList();
    }

    private static List<TaskDto> MapTaskListToDto(IReadOnlyCollection<EntityTask>? notificationTasks)
    {
        if (notificationTasks == null || notificationTasks.Count == 0)
            return new List<TaskDto>();

        return TaskMapper.ToDtoList(notificationTasks);
    }

    private static CargoManifestDto? MapCargoManifestToDto(CargoManifest? cargoManifest)
    {
        if (cargoManifest == null)
            return null;

        var cargoManifestEntriesDto = MapCargoManifestEntriesToDto(cargoManifest.ContainerEntries);
        
        return new CargoManifestDto(
            cargoManifest.Id.AsGuid(),
            cargoManifest.Code,
            cargoManifest.Type,
            cargoManifest.CreatedAt,
            cargoManifest.SubmittedBy.ToString(),
            cargoManifestEntriesDto
        );
    }

    private static List<CargoManifestEntryDto> MapCargoManifestEntriesToDto(List<CargoManifestEntry>? containerEntries)
    {
        if (containerEntries == null || containerEntries.Count == 0)
            return new List<CargoManifestEntryDto>();

        return containerEntries.Select(c => new CargoManifestEntryDto(
            c.Id.AsGuid(),
            c.Bay,
            c.Row,
            c.Tier,
            c.StorageAreaId.Value,
            ContainerMapper.ToDto(c.Container)
        )).ToList();
    }

    private static CrewManifestDto? MapCrewManifestToDto(CrewManifest? crewManifest)
    {
        if (crewManifest == null)
            return null;

        var crewMembersDto = MapCrewMembersToDto(crewManifest.CrewMembers);
        
        return new CrewManifestDto(
            crewManifest.Id.AsGuid(),
            crewManifest.TotalCrew,
            crewManifest.CaptainName,
            crewMembersDto
        );
    }

    private static List<CrewMemberDto> MapCrewMembersToDto(List<CrewMember>? crewMembers)
    {
        if (crewMembers == null || crewMembers.Count == 0)
            return new List<CrewMemberDto>();

        return CrewMemberMapper.ToDtoList(crewMembers);
    }
}