using SEM5_PI_WEBAPI.Domain.ValueObjects;
using SEM5_PI_WEBAPI.Domain.VesselsTypes;

namespace SEM5_PI_WEBAPI.Domain.Vessels.DTOs;

public class VesselDto
{
    public Guid Id { get; set; }
    public ImoNumber ImoNumber {get; private set;}
    public string Name {get; private set;}
    public string Owner {get; private set;}
    public VesselTypeId VesselTypeId {get; private set;}

    public VesselDto(Guid id,ImoNumber imoNumber, string name,string owner, VesselTypeId vesselTypeId)
    {
        this.Id = id;
        this.ImoNumber = imoNumber;
        this.Name = name;
        this.Owner = owner;
        this.VesselTypeId = vesselTypeId;
    }
}