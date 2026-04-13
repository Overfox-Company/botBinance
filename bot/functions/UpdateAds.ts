import { BotConfig } from "@/database/models/Ads_config.ts";
import { getP2PMarket } from "./GetPriceMarket.ts";
import { getUserClientNode } from "@/utils/binance/NodeAdapter.ts";

// IMPORTA tu script de mercado (ajusta la ruta a donde lo guardaste)

const bodyBuy = {
    asset: "USDT",
    fiatUnit: "VES",
    tradeType: "BUY",
    page: 1,
    rows: 100,
};

const bodySell = {
    asset: "USDT",
    fiatUnit: "VES",
    tradeType: "SELL",
    page: 1,
    rows: 100,
};

// Si necesitas forzar 2 decimales
function round2(n: number) {
    return Math.round(n * 100) / 100;
}

function computeStepPrice(
    previous: number,
    mode: "above" | "below",
    tolerancePct: number
) {
    const ratio = Math.max(0, tolerancePct) / 100;
    if (ratio === 0) return round2(previous);

    const raw =
        mode === "above"
            ? previous * (1 + ratio)
            : previous * (1 - ratio);

    return round2(Math.max(0.01, raw));
}

function nudgeUniquePrice(current: number, mode: "above" | "below") {
    if (mode === "above") {
        return round2(current + 0.01);
    }

    return round2(Math.max(0.01, current - 0.01));
}

function computeBasePrice(avg: number, mode: "above" | "below", offset: number) {
    const base = mode === "above" ? avg + offset : avg - offset;
    return round2(base);
}

/**
 * Extrae advNo y price desde la estructura que devuelva Binance.
 * (Como Binance a veces cambia el shape, lo hacemos tolerante.)
 */
function getAdvNo(item: any): string | null {
    return (
        item?.advNo ??
        item?.adv?.advNo ??
        item?.advertisementNo ??
        item?.adv?.advertisementNo ??
        null
    );
}

function getCurrentPrice(item: any): number | null {
    const raw =
        item?.price ??
        item?.adv?.price ??
        item?.advPrice ??
        item?.adv?.advPrice ??
        null;

    if (raw === null || raw === undefined) return null;
    const n = Number(String(raw).replace(",", "."));
    return Number.isFinite(n) ? n : null;
}

async function updateAdPrice(advNo: string, price: number) {
    // Binance suele aceptar string numérico
    const payload = {
        advNo: String(advNo),
        price: String(round2(price)),
    };
    const client = await getUserClientNode();
    const r = await client.request({
        method: "POST",
        url: "/sapi/v1/c2c/ads/update",
        data: payload,
        signed: true,
    });

    return r?.data ?? null;
}

type Side = "buy" | "sell";

type UpdateAdsOptions = {
    syncLoopIntervalSeconds?: (loopIntervalSeconds: number) => void;
};

