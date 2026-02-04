import axios from "axios";

type TradeType = "BUY" | "SELL";

function median(nums: number[]) {
    if (!nums.length) return null;
    const a = [...nums].sort((x, y) => x - y);
    const mid = Math.floor(a.length / 2);
    return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}

function mean(nums: number[]) {
    if (!nums.length) return null;
    const s = nums.reduce((acc, n) => acc + n, 0);
    return s / nums.length;
}

function toNum(x: any) {
    const n = Number(String(x ?? "").replace(",", "."));
    return Number.isFinite(n) ? n : null;
}

const BINANCE_P2P_URL =
    "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search";

async function fetchMarketSide(tradeType: TradeType, rows = 20, page = 1) {
    const body = {
        page,
        rows,
        asset: "USDT",
        fiat: "VES",
        tradeType,
        publisherType: null,
    };

    const r = await axios.post(BINANCE_P2P_URL, body, {
        // headers típicos para evitar bloqueos/random 4xx en algunos entornos
        headers: {
            "content-type": "application/json",
            "user-agent":
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
            accept: "*/*",
            origin: "https://p2p.binance.com",
            referer: "https://p2p.binance.com/",
        },
        timeout: 15_000,
        // si estás detrás de proxy corporativo, axios lo toma de env (HTTP_PROXY/HTTPS_PROXY)
        // proxy: false, // <- descomenta si tu proxy rompe TLS y prefieres manejarlo tú
    });

    const items = Array.isArray(r.data?.data) ? r.data.data : [];
    const prices = items
        .map((it: any) => toNum(it?.adv?.price))
        .filter((n: number | null): n is number => n !== null);

    return { items, prices };
}

export async function getP2PMarket() {
    try {
        const PAGES = 5;
        const ROWS = 20;
        const pages = Array.from({ length: PAGES }, (_, i) => i + 1);

        const [sellPages, buyPages] = await Promise.all([
            Promise.all(pages.map((p) => fetchMarketSide("SELL", ROWS, p))),
            Promise.all(pages.map((p) => fetchMarketSide("BUY", ROWS, p))),
        ]);

        const sellItems = sellPages.flatMap((x) => x.items);
        const buyItems = buyPages.flatMap((x) => x.items);

        const sellPrices = sellPages.flatMap((x) => x.prices);
        const buyPrices = buyPages.flatMap((x) => x.prices);

        const getItemPrice = (it: any) => toNum(it?.adv?.price);

        const pickMinMax = (items: any[]) => {
            let minItem: any = null;
            let maxItem: any = null;
            let minPrice: number | null = null;
            let maxPrice: number | null = null;

            for (const it of items) {
                const p = getItemPrice(it);
                if (p === null) continue;

                if (minPrice === null || p < minPrice) {
                    minPrice = p;
                    minItem = it;
                }
                if (maxPrice === null || p > maxPrice) {
                    maxPrice = p;
                    maxItem = it;
                }
            }

            return { minItem, minPrice, maxItem, maxPrice };
        };

        const compactOrder = (it: any) =>
            it
                ? {
                    advNo: it?.adv?.advNo,
                    price: it?.adv?.price,
                    minSingleTransAmount: it?.adv?.minSingleTransAmount,
                    maxSingleTransAmount: it?.adv?.maxSingleTransAmount,
                    surplusAmount: it?.adv?.surplusAmount,
                    nickName: it?.advertiser?.nickName,
                    userType: it?.advertiser?.userType,
                    monthOrderCount: it?.advertiser?.monthOrderCount,
                    monthFinishRate: it?.advertiser?.monthFinishRate,
                    tradeMethods: it?.adv?.tradeMethods ?? [],
                }
                : null;

        // SELL side (tú compras USDT aquí)
        const sellSide = pickMinMax(sellItems);

        // BUY side (tú vendes USDT aquí)
        const buySide = pickMinMax(buyItems);

        const buyBest = sellPrices.length ? Math.min(...sellPrices) : sellSide.minPrice; // comprar = menor SELL
        const sellBest = buyPrices.length ? Math.max(...buyPrices) : buySide.maxPrice;  // vender  = mayor BUY
        const buyAvg = mean(sellPrices);
        const sellAvg = mean(buyPrices);

        return {
            ok: true as const,
            ts: Date.now(),
            pair: "USDT/VES",
            buy: {
                best: buyBest,
                avg: mean(sellPrices),
                median: median(sellPrices),
                samples: sellPrices.length,
                minOrder: compactOrder(sellSide.minItem),
                maxOrder: compactOrder(sellSide.maxItem),
            },
            sell: {
                best: sellBest,
                avg: mean(buyPrices),
                median: median(buyPrices),
                samples: buyPrices.length,
                minOrder: compactOrder(buySide.minItem),
                maxOrder: compactOrder(buySide.maxItem),
            },
            spread: buyAvg !== null && sellAvg !== null ? sellAvg - buyAvg : null,
            pcntSpread:
                buyAvg !== null && sellAvg !== null ? ((sellAvg - buyAvg) / buyAvg) * 100 : null,
        };
    } catch (e: any) {
        return {
            ok: false as const,
            status: e?.response?.status,
            data: e?.response?.data,
            message: e?.message,
        };
    }
}
