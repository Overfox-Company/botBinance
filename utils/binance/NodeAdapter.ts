// lib/binance/getUserClientNode.ts

import { createClient } from "./CreateClient";
import { readLocalCredentials } from "./CredentialStore";

export function getUserClientNode(port: number = 4000) {
    const { apiKey, apiSecret } = readLocalCredentials(port);

    console.log(`[BOT ${port}] Loaded credentials`);

    return createClient({
        apiKey,
        apiSecret,
    });
}