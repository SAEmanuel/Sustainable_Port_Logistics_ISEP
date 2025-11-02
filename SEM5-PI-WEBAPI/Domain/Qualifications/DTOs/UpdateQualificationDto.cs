namespace SEM5_PI_WEBAPI.Domain.Qualifications.DTOs;

public class UpdateQualificationDto
{
    public string? Name { get; set; }
    public string? Code { get; set; }

    public UpdateQualificationDto() { }

    public UpdateQualificationDto(string? name, string? code)
    {
        Name = name;
        Code = code;
    }
}
