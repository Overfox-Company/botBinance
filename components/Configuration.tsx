"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { PatchBotConfig } from "@/actions/config/PatchConfigUser";
import { useEffect } from "react";
import { ValidateBinanceCredentials } from "@/actions/validateCredentials/ValidateCredentials";
import { useRouter } from "next/navigation";
import {
    DEFAULT_LOOP_INTERVAL_SECONDS,
    DEFAULT_TOLERANCE_PERCENT,
    MIN_LOOP_INTERVAL_SECONDS,
    MIN_TOLERANCE_PERCENT,
} from "@/actions/config/Functions";
import { HugeiconsIcon } from '@hugeicons/react';
import { CheckmarkCircle01Icon } from '@hugeicons-pro/core-solid-rounded';
import { CancelCircleIcon } from '@hugeicons-pro/core-solid-rounded';

type SideMode = "above" | "below";

function toNumberOrNull(v: string) {
    const n = Number(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : null;
}

function computeTarget(market: number | null, offset: number | null, mode: SideMode) {
    if (market === null || offset === null) return null;
    return mode === "above" ? market + offset : market - offset;
}

function computeProfitPct(buyTarget: number | null, sellTarget: number | null) {
    if (buyTarget === null || sellTarget === null) return null;
    if (buyTarget <= 0) return null; // evita división rara
    return ((sellTarget - buyTarget) / buyTarget) * 100;
}

type Props = {
    config?: {
        enabled: boolean;
        buy: { mode: SideMode; offset: number };
        sell: { mode: SideMode; offset: number };
        loopIntervalSeconds: number;
        buyTolerancePct: number;
        sellTolerancePct: number;
    } | null;
    marketBuyAvg?: number | null;
    marketSellAvg?: number | null;
};

function clampLoopIntervalSeconds(value: number | null) {
    if (value === null) {
        return DEFAULT_LOOP_INTERVAL_SECONDS;
    }

    return Math.max(MIN_LOOP_INTERVAL_SECONDS, Math.trunc(value));
}

export default function BotConfig({ config = null, marketBuyAvg = null, marketSellAvg = null }: Props) {

    const [apiKey, setApiKey] = React.useState("");
    const [apiSecret, setApiSecret] = React.useState("");
    const [validating, setValidating] = React.useState(false);
    const [credentialsValid, setCredentialsValid] = React.useState<boolean | null>(null);


    const [enabled, setEnabled] = React.useState(config?.enabled ?? false);

    const [buyMode, setBuyMode] = React.useState<SideMode>(config?.buy.mode ?? "above");
    const [sellMode, setSellMode] = React.useState<SideMode>(config?.sell.mode ?? "below");
    const [buyOffsetRaw, setBuyOffsetRaw] = React.useState(config?.buy.offset.toString() ?? "");
    const [sellOffsetRaw, setSellOffsetRaw] = React.useState(config?.sell.offset.toString() ?? "");
    const [loopIntervalRaw, setLoopIntervalRaw] = React.useState(
        String(config?.loopIntervalSeconds ?? DEFAULT_LOOP_INTERVAL_SECONDS)
    );
    const [buyToleranceRaw, setBuyToleranceRaw] = React.useState(
        String(config?.buyTolerancePct ?? DEFAULT_TOLERANCE_PERCENT)
    );
    const [sellToleranceRaw, setSellToleranceRaw] = React.useState(
        String(config?.sellTolerancePct ?? DEFAULT_TOLERANCE_PERCENT)
    );
    const [statusMessage, setStatusMessage] = React.useState<string | null>(null);

    const buyOffset = toNumberOrNull(buyOffsetRaw);
    const sellOffset = toNumberOrNull(sellOffsetRaw);
    const loopIntervalCandidate = toNumberOrNull(loopIntervalRaw);
    const loopIntervalSeconds = clampLoopIntervalSeconds(loopIntervalCandidate);
    const loopIntervalHasError =
        loopIntervalCandidate !== null && loopIntervalCandidate < MIN_LOOP_INTERVAL_SECONDS;
    const buyToleranceCandidate = toNumberOrNull(buyToleranceRaw);
    const sellToleranceCandidate = toNumberOrNull(sellToleranceRaw);
    const buyTolerancePct = Math.max(MIN_TOLERANCE_PERCENT, buyToleranceCandidate ?? DEFAULT_TOLERANCE_PERCENT);
    const sellTolerancePct = Math.max(MIN_TOLERANCE_PERCENT, sellToleranceCandidate ?? DEFAULT_TOLERANCE_PERCENT);

    const buyTarget = computeTarget(marketBuyAvg, buyOffset, buyMode);
    const sellTarget = computeTarget(marketSellAvg, sellOffset, sellMode);

    const profitPct = computeProfitPct(buyTarget, sellTarget);

    const profitColor =
        profitPct === null
            ? "text-muted-foreground"
            : profitPct >= 0
                ? "text-emerald-600"
                : "text-red-600";

    const profitBg =
        profitPct === null
            ? "bg-muted/20"
            : profitPct >= 0
                ? "bg-emerald-500/10 border-emerald-500/20"
                : "bg-red-500/10 border-red-500/20";

    const profitLabel =
        profitPct === null
            ? "—"
            : `${profitPct >= 0 ? "+" : ""}${profitPct.toFixed(2)}%`;

    const [saving, setSaving] = React.useState(false);

    async function onToggle(next: boolean) {
        setEnabled(next);
        setSaving(true);

        const res: any = await PatchBotConfig({ enabled: next });

        if (!res.ok) {
            setEnabled((prev) => !prev);
            console.log("ENABLE ERR:", res.message);
        }

        setSaving(false);
    }

    const onEdit = () => {
        setSaving(true);

        PatchBotConfig({
            buy: { mode: buyMode, offset: buyOffset ?? 0 },
            sell: { mode: sellMode, offset: sellOffset ?? 0 },
            loopIntervalSeconds,
            buyTolerancePct,
            sellTolerancePct,
        }).then((res: any) => {
            if (!res.ok) {
                alert("Error al guardar configuración: " + res.message);
                console.log("EDIT ERR:", res.message);
            } else {
                setLoopIntervalRaw(String(res.data.loopIntervalSeconds));
                setBuyToleranceRaw(String(res.data.buyTolerancePct));
                setSellToleranceRaw(String(res.data.sellTolerancePct));
            }
            setSaving(false);
        });
    };
    useEffect(() => {
        fetch("/api/binance/credentials", { cache: "no-store" })
            .then(async (response) => {
                const result = await response.json();
                setCredentialsValid(Boolean(result?.configured));
            })
            .catch(() => {
                setCredentialsValid(false);
            });
    }, []);
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            onEdit();
        }, 1000);
        return () => clearTimeout(timeoutId);
    }, [buyMode, sellMode, buyOffsetRaw, sellOffsetRaw, loopIntervalRaw, buyToleranceRaw, sellToleranceRaw]);
    const router = useRouter();
    async function validateCredentials() {
        setValidating(true);
        setStatusMessage(null);

        const res: any = await ValidateBinanceCredentials(apiKey, apiSecret);

        if (!res.ok) {
            alert(res.message);
            setCredentialsValid(false);
        } else {
            setCredentialsValid(true);
            setApiKey("");
            setApiSecret("");
            setStatusMessage("Credenciales guardadas localmente de forma segura.");
        }

        setValidating(false);
        router.refresh();
    }
    return (
        <Card className="p-4 space-y-4 h-full bg-muted/20">
            <div className="space-y-3">
                <div className="text-lg font-semibold">Credenciales Binance</div>

                <div className="flex  gap-2 items-center justify-start">
                    <Input

                        placeholder="API Key"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                    />

                    <Input

                        placeholder="API Secret"
                        type="password"
                        value={apiSecret}
                        onChange={(e) => setApiSecret(e.target.value)}
                    />

                    <Button onClick={validateCredentials} disabled={validating}>
                        Validar
                    </Button>

                    {credentialsValid === true && (
                        <div
                            style={{ width: "12px ", height: "12px", backgroundColor: "rgb(34, 197, 94)", borderRadius: "50px" }}

                        />
                    )}

                    {credentialsValid === false && (
                        <div
                            style={{ width: "12px", height: "12px", backgroundColor: "rgb(220, 38, 38)", borderRadius: "50px" }}
                        />
                    )}
                </div>

                <div className="text-xs text-muted-foreground">
                    {statusMessage ?? (credentialsValid
                        ? "Credenciales almacenadas en un store local cifrado dentro del proyecto."
                        : "Las credenciales no se exponen al navegador y no se guardan en cookies ni localStorage.")}
                </div>
            </div>
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                    <div className="text-lg font-semibold">Configuración</div>
                    <div className="text-xs text-muted-foreground">
                        Define el margen para posicionar tus anuncios con respecto al promedio del mercado.
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Badge variant={enabled ? "default" : "secondary"}>{enabled ? "Activo" : "Inactivo"}</Badge>

                    <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground">Bot</Label>
                        <Switch checked={enabled} onCheckedChange={onToggle} disabled={saving} />
                    </div>
                </div>
            </div>

            {/* ✅ Mini banner de ganancia */}
            <div className={`rounded-md border p-3 ${profitBg}`}>
                <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium">Ganancia estimada</div>

                    <div className={`text-sm font-semibold ${profitColor}`}>
                        {profitLabel}
                    </div>
                </div>

                <div className="mt-1 text-xs text-muted-foreground">
                    Compra objetivo: <span className="font-medium">{buyTarget?.toFixed(2) ?? "—"}</span>{" "}
                    • Venta objetivo: <span className="font-medium">{sellTarget?.toFixed(2) ?? "—"}</span>
                </div>
            </div>

            <Separator />

            <div className="space-y-2 rounded-md border p-3 bg-background/60">
                <Label htmlFor="loop-interval">Tiempo del loop y refresco</Label>

                <div className="flex flex-wrap items-center gap-3">
                    <Input
                        id="loop-interval"
                        type="number"
                        min={MIN_LOOP_INTERVAL_SECONDS}
                        step={1}
                        className="w-[160px]"
                        value={loopIntervalRaw}
                        onChange={(e) => setLoopIntervalRaw(e.target.value)}
                    />

                    <span className="text-sm text-muted-foreground">
                        Segundos entre cada ejecución del bot y el auto-refresh web.
                    </span>
                </div>

                <div className={`text-xs ${loopIntervalHasError ? "text-red-500" : "text-muted-foreground"}`}>
                    {loopIntervalHasError
                        ? `El mínimo permitido es ${MIN_LOOP_INTERVAL_SECONDS} segundos. Se guardará como ${MIN_LOOP_INTERVAL_SECONDS}.`
                        : `Mínimo ${MIN_LOOP_INTERVAL_SECONDS} segundos. Valor actual: ${loopIntervalSeconds}s.`}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                        <Label htmlFor="buy-tolerance">Tolerancia % compra</Label>
                        <Input
                            id="buy-tolerance"
                            type="number"
                            min={MIN_TOLERANCE_PERCENT}
                            step={0.1}
                            className="w-[160px]"
                            value={buyToleranceRaw}
                            onChange={(e) => setBuyToleranceRaw(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="sell-tolerance">Tolerancia % venta</Label>
                        <Input
                            id="sell-tolerance"
                            type="number"
                            min={MIN_TOLERANCE_PERCENT}
                            step={0.1}
                            className="w-[160px]"
                            value={sellToleranceRaw}
                            onChange={(e) => setSellToleranceRaw(e.target.value)}
                        />
                    </div>
                </div>

                <div className="text-xs text-muted-foreground">
                    Se aplica en cascada por anuncio respecto al anterior. Ejemplo con 0.5% por encima: 630 → 633.15.
                </div>
            </div>

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
                        Mercado: <span className="font-medium">{marketBuyAvg?.toFixed(2) ?? "—"}</span> → Objetivo:{" "}
                        <span className="font-medium">{buyTarget?.toFixed(2) ?? "—"}</span>
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
                        Mercado: <span className="font-medium">{marketSellAvg?.toFixed(2) ?? "—"}</span> → Objetivo:{" "}
                        <span className="font-medium">{sellTarget?.toFixed(2) ?? "—"}</span>
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
