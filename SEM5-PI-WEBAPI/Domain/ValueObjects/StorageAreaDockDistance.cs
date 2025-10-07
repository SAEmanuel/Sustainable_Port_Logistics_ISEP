using Microsoft.EntityFrameworkCore;
using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.ValueObjects;

[Owned]
public class StorageAreaDockDistance : IValueObject
{
    public DockCode Dock { get; private set; }
    public float Distance { get; private set; }

    private StorageAreaDockDistance() { }
    public StorageAreaDockDistance(DockCode dock, float distanceKm)
    {
        if (dock == null)
            throw new BusinessRuleValidationException("Dock cannot be null");

        if (distanceKm < 0)
            throw new BusinessRuleValidationException("Distance cannot be negative.");

        Dock = dock;
        Distance = distanceKm;
    }
}