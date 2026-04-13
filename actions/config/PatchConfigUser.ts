'use server'
import { connectDB } from "@/database/utils/MongoDB";
import {
    DEFAULT_LOOP_INTERVAL_SECONDS,
    DEFAULT_TOLERANCE_PERCENT,
    normalizeLoopIntervalSeconds,
    normalizeSide,
    normalizeTolerancePercent,
    resolveUserId,
} from "./Functions";
import { BotConfigDTO, BotConfigPatch } from "./Types";
import { BotConfig } from "@/database/models/Ads_config";

export async function PatchBotConfig(
    patch: BotConfigPatch
): Promise<{ ok: true; data: BotConfigDTO } | { ok: false; message: string }> {
    try {
        await connectDB();
        const userId = await resolveUserId();

        // 🔹 Asegura que exista la config
        const current = await BotConfig.findOneAndUpdate(
            { userId },
            {
                $setOnInsert: {
                    userId,
                    enabled: false,
                    buy: { mode: "above", offset: 0 },
                    sell: { mode: "below", offset: 0 },
                    loopIntervalSeconds: DEFAULT_LOOP_INTERVAL_SECONDS,
                    buyTolerancePct: DEFAULT_TOLERANCE_PERCENT,
                    sellTolerancePct: DEFAULT_TOLERANCE_PERCENT,
                },
            },
            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true,
                lean: true,
            }
        );

        const nextEnabled =
            patch.enabled !== undefined ? Boolean(patch.enabled) : current.enabled;

        const nextBuy = normalizeSide(
            current.buy,
            patch.buy ?? {},
            { mode: "above", offset: 0 }
        );

        const nextSell = normalizeSide(
            current.sell,
            patch.sell ?? {},
            { mode: "below", offset: 0 }
        );

        const nextLoopIntervalSeconds =
            patch.loopIntervalSeconds !== undefined
                ? normalizeLoopIntervalSeconds(patch.loopIntervalSeconds)
                : normalizeLoopIntervalSeconds(current.loopIntervalSeconds);

        const nextBuyTolerancePct =
            patch.buyTolerancePct !== undefined
                ? normalizeTolerancePercent(patch.buyTolerancePct)
                : normalizeTolerancePercent(current.buyTolerancePct);

        const nextSellTolerancePct =
            patch.sellTolerancePct !== undefined
                ? normalizeTolerancePercent(patch.sellTolerancePct)
                : normalizeTolerancePercent(current.sellTolerancePct);

        const updated = await BotConfig.findOneAndUpdate(
            { userId },
            {
                enabled: nextEnabled,
                buy: nextBuy,
                sell: nextSell,
                loopIntervalSeconds: nextLoopIntervalSeconds,
                buyTolerancePct: nextBuyTolerancePct,
                sellTolerancePct: nextSellTolerancePct,
            },
            { new: true, lean: true }
        );

        const data: BotConfigDTO = {
            enabled: Boolean(updated.enabled),
            buy: {
                mode: updated.buy.mode,
                offset: Number(updated.buy.offset),
            },
            sell: {
                mode: updated.sell.mode,
                offset: Number(updated.sell.offset),
            },
            loopIntervalSeconds: normalizeLoopIntervalSeconds(updated.loopIntervalSeconds),
            buyTolerancePct: normalizeTolerancePercent(updated.buyTolerancePct),
            sellTolerancePct: normalizeTolerancePercent(updated.sellTolerancePct),
            updatedAt: updated.updatedAt
                ? new Date(updated.updatedAt).getTime()
                : Date.now(),
        };

        return { ok: true, data };
    } catch (e: any) {
        console.log("PatchBotConfig ERR:", e?.message);
        return { ok: false, message: e?.message ?? "Error actualizando configuración" };
    }
}