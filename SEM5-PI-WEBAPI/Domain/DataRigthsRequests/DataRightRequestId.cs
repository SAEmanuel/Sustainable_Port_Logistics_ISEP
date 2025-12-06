using SEM5_PI_WEBAPI.Domain.Shared;

namespace SEM5_PI_WEBAPI.Domain.DataRigthsRequests;

public class DataRightRequestId : EntityId
{
    public DataRightRequestId(Guid value) : base(value) {}
    
    public DataRightRequestId(string value) : base(value){}


    protected override object createFromString(string text)
    {
        return new Guid(text);
    }

    public override string AsString()
    {
        Guid obg = (Guid)base.ObjValue;
        return obg.ToString();
    }
    
    public Guid AsGuid(){
        return (Guid) base.ObjValue;
    }
}