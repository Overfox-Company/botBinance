"use server";

import client from "@/utils/binance";

type AdvStatus = 1 | 3 | 4;

export type UpdateP2PAdParamsInput = {
    advNo: string;

    // Precio del anuncio
    price?: number | string;

    // Liquidez / cantidad anunciada (monto total)
    initAmount?: number | string;

    // Límites por transacción
    minSingleTransAmount?: number | string;
    maxSingleTransAmount?: number | string;

    // opcional por si lo usas
    //  advStatus?: AdvStatus;
};

function onlyDefined<T extends Record<string, any>>(obj: T) {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
        if (v !== undefined && v !== null) out[k] = v;
    }
    return out;
}

export async function UpdateP2PAdParams(input: UpdateP2PAdParamsInput) {
    try {
        if (!input?.advNo) throw new Error("advNo es obligatorio");

        // Binance suele aceptar strings numéricos; convertimos por seguridad
        const payload = onlyDefined({
            advNo: String(input.advNo),
            price: input.price !== undefined ? String(input.price) : undefined,
            initAmount: input.initAmount !== undefined ? String(input.initAmount) : undefined,
            minSingleTransAmount:
                input.minSingleTransAmount !== undefined ? String(input.minSingleTransAmount) : undefined,
            maxSingleTransAmount:
                input.maxSingleTransAmount !== undefined ? String(input.maxSingleTransAmount) : undefined,
            //  advStatus: input.advStatus,
        });

        const r = await client.request({
            method: "POST",
            url: "/sapi/v1/c2c/ads/update",
            data: payload,     // ✅ body JSON
            signed: true,      // ✅ firma timestamp + signature
        });

        return r.data;
    } catch (e: any) {
        // console.log("STATUS:", e?.response?.status);
        //  console.log("DATA:", e?.response?.data);
        //  console.log("UPDATE ERR:", e?.response?.status, e?.response?.data);
        return null;
    }
}
