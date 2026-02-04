// <-- ajusta esta ruta a tu client real

import client from "@/utils/binance";

type AdvStatus = 1 | 3 | 4;

export type UpdateP2PAdParamsInput = {
    advNo: string;

    price?: number | string;
    initAmount?: number | string;

    minSingleTransAmount?: number | string;
    maxSingleTransAmount?: number | string;

    // advStatus?: AdvStatus;
};

function onlyDefined<T extends Record<string, any>>(obj: T) {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
        if (v !== undefined && v !== null) out[k] = v;
    }
    return out;
}

export async function updateP2PAdParams(input: UpdateP2PAdParamsInput) {
    try {
        if (!input?.advNo) throw new Error("advNo es obligatorio");

        const payload = onlyDefined({
            advNo: String(input.advNo),
            price: input.price !== undefined ? String(input.price) : undefined,
            initAmount: input.initAmount !== undefined ? String(input.initAmount) : undefined,
            minSingleTransAmount:
                input.minSingleTransAmount !== undefined ? String(input.minSingleTransAmount) : undefined,
            maxSingleTransAmount:
                input.maxSingleTransAmount !== undefined ? String(input.maxSingleTransAmount) : undefined,
            // advStatus: input.advStatus,
        });

        const r = await client.request({
            method: "POST",
            url: "/sapi/v1/c2c/ads/update",
            data: payload,
            signed: true,
        });

        return r.data;
    } catch (_e: any) {
        return null;
    }
}
