using SEM5_PI_WEBAPI.Domain.CargoManifests;
using SEM5_PI_WEBAPI.Domain.CrewManifests;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.Domain.Tasks;
using SEM5_PI_WEBAPI.Domain.VVN.Docs;

namespace SEM5_PI_WEBAPI.Domain.VVN
{
    public class VesselVisitNotification : Entity<VesselVisitNotificationId>, IAggregateRoot
    {
        private bool _isConstructing = false;

        public VvnCode Code { get; private set; }

        public ClockTime EstimatedTimeArrival { get; private set; }
        public ClockTime? ActualTimeArrival { get; private set; }
        public ClockTime EstimatedTimeDeparture { get; private set; }
        public ClockTime? ActualTimeDeparture { get; private set; }
        public ClockTime? SubmittedDate { get; private set; }
        public ClockTime? AcceptenceDate { get; private set; }

        public int Volume { get; private set; }
        public PdfDocumentCollection Documents { get; private set; }

        public Status Status { get; private set; }
        public DockCode? Dock { get; private set; }
        public CrewManifest CrewManifest { get; private set; }
        public CargoManifest? LoadingCargoManifest { get; private set; }
        public CargoManifest? UnloadingCargoManifest { get; private set; }
        public ImoNumber VesselImo { get; private set; }

        public IReadOnlyCollection<EntityTask> Tasks { get; private set; }

        protected VesselVisitNotification()
        {
        }

        public VesselVisitNotification(
            VvnCode code,
            ClockTime estimatedTimeArrival,
            ClockTime estimatedTimeDeparture,
            int volume,
            PdfDocumentCollection? documents,
            CrewManifest? crewManifest,
            CargoManifest? loadingCargoManifest,
            CargoManifest? unloadingCargoManifest,
            ImoNumber vesselImo)
        {
            _isConstructing = true;

            if (estimatedTimeArrival == null || estimatedTimeDeparture == null)
                throw new BusinessRuleValidationException("ETA and ETD cannot be null.");

            if (estimatedTimeArrival.Value >= estimatedTimeDeparture.Value)
                throw new BusinessRuleValidationException(
                    "Estimated Time of Arrival must be before Estimated Time of Departure.");

            Id = new VesselVisitNotificationId(Guid.NewGuid());

            SetCode(code);
            SetEstimatedTimeArrival(estimatedTimeArrival);
            SetEstimatedTimeDeparture(estimatedTimeDeparture);
            SetVolume(volume);
            SetDocuments(documents);
            SetCrewManifest(crewManifest);
            SetLoadingCargoManifest(loadingCargoManifest);
            SetUnloadingCargoManifest(unloadingCargoManifest);
            SetVesselImo(vesselImo);

            SetActualTimeArrival(null);
            SetActualTimeDeparture(null);
    
            SubmittedDate = null;
            AcceptenceDate = null;
            Status = new Status(VvnStatus.InProgress, null);
            Tasks = new List<EntityTask>();

            _isConstructing = false;
        }


        public void UpdateEstimatedTimeArrival(ClockTime estimatedTimeArrival) =>
            SetEstimatedTimeArrival(estimatedTimeArrival);

        public void UpdateEstimatedTimeDeparture(ClockTime estimatedTimeDeparture) =>
            SetEstimatedTimeDeparture(estimatedTimeDeparture);

        public void UpdateVolume(int volume) => SetVolume(volume);
        public void UpdateDocuments(PdfDocumentCollection? documents) => SetDocuments(documents);
        public void UpdateDock(DockCode dock) => SetDock(dock);
        public void UpdateCrewManifest(CrewManifest? crewManifest) => SetCrewManifest(crewManifest);
        public void UpdateLoadingCargoManifest(CargoManifest? cargoManifest) => SetLoadingCargoManifest(cargoManifest);

        public void UpdateUnloadingCargoManifest(CargoManifest? cargoManifest) =>
            SetUnloadingCargoManifest(cargoManifest);

        public void UpdateImoNumber(ImoNumber newImo) => SetVesselImo(newImo);
        public void SetTasks(IEnumerable<EntityTask> tasks) => Tasks = tasks?.ToList() ?? new List<EntityTask>();


        private void SetCode(VvnCode code) => Code = code;

        private void SetEstimatedTimeArrival(ClockTime estimatedTimeArrival)
        {
            if (!_isConstructing && !IsEditable)
                throw new BusinessRuleValidationException("Cannot update ETA when VVN is not editable.");

            EstimatedTimeArrival = estimatedTimeArrival;
            ValidateTimeConsistency();
        }

        private void SetEstimatedTimeDeparture(ClockTime estimatedTimeDeparture)
        {
            if (!_isConstructing && !IsEditable)
                throw new BusinessRuleValidationException("Cannot update ETD when VVN is not editable.");

            EstimatedTimeDeparture = estimatedTimeDeparture;
            ValidateTimeConsistency();
        }

