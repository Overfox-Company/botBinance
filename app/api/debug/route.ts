export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import client from "@/utils/binance";

export async function GET() {
    try {
        const now = Date.now();
        const DAYS_30 = 30 * 24 * 60 * 60 * 1000;

        const r = await client.request({
            method: "GET",
            url: "/sapi/v1/c2c/orderMatch/listUserOrderHistory",
            params: {
                asset: "USDT",
                fiat: "VES",
                // tradeType: "BUY", // opcional
                startTime: now - DAYS_30,
                endTime: now,
                page: 1,
                rows: 100,
            },
            signed: true,
        });

        return NextResponse.json({
            ok: true,
            data: r.data,
        });
    } catch (e: any) {
        console.error(
            "BINANCE P2P HISTORY ERR:",
            e?.response?.status,
            e?.response?.data,
            e?.message
        );

        return NextResponse.json(
            {
                ok: false,
                status: e?.response?.status,
                data: e?.response?.data,
                msg: e?.message,
            },
            { status: 500 }
        );
    }
}
