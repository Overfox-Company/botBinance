import { GetP2PMarket } from "@/actions/market/GetMarket";
import { Badge } from "@/components/ui/badge";
import { AutoRefresh } from "./AutoRefresh";

function formatVES(n: number | null, decimals = 0) {
    if (n === null || !Number.isFinite(n)) return "—";
    return new Intl.NumberFormat("es-VE", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(n);
}

function formatDate(ms: number) {
    return new Intl.DateTimeFormat("es-VE", {
        dateStyle: "short",
        timeStyle: "short",
    }).format(new Date(ms));
}

type SpreadPercentProps = { value: number | null };

export function SpreadPercent({ value }: SpreadPercentProps) {
    if (value === null) return <span className="text-muted-foreground">—</span>;

    const isPositive = value > 0;
    const isNegative = value < 0;

    const sign = isPositive ? "+" : isNegative ? "−" : "";
    const colorClass = isPositive
        ? "text-emerald-600"
        : isNegative
            ? "text-red-600"
            : "text-muted-foreground";

    return (
        <span className={`text-xs font-medium ${colorClass}`}>
            {sign}
            {Math.abs(value).toFixed(2)}% de diferencia
        </span>
    );
}

export default async function MarketBanner() {
    const m = await GetP2PMarket();
    const refresh = <AutoRefresh everyMs={process.env.TIME_TO_REFRESH ? Number(process.env.TIME_TO_REFRESH) : 15000} />;

    if (!m?.ok) {
        return (
            <section className="rounded-lg border p-4 bg-muted/20 space-y-3">
                {refresh}
                <div className="flex items-center justify-between gap-2">
                    <div className="space-y-1">
                        <div className="text-lg font-semibold">Mercado P2P USDT/VES</div>
                        <div className="text-xs text-muted-foreground">No se pudo cargar el mercado.</div>
                    </div>
                    <Badge variant="destructive">Error</Badge>
                </div>
            </section>
        );
    }

    return (
        <section className="rounded-lg border p-4 bg-muted/20 space-y-3 h-full">
            {refresh}

            <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                    <div className="text-base font-semibold">Mercado P2P {m.pair}</div>
                    <div className="text-xs text-muted-foreground">
                        Actualizado: {formatDate(m.ts)}
                    </div>
                </div>

                <Badge variant="secondary" className="h-fit">
                    Venta {m.buy.samples} • Compra {m.sell.samples}
                </Badge>
            </div>

            {/* Vertical: 3 tarjetas apiladas */}
            <div className="space-y-3">
                {/* Comprar */}
                <div className="relative rounded-lg border p-3 bg-background space-y-2">
                    <div className="absolute top-2 right-2 text-[11px] text-muted-foreground bg-muted/60 rounded-md px-2 py-1 leading-tight">
                        <div>
                            <span className="opacity-70">Min</span>{" "}
                            <span className="font-medium text-white">
                                Bs {formatVES(Number(m.buy.minOrder?.price ?? null), 0)}
                            </span>
                        </div>
                        <div>
                            <span className="opacity-70">Max</span>{" "}
                            <span className="font-medium text-white">
                                Bs {formatVES(Number(m.buy.maxOrder?.price ?? null), 0)}
                            </span>
                        </div>
                    </div>

                    <div className="text-xs text-muted-foreground">Comprar USDT (promedio)</div>
                    <div className="text-2xl font-semibold">Bs {formatVES(m.buy.avg, 0)}</div>
                    <div className="text-xs text-muted-foreground">
                        Mediana: <span className="font-medium">Bs {formatVES(m.buy.median, 0)}</span>
                    </div>
                </div>

                {/* Vender */}
                <div className="relative rounded-lg border p-3 bg-background space-y-2">
                    <div className="absolute top-2 right-2 text-[11px] text-muted-foreground bg-muted/60 rounded-md px-2 py-1 leading-tight">
                        <div>
                            <span className="opacity-70">Min</span>{" "}
                            <span className="font-medium text-white">
                                Bs {formatVES(Number(m.sell.minOrder?.price ?? null), 0)}
                            </span>
                        </div>
                        <div>
                            <span className="opacity-70">Max</span>{" "}
                            <span className="font-medium text-white">
                                Bs {formatVES(Number(m.sell.maxOrder?.price ?? null), 0)}
                            </span>
                        </div>
                    </div>

                    <div className="text-xs text-muted-foreground">Vender USDT (promedio)</div>
                    <div className="text-2xl font-semibold">Bs {formatVES(m.sell.avg, 0)}</div>
                    <div className="text-xs text-muted-foreground">
                        Mediana: <span className="font-medium">Bs {formatVES(m.sell.median, 0)}</span>
                    </div>
                </div>

                {/* Spread */}
                <div className="rounded-lg border p-3 bg-background space-y-2">
                    <div className="text-xs text-muted-foreground">
                        Diferencia (promedio venta − promedio compra)
                    </div>

                    <div className="text-2xl font-semibold">
                        {m.spread === null ? "—" : `Bs ${formatVES(m.spread, 0)}`}
                    </div>

                    <div className="text-xs text-muted-foreground">
                        <SpreadPercent value={m.pcntSpread} />
                    </div>
                </div>
            </div>
        </section>
    );
}
