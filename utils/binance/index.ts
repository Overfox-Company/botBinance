import { BinanceClient } from "./client";
import { readLocalCredentials } from "./CredentialStore";

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

export async function getUserClient() {
    const { apiKey, apiSecret } = readLocalCredentials();

    if (!apiKey || !apiSecret) {
        throw new Error("Binance credentials not configured");
    }

    return createClient({
        apiKey,
        apiSecret,
    });
}