"use server";

import { connectDB } from "@/database/utils/MongoDB";
import { resolveUserId } from "./Functions";
import { BotConfigDTO } from "./Types";
import { BotConfig } from "@/database/models/Ads_config";


export async function GetBotConfig(): Promise<
    { ok: true; data: BotConfigDTO } | { ok: false; message: string }
> {
    try {
        await connectDB();
        const userId = await resolveUserId();

        // ✅ Upsert: si no existe, lo crea con valores por defecto
        const doc = await BotConfig.findOneAndUpdate(
            { userId },
            {
                $setOnInsert: {
                    userId,
                    enabled: false,
                    buy: { mode: "above", offset: 0 },
                    sell: { mode: "below", offset: 0 },
                },
            },
            {
                new: true,            // devuelve el doc actualizado/creado
                upsert: true,         // crea si no existe
                setDefaultsOnInsert: true,
                lean: true,           // devuelve objeto plano (mejor para SSR)
            }
        );

        // ✅ Normaliza salida al DTO
        const data: BotConfigDTO = {
            enabled: Boolean(doc.enabled),
            buy: {
                mode: (doc.buy?.mode ?? "above") as any,
                offset: Number(doc.buy?.offset ?? 0),
            },
            sell: {
                mode: (doc.sell?.mode ?? "below") as any,
                offset: Number(doc.sell?.offset ?? 0),
            },
            updatedAt: doc.updatedAt ? new Date(doc.updatedAt).getTime() : Date.now(),
        };

        return { ok: true, data };
    } catch (e: any) {
        console.log("GetBotConfig ERR:", e?.message);
        return { ok: false, message: e?.message ?? "Error al cargar configuración" };
    }
}
