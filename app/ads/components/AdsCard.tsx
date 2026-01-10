import { NextPage } from 'next'
// app/page.tsx
import Image from "next/image";
import { GetAdversitingList } from "@/actions/advertisements/GetAdvertinsingList";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { TypeBinanceAd, TypeTradeMethod, TypeTradeMethodCommissionRate } from '@/types/DataBinance';
import { formatDate, formatNumberLike, safeArray, statusLabel, tradeTypeVariant } from '../functions/functions';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon } from '@hugeicons-pro/core-duotone-standard';
import BackButton from '@/components/BackButton';




interface Props {

    ad: TypeBinanceAd;
}

const AdsCard: NextPage<Props> = ({ ad }) => {
    const fiatSymbol = ad.fiatSymbol ?? ad.fiatUnit;
    const status = statusLabel(ad.advStatus);

    return <main className="mx-auto w-full max-w-8xl p-12 space-y-4">
        <BackButton />
        <header className="flex items-end justify-between gap-4">

            <div className="space-y-1">

                <h1 className="text-2xl font-semibold">Detalle del anuncio {ad.advNo}</h1>

            </div>

        </header>
        <Card key={ad.advNo} className="overflow-hidden">
            <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        {ad.assetLogo ? (
                            <div className="relative h-9 w-9 overflow-hidden rounded-full border">
                                <Image
                                    src={ad.assetLogo}
                                    alt={ad.asset}
                                    fill
                                    className="object-contain"
                                    sizes="36px"
                                    priority={false}
                                />
                            </div>
                        ) : null}

                        <div className="space-y-1">
                            <CardTitle className="text-lg">
                                {ad.tradeType} {ad.asset} → {ad.fiatUnit}
                            </CardTitle>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant={tradeTypeVariant(ad.tradeType)}>{ad.tradeType}</Badge>
                                <Badge variant={status.variant}>{status.text}</Badge>
                                <Badge variant="secondary">advNo: {ad.advNo}</Badge>
                                <Badge variant="outline">classify: {ad.classify}</Badge>
                            </div>
                        </div>
                    </div>

                    <div className="text-right">
                        <div className="text-sm text-muted-foreground">Precio</div>
                        <div className="text-2xl font-semibold">
                            {fiatSymbol} {formatNumberLike(ad.price, ad.priceScale ?? 3)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            priceType: {ad.priceType} · floating: {ad.priceFloatingRatio}%
                        </div>
                    </div>
                </div>

                <Separator />

                {/* KPI cards */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-dashed">
                        <CardContent className="p-4 space-y-1">
                            <div className="text-xs text-muted-foreground">Disponible</div>
                            <div className="text-lg font-medium">
                                {formatNumberLike(ad.tradableQuantity ?? ad.surplusAmount, ad.assetScale ?? 2)}{" "}
                                {ad.asset}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                surplus: {formatNumberLike(ad.surplusAmount, ad.assetScale ?? 2)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-dashed">
                        <CardContent className="p-4 space-y-1">
                            <div className="text-xs text-muted-foreground">Monto inicial</div>
                            <div className="text-lg font-medium">
                                {formatNumberLike(ad.initAmount, 2)} {ad.asset}
                            </div>
                            <div className="text-xs text-muted-foreground">commission: {ad.commissionRate}</div>
                        </CardContent>
                    </Card>

                    <Card className="border-dashed">
                        <CardContent className="p-4 space-y-1">
                            <div className="text-xs text-muted-foreground">Límite mínimo</div>
                            <div className="text-lg font-medium">
                                {fiatSymbol} {formatNumberLike(ad.minSingleTransAmount, ad.fiatScale ?? 0)}
                            </div>
                            <div className="text-xs text-muted-foreground">payTimeLimit: {ad.payTimeLimit} min</div>
                        </CardContent>
                    </Card>

                    <Card className="border-dashed">
                        <CardContent className="p-4 space-y-1">
                            <div className="text-xs text-muted-foreground">Límite máximo</div>
                            <div className="text-lg font-medium">
                                {fiatSymbol} {formatNumberLike(ad.maxSingleTransAmount, ad.fiatScale ?? 0)}
                            </div>
                            <div className="text-xs text-muted-foreground">KYC: {ad.buyerKycLimit ? "Sí" : "No"}</div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                    <div>Creado: {formatDate(ad.createTime)}</div>
                    <div>Actualizado: {formatDate(ad.advUpdateTime)}</div>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Métodos de pago */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold">Métodos de pago</h2>
                        <Badge variant="outline">{safeArray(ad.tradeMethods).length} método(s)</Badge>
                    </div>

                    <div className="rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[72px]">Icono</TableHead>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Identificador</TableHead>
                                    <TableHead className="text-right">Comisión</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {safeArray<TypeTradeMethod>(ad.tradeMethods).map((m) => {
                                    const commission =
                                        safeArray<TypeTradeMethodCommissionRate>(ad.tradeMethodCommissionRateVoList).find(
                                            (x) => x.tradeMethodIdentifier === m.identifier
                                        )?.commissionRate ?? ad.commissionRate;

                                    return (
                                        <TableRow key={`${ad.advNo}-${m.identifier}`}>
                                            <TableCell>
                                                {m.iconUrlColor ? (
                                                    <div className="relative h-8 w-8 overflow-hidden rounded-md border bg-background">
                                                        <Image
                                                            src={m.iconUrlColor}
                                                            alt={m.tradeMethodName}
                                                            fill
                                                            className="object-contain p-1"
                                                            sizes="32px"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="h-8 w-8 rounded-md border bg-muted" />
                                                )}
                                            </TableCell>
                                            <TableCell className="font-medium">{m.tradeMethodName}</TableCell>
                                            <TableCell className="text-muted-foreground">{m.identifier}</TableCell>
                                            <TableCell className="text-right">{commission}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Reglas / notas */}
                <div className="space-y-2">
                    <h2 className="text-sm font-semibold">Notas y auto-respuesta</h2>

                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="remarks">
                            <AccordionTrigger>Remarks</AccordionTrigger>
                            <AccordionContent>
                                <div className="whitespace-pre-wrap text-sm text-muted-foreground">
                                    {ad.remarks?.trim() || "—"}
                                </div>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="autoReply">
                            <AccordionTrigger>Auto Reply Message</AccordionTrigger>
                            <AccordionContent>
                                <div className="whitespace-pre-wrap text-sm text-muted-foreground">
                                    {ad.autoReplyMsg?.trim() || "—"}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>

                {/* Requisitos */}
                <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">buyerRegDaysLimit</div>
                        <div className="text-sm font-medium">{ad.buyerRegDaysLimit}</div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">buyerBtcPositionLimit</div>
                        <div className="text-sm font-medium">{ad.buyerBtcPositionLimit}</div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">offlineReason</div>
                        <div className="text-sm font-medium">{ad.offlineReason?.trim() || "—"}</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    </main>
}

export default AdsCard