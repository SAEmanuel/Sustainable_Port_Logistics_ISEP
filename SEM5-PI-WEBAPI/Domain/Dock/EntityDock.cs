using System.ComponentModel.DataAnnotations;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.Domain.VesselsTypes;

namespace SEM5_PI_WEBAPI.Domain.Dock;

public enum DockStatus
{
    Available,
    Unavailable,
    Maintenance
}

public class EntityDock : Entity<DockId>, IAggregateRoot
{
    public DockCode Code { get; private set; }
    private readonly HashSet<PhysicalResourceCode> _physicalResourceCodes = new();
    public IReadOnlyCollection<PhysicalResourceCode> PhysicalResourceCodes => _physicalResourceCodes;
    [MaxLength(50)]
    public string Location { get; private set; }
    public double LengthM { get; private set; }
    public double DepthM  { get; private set; }
    public double MaxDraftM { get; private set; }
    public DockStatus Status { get; private set; } = DockStatus.Available;

    private readonly HashSet<VesselTypeId> _allowedVesselTypeIds = new(); 
    public IReadOnlyCollection<VesselTypeId> AllowedVesselTypeIds => _allowedVesselTypeIds;

    protected EntityDock() { }

    public EntityDock(
        DockCode code,
        IEnumerable<PhysicalResourceCode> physicalResourceCodes,
        string location,
        double lengthM,
        double depthM,
        double maxDraftM,
        IEnumerable<VesselTypeId> allowedVesselTypes,
        DockStatus status = DockStatus.Available)
    {
        SetCode(code);
        AddPhysicalResourceCodes(physicalResourceCodes, replace: true);
        SetLocation(location);
        SetLength(lengthM);
        SetDepth(depthM);
        SetMaxDraft(maxDraftM);
        AddAllowedVesselTypes(allowedVesselTypes);
        SetStatus(status);
        Id = new DockId(Guid.NewGuid());
    }

    public void SetCode(DockCode code) =>
        Code = code ?? throw new BusinessRuleValidationException("Dock code cannot be null.");

    public void SetLocation(string location)
    {
        if (string.IsNullOrWhiteSpace(location))
            throw new BusinessRuleValidationException("Location is required.");
        Location = location.Trim();
    }

    public void SetLength(double lengthM)
    {
        if (lengthM <= 0) throw new BusinessRuleValidationException("Length must be > 0.");
        LengthM = Math.Round(lengthM, 2);
    }

    public void SetDepth(double depthM)
    {
        if (depthM <= 0) throw new BusinessRuleValidationException("Depth must be > 0.");
        DepthM = Math.Round(depthM, 2);
    }

    public void SetMaxDraft(double maxDraftM)
    {
        if (maxDraftM <= 0) throw new BusinessRuleValidationException("Max draft must be > 0.");
        MaxDraftM = Math.Round(maxDraftM, 2);
    }

    public void ReplacePhysicalResourceCodes(IEnumerable<PhysicalResourceCode> items)
    {
        AddPhysicalResourceCodes(items, replace: true);
    }

    private void AddPhysicalResourceCodes(IEnumerable<PhysicalResourceCode> items, bool replace = false)
    {
        if (items is null) throw new BusinessRuleValidationException("Physical resource codes are required.");
        if (replace) _physicalResourceCodes.Clear();
        foreach (var prc in items)
        {
            if (prc is null || string.IsNullOrWhiteSpace(prc.Value))
                throw new BusinessRuleValidationException("Invalid Physical Resource Code.");
            if (!_physicalResourceCodes.Any(x => x.Value == prc.Value))
                _physicalResourceCodes.Add(prc);
        }
    }

    public void AllowVesselType(VesselTypeId vesselTypeId)
    {
        if (vesselTypeId.Value.Equals(Guid.Empty))
            throw new BusinessRuleValidationException("VesselTypeId cannot be empty.");
        _allowedVesselTypeIds.Add(vesselTypeId);
    }

    public void DisallowVesselType(VesselTypeId vesselTypeId)
    {
        if (_allowedVesselTypeIds.Count <= 1 && _allowedVesselTypeIds.Contains(vesselTypeId))
            throw new BusinessRuleValidationException("A dock must allow at least one vessel type.");
        _allowedVesselTypeIds.Remove(vesselTypeId);
    }

    public void ReplaceAllowedVesselTypes(IEnumerable<VesselTypeId> vesselTypeIds)
    {
        AddAllowedVesselTypes(vesselTypeIds, replace: true);
    }

    private void AddAllowedVesselTypes(IEnumerable<VesselTypeId> items, bool replace = false)
    {
        if (items is null) throw new BusinessRuleValidationException("Allowed vessel types are required.");
        if (replace) _allowedVesselTypeIds.Clear();
        int added = 0;
        foreach (var vt in items)
        {
            if (vt is null || vt.Value.Equals(Guid.Empty))
                throw new BusinessRuleValidationException("Invalid VesselTypeId.");
            if (_allowedVesselTypeIds.Add(vt)) added++;
        }
        if (_allowedVesselTypeIds.Count == 0 && added == 0)
            throw new BusinessRuleValidationException("A dock must allow at least one vessel type.");
    }
    
    public void EnsureHasAllowedVesselTypes()
    {
        if (_allowedVesselTypeIds.Count == 0)
            throw new BusinessRuleValidationException("At least one allowed vessel type is required for a dock.");
    }
    
    public void SetStatus(DockStatus status)
    {
        Status = status;
    }

    public void MarkUnavailable()
    {
        SetStatus(DockStatus.Unavailable);
    }
}
