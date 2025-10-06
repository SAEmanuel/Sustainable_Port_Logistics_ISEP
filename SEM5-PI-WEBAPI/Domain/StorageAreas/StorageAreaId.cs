using System.Text.Json.Serialization;
using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.StorageAreas;

public class StorageAreaId : EntityId
{

    [JsonConstructor]
    public StorageAreaId(Guid value) : base(value)
    {
    }

    public StorageAreaId(String value) : base(value)
    {
    }
            
    override
        protected  Object createFromString(String text){
        return new Guid(text);
    }
            
    override
        public String AsString(){
        Guid obj = (Guid) base.ObjValue;
        return obj.ToString();
    }
    public Guid AsGuid(){
        return (Guid) base.ObjValue;
    }
}