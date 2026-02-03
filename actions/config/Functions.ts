import { OffsetMode, SideConfig, SidePatch } from "./Types";

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