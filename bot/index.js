import express from "express";
import cors from "cors";
import "dotenv/config";
import { createLoop } from "./loop.js";
import UpdateAds from "./functions/UpdateAds.js";
import { connectDB } from "../database/utils/MongoDB.ts";
import { getP2PMarket } from "./functions/GetPriceMarket.js";

const app = express();
const loop = createLoop({
    enabled: true,
    intervalMs: Number(process.env.TIME_TO_REFRESH) || 15000,
    task: async () => {
        await UpdateAds()
    }
})
await connectDB()
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


const PORT = Number(process.env.PORT_BOT || 4000);

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