async function adjustSideAds(params: {
    side: Side;
    ads: any[];
    avgPrice: number;
    mode: "above" | "below";
    offset: number;
    tolerancePct: number;
}) {
    const { side, ads, avgPrice, mode, offset, tolerancePct } = params;

    const base = computeBasePrice(avgPrice, mode, offset);

    // ✅ “lista del último valor ajustado”
    // (en este run) para controlar que no se repitan precios
    const adjustedPrices: number[] = [];

    // Set para evitar duplicados por redondeo / colisiones
    const used = new Set<string>();

    console.log(
        `[${side.toUpperCase()}] avg=${avgPrice} mode=${mode} offset=${offset} tolerancePct=${tolerancePct} => base=${base}`
    );

    let i = 0;
    let previousTarget = base;

    // Lo hago secuencial para evitar rate limit y para que el step sea determinista
    for (const item of ads) {
        const advNo = getAdvNo(item);
        if (!advNo) continue;

        // Aplica tolerancia porcentual en cascada tomando como referencia el anuncio anterior.
        let target = i === 0 ? base : computeStepPrice(previousTarget, mode, tolerancePct);

        // Si colisiona por redondeo, ajusta 0.01 en dirección del modo.
        while (used.has(target.toFixed(2))) {
            target = nudgeUniquePrice(target, mode);
        }

        used.add(target.toFixed(2));
        adjustedPrices.push(target);
        previousTarget = target;

        const current = getCurrentPrice(item);

        // Si ya está igual (2 decimales), puedes saltarlo
        if (current !== null && round2(current) === round2(target)) {
            // Igual lo contamos como ajustado para mantener el patrón de tolerancia
            console.log(`[${side}] advNo=${advNo} ya estaba en ${target}`);
            i++;
            continue;
        }

        try {
            await updateAdPrice(advNo, target);
            console.log(`[${side}] advNo=${advNo} ${current ?? "N/A"} -> ${target}`);
        } catch (e: any) {
            console.log(
                `[${side}] ERROR advNo=${advNo} target=${target} status=${e?.response?.status ?? e?.status
                } data=${JSON.stringify(e?.response?.data ?? e?.data ?? null)}`
            );
        }

        i++;
    }

    return {
        base,
        adjustedPrices, // ✅ lista de precios usados este run
    };
}

const UpdateAds = async (options?: UpdateAdsOptions) => {
    const config = await BotConfig.findOne({});
    if (!config) {
        console.log("No se encontró la configuración del bot.");
        return;
    }

    options?.syncLoopIntervalSeconds?.(Number(config.loopIntervalSeconds ?? 15));

    if (!config.enabled) {
        console.log("Bot deshabilitado. No se actualizan anuncios.");
        return;
    }

    console.log("Actualizando anuncios...");

    // 1) Traer mercado de referencia
    const market = await getP2PMarket();
    if (!market?.ok) {
        console.log("No se pudo obtener referencia del mercado P2P.");
        return;
    }

    // Referencias:
    // - Para anuncios BUY (comprar USDT): usa market.buy.avg
    // - Para anuncios SELL (vender USDT): usa market.sell.avg
    const avgBuy = market.buy?.avg;
    const avgSell = market.sell?.avg;

    if (avgBuy === null || avgBuy === undefined || avgSell === null || avgSell === undefined) {
        console.log("Referencia del mercado inválida (avg null).");
        return;
    } const client = await getUserClientNode();

    // 2) Traer anuncios del usuario (BUY y SELL)
    const [adsBuyRes, adsSellRes] = await Promise.all([
        client.request({
            method: "POST",
            url: "/sapi/v1/c2c/ads/listWithPagination",
            data: bodyBuy,
            signed: true,
        }),
        client.request({
            method: "POST",
            url: "/sapi/v1/c2c/ads/listWithPagination",
            data: bodySell,
            signed: true,
        }),
    ]);

    const buyAds = adsBuyRes?.data?.data ?? [];
    const sellAds = adsSellRes?.data?.data ?? [];

    // 3) Ajustar cada lado con su configuración
    const buyCfg = config.buy;   // { mode, offset }
    const sellCfg = config.sell; // { mode, offset }

    const buyResult = await adjustSideAds({
        side: "buy",
        ads: buyAds,
        avgPrice: Number(avgBuy),
        mode: buyCfg.mode,
        offset: Number(buyCfg.offset ?? 0),
        tolerancePct: Number(config.buyTolerancePct ?? 0.5),
    });

    const sellResult = await adjustSideAds({
        side: "sell",
        ads: sellAds,
        avgPrice: Number(avgSell),
        mode: sellCfg.mode,
        offset: Number(sellCfg.offset ?? 0),
        tolerancePct: Number(config.sellTolerancePct ?? 0.5),
    });

    console.log("✅ Ajuste completado.");
    console.log("BUY adjusted prices:", buyResult.adjustedPrices);
    console.log("SELL adjusted prices:", sellResult.adjustedPrices);

    return {
        ok: true,
        market: { avgBuy, avgSell },
        buy: buyResult,
        sell: sellResult,
    };
};

export default UpdateAds;
