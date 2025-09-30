namespace SEM5_PI_WEBAPI.Domain.BusinessShared;

[Flags]
public enum WeekDays
{
    None = 0,
    Monday = 1 << 0,
    Tuesday = 1 << 1,
    Wednesday = 1 << 2,
    Thursday = 1 << 3,
    Friday = 1 << 4,
    Saturday = 1 << 5,
    Sunday = 1 << 6,
    AllWeek = Monday | Tuesday | Wednesday | Thursday | Friday | Saturday | Sunday
}