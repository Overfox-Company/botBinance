"use server";

import { createClient } from "@/utils/binance"; // factory de tu cliente
import { writeLocalCredentials } from "@/utils/binance/CredentialStore";

export async function ValidateBinanceCredentials(
    apiKey: string,
    secret: string
) {
    try {
        if (!apiKey || !secret) {
            return {
                ok: false,
                message: "API Key y Secret son requeridos",
            };
        }

        // cliente temporal con credenciales del usuario
        const client = createClient({
            apiKey,
            apiSecret: secret,
        });

        const response = await client.request({
            method: "POST",
            url: "/sapi/v1/c2c/user/baseDetail",
            signed: true,
        });

        const user = response?.data?.data;

        if (!user) {
            return {
                ok: false,
                message: "Credenciales inválidas",
            };
        }

        writeLocalCredentials({
            apiKey,
            apiSecret: secret,
        });

        return {
            ok: true,
            user: {
                nickname: user.nickName,
                userNo: user.userNo,
            },
        };
    } catch (error: any) {
        console.error("BINANCE VALIDATION ERROR:", error?.response?.data);
        return {
            ok: false,
            message:
                error?.response?.data?.msg ??
                "No se pudieron validar las credenciales",
        };
    }
}