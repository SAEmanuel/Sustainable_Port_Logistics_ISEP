export type Category =
    | "Safety and Security"
    | "Maintenance"
    | "Cleaning and Housekeeping";

export interface ComplementaryTaskCategory {
    id: string;
    code: string;
    name: string;
    description: string;
    category: Category;
    defaultDuration: number | null;
    isActive: boolean;
}