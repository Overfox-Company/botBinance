"use server";

import client from "@/utils/binance";

interface GetHistoryP2PParams {
    page?: number;
    rows?: number;
    tradeType?: "BUY" | "SELL";
    startTime?: number;
    endTime?: number;
}

export async function GetHistoryP2P(
    params: GetHistoryP2PParams
) {
    try {
        const now = Date.now();
        const DAYS_30 = 30 * 24 * 60 * 60 * 1000;

        const response = await client.request({
            method: "GET",
            url: "/sapi/v1/c2c/orderMatch/listUserOrderHistory",
            params: {
                asset: "USDT",
                fiat: "VES",
                tradeType: params?.tradeType ?? "BUY", // opcional
                startTime: params?.startTime ?? now - DAYS_30,
                endTime: params?.endTime ?? now,
                page: params?.page ?? 1,
                rows: params?.rows ?? 100,
            },
            signed: true,
        });

        return {
            ok: true,
            data: response.data,
        };
    } catch (error) {
        console.error("Error fetching P2P transactions:", error);
        return {
            ok: false,
            data: null,
        };
    }
}