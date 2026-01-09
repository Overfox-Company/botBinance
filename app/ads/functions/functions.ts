
function safeArray<T>(value: any): T[] {
    return Array.isArray(value) ? value : [];
}

function formatDate(ms?: number) {
    if (!ms) return "—";
    try {
        return new Intl.DateTimeFormat("es-VE", {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(new Date(ms));
    } catch {
        return new Date(ms).toISOString();
    }
}

function formatNumberLike(n: string | number | null | undefined, decimals?: number) {
    if (n === null || n === undefined) return "—";
    const num = typeof n === "number" ? n : Number(n);
    if (Number.isNaN(num)) return String(n);
    return new Intl.NumberFormat("es-VE", {
        minimumFractionDigits: decimals ?? 0,
        maximumFractionDigits: decimals ?? 8,
    }).format(num);
}

function statusLabel(status: number) {
    // Binance P2P suele usar códigos; aquí lo mostramos simple.
    if (status === 1) return { text: "Activo", variant: "default" as const };
    return { text: `Estado ${status}`, variant: "secondary" as const };
}

function tradeTypeVariant(tt: string) {
    if (tt === "BUY") return "default" as const;
    if (tt === "SELL") return "destructive" as const;
    return "secondary" as const;
}

export {
    safeArray,
    formatDate,
    formatNumberLike,
    statusLabel,
    tradeTypeVariant,
};  