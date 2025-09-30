namespace SEM5_PI_WEBAPI.Domain.BusinessShared;

public class Schedule
{
    public ShiftType Shift { get; set; }
    public WeekDays Days { get; set; }

    public Schedule(ShiftType shift, WeekDays days)
    {
        Shift = shift;
        Days = days;
    }
}