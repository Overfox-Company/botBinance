"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function AutoRefresh({ everyMs = 5000 }: { everyMs?: number }) {
    const router = useRouter();

    useEffect(() => {
        const id = setInterval(() => {
            console.log("AutoRefresh: refreshing SSR...");
            console.log("apiKey:", process.env.BINANCE_API_KEY)
            console.log("apiSecret:", process.env.BINANCE_API_SECRET)
            router.refresh(); // ✅ vuelve a ejecutar el SSR
        }, everyMs);

        return () => clearInterval(id);
    }, [router, everyMs]);

    return null;
}
