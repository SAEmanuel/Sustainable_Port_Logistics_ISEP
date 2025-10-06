using System.ComponentModel;
using SEM5_PI_WEBAPI.Domain.Shared;
using SEM5_PI_WEBAPI.Domain.ValueObjects;

namespace SEM5_PI_WEBAPI.Domain.Containers;

public class ContainerFactory
{
    public static ContainerDto CreateContainerDto(EntityContainer container)
    {
        return new ContainerDto(container.Id.AsGuid(),container.ISOId,
            container.Description,container.Type,container.Status,
            container.WeightKg);
    }

    public static EntityContainer CreateEntityContainer(CreatingContainerDto dto)
    {
        var newContainer = new EntityContainer(dto.IsoCode, dto.Description, dto.Type, dto.WeightKg);
        
        return newContainer;
    }

}