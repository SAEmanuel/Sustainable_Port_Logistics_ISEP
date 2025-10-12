using SEM5_PI_WEBAPI.Domain.VesselsTypes;

namespace SEM5_PI_WEBAPI.Domain.Vessels.DTOs;

public class CreatingVesselDto
{
    public string ImoNumber {get; set;}
    public string Name {get; set;}
    public string Owner {get; set;}
    public VesselTypeId VesselTypeId {get;set;}

    public CreatingVesselDto(string imoNumber, string name, string owner, string vesselTypeId)
    {
        this.ImoNumber = imoNumber;
        this.Name = name;
        this.Owner = owner;
        this.VesselTypeId = new VesselTypeId(new Guid(vesselTypeId));
    }
}