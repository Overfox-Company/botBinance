import client from "@/utils/binance";

export async function GetAdvertisementById(advNo: string, req?: Request) {
    try {
        console.log("Fetching advertisement with ID:", advNo);
        const r = await client.request({
            method: "POST",
            url: "/sapi/v1/c2c/ads/getDetailByNo",
            // Binance lo pide como query param: adsNo
            // url: `/sapi/v1/c2c/ads/getDetailByNo?adsNo=${encodeURIComponent(advNo)}`,
            params: { adsNo: advNo },
            signed: true, // ✅ importante: este endpoint es público
        });

        // r.data suele ser { code, message, data }
        console.log("Advertisement data received:", r.data);
        return r.data;
    } catch (e) {
        console.log(e);
        return null;
    }
}