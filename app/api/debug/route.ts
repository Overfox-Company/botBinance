export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import client from "@/utils/binance";

export async function GET() {
    try {
        const r = await client.request({
            method: "POST",
            url: "/sapi/v1/c2c/ads/listWithPagination",
            data: { asset: "USDT", fiatUnit: "VES", tradeType: "BUY", page: 1, rows: 100 },
            signed: true,
        });

        return NextResponse.json(r.data);
    } catch (e: any) {
        console.error("DEBUG BINANCE ERR:", e?.response?.status, e?.response?.data, e?.message);
        return NextResponse.json(
            { ok: false, status: e?.response?.status, data: e?.response?.data, msg: e?.message },
            { status: 500 }
        );
    }
}
