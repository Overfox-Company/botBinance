// lib/binance/getUserClientNode.ts

import fs from "fs";
import path from "path";
import { createClient } from "./CreateClient";

export function getUserClientNode(port: number = 4000) {

    const filePath = path.join(
        process.cwd(),
        `binance.credentials.${port}.json`
    );

    if (!fs.existsSync(filePath)) {
        throw new Error(
            `Binance credentials not found for instance ${port}`
        );
    }

    const { apiKey, apiSecret } = JSON.parse(
        fs.readFileSync(filePath, "utf8")
    );

    console.log(`[BOT ${port}] Loaded credentials`);

    return createClient({
        apiKey,
        apiSecret,
    });
}