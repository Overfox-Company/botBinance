// lib/binance/getUserClientNode.ts

import { createClient } from "./CreateClient";

type CookieMap = Record<string, string>;

function parseCookies(cookieHeader?: string): CookieMap {
    if (!cookieHeader) return {};

    return Object.fromEntries(
        cookieHeader.split(";").map((c) => {
            const [key, ...v] = c.trim().split("=");
            return [key, decodeURIComponent(v.join("="))];
        })
    );
}

export function getUserClientNode(cookieHeader?: string) {
    const cookies = parseCookies(cookieHeader);

    const apiKey = cookies["binance_api_key"];
    const apiSecret = cookies["binance_secret"];
    console.log("Parsed cookies:", cookies);
    if (!apiKey || !apiSecret) {
        //      throw new Error("Binance credentials not configured");
    }

    return createClient({
        apiKey,
        apiSecret,
    });
}