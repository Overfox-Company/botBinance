import Link from "next/link";
import { GetAdversitingList } from "@/actions/advertisements/GetAdvertinsingList";
import './globals.css'
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CancelCircleIcon } from '@hugeicons-pro/core-stroke-standard';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TypeBinanceAd } from "@/types/DataBinance";
import { AdStatusCell } from "@/components/AdsStatusComponent";
import { EditableNumberCell } from "@/components/editable-cell";
import { UpdateP2PAdParams } from "@/actions/advertisements/UpdateP2PAdParams"; // ajusta ruta real
import MarketBanner from "@/components/MarketBanner";
import BotConfig from "@/components/Configuration";
import { GetP2PMarket } from "@/actions/market/GetMarket";
import { GetBotConfig } from "@/actions/config/GetConfigUser";

// components/ads/status-badge.tsx



function formatNumberLike(value: string, decimals = 0) {
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  return new Intl.NumberFormat("es-VE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}
function formatDate(ms: number) {
  if (!ms) return "—";
  return new Intl.DateTimeFormat("es-VE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(ms));
}


export default async function Home() {
  const data = await GetAdversitingList();
  //console.log("DATA ADS:", data);
  // Soporta varios shapes comunes: array directo o data/items
  const ads: TypeBinanceAd[] = Array.isArray(data)
    ? (data as TypeBinanceAd[])
    : Array.isArray((data as any)?.data)
      ? ((data as any).data as TypeBinanceAd[])
      : Array.isArray((data as any)?.items)
        ? ((data as any).items as TypeBinanceAd[])
        : (data?.advNo ? [data as TypeBinanceAd] : []);

  const m = await GetP2PMarket();
  const config = await GetBotConfig();
  //console.log("CONFIG BOT:", config);
  return (
    <main className="mx-auto w-full max-w-8xl p-12 space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Mercado P2P USDT/VES</h1>
        <p className="text-sm text-muted-foreground">
          Vista del mercado actual
        </p>
      </div>
      <main className="mx-auto w-full max-w-8xl">
        <div className="grid grid-cols-12 gap-4 items-start">
          {/* 8 columnas: Config */}
          <div className="col-span-12 lg:col-span-7 h-full">
            <BotConfig
              config={config.ok ? config.data : null}
              marketBuyAvg={m?.ok ? m.buy.avg : null}
              marketSellAvg={m?.ok ? m.sell.avg : null}
            />
          </div>

          {/* 4 columnas: Mercado */}
          <div className="col-span-12 lg:col-span-5">
            <MarketBanner />
          </div>
        </div>
      </main>
      {/* tu tabla */}

      <header className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">P2P Anuncios</h1>
          <p className="text-sm text-muted-foreground">
            Vista resumida tipo tabla (similar a Binance).
          </p>
        </div>

        <Badge variant="secondary" style={{ borderRadius: 8 }}>{ads.length} anuncios</Badge>
      </header>
      <br />
      <div className="rounded-lg border">
        <Table>
          <TableHeader className='bg-muted/60'>
            <TableRow>
              <TableHead className="w-[92px]">Tipo</TableHead>
              <TableHead>Par</TableHead>
              <TableHead className="w-[160px]">Precio</TableHead>
              <TableHead className=" w-[180px]">Disponible</TableHead>
              <TableHead className=" w-[260px]">Límites</TableHead>
              <TableHead>Métodos</TableHead>

              {/* NUEVAS */}
              <TableHead>Publicado</TableHead>
              <TableHead>Actualizado</TableHead>

              <TableHead className="w-[120px]">Estado</TableHead>
              <TableHead className="w-[140px] ">Acción</TableHead>
            </TableRow>
          </TableHeader>


          <TableBody className='bg-muted/40'>
            {ads.map((ad) => {
              const fiat = ad.fiatSymbol ?? ad.fiatUnit;

              return (
                <TableRow key={ad.advNo}>
                  <TableCell>
                    <Badge variant={ad.tradeType === "BUY" ? "default" : "destructive"}>
                      {ad.tradeType}
                    </Badge>
                  </TableCell>

                  <TableCell className="font-medium">
                    {ad.asset} / {ad.fiatUnit}
                    <div className="text-xs text-muted-foreground">ID {ad.advNo}</div>
                  </TableCell>

                  <TableCell className=" font-semibold">
                    <EditableNumberCell
                      advNo={String(ad.advNo)}
                      field="price"
                      raw={String(ad.price)}
                      display={`${fiat} ${formatNumberLike(ad.price, 3)}`}
                      inputClassName="w-[140px] text-right"
                      min={0}
                    />
                  </TableCell>


                  <TableCell>
                    <div className="font-medium">
                      <EditableNumberCell
                        advNo={String(ad.advNo)}
                        field="initAmount"
                        // si tu response trae initAmount úsalo; si no, como fallback toma surplusAmount
                        raw={String((ad as any).initAmount ?? ad.surplusAmount)}
                        display={`${formatNumberLike(ad.initAmount ?? ad.surplusAmount, 2)} ${ad.asset}`}
                        inputClassName="w-[160px]"
                        min={0}
                      />
                    </div>

                    {                 /*   <div className="text-xs text-muted-foreground">
                      pago en {ad.payTimeLimit} min
                    </div>*/}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm flex items-center justify-start gap-2">
                      <span>{fiat}</span>

                      {/* MIN */}
                      <EditableNumberCell
                        advNo={String(ad.advNo)}
                        field="minSingleTransAmount"
                        raw={String(ad.minSingleTransAmount)}
                        display={formatNumberLike(ad.minSingleTransAmount, 0)}
                        inputClassName="w-[120px]"
                        min={0}
                        // opcional: para evitar que pongan min > max
                        max={Number(ad.maxSingleTransAmount)}
                      />

                      <span className="text-muted-foreground">—</span>

                      <span>{fiat}</span>

                      {/* MAX */}
                      <EditableNumberCell
                        advNo={String(ad.advNo)}
                        field="maxSingleTransAmount"
                        raw={String(ad.maxSingleTransAmount)}
                        display={formatNumberLike(ad.maxSingleTransAmount, 0)}
                        inputClassName="w-[140px]"
                        min={Number(ad.minSingleTransAmount)}
                      />
                    </div>
                  </TableCell>


                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(ad.tradeMethods ?? []).slice(0, 3).map((m) => (
                        <Badge key={m.identifier} variant="outline">
                          {m.tradeMethodName}
                        </Badge>
                      ))}
                      {(ad.tradeMethods ?? []).length > 3 ? (
                        <Badge variant="secondary">+{(ad.tradeMethods ?? []).length - 3}</Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formatDate(ad.createTime)}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      {formatDate(ad.advUpdateTime)}
                    </div>
                  </TableCell>

                  <TableCell>
                    <AdStatusCell ad={ad as { advNo: string; advStatus: 1 | 3 | 4 }} />
                  </TableCell>

                  <TableCell className="text-right">
                    {/* Ruta de detalle: tú decides el path */}
                    <Button asChild size="lg" className="font-semibold">
                      <Link href={`/ads/${ad.advNo}`}>Ver detalle</Link>
                    </Button>

                  </TableCell>
                </TableRow>
              );
            })}

            {ads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                  No hay anuncios para mostrar.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}
