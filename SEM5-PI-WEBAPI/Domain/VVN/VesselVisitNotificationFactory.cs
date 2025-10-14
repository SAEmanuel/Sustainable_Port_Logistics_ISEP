using SEM5_PI_WEBAPI.Domain.CargoManifestEntries;
using SEM5_PI_WEBAPI.Domain.CargoManifests;
using SEM5_PI_WEBAPI.Domain.Containers;
using SEM5_PI_WEBAPI.Domain.CrewManifests;
using SEM5_PI_WEBAPI.Domain.CrewMembers;
using SEM5_PI_WEBAPI.Domain.Dock;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.Tasks;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.Domain.VVN.Docs;
using SEM5_PI_WEBAPI.Domain.VVN.DTOs;

namespace SEM5_PI_WEBAPI.Domain.VVN;

public static class VesselVisitNotificationFactory
{
    public static VesselVisitNotification CreateVesselVisitNotification(
        VvnCode code,
        string estimatedTimeArrivalDto,
        string estimatedTimeDepartureDto,
        int volume,
        PdfDocumentCollection? documents,
        CrewManifest? crewManifest,
        CargoManifest? loadingCargoManifest,
        CargoManifest? unloadingCargoManifest,
        ImoNumber vesselImo)
    {
        if (!DateTime.TryParse(estimatedTimeArrivalDto, null,
                System.Globalization.DateTimeStyles.RoundtripKind, out var eta))
            throw new BusinessRuleValidationException("Invalid EstimatedTimeArrival format. Use ISO 8601.");

        if (!DateTime.TryParse(estimatedTimeDepartureDto, null,
                System.Globalization.DateTimeStyles.RoundtripKind, out var etd))
            throw new BusinessRuleValidationException("Invalid EstimatedTimeDeparture format. Use ISO 8601.");

        var estimatedTimeArrival = new ClockTime(eta);
        var estimatedTimeDeparture = new ClockTime(etd);

        var safeDocuments = documents ?? new PdfDocumentCollection();

        return new VesselVisitNotification(
            code,
            estimatedTimeArrival,
            estimatedTimeDeparture,
            volume,
            safeDocuments,
            crewManifest,
            loadingCargoManifest,
            unloadingCargoManifest,
            vesselImo
        );
    }

    public static VesselVisitNotificationDto CreateVesselVisitNotificationDto(VesselVisitNotification notification)
    {
        var crewManifestDto = CreateCrewManifestDto(notification.CrewManifest);
        var loadingCargoManifestDto = CreateCargoManifestDto(notification.LoadingCargoManifest);
        var unloadingCargoManifestDto = CreateCargoManifestDto(notification.UnloadingCargoManifest);
        var taskListDto = CreateTaskListDto(notification.Tasks);

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


    private static List<TaskDto> CreateTaskListDto(IReadOnlyCollection<EntityTask>? notificationTasks)
    {
        if (notificationTasks == null || notificationTasks.Count == 0)
            return new List<TaskDto>();

        return notificationTasks.Select(CreateTaskDto).ToList();
    }

    private static TaskDto CreateTaskDto(EntityTask entityTask)
    {
        return new TaskDto(
            entityTask.Id.AsGuid(),
            entityTask.Code.ToString(),
            entityTask.StartTime,
            entityTask.EndTime,
            entityTask.Description,
            entityTask.Type,
            entityTask.Status
        );
    }

    private static CargoManifestDto? CreateCargoManifestDto(CargoManifest? cargoManifest)
    {
        if (cargoManifest == null)
            return null;

        var cargoManifestEntrysDto = CreateCargoManifestEntrysDto(cargoManifest.ContainerEntries);
        return new CargoManifestDto(
            cargoManifest.Id.AsGuid(),
            cargoManifest.Code,
            cargoManifest.Type,
            cargoManifest.CreatedAt,
            cargoManifest.SubmittedBy,
            cargoManifestEntrysDto
        );
    }

    private static List<CargoManifestEntryDto> CreateCargoManifestEntrysDto(List<CargoManifestEntry>? containerEntries)
    {
        if (containerEntries == null || containerEntries.Count == 0)
            return new List<CargoManifestEntryDto>();

        return containerEntries.Select(c => new CargoManifestEntryDto(
            c.Id.AsGuid(),
            c.Bay,
            c.Row,
            c.Tier,
            c.StorageAreaId.Value,
            ContainerFactory.CreateContainerDto(c.Container)
        )).ToList();
    }

    private static CrewManifestDto? CreateCrewManifestDto(CrewManifest? crewManifest)
    {
        if (crewManifest == null)
            return null;

        var crewMembersDto = CreateCrewMemberDto(crewManifest.CrewMembers);
        return new CrewManifestDto(
            crewManifest.Id.AsGuid(),
            crewManifest.TotalCrew,
            crewManifest.CaptainName,
            crewMembersDto
        );
    }

    private static List<CrewMemberDto> CreateCrewMemberDto(List<CrewMember>? crewMembers)
    {
        if (crewMembers == null || crewMembers.Count == 0)
            return new List<CrewMemberDto>();

        return crewMembers.Select(c => new CrewMemberDto(
            c.Id.AsGuid(),
            c.Name,
            c.Role,
            c.Nationality,
            c.CitizenId.PassportNumber
        )).ToList();
    }
}
