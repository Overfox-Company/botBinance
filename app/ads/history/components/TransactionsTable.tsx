"use client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { use, useEffect, useState, useTransition } from "react";
import { GetHistoryP2P } from "@/actions/history/GetHistoryP2P";
import { UserIcon } from '@hugeicons-pro/core-stroke-sharp';
import { HugeiconsIcon } from '@hugeicons/react';
import { Pdf01Icon } from '@hugeicons-pro/core-stroke-rounded';
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { GoogleSheetIcon } from '@hugeicons-pro/core-stroke-rounded';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Props {
    initialData: any;
}

function formatNumber(value: string, decimals = 2) {
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

export default function TransactionsTable({ initialData }: Props) {
    const [data, setData] = useState(initialData?.data ?? []);
    const [page, setPage] = useState(1);
    const [isPending, startTransition] = useTransition();

    const [rows, setRows] = useState(10);
    const [search, setSearch] = useState("");
    const [tradeType, setTradeType] = useState<"BUY" | "SELL">("BUY");
    const [status, setStatus] = useState<string | undefined>(undefined);


    const loadPage = (newPage: number) => {
        startTransition(async () => {
            const res = await GetHistoryP2P({
                tradeType,
                page: newPage,
                rows,
            });

            if (res?.ok) {
                let result = res.data?.data ?? [];

                // Filtro local (search)
                if (search) {
                    result = result.filter((tx: any) =>
                        tx.orderNumber.includes(search) ||
                        tx.advNo.includes(search) ||
                        tx.counterPartNickName?.toLowerCase().includes(search.toLowerCase())
                    );
                }

                // Filtro estado
                if (status) {
                    result = result.filter((tx: any) => tx.orderStatus === status);
                }

                setData(result);
                setPage(newPage);
            }
        });
    };

    const exportToExcel = () => {
        if (!data || data.length === 0) return;

        const formattedData = data.map((tx: any) => ({
            Order: tx.orderNumber,
            Adv: tx.advNo,
            Type: tx.tradeType,
            Asset: tx.asset,
            Fiat: tx.fiat,
            Amount: `${tx.asset} ${Number(tx.amount)}`,
            UnitPrice: `${tx.fiatSymbol} ${Number(tx.unitPrice)}`,
            Total: `${tx.fiatSymbol} ${Number(tx.totalPrice)}`,
            Commission: `${tx.asset} ${Number(tx.commission)}`,
            Status: tx.orderStatus,
            User: tx.counterPartNickName,
            Method: tx.payMethodName,
            Date: new Date(tx.createTime).toLocaleString(),
        }));

        const worksheet = XLSX.utils.json_to_sheet(formattedData);

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "P2P History");

        XLSX.writeFile(workbook, "p2p-transactions.xlsx");
    };
    const exportToCSV = () => {
        const headers = [
            "Order",
            "Type",
            "Asset",
            "Fiat",
            "Amount",
            "Unit Price",
            "Total",
            "Commission",
            "Status",
            "Date",
        ];

        const rowsCSV = data.map((tx: any) => [
            tx.orderNumber,
            tx.tradeType,
            tx.asset,
            tx.fiat,
            tx.amount,
            tx.unitPrice,
            tx.totalPrice,
            tx.commission,
            tx.orderStatus,
            new Date(tx.createTime).toLocaleString(),
        ]);

        const csvContent =
            [headers, ...rowsCSV]
                .map((row) => row.join(","))
                .join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "p2p-transactions.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    const exportToPDF = () => {
        if (!data || data.length === 0) return;

        const doc = new jsPDF("landscape", "pt", "a4");

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        const marginX = 40;
        const startY = 95;

        const now = new Date();
        const periodStart = new Date(data[data.length - 1]?.createTime);
        const periodEnd = new Date(data[0]?.createTime);

        // =============================
        // HEADER CORPORATIVO SUPERIOR
        // =============================
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(120);

        doc.text(
            "Nest Services Limited  •  House of Francis, Room 303, Ile Du Port, Mahe, Seychelles  •  www.binance.com",
            marginX,
            20
        );

        // Línea separadora
        doc.setDrawColor(230);
        doc.line(marginX, 25, pageWidth - marginX, 25);

        // =============================
        // TÍTULO
        // =============================
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(0);

        doc.text("P2P Order History", marginX, 45);

        // =============================
        // INFO USUARIO
        // =============================
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(60);

        doc.text(`Name: Hector`, marginX, 60);
        doc.text(`User ID: 29039492`, marginX + 250, 60);
        doc.text(`Email: hector@email.com`, marginX + 450, 60);

        doc.text(
            `Period (UTC+0): ${periodStart.toISOString().slice(0, 10)} to ${periodEnd
                .toISOString()
                .slice(0, 10)}`,
            marginX,
            72
        );

        // =============================
        // TABLA ESTILO BINANCE
        // =============================
        autoTable(doc, {
            startY,
            theme: "grid",
            styles: {
                fontSize: 7,
                cellPadding: 4,
                lineColor: [230, 230, 230],
                lineWidth: 0.5,
                valign: "middle",
            },
            headStyles: {
                fillColor: [245, 245, 245], // Gris muy claro
                textColor: 40,
                fontStyle: "bold",
                lineWidth: 0.5,
            },
            alternateRowStyles: {
                fillColor: [252, 252, 252],
            },
            columnStyles: {
                5: { halign: "right" },
                6: { halign: "right" },
                7: { halign: "right" },
                8: { halign: "right" },
                12: { halign: "center" },
            },
            head: [[
                "Order Number",
                "Adv No",
                "Type",
                "Asset",
                "Fiat",
                "Total Price",
                "Price",
                "Quantity",
                "Commission",
                "Payment",
                "Counterparty",
                "Status",
                "Match Time (UTC)",
            ]],
            body: data.map((tx: any): any => [
                tx.orderNumber,
                tx.advNo,
                tx.tradeType,
                tx.asset,
                tx.fiat,
                `${tx.fiatSymbol} ${Number(tx.totalPrice).toLocaleString()}`,
                `${tx.fiatSymbol} ${Number(tx.unitPrice).toLocaleString()}`,
                `${tx.asset} ${Number(tx.amount).toLocaleString()}`,
                `${tx.fiatSymbol} ${Number(tx.commission).toLocaleString()}`,
                tx.payMethodName,
                tx.counterPartNickName,
                tx.orderStatus,
                new Date(tx.createTime)
                    .toISOString()
                    .replace("T", " ")
                    .slice(0, 19),
            ]),
            didParseCell: (hookData) => {
                // Status en gris suave
                if (hookData.column.index === 11) {
                    if (hookData.cell.raw === "Completed") {
                        hookData.cell.styles.textColor = [0, 120, 0];
                    } else if (hookData.cell.raw === "Cancelled") {
                        hookData.cell.styles.textColor = [180, 0, 0];
                    }
                }
            },
        });

        // =============================
        // FOOTER
        // =============================
        const pageCount = doc.getNumberOfPages();

        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(7);
            doc.setTextColor(120);

            doc.text(
                `Page ${i}/${pageCount}`,
                pageWidth - marginX,
                pageHeight - 15,
                { align: "right" }
            );
        }

        doc.save("p2p-order-history.pdf");
    };
    useEffect(() => {
        // Al cambiar filtros, volvemos a cargar la página 1
        loadPage(1);
    }, [tradeType, status, rows]);
    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">

                {/* Search */}
                <Input
                    placeholder="Buscar orden, adv o usuario..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-[250px]"
                />

                <div className="flex items-center gap-4">

                    {/* Trade Type */}
                    <Select onValueChange={(v) => setTradeType(v as "BUY" | "SELL")}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="BUY">BUY</SelectItem>
                            <SelectItem value="SELL">SELL</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Status */}
                    <Select onValueChange={(v) => setStatus(v === "ALL" ? undefined : v)}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Todos</SelectItem>
                            <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                            <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                            <SelectItem value="PENDING">PENDING</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Rows */}
                    <Select onValueChange={(v) => setRows(Number(v))}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Rows" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Export */}
                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="cursor-pointer"
                            onClick={exportToExcel} >
                            Export Sheets   <HugeiconsIcon
                                icon={GoogleSheetIcon}
                                size={32}
                                color="currentColor"
                                strokeWidth={1.5}
                            />
                        </Button>

                        <Button variant="outline" className="cursor-pointer"
                            onClick={exportToPDF} >
                            Export
                            <HugeiconsIcon
                                icon={Pdf01Icon}
                                size={32}
                                color="currentColor"
                                strokeWidth={1.5}
                            />
                        </Button>
                    </div>
                </div>
            </div>
            <div className="rounded-lg">
                <Table>
                    <TableHeader className='bg-muted/60'>
                        <TableRow>
                            <TableHead>Orden</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Par</TableHead>
                            <TableHead className="text-right">Cantidad</TableHead>
                            <TableHead className="text-right">Precio Unit.</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Comisión</TableHead>
                            <TableHead className="w-[200px] flex items-center gap-2">
                                <HugeiconsIcon
                                    icon={UserIcon}
                                    size={16}
                                    color="currentColor"
                                    strokeWidth={1.5}
                                />
                                Contraparte

                            </TableHead>
                            <TableHead>Método</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Fecha</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody className="bg-muted/40">
                        {data.map((tx: any) => (
                            <TableRow key={tx.orderNumber}>
                                <TableCell className="font-medium">
                                    {tx.orderNumber}
                                    <div className="text-xs text-muted-foreground">
                                        Adv {tx.advNo}
                                    </div>
                                </TableCell>

                                <TableCell>
                                    <Badge
                                        variant={
                                            tx.tradeType === "BUY" ? "default" : "destructive"
                                        }
                                    >
                                        {tx.tradeType}
                                    </Badge>
                                </TableCell>

                                <TableCell>
                                    {tx.asset} / {tx.fiat}
                                </TableCell>

                                <TableCell className="text-right font-medium">
                                    {formatNumber(tx.amount, 2)} {tx.asset}
                                </TableCell>

                                <TableCell className="text-right">
                                    {tx.fiatSymbol} {formatNumber(tx.unitPrice, 2)}
                                </TableCell>

                                <TableCell className="text-right font-semibold">
                                    {tx.fiatSymbol} {formatNumber(tx.totalPrice, 2)}
                                </TableCell>

                                <TableCell className="text-right">
                                    {formatNumber(tx.commission, 4)}
                                </TableCell>

                                <TableCell>
                                    {tx.counterPartNickName}
                                </TableCell>

                                <TableCell>
                                    <Badge variant="outline">
                                        {tx.payMethodName}
                                    </Badge>
                                </TableCell>

                                <TableCell>
                                    <Badge
                                        variant={
                                            tx.orderStatus === "COMPLETED"
                                                ? "default"
                                                : tx.orderStatus === "CANCELLED"
                                                    ? "destructive"
                                                    : "secondary"
                                        }
                                    >
                                        {tx.orderStatus}
                                    </Badge>
                                </TableCell>

                                <TableCell>
                                    {formatDate(tx.createTime)}
                                </TableCell>
                            </TableRow>
                        ))}

                        {data.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={11}
                                    className="py-10 text-center text-sm text-muted-foreground"
                                >
                                    No hay transacciones para mostrar.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Paginación */}
            <div className="w-full flex justify-center">
                <div className=" w-[300px] flex items-center justify-between">
                    <Button
                        variant="outline"
                        disabled={page === 1 || isPending}
                        onClick={() => loadPage(page - 1)}
                    >
                        Anterior
                    </Button>

                    <span className="text-sm text-muted-foreground">
                        Página {page}
                    </span>

                    <Button
                        variant="outline"
                        disabled={isPending}
                        onClick={() => loadPage(page + 1)}
                    >
                        Siguiente
                    </Button>
                </div>
            </div>

        </div>
    );
}