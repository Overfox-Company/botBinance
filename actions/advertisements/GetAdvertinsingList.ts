"use server";

import client from "@/utils/binance";
const body = {
    "asset": "USDT",
    "fiatUnit": "VES",
    "tradeType": "BUY",
    "page": 1,
    "rows": 100
}

export async function GetAdversitingList(req?: Request) {
    try {

        const r = await client.request({
            method: "POST",
            url: "/sapi/v1/c2c/ads/listWithPagination",
            data: body,
            signed: true,
        });
        return r.data;
    } catch (e) {
        console.log(e);
        return null;
    }
};

