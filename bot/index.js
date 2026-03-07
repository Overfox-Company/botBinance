import express from "express";
import cors from "cors";
import "dotenv/config";
import { createLoop } from "./loop.js";
import UpdateAds from "./functions/UpdateAds.js";
import { connectDB } from "../database/utils/MongoDB.ts";
import { getP2PMarket } from "./functions/GetPriceMarket.js";
import fs from "fs";
import path from "path";

const app = express();
const PORT = Number(process.env.BOT_PORT ?? process.env.PORT_BOT) || 4000;
const loop = createLoop({
    enabled: true,
    intervalMs: Number(process.env.TIME_TO_REFRESH) || 15000,
    task: async () => {
        await UpdateAds()
    }
})
//await startNextServer()
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
const credentialsFile = path.join(process.cwd(), `binance.credentials.${PORT}.json`);

app.post("/store-credentials", (req, res) => {
    const { apiKey, apiSecret } = req.body;

    if (!apiKey || !apiSecret) {
        return res.status(400).json({
            ok: false,
            message: "Missing credentials",
        });
    }

    fs.writeFileSync(
        credentialsFile,
        JSON.stringify(
            {
                apiKey,
                apiSecret,
                updatedAt: Date.now(),
            },
            null,
            2
        )
    );
    app.delete("/delete-credentials", (req, res) => {
        if (fs.existsSync(credentialsFile)) {
            fs.unlinkSync(credentialsFile);
            console.log("[BOT] credentials deleted");
        } else {
            console.log("[BOT] no credentials file to delete");
        }

        res.json({ ok: true });
    });
    console.log("[BOT] credentials stored");

    res.json({ ok: true });
});

app.listen(PORT, () => {
    console.log(`[BOT] listening on http://localhost:${PORT}`);
});
