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

export default async function MarketBanner() {
    const m = await GetP2PMarket();

    // ✅ auto refresh SSR cada 5s
    // (esto solo “dispara” el refresh; el fetch sigue siendo en server)
    const refresh = <AutoRefresh everyMs={5000} />;

    if (!m?.ok) {
        return (
            <section className="rounded-lg border p-4 bg-muted/20">
                {
                    refresh
                }
                <div className="flex items-center justify-between gap-2">
                    <div className="space-y-1">
                        <div className="text-lg font-semibold">Mercado P2P USDT/VES</div>
                        <div className="text-xs text-muted-foreground">No se pudo cargar el mercado.</div>
                    </div>
                    <Badge variant="destructive">Error</Badge>
                </div>

                <pre className="mt-3 text-xs overflow-auto opacity-80">
                    {JSON.stringify(m, null, 2)}
                </pre>
            </section>
        );
    }

    const spreadPct =
        m.buy.best && m.sell.best ? ((m.sell.best - m.buy.best) / m.buy.best) * 100 : null;

    return (
        <section className="rounded-lg border p-4 bg-muted/20 space-y-3">
            {
                refresh

            }

            <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                    <div className="text-lg font-semibold">Mercado P2P {m.pair}</div>
                    <div className="text-xs text-muted-foreground">
                        Actualizado: {formatDate(m.ts)}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                        Ordenes de venta {m.buy.samples} • Ordenes de compra {m.sell.samples}
                    </Badge>

                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Comprar USDT => mirar SELL */}
                <div className="rounded-lg border p-3 bg-background">
                    <div className="text-xs text-muted-foreground">Comprar USDT</div>
                    <div className="text-2xl font-semibold">Bs {formatVES(m.buy.best, 0)}</div>
                    <div className="text-xs text-muted-foreground">
                        Promedio: Bs {formatVES(m.buy.avg, 0)} • Mediana: Bs {formatVES(m.buy.median, 0)}
                    </div>
                </div>

                {/* Vender USDT => mirar BUY */}
                <div className="rounded-lg border p-3 bg-background">
                    <div className="text-xs text-muted-foreground">Vender USDT</div>
                    <div className="text-2xl font-semibold">Bs {formatVES(m.sell.best, 0)}</div>
                    <div className="text-xs text-muted-foreground">
                        Promedio: Bs {formatVES(m.sell.avg, 0)} • Mediana: Bs {formatVES(m.sell.median, 0)}
                    </div>
                </div>

                {/* Spread */}
                <div className="rounded-lg border p-3 bg-background">
                    <div className="text-xs text-muted-foreground">
                        Diferencia entre compra y venta
                    </div>

                    <div className="text-2xl font-semibold">
                        {m.spread === null ? "—" : `Bs ${formatVES(m.spread, 0)}`}
                    </div>

                    <div className="text-xs text-muted-foreground">
                        {spreadPct === null ? "—" : `${spreadPct.toFixed(2)}% de diferencia`}
                    </div>
                </div>

            </div>
        </section>
    );
}
