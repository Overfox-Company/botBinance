// lib/binance/getUserClientNext.ts

import { cookies } from "next/headers";
import { createClient } from "./CreateClient";

export async function getUserClientNext() {
    const cookieStore = await cookies();

    const apiKey = cookieStore.get("binance_api_key")?.value;
    const apiSecret = cookieStore.get("binance_secret")?.value;

    if (!apiKey || !apiSecret) {
        throw new Error("Binance credentials not configured");
    }

    return createClient({
        apiKey,
        apiSecret,
    });
}