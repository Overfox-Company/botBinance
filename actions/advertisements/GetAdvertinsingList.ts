"use server";

import client from "@/utils/binance";
const bodyBuy = {
    "asset": "USDT",
    "fiatUnit": "VES",
    "tradeType": "BUY",
    "page": 1,
    "rows": 100
}

const bodySell = {
    "asset": "USDT",
    "fiatUnit": "VES",
    "tradeType": "SELL",
    "page": 1,
    "rows": 100
}
export async function GetAdversitingList(req?: Request) {
    try {

        const rBuy = await client.request({
            method: "POST",
            url: "/sapi/v1/c2c/ads/listWithPagination",
            data: bodyBuy,
            signed: true,
        });
const rSell = await client.request({
            method: "POST",
            url: "/sapi/v1/c2c/ads/listWithPagination",
            data: bodySell,
            signed: true,
        });

        const r = {
            buy: rBuy.data,
            sell: rSell.data,
        };
        return r;
    } catch (e) {
        //  console.log(e);
        return null;
    }
};

