using System.Text.Json.Serialization;
using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.ShippingAgentOrganizations;

public class ShippingAgentOrganizationId : EntityId
{
    [JsonConstructor]
    public ShippingAgentOrganizationId(Guid value) : base(value) {}
    
    public ShippingAgentOrganizationId(string value) : base(value){}

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