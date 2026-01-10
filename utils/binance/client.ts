import { TypeClientBinance, TypeRequest } from "@/types/ClientBinance";
import axios, { AxiosInstance, AxiosRequestHeaders } from "axios";
import crypto from "crypto";


export class BinanceClient {
    private apiKey: string;
    private apiSecret: string;
    protected http: AxiosInstance;

    constructor({ apiKey, apiSecret, baseURL }: TypeClientBinance) {
        this.apiKey = apiKey.trim();
        this.apiSecret = apiSecret.trim();
        this.http = axios.create({ baseURL });
    }

    private sign(query: string) {
        return crypto.createHmac("sha256", this.apiSecret).update(query).digest("hex");
    }

    async request({ method, url, params = {}, data, signed = true }: TypeRequest) {
        // ✅ headers base (sin API KEY por defecto)
        const headers: any = {
            clientType: "web",
            "Content-Type": "application/json",
        };

        // ✅ Solo endpoints privados/firmados deben llevar API KEY
        if (signed) {
            headers["X-MBX-APIKEY"] = this.apiKey;

            const timestamp = Date.now();
            params = { ...params, timestamp };

            // URLSearchParams necesita strings
            const qs = new URLSearchParams(
                Object.entries(params).reduce<Record<string, string>>((acc, [k, v]) => {
                    acc[k] = String(v);
                    return acc;
                }, {})
            ).toString();

            const signature = this.sign(qs);
            params = { ...params, signature };
        }
        return this.http.request({
            method,
            url,
            params,
            data,
            headers,
        });
    }
}
