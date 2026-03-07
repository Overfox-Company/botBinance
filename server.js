import express from "express";
import net from "net";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVER_PORT = 5000;
const NEXT_START_PORT = 3000;
const BOT_START_PORT = 4000;
const HOST = "127.0.0.1";

const reservedPorts = new Set([SERVER_PORT]);
const instances = [];

function getInstanceCount() {
    const arg = process.argv.find((value) => value.startsWith("--instances="));
    const rawValue = arg?.split("=")[1] ?? process.env.npm_config_instances ?? "1";
    const count = Number.parseInt(rawValue, 10);

    if (!Number.isInteger(count) || count < 1) {
        return 1;
    }

    return count;
}

function isPortFree(port, host = HOST) {
    return new Promise((resolve) => {
        const server = net.createServer();

        server.once("error", () => resolve(false));
        server.once("listening", () => {
            server.close(() => resolve(true));
        });

        server.listen(port, host);
    });
}

async function findAvailablePort(startPort) {
    let port = startPort;

    while (reservedPorts.has(port) || !(await isPortFree(port))) {
        port += 1;
    }

    reservedPorts.add(port);
    return port;
}

function waitForHttp(url, timeoutMs = 30000) {
    const startedAt = Date.now();

    return new Promise((resolve, reject) => {
        const attempt = async () => {
            try {
                const res = await fetch(url);
                if (res.ok) {
                    resolve();
                    return;
                }
            } catch {
                // Retry until timeout.
            }

            if (Date.now() - startedAt >= timeoutMs) {
                reject(new Error(`Timeout waiting for ${url}`));
                return;
            }

            setTimeout(attempt, 500);
        };

        attempt();
    });
}

function spawnManagedProcess(command, args, env, name) {
    const child = spawn(command, args, {
        cwd: __dirname,
        env,
        stdio: "inherit",
    });

    child.on("exit", (code, signal) => {
        if (signal) {
            console.log(`[${name}] exited with signal ${signal}`);
            return;
        }

        if (code !== 0) {
            console.error(`[${name}] exited with code ${code}`);
        }
    });

    child.on("error", (error) => {
        console.error(`[${name}] failed to start`, error);
    });

    return child;
}

function toInstancePayload(instance) {
    return {
        id: instance.id,
        nextPort: instance.nextPort,
        botPort: instance.botPort,
        nextUrl: `http://${HOST}:${instance.nextPort}`,
        botUrl: `http://${HOST}:${instance.botPort}`,
    };
}

async function startInstance(id) {
    const nextPort = await findAvailablePort(NEXT_START_PORT);
    const botPort = await findAvailablePort(BOT_START_PORT);

    const sharedEnv = {
        ...process.env,
        SERVER_PORT: String(SERVER_PORT),
        INSTANCE_ID: String(id),
        NEXT_PORT: String(nextPort),
        BOT_PORT: String(botPort),
        PORT: String(nextPort),
        PORT_BOT: String(botPort),
    };

    const nextBin = require.resolve("next/dist/bin/next");
    const tsxBin = require.resolve("tsx/cli");

    const nextArgs =
        process.env.NODE_ENV === "production"
            ? [nextBin, "start", "-p", String(nextPort), "-H", HOST]
            : [nextBin, "dev", "-p", String(nextPort), "-H", HOST];

    const nextProcess = spawnManagedProcess(
        process.execPath,
        nextArgs,
        sharedEnv,
        `NEXT:${id}`
    );

    await waitForHttp(`http://${HOST}:${nextPort}`);

    const botProcess = spawnManagedProcess(
        process.execPath,
        [tsxBin, path.join(__dirname, "bot/index.js")],
        sharedEnv,
        `BOT:${id}`
    );

    await waitForHttp(`http://${HOST}:${botPort}/health`);

    const instance = {
        id,
        nextPort,
        botPort,
        nextProcess,
        botProcess,
    };

    instances.push(instance);
    return instance;
}

async function startServices() {
    const totalInstances = getInstanceCount();

    for (let index = 1; index <= totalInstances; index += 1) {
        await startInstance(index);
    }
}

function stopServices() {
    for (const instance of instances) {
        if (instance.nextProcess) {
            instance.nextProcess.kill("SIGTERM");
            instance.nextProcess = null;
        }

        if (instance.botProcess) {
            instance.botProcess.kill("SIGTERM");
            instance.botProcess = null;
        }
    }
}

async function bootstrap() {
    const serverPortAvailable = await isPortFree(SERVER_PORT);
    if (!serverPortAvailable) {
        throw new Error(`Port ${SERVER_PORT} is already in use`);
    }

    await startServices();

    const app = express();

    app.get("/", (_req, res) => {
        res.json({
            ok: true,
            serverPort: SERVER_PORT,
            totalInstances: instances.length,
            instances: instances.map(toInstancePayload),
        });
    });

    app.get("/health", (_req, res) => {
        res.json({
            ok: true,
            serverPort: SERVER_PORT,
            totalInstances: instances.length,
            ts: Date.now(),
        });
    });

    app.get("/instances", (_req, res) => {
        res.json({
            ok: true,
            totalInstances: instances.length,
            instances: instances.map(toInstancePayload),
        });
    });

    app.get("/instances/:id", (req, res) => {
        const id = Number.parseInt(req.params.id, 10);
        const instance = instances.find((entry) => entry.id === id);

        if (!instance) {
            res.status(404).json({
                ok: false,
                message: `Instance ${req.params.id} not found`,
            });
            return;
        }

        res.json({
            ok: true,
            ...toInstancePayload(instance),
        });
    });

    app.get("/app/:id", (req, res) => {
        const id = Number.parseInt(req.params.id, 10);
        const instance = instances.find((entry) => entry.id === id);

        if (!instance) {
            res.status(404).json({
                ok: false,
                message: `Instance ${req.params.id} not found`,
            });
            return;
        }

        res.redirect(`http://${HOST}:${instance.nextPort}`);
    });

    app.listen(SERVER_PORT, HOST, () => {
        console.log(`[SERVER] listening on http://${HOST}:${SERVER_PORT}`);

        for (const instance of instances) {
            console.log(
                `[SERVER] instance ${instance.id}: next=http://${HOST}:${instance.nextPort} bot=http://${HOST}:${instance.botPort}`
            );
        }
    });
}

for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => {
        stopServices();
        process.exit(0);
    });
}

bootstrap().catch((error) => {
    console.error("[SERVER] failed to bootstrap", error);
    stopServices();
    process.exit(1);
});
