import Link from "next/link";
import { GetAdversitingList } from "@/actions/advertisements/GetAdvertinsingList";
import './globals.css'
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TypeBinanceAd } from "@/types/DataBinance";



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

function statusBadge(status: number) {
  // (simple) 1 = activo; lo demás lo mostramos como secundario.
  if (status === 1) return <Badge>Activo</Badge>;
  return <Badge variant="secondary">Estado {status}</Badge>;
}

export default async function Home() {
  const data = await GetAdversitingList();

  // Soporta varios shapes comunes: array directo o data/items
  const ads: TypeBinanceAd[] = Array.isArray(data)
    ? (data as TypeBinanceAd[])
    : Array.isArray((data as any)?.data)
      ? ((data as any).data as TypeBinanceAd[])
      : Array.isArray((data as any)?.items)
        ? ((data as any).items as TypeBinanceAd[])
        : (data?.advNo ? [data as TypeBinanceAd] : []);

  return (
    <main className="mx-auto w-full max-w-8xl p-12 space-y-4">
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
              <TableHead className="text-right">Precio</TableHead>
              <TableHead>Disponible</TableHead>
              <TableHead>Límites</TableHead>
              <TableHead>Métodos</TableHead>

              {/* NUEVAS */}
              <TableHead>Publicado</TableHead>
              <TableHead>Actualizado</TableHead>

              <TableHead className="w-[120px]">Estado</TableHead>
              <TableHead className="w-[140px] text-right">Acción</TableHead>
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

                  <TableCell className="text-right font-semibold">
                    {fiat} {formatNumberLike(ad.price, 3)}
                  </TableCell>

                  <TableCell>
                    <div className="font-medium">
                      {formatNumberLike(ad.surplusAmount, 2)} {ad.asset}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      pago en {ad.payTimeLimit} min
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      {fiat} {formatNumberLike(ad.minSingleTransAmount, 0)}{" "}
                      <span className="text-muted-foreground">—</span>{" "}
                      {fiat} {formatNumberLike(ad.maxSingleTransAmount, 0)}
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

                  <TableCell>{statusBadge(ad.advStatus)}</TableCell>

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
