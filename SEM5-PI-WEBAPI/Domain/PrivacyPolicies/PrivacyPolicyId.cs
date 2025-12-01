using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.PrivacyPolicies;

public class PrivacyPolicyId : EntityId
{
   
    public PrivacyPolicyId(Guid value) : base(value)
    {
    }
    
    public PrivacyPolicyId(string value) : base(value)
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