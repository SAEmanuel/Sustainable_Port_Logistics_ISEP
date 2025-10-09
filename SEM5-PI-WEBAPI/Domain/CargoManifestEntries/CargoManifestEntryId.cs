using System.Text.Json.Serialization;
using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.CargoManifestEntries;

public class CargoManifestEntryId : EntityId
{
    [JsonConstructor]
    public CargoManifestEntryId(Guid value) : base(value)
    {
    }

    public CargoManifestEntryId(string value) : base(value)
    {
    }

    protected override object createFromString(string text)
    {
        return new Guid(text);
    }

    public override string AsString()
    {
        Guid obj = (Guid)ObjValue;
        return obj.ToString();
    }

    public Guid AsGuid()
    {
        return (Guid)ObjValue;
    }
}