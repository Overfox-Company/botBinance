// app/api/binance/credentials/route.ts

import { cookies } from "next/headers";

export async function GET() {
    const cookieStore = await cookies();

    const apiKey = cookieStore.get("binance_api_key")?.value;
    const apiSecret = cookieStore.get("binance_secret")?.value;

    if (!apiKey || !apiSecret) {
        return Response.json(
            { ok: false, message: "Missing credentials" },
            { status: 401 }
        );
    }

    return Response.json({
        ok: true,
        apiKey,
        apiSecret,
    });
}