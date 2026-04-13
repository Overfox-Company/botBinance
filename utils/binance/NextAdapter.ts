// lib/binance/getUserClientNext.ts

import { createClient } from "./CreateClient";
import { readLocalCredentials } from "./CredentialStore";

export async function getUserClientNext() {
    const { apiKey, apiSecret } = readLocalCredentials();

    if (!apiKey || !apiSecret) {
        throw new Error("Binance credentials not configured");
    }

    return createClient({
        apiKey,
        apiSecret,
    });
}