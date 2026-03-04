export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import client from "@/utils/binance";

export async function GET() {
    try {
        const now = Date.now();
        const DAYS_30 = 30 * 24 * 60 * 60 * 1000;

        const r = await client.request({
            method: "POST",
            url: "/sapi/v1/c2c/orderMatch/getUserOrderDetail",
            params: {
                adOrderNo: "22860114003455488000"

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
