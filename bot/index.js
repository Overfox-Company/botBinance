import express from "express";
import cors from "cors";
import "dotenv/config";
import { createLoop } from "./loop.js";
import UpdateAds from "./functions/UpdateAds.ts";
import { connectDB } from "../database/utils/MongoDB.ts";
import { getP2PMarket } from "./functions/GetPriceMarket.ts";
import { migrateLegacyCredentialsToSecureStore } from "../utils/binance/CredentialStore.ts";

const app = express();
const PORT = Number(process.env.BOT_PORT ?? process.env.PORT_BOT) || 4000;
const MIN_LOOP_INTERVAL_MS = 5000;
const DEFAULT_LOOP_INTERVAL_MS = 15000;

function normalizeLoopIntervalMs(value) {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
        return DEFAULT_LOOP_INTERVAL_MS;
    }

    return Math.max(MIN_LOOP_INTERVAL_MS, Math.trunc(parsed));
}

const loop = createLoop({
    enabled: true,
    intervalMs: normalizeLoopIntervalMs(Number(process.env.TIME_TO_REFRESH) || DEFAULT_LOOP_INTERVAL_MS),
    task: async () => {
        await UpdateAds({
            syncLoopIntervalSeconds(loopIntervalSeconds) {
                loop.update({ intervalMs: normalizeLoopIntervalMs(loopIntervalSeconds * 1000) });
            },
        })
    }
})
//await startNextServer()
await connectDB()
migrateLegacyCredentialsToSecureStore(PORT);
// Middlewares básicos
app.use(cors());
app.use(express.json());

// Healthcheck
app.get("/health", (req, res) => {
    res.json({
        ok: true,
        service: "p2p-bot",
        ts: Date.now(),
    });
});

// Ruta base
app.get("/", (req, res) => {
    res.send("bot ok");
});

try {
    loop.start();
} catch (error) {
    console.error("Error starting the bot loop:", error);
}


app.get("/start-loop", (req, res) => {
    loop.start();
    res.send("Loop started");
});

app.get("/stop-loop", (req, res) => {
    loop.stop();
    res.send("Loop stopped");
});
app.get("/market", async (req, res) => {
    const result = await getP2PMarket();
    res.send(result);
});

app.listen(PORT, () => {
    console.log(`[BOT] listening on http://localhost:${PORT}`);
});
