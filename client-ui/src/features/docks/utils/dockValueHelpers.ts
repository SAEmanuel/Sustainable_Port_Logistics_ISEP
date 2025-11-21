export type ValueLike = string | { value: string };

export const val = (x: ValueLike | null | undefined): string =>
    typeof x === "string" ? x : x?.value ?? "";

export const vals = (arr?: Array<ValueLike> | null): string[] =>
    (arr ?? []).map(val);
