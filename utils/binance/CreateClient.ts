// lib/binance/createClient.ts

import { BinanceClient } from "./client";

export type BinanceClientOptions = {
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