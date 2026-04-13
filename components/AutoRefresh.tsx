"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function AutoRefresh({ everyMs = 15000 }: { everyMs?: number }) {
    const router = useRouter();

    useEffect(() => {
        const id = setInterval(() => {
            router.refresh(); // ✅ vuelve a ejecutar el SSR
        }, everyMs);

        return () => clearInterval(id);
    }, [router, everyMs]);

    return null;
}
