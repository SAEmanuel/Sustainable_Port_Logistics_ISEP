export function unwrap(v: any): any {
    if (v == null) return v;
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return v;
    if (typeof v === "object" && "value" in v) return (v as any).value;
    return v;
}
export function num(x: any, fallback: number): number {
    const n = Number(unwrap(x));
    return Number.isFinite(n) ? n : fallback;
}
export function pos(x: any, fallback: number): number {
    const n = Number(unwrap(x));
    return Number.isFinite(n) ? n : fallback;
}
export function str(x: any, fallback = ""): string {
    const s = unwrap(x);
    return s == null ? fallback : String(s);
}
export function finite(x: any, fallback: number): number {
    const n = Number(x);
    return Number.isFinite(n) ? n : fallback;
}
export function safeSize(x: any, min: number, fallback: number): number {
    return Math.max(min, finite(x, fallback));
}

export const TEU_LENGTH = 6.06;
export const TEU_WIDTH  = 2.44;
export const TEU_HEIGHT = 2.59;
