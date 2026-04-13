import { OffsetMode, SideConfig, SidePatch } from "./Types";

export const MIN_LOOP_INTERVAL_SECONDS = 5;
export const DEFAULT_LOOP_INTERVAL_SECONDS = 15;
export const MIN_TOLERANCE_PERCENT = 0;
export const DEFAULT_TOLERANCE_PERCENT = 0.5;

// ✅ Ajusta esto cuando tengas auth (ej. session.user.id)
export async function resolveUserId(): Promise<string> {
    return "default";
}

export function clampOffset(n: number) {
    // evita negativos y cosas raras
    if (!Number.isFinite(n)) return 0;
    if (n < 0) return 0;
    return n;
}

export function normalizeMode(m: any): OffsetMode {
    return m === "below" ? "below" : "above";
}

export function normalizeLoopIntervalSeconds(value: unknown) {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
        return DEFAULT_LOOP_INTERVAL_SECONDS;
    }

    return Math.max(MIN_LOOP_INTERVAL_SECONDS, Math.trunc(parsed));
}

export function normalizeTolerancePercent(value: unknown) {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
        return DEFAULT_TOLERANCE_PERCENT;
    }

    return Math.max(MIN_TOLERANCE_PERCENT, parsed);
}

export function normalizeSide(
    current: { mode: OffsetMode; offset: number },
    patch: SidePatch,
    fallback: { mode: OffsetMode; offset: number }
) {
    return {
        mode: patch?.mode ?? current?.mode ?? fallback.mode,
        offset:
            patch?.offset !== undefined && Number.isFinite(patch.offset)
                ? Math.max(0, patch.offset)
                : current?.offset ?? fallback.offset,
    };
}