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
import AdsCard from "./ads/components/AdsCard";
import { statusLabel } from "./ads/functions/functions";
import { TypeBinanceAd } from "@/types/DataBinance";





export default async function Home() {
  const data = await GetAdversitingList();

  // Soporta: array directo, { data: [] }, { items: [] }, o { data: { ...ad } }
  const ads: TypeBinanceAd[] = (() => {
    if (Array.isArray(data)) return data as TypeBinanceAd[];
    if (Array.isArray((data as any)?.data)) return (data as any).data as TypeBinanceAd[];
    if (Array.isArray((data as any)?.items)) return (data as any).items as TypeBinanceAd[];
    if ((data as any)?.advNo) return [data as TypeBinanceAd];
    if ((data as any)?.data?.advNo) return [(data as any).data as TypeBinanceAd];
    return [];
  })();

  return (
    <main className="mx-auto w-full max-w-6xl p-6 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Binance P2P Advertisements</h1>
        <p className="text-sm text-muted-foreground">
          Vista de anuncios (precio, límites, métodos de pago y notas).
        </p>
      </header>

      {ads.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Sin datos</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            La acción no devolvió anuncios (o la forma de la respuesta no coincide con lo esperado).
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {ads.map((ad) => {
            const status = statusLabel(ad.advStatus);
            const fiatSymbol = ad.fiatSymbol ?? ad.fiatUnit;

            return (
              <AdsCard key={ad.advNo} ad={ad} fiatSymbol={fiatSymbol} status={status} />
            );
          })}
        </div>
      )}
    </main>
  );
}
