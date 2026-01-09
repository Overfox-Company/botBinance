export type TypeClientBinance = {
    apiKey: string;
    apiSecret: string;
    baseURL: string;
};
export type TypeRequest = {
    method: "GET" | "POST" | "DELETE" | "PUT";
    url: string;
    params?: Record<string, any>;
    data?: Record<string, any>;
    signed?: boolean;
}