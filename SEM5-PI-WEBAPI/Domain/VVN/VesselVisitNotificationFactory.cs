using System.ComponentModel;
using SEM5_PI_WEBAPI.Domain.CargoManifests;
using SEM5_PI_WEBAPI.Domain.CrewManifests;
using SEM5_PI_WEBAPI.Domain.CrewMembers;
using SEM5_PI_WEBAPI.Domain.Dock;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.Domain.VVN.Docs;
using SEM5_PI_WEBAPI.Domain.VVN.DTOs;
using SEM5_PI_WEBAPI.Domain.CargoManifestEntries;
using SEM5_PI_WEBAPI.Domain.Containers;
using SEM5_PI_WEBAPI.Domain.Tasks;
using Task = SEM5_PI_WEBAPI.Domain.Tasks.Task;


namespace SEM5_PI_WEBAPI.Domain.VVN;

public static class VesselVisitNotificationFactory
{
    public static VesselVisitNotification CreateVesselVisitNotification(
        VvnCode code,
        string estimatedTimeArrivalDto,
        string estimatedTimeDepartureDto,
        int volume,
        PdfDocumentCollection? documents,
        List<EntityDock> docks,
        CrewManifest? crewManifest,
        CargoManifest? loadingCargoManifest,
        CargoManifest? unloadingCargoManifest,
        ImoNumber vesselImo)
    {
        if (!DateTime.TryParseExact(estimatedTimeArrivalDto, "yyyy-MM-ddTHH:mm:ss", null, System.Globalization.DateTimeStyles.None, out var eta))
            throw new BusinessRuleValidationException("Invalid EstimatedTimeArrival format. Expected format: yyyy-MM-ddTHH:mm:ss");

        if (!DateTime.TryParseExact(estimatedTimeDepartureDto, "yyyy-MM-ddTHH:mm:ss", null, System.Globalization.DateTimeStyles.None, out var etd))
            throw new BusinessRuleValidationException("Invalid EstimatedTimeDeparture format. Expected format: yyyy-MM-ddTHH:mm:ss");

        var estimatedTimeArrival = new ClockTime(eta);
        var estimatedTimeDeparture = new ClockTime(etd);

        var safeDocuments = documents ?? new PdfDocumentCollection();

        return new VesselVisitNotification(
            code,
            estimatedTimeArrival,
            estimatedTimeDeparture,
            volume,
            safeDocuments,
            docks,
            crewManifest,
            loadingCargoManifest,
            unloadingCargoManifest,
            vesselImo
        );
    }

    public static VesselVisitNotificationDto CreateVesselVisitNotificationDto(VesselVisitNotification notification)
    {
        
        CrewManifestDto crewManifestDto = CreateCrewManifestDto(notification.CrewManifest);
        CargoManifestDto loadingCargoManifestDto = CreateCargoManifestDto(notification.LoadingCargoManifest);
        CargoManifestDto unloadingCargoManifestDto = CreateCargoManifestDto(notification.UnloadingCargoManifest);
        List<TaskDto> taskListDto = CreateTaskListDto(notification.Tasks);
        List<DockDto> dockListDto = notification.ListDocks.Select(d => DockFactory.RegisterDockDto(d)).ToList();
            
        return new VesselVisitNotificationDto(
            notification.Id.Value,
            notification.Code.Code,
            notification.EstimatedTimeArrival,
            notification.EstimatedTimeDeparture,
            notification.ActualTimeArrival,
            notification.ActualTimeDeparture,
            notification.AcceptenceDate,
            notification.Volume,
            notification.Documents ?? new PdfDocumentCollection(),
            notification.Status,
            dockListDto,
            crewManifestDto,
            loadingCargoManifestDto,
            unloadingCargoManifestDto,
            notification.VesselImo.Value,
            taskListDto
        );
    }

    private static List<TaskDto> CreateTaskListDto(IReadOnlyCollection<Task> notificationTasks)
    {
        return new List<TaskDto>(notificationTasks.Select(t => CreateTaskDto(t)).ToList());
    }

    private static TaskDto CreateTaskDto(Task task)
    {
        return new TaskDto(task.Id.AsGuid(),task.Code.ToString(),task.StartTime,task.EndTime,task.Description,task.Type,task.Status);
    }
    private static CargoManifestDto CreateCargoManifestDto(CargoManifest? cargoManifest)
    {
        List<CargoManifestEntryDto> cargoManifestEntrysDto = CreateCargoManifestEntrysDto(cargoManifest.ContainerEntries);
        return new CargoManifestDto(cargoManifest.Id.AsGuid(),cargoManifest.Code,cargoManifest.Type,
            cargoManifest.CreatedAt,cargoManifest.SubmittedBy,cargoManifestEntrysDto);
    }

    private static List<CargoManifestEntryDto> CreateCargoManifestEntrysDto(List<CargoManifestEntry> containerEntries)
    {
        return new List<CargoManifestEntryDto>(containerEntries.Select(c => new CargoManifestEntryDto(
            c.Id.AsGuid(),c.Bay,c.Row,c.Tier,c.StorageAreaId.Value,
            ContainerFactory.CreateContainerDto(c.Container))).ToList());
    }
    
    private static CrewManifestDto CreateCrewManifestDto(CrewManifest crewManifest)
    {       
        List<CrewMemberDto> crewMembersDto = CreateCrewMemberDto(crewManifest.CrewMembers);
        return new CrewManifestDto(crewManifest.Id.AsGuid(),crewManifest.TotalCrew,crewManifest.CaptainName,crewMembersDto);
    }
    private static List<CrewMemberDto> CreateCrewMemberDto(List<CrewMember>? crewMembers)
    {
        return new List<CrewMemberDto>(crewMembers.Select(c => new CrewMemberDto(c.Id.AsGuid(),c.Name,c.Role,c.Nationality,c.CitizenId.PassportNumber)).ToList());
    }
    
    
}
