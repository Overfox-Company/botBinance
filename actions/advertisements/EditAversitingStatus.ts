'use server'
import client from "@/utils/binance";

export async function UpdateP2PAdStatus(body: { advNos: string[]; advStatus: number }) {
    try {
        const r = await client.request({
            method: "POST",
            url: "/sapi/v1/c2c/ads/updateStatus",
            data: body,
            signed: true,
        });
        return r.data;
    }
    catch (e: any) {
        console.log("STATUS:", e?.response?.status);
        console.log("DATA:", e?.response?.data);
        console.log("HEADERS:", e?.response?.headers);
        return null;
    }

}