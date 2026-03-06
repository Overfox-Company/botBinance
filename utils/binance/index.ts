
import { cookies } from "next/headers";
import { BinanceClient } from "./client";

type BinanceClientOptions = {
    apiKey: string;
    apiSecret: string;
    baseURL?: string;
};

export function createClient({
    apiKey,
    apiSecret,
    baseURL = "https://api.binance.com",
}: BinanceClientOptions) {
    return new BinanceClient({
        apiKey,
        apiSecret,
        baseURL,
    });
}

/*
Cliente dinámico por usuario (lee cookies)
*/
export async function getUserClient() {
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