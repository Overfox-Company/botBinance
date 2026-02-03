"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { PatchBotConfig } from "@/actions/config/PatchConfigUser"

type SideMode = "above" | "below";

function toNumberOrNull(v: string) {
    const n = Number(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : null;
}

function computeTarget(market: number | null, offset: number | null, mode: SideMode) {
    if (market === null || offset === null) return null;
    return mode === "above" ? market + offset : market - offset;
}

type Props = {
    config?: {
        enabled: boolean;
        buy: { mode: SideMode; offset: number };
        sell: { mode: SideMode; offset: number };
    } | null;
    marketBuyAvg?: number | null;
    marketSellAvg?: number | null;
};

export default function BotConfig({ config = null, marketBuyAvg = null, marketSellAvg = null }: Props) {
    const [enabled, setEnabled] = React.useState(config?.enabled ?? false);

    const [buyMode, setBuyMode] = React.useState<SideMode>(config?.buy.mode ?? "above");
    const [sellMode, setSellMode] = React.useState<SideMode>(config?.sell.mode ?? "below");
    const [buyOffsetRaw, setBuyOffsetRaw] = React.useState(config?.buy.offset.toString() ?? "");
    const [sellOffsetRaw, setSellOffsetRaw] = React.useState(config?.sell.offset.toString() ?? "");

    const buyOffset = toNumberOrNull(buyOffsetRaw);
    const sellOffset = toNumberOrNull(sellOffsetRaw);

    const buyTarget = computeTarget(marketBuyAvg, buyOffset, buyMode);
    const sellTarget = computeTarget(marketSellAvg, sellOffset, sellMode);
    const [saving, setSaving] = React.useState(false);
    async function onToggle(next: boolean) {
        // ✅ UI optimista
        setEnabled(next);
        setSaving(true);

        const res: any = await PatchBotConfig({ enabled: next });

        if (!res.ok) {
            // 🔁 rollback si falla
            setEnabled((prev) => !prev);
            console.log("ENABLE ERR:", res.message);
        }

        setSaving(false);
    }
    return (
        <Card className="p-4 space-y-4 h-full">
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                    <div className="text-lg font-semibold">Configuración</div>
                    <div className="text-xs text-muted-foreground">
                        Define el margen para posicionar tus anuncios con respecto al promedio del mercado.
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Badge variant={enabled ? "default" : "secondary"}>
                        {enabled ? "Activo" : "Inactivo"}
                    </Badge>

                    <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground">Bot</Label>
                        <Switch checked={enabled} onCheckedChange={onToggle} disabled={saving} />
                    </div>
                </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Comprar */}
                <div className="space-y-2">
                    <Label>Comprar USDT</Label>

                    <div className="flex flex-wrap items-center gap-2">
                        <Input
                            inputMode="decimal"
                            placeholder="Ej: 10"
                            className="w-[160px]"
                            value={buyOffsetRaw}
                            onChange={(e) => setBuyOffsetRaw(e.target.value)}
                        />

                        <Button
                            type="button"
                            className={buyMode === "above" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                            variant={buyMode === "above" ? "default" : "secondary"}
                            onClick={() => setBuyMode("above")}
                            style={{ color: "white" }}
                        >
                            Por encima
                        </Button>

                        <Button
                            type="button"
                            className={buyMode === "below" ? "bg-red-600 hover:bg-red-700" : ""}
                            variant={buyMode === "below" ? "default" : "secondary"}
                            onClick={() => setBuyMode("below")}
                            style={{ color: "white" }}
                        >
                            Por debajo
                        </Button>
                    </div>

                    <div className="text-xs text-muted-foreground">
                        Mercado: <span className="font-medium">{marketBuyAvg ?? "—"}</span> → Objetivo:{" "}
                        <span className="font-medium">{buyTarget ?? "—"}</span>
                    </div>
                </div>

                {/* Vender */}
                <div className="space-y-2">
                    <Label>Vender USDT</Label>

                    <div className="flex flex-wrap items-center gap-2">
                        <Input
                            inputMode="decimal"
                            placeholder="Ej: 10"
                            className="w-[160px]"
                            value={sellOffsetRaw}
                            onChange={(e) => setSellOffsetRaw(e.target.value)}
                        />

                        <Button
                            type="button"
                            className={sellMode === "above" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                            variant={sellMode === "above" ? "default" : "secondary"}
                            onClick={() => setSellMode("above")}
                            style={{ color: "white" }}
                        >
                            Por encima
                        </Button>

                        <Button
                            type="button"
                            className={sellMode === "below" ? "bg-red-600 hover:bg-red-700" : ""}
                            variant={sellMode === "below" ? "default" : "secondary"}
                            onClick={() => setSellMode("below")}
                            style={{ color: "white" }}
                        >
                            Por debajo
                        </Button>
                    </div>

                    <div className="text-xs text-muted-foreground">
                        Mercado: <span className="font-medium">{marketSellAvg ?? "—"}</span> → Objetivo:{" "}
                        <span className="font-medium">{sellTarget ?? "—"}</span>
                    </div>
                </div>
            </div>

            <div className="rounded-md border p-3 bg-muted/20 text-sm">
                <div className="font-medium mb-1">Ejemplo</div>
                <div className="text-muted-foreground">
                    Mercado 100 + 10 por encima → 110 • Mercado 100 − 10 por debajo → 90
                </div>
            </div>
        </Card>
    );
}
