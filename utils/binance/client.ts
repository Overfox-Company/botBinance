import { TypeClientBinance, TypeRequest } from "@/types/ClientBinance";
import axios, { AxiosInstance } from "axios";
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

    sign(query: string) {
        return crypto
            .createHmac("sha256", this.apiSecret)
            .update(query)
            .digest("hex");
    }

    async request({ method, url, params = {}, data, signed = false }: TypeRequest) {
        const headers = {
            "X-MBX-APIKEY": this.apiKey,
            clientType: "web",
            "Content-Type": "application/json"
        };

        if (signed) {
            const timestamp = Date.now();
            params.timestamp = timestamp;

            const qs = new URLSearchParams(params).toString();
            params.signature = this.sign(qs);
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