        private void SetActualTimeDeparture(ClockTime? actualTimeDeparture)
        {
            if (!_isConstructing && !IsEditable)
                throw new BusinessRuleValidationException("Cannot update ATD when VVN is not editable.");

            ActualTimeDeparture = actualTimeDeparture;
        }

        private void SetActualTimeArrival(ClockTime? actualTimeArrival)
        {
            if (!_isConstructing && !IsEditable)
                throw new BusinessRuleValidationException("Cannot update ATA when VVN is not editable.");

            ActualTimeArrival = actualTimeArrival;
        }

        private void SetVolume(int volume)
        {
            if (!_isConstructing && !IsEditable)
                throw new BusinessRuleValidationException("Cannot update volume when VVN is not editable.");

            if (volume < 0)
                throw new BusinessRuleValidationException("Volume must be non-negative.");

            Volume = volume;
        }

        private void SetDocuments(PdfDocumentCollection? documents)
        {
            if (!_isConstructing && !IsEditable)
                throw new BusinessRuleValidationException("Cannot update documents when VVN is not editable.");

            Documents = documents == null || documents.Pdfs.Count == 0
                ? new PdfDocumentCollection()
                : documents;
        }

        private void SetDock(DockCode dock)
        {
            if (!_isConstructing && !IsEditableWhenAccepting)
                throw new BusinessRuleValidationException("Cannot update dock when VVN is not editable.");

            Dock = dock;
        }

        private void SetCrewManifest(CrewManifest? crewManifest)
        {
            if (!_isConstructing && !IsEditable)
                throw new BusinessRuleValidationException("Cannot update CrewManifest when VVN is not editable.");

            CrewManifest = crewManifest;
        }

        private void SetLoadingCargoManifest(CargoManifest? cargoManifest)
        {
            if (!_isConstructing && !IsEditable)
                throw new BusinessRuleValidationException(
                    "Cannot update Loading CargoManifest when VVN is not editable.");

            LoadingCargoManifest = cargoManifest;
        }

        private void SetUnloadingCargoManifest(CargoManifest? cargoManifest)
        {
            if (!_isConstructing && !IsEditable)
                throw new BusinessRuleValidationException(
                    "Cannot update Unloading CargoManifest when VVN is not editable.");

            UnloadingCargoManifest = cargoManifest;
        }

        private void SetVesselImo(ImoNumber vesselImo)
        {
            if (!_isConstructing && !IsEditable)
                throw new BusinessRuleValidationException("Cannot update Vessel IMO when VVN is not editable.");

            VesselImo = vesselImo;
        }

        private void ValidateTimeConsistency()
        {
            if (EstimatedTimeArrival != null && EstimatedTimeDeparture != null &&
                EstimatedTimeArrival.Value >= EstimatedTimeDeparture.Value)
            {
                throw new BusinessRuleValidationException("ETA must always be before ETD.");
            }
        }

        public void Submit()
        {
            if (!IsEditable)
                throw new BusinessRuleValidationException($"Only In-progress VVNs can be submitted. Current status: {Status}");
            
            SubmittedDate = new ClockTime(DateTime.Now);
            Status = new Status(VvnStatus.Submitted, null);
        }

        public void MarkPending(string message)
        {
            if (Status.StatusValue != VvnStatus.Submitted)
                throw new BusinessRuleValidationException(
                    $"Only Submitted VVNs can be marked Pending. Current status: {Status}");
            SubmittedDate = null;
            Status = new Status(VvnStatus.PendingInformation, message);
        }

        public void Withdraw()
        {
            if (Status.StatusValue != VvnStatus.InProgress && Status.StatusValue != VvnStatus.PendingInformation)
                throw new BusinessRuleValidationException(
                    $"Only In-progress or Pending VVNs can be withdrawn. Current status: {Status}");
            Status = new Status(VvnStatus.Withdrawn, null);
        }

        public void Resume()
        {
            if (Status.StatusValue != VvnStatus.Withdrawn)
                throw new BusinessRuleValidationException(
                    $"Only Withdrawn VVNs can be resumed. Current status: {Status}");
            Status = new Status(VvnStatus.InProgress, null);
        }

        public void Accept()
        {
            if (Status.StatusValue != VvnStatus.Submitted)
                throw new BusinessRuleValidationException(
                    $"Only Submitted VVNs can be accepted. Current status: {Status}");
            Status = new (VvnStatus.Accepted, null);
            AcceptenceDate = new ClockTime(DateTime.Now);
        }

        public bool IsEditable => Status.StatusValue == VvnStatus.InProgress || Status.StatusValue == VvnStatus.PendingInformation;
        public bool IsEditableWhenAccepting => Status.StatusValue == VvnStatus.Submitted;

        // ============================
        // Overrides
        // ============================

        public override bool Equals(object? obj)
        {
            if (obj is not VesselVisitNotification other)
                return false;
            return Code.Equals(other.Code);
        }

        public override int GetHashCode() => Code.GetHashCode();

        public override string ToString() =>
            $"VVN {Code.Code} - Status: {Status} - Vessel IMO: {VesselImo}";
    }
}