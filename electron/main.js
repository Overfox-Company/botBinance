import { app, BrowserWindow } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let nextProcess;
let botProcess;

const PORT = 1234;

function getAppRoot() {
    return app.getAppPath(); // CLAVE en producción
}

function startNext() {
    return new Promise((resolve, reject) => {
        const appRoot = getAppRoot();
        const nextBin = require.resolve("next/dist/bin/next");

        nextProcess = spawn(
            process.execPath, // usa el node embebido de Electron
            [nextBin, "start", "-p", PORT],
            {
                cwd: appRoot,
                stdio: "inherit",
            }
        );

        nextProcess.on("error", reject);

        const checkServer = setInterval(async () => {
            try {
                const res = await fetch(`http://localhost:${PORT}`);
                if (res.ok) {
                    clearInterval(checkServer);
                    resolve();
                }
            } catch {
                // sigue intentando
            }
        }, 500);
    });
}

function startBot() {
    return new Promise((resolve, reject) => {
        const appRoot = getAppRoot();

        botProcess = spawn(
            process.execPath,
            [path.join(appRoot, "dist/bot/index.js")],
            {
                cwd: appRoot,
                stdio: "inherit",
            }
        );

        botProcess.on("error", reject);

        resolve();
    });
}

async function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    await startNext();
    await startBot();

    await win.loadURL(`http://localhost:${PORT}`);
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
    if (nextProcess) nextProcess.kill();
    if (botProcess) botProcess.kill();

    if (process.platform !== "darwin") app.quit();
});