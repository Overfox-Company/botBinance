"use server";

import { cookies } from "next/headers";
import { createClient } from "@/utils/binance"; // factory de tu cliente

export async function ValidateBinanceCredentials(
    apiKey: string,
    secret: string
) {
    const cookieStore = await cookies();
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

        /*
        Guardar en cookies
        */


        cookieStore.set("binance_api_key", apiKey, {
            httpOnly: false,
            path: "/",
        });

        cookieStore.set("binance_secret", secret, {
            httpOnly: false,
            path: "/",
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
        cookieStore.delete("binance_api_key");
        cookieStore.delete("binance_secret");
        return {
            ok: false,
            message:
                error?.response?.data?.msg ??
                "No se pudieron validar las credenciales",
        };
    }
}