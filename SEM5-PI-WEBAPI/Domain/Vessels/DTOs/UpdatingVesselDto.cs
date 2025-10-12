namespace SEM5_PI_WEBAPI.Domain.Vessels.DTOs;

public class UpdatingVesselDto
{
    public string? Name {get; set;}
    public string? Owner {get; set;}

    public UpdatingVesselDto(string? name, string? ownerName)
    {
        this.Name = name;
        this.Owner = ownerName;
    }
}