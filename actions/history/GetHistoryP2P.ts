"use server";

import { getUserClient } from "@/utils/binance";



interface GetHistoryP2PParams {
    page?: number;
    rows?: number;
    tradeType?: "BUY" | "SELL";
    startTime?: number;
    endTime?: number;
}

interface P2POrder {
    adOrderNo: string;
    orderNumber: string;
    tradeType: "BUY" | "SELL";
    asset: string;
    fiat: string;
    price: string;
    amount: string;
    totalPrice: string;
    status: string;
    createTime: number;

    counterparty?: {
        userNo?: string;
        nickName?: string;
    };

    raw?: any;
}

export async function GetHistoryP2P(params: GetHistoryP2PParams) {
    try {
        const now = Date.now();
        const DAYS_30 = 30 * 24 * 60 * 60 * 1000;
        const client = await getUserClient();
        const response = await client.request({
            method: "GET",
            url: "/sapi/v1/c2c/orderMatch/listUserOrderHistory",
            params: {
                asset: "USDT",
                fiat: "VES",
                tradeType: params?.tradeType ?? "BUY",
                startTime: now - DAYS_30,
                endTime: now,
                page: params?.page ?? 1,
                rows: params?.rows ?? 100,
            },
            signed: true,
        });

        const orders = response?.data?.data ?? [];

        if (!orders.length) {
            return {
                ok: true,
                data: [],
            };
        }

        /*
         Obtener detalles de cada orden
        */
        const detailResponses = await Promise.all(
            orders.map(async (order: any) => {
                const lookupKey = String(order.orderNumber ?? order.adOrderNo ?? "");

                //     console.log("Fetching detail for order:", order);
                try {
                    const detail = await client.request({
                        method: "POST",
                        url: "/sapi/v1/c2c/orderMatch/getUserOrderDetail",
                        data: {
                            adOrderNo: lookupKey,
                        },
                        signed: true,
                    });

                    return {
                        lookupKey,
                        detail: detail.data ?? null,
                    };
                } catch (err) {
                    console.error("detail error", err);
                    return {
                        lookupKey,
                        detail: null,
                    };
                }
            })
        );

        /*
         Crear mapa para lookup rápido
        */
        const detailMap = new Map(
            detailResponses.map((detailResponse) => [detailResponse.lookupKey, detailResponse.detail])
        );

        /*
         Normalizar estructura final
        */
        const normalized: any[] = orders.map((order: any) => {
            const lookupKey = String(order.orderNumber ?? order.adOrderNo ?? "");
            const detail = detailMap.get(lookupKey);
            const detailData = detail?.data ?? {};

            return {
                ...order,

                counterparty: {
                    name:
                        order.tradeType === "BUY"
                            ? detailData.sellerName ?? null
                            : detailData.buyerName ?? null,
                    nickName:
                        order.tradeType === "BUY"
                            ? detailData.sellerNickname ?? null
                            : detailData.buyerNickname ?? null,
                },

                raw: detail,
            };
        });

        return {
            ok: true,
            page: params?.page ?? 1,
            rows: params?.rows ?? 100,
            total: response?.data?.total ?? normalized.length,
            data: normalized,
        };
    } catch (error) {
        console.error("Error fetching P2P transactions:", error);

        return {
            ok: false,
            data: null,
        };
    }
}