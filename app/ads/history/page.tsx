import { GetHistoryP2P } from "@/actions/history/GetHistoryP2P";
import { GetBinanceAccountOwner } from "@/actions/validateCredentials/GetBinanceAccountOwner";
import TransactionsTable from "./components/TransactionsTable";

export const dynamic = "force-dynamic";

export default async function Page() {
    const [{ data }, ownerResult] = await Promise.all([
        GetHistoryP2P({
            page: 1,
            rows: 20,
        }),
        GetBinanceAccountOwner(),
    ]);
    console.log("Binance account owner result:", ownerResult);
    return (
        <main className="mx-auto w-full max-w-8xl p-12 space-y-6">
            <h1 className="text-2xl font-semibold">
                Historial de transacciones
            </h1>

            <TransactionsTable initialData={data} accountOwner={ownerResult.data} />
        </main>
    );
}