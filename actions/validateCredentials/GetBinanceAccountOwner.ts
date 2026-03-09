"use server";

import { getUserClient } from "@/utils/binance";

export type BinanceAccountOwner = {
    name: string;
    nickname: string;
};

export async function GetBinanceAccountOwner(): Promise<{
    ok: boolean;
    data: BinanceAccountOwner | null;
}> {
    try {
        const client = await getUserClient();
        const response = await client.request({
            method: "POST",
            url: "/sapi/v1/c2c/user/baseDetail",
            signed: true,
        });
        console.log("Binance account owner response:", response.data);
        const user = response?.data?.data ?? {};

        return {
            ok: true,
            data: {
                name: String(
                    user.kycFullName ?? user.name ?? user.userName ?? user.nickName ?? ""
                ).trim(),
                nickname: String(user.nickName).trim(),
            },
        };
    } catch (error) {
        console.error("Error fetching Binance account owner:", error);

        return {
            ok: false,
            data: null,
        };
    }
}