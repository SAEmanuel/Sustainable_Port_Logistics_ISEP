using SEM5_PI_WEBAPI.Domain.CargoManifests;
using SEM5_PI_WEBAPI.Domain.CrewManifests;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.Domain.Dock;
using Task = SEM5_PI_WEBAPI.Domain.Tasks.Task;


namespace SEM5_PI_WEBAPI.Domain.VVN
{
    public enum VvnStatus{
        InProgress,
        PendingInformation,
        Withdrawn,
        Submitted,
        Accepted
    }

    public class VesselVisitNotification : Entity<VesselVisitNotificationId>, IAggregateRoot
    {
        private const string DefaultDocumentBody = "No documents attached.";
        public VvnCode Code { get; private set; }
    
        public ClockTime EstimatedTimeArrival { get; private set; }
        public ClockTime? ActualTimeArrival { get; private set; }
        public ClockTime EstimatedTimeDeparture { get; private set; }
        public ClockTime? ActualTimeDeparture { get; private set; }
        public ClockTime? AcceptenceDate {get; private set;}

        public int Volume {get; private set;}
        public string Documents {get; private set;}

        public VvnStatus Status {get; private set;}
        public IReadOnlyCollection<EntityDock> ListDocks {get; private set;}
        public CrewManifest? CrewManifest {get; set;}
        public CargoManifest? LoadingCargoManifest {get; set;}
        public CargoManifest? UnloadingCargoManifest {get; private set;}
        public ImoNumber VesselImo {get; set;}
    
        public IReadOnlyCollection<Task> Tasks {get; set;}
    
    
    
        public VesselVisitNotification (){}
    
        public VesselVisitNotification(VvnCode code, ClockTime estimatedTimeArrival, ClockTime estimatedTimeDeparture,
            int volume,string? documents, IEnumerable<EntityDock> docks,
            CrewManifest? crewManifest,CargoManifest? loadingCargoManifest,
            CargoManifest? unloadingCargoManifest,ImoNumber vesselImo,IEnumerable<Task> tasks)
        {
            Id = new VesselVisitNotificationId(Guid.NewGuid());
            SetCode(code);
            SetEstimatedTimeArrival(estimatedTimeArrival);
            SetEstimatedTimeDeparture(estimatedTimeDeparture);
            SetVolume(volume);
            SetDocuments(documents);
            SetListDocks(docks);
            SetCrewManifest(crewManifest);
            SetLoadingCargoManifest(loadingCargoManifest);
            SetUnloadingCargoManifest(unloadingCargoManifest);
            SetVesselImo(vesselImo);
            
            SetActualTimeArrival(null);
            SetActualTimeDeparture(null);

            AcceptenceDate = null;
            Status = VvnStatus.InProgress;
        }

        
        public void UpdateEstimatedTimeArrival(ClockTime estimatedTimeArrival) => SetEstimatedTimeArrival(estimatedTimeArrival);
        public void UpdateEstimatedTimeDeparture(ClockTime estimatedTimeDeparture) => SetEstimatedTimeDeparture(estimatedTimeDeparture);
        public void UpdateVolume(int volume) => SetVolume(volume);
        public void UpdateDocuments(string? documents) => SetDocuments(documents);
        public void UpdateListDocks(IEnumerable<EntityDock> docks) => SetListDocks(docks);
        public void UpdateCrewManifest(CrewManifest? crewManifest) => SetCrewManifest(crewManifest);
        public void UpdateLoadingCargoManifest(CargoManifest? cargoManifest) => SetLoadingCargoManifest(cargoManifest);
        public void UpdateUploadingCargoManifest(CargoManifest? cargoManifest) => SetUnloadingCargoManifest(cargoManifest);
        
        
        
        // ==============    
        private void SetCode(VvnCode code)
        {
            this.Code = code;
        }

        private void SetEstimatedTimeArrival(ClockTime estimatedTimeArrival)
        {
            this.EstimatedTimeArrival = estimatedTimeArrival;
        }

        private void SetEstimatedTimeDeparture(ClockTime estimatedTimeDeparture)
        {
            this.EstimatedTimeDeparture = estimatedTimeDeparture;
        }

        private void SetActualTimeDeparture(ClockTime? actualTimeDeparture)
        {
            this.ActualTimeDeparture = actualTimeDeparture;
        }

        private void SetActualTimeArrival(ClockTime? actualTimeArrival)
        {
            this.ActualTimeArrival = actualTimeArrival;
        }

        private void SetVolume(int volume)
        {
            if (volume < 0) throw new BusinessRuleValidationException("Volume must be non-negative.");
            Volume = volume;
        }


        private void SetDocuments(string? documents)
        {
            if (string.IsNullOrWhiteSpace(documents))
                Documents = DefaultDocumentBody;
            else
                Documents = documents;
        }


        private void SetListDocks(IEnumerable<EntityDock> docks)
        {
            ListDocks = docks?.ToList() ?? new List<EntityDock>();
        }

        private void SetCrewManifest(CrewManifest? crewManifest)
        {
            this.CrewManifest = crewManifest;
        }

        private void SetLoadingCargoManifest(CargoManifest? cargoManifest)
        {
            this.LoadingCargoManifest = cargoManifest;
        }

        private void SetUnloadingCargoManifest(CargoManifest? cargoManifest)
        {
            this.UnloadingCargoManifest = cargoManifest;
        }

        private void SetVesselImo(ImoNumber vesselImo)
        {
            this.VesselImo = vesselImo;
        }

        private void SetTasks(IEnumerable<Task> tasks)
        {
            Tasks = tasks?.ToList() ?? new List<Task>();
        }
        // ==============    
    
        
        
        // ==============    
        public void Submit()
        {
            if (Status != VvnStatus.InProgress)
                throw new BusinessRuleValidationException("Only In-progress VVNs can be submitted.");
            Status = VvnStatus.Submitted;
            
        }

        public void MarkPending()
        {
            if (Status != VvnStatus.Submitted)
                throw new BusinessRuleValidationException("Only Submitted VVNs can be marked pending.");
            Status = VvnStatus.PendingInformation;
        }

        public void Withdraw()
        {
            if (Status != VvnStatus.InProgress && Status != VvnStatus.PendingInformation)
                throw new BusinessRuleValidationException("Only In-progress/Pending VVNs can be withdrawn.");
            Status = VvnStatus.Withdrawn;
        }
    
        public void Resume()
        {
            if (Status != VvnStatus.Withdrawn)
                throw new BusinessRuleValidationException("Only withdrawn VVNs can be resumed.");
            Status = VvnStatus.InProgress;
        }

        public void Accept()
        {
            if (Status != VvnStatus.Submitted)
                throw new BusinessRuleValidationException("Only Submitted VVNs can be accepted.");
            Status = VvnStatus.Accepted;
            AcceptenceDate = new ClockTime(DateTime.Now);
        }
    
        public bool IsEditable => Status == VvnStatus.InProgress || Status == VvnStatus.PendingInformation;

        // ==============
        
        public override bool Equals(object? obj)
        {
            if (obj is not VesselVisitNotification other)
                return false;
            return Code.Equals(other.Code);
        }

        public override int GetHashCode() => Code.GetHashCode();


        public override string ToString()
        {
            return $"VVN {Code.Code} - Status: {Status} - Vessel IMO: {VesselImo}";
        }

    }
    

}