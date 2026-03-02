import { GetHistoryP2P } from "@/actions/history/GetHistoryP2P";
import TransactionsTable from "./components/TransactionsTable";


export default async function Page() {
    const { data } = await GetHistoryP2P({
        page: 1,
        rows: 20,
    });
    console.log("Initial P2P transactions:", data);
    return (
        <main className="mx-auto w-full max-w-8xl p-12 space-y-6">
            <h1 className="text-2xl font-semibold">
                Historial de transacciones
            </h1>

            <TransactionsTable initialData={data} />
        </main>
    );
}