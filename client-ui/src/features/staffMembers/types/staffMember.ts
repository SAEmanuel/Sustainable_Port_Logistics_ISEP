// ========================================
// SHIFT TYPES
// ========================================

export const ShiftType = {
    Morning: "Morning",
    Afternoon: "Afternoon",
    Night: "Night"
} as const;

export type ShiftType = typeof ShiftType[keyof typeof ShiftType];

// ========================================
// WEEK DAYS (bitmask)
// ========================================

export const WeekDay = {
    None: 0,
    Monday: 1,      // 0000001
    Tuesday: 2,     // 0000010
    Wednesday: 4,   // 0000100
    Thursday: 8,    // 0001000
    Friday: 16,     // 0010000
    Saturday: 32,   // 0100000
    Sunday: 64      // 1000000
} as const;

export type WeekDay = typeof WeekDay[keyof typeof WeekDay];

// ========================================
// SCHEDULE
// ========================================

export interface Schedule {
    shift: ShiftType;
    daysOfWeek: string;
}

// ========================================
// STAFF MEMBER (Response do Backend)
// ========================================

export interface StaffMember {
    id: string;
    shortName: string;
    mecanographicNumber: string;
    email: string;
    phone: string;
    schedule: Schedule;
    isActive: boolean;
    qualificationCodes: string[];
}

// ========================================
// CREATE STAFF MEMBER (Request)
// ========================================

export interface CreateStaffMember {
    shortName: string;
    email: string;
    phone: string;
    schedule: Schedule;
    isActive: boolean;
    qualificationCodes?: string[];
}

// ========================================
// UPDATE STAFF MEMBER (Request)
// ========================================

export interface UpdateStaffMember {
    mecNumber: string;
    shortName?: string;
    email?: string;
    phone?: string;
    schedule?: Schedule;
    isActive?: boolean;
    qualificationCodes?: string[];
    addQualifications?: boolean;
}

// ========================================
// HELPERS
// ========================================

export function weekDaysToBinary(days: number[]): string {
    const value = days.reduce((acc, day) => acc | day, 0);
    return value.toString(2).padStart(7, '0');
}


export function binaryToWeekDays(binary: string): number[] {
    const value = parseInt(binary, 2);
    const days: number[] = [];

    if (value & WeekDay.Monday) days.push(WeekDay.Monday);
    if (value & WeekDay.Tuesday) days.push(WeekDay.Tuesday);
    if (value & WeekDay.Wednesday) days.push(WeekDay.Wednesday);
    if (value & WeekDay.Thursday) days.push(WeekDay.Thursday);
    if (value & WeekDay.Friday) days.push(WeekDay.Friday);
    if (value & WeekDay.Saturday) days.push(WeekDay.Saturday);
    if (value & WeekDay.Sunday) days.push(WeekDay.Sunday);

    return days;
}


export function weekDayToString(day: number): string {
    switch (day) {
        case WeekDay.Monday: return "Monday";
        case WeekDay.Tuesday: return "Tuesday";
        case WeekDay.Wednesday: return "Wednesday";
        case WeekDay.Thursday: return "Thursday";
        case WeekDay.Friday: return "Friday";
        case WeekDay.Saturday: return "Saturday";
        case WeekDay.Sunday: return "Sunday";
        default: return "None";
    }
}


export function getWeekDayNames(binary: string): string[] {
    const days = binaryToWeekDays(binary);
    return days.map(weekDayToString);
}


export function createSchedule(shift: ShiftType, days: number[]): Schedule {
    return {
        shift,
        daysOfWeek: weekDaysToBinary(days)
    };
}


export const SHIFT_OPTIONS: ShiftType[] = [
    ShiftType.Morning,
    ShiftType.Afternoon,
    ShiftType.Night
];


export const WEEKDAY_OPTIONS = [
    { value: WeekDay.Monday, label: "Monday" },
    { value: WeekDay.Tuesday, label: "Tuesday" },
    { value: WeekDay.Wednesday, label: "Wednesday" },
    { value: WeekDay.Thursday, label: "Thursday" },
    { value: WeekDay.Friday, label: "Friday" },
    { value: WeekDay.Saturday, label: "Saturday" },
    { value: WeekDay.Sunday, label: "Sunday" }
];