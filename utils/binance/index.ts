import { BinanceClient } from "./client";

const client = new BinanceClient({
    apiKey: process.env.BINANCE_API_KEY || "",
    apiSecret: process.env.BINANCE_API_SECRET || "",
    baseURL: "https://api.binance.com",
});


export default client;