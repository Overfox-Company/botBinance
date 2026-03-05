import next from "next";
import http from "http";
import detect from "detect-port";

const dev = false;
const hostname = "0.0.0.0";

export const startNextServer = async () => {
    const preferredPort = Number(process.env.PORT) || 3000;

    const port = await detect(preferredPort);

    if (port !== preferredPort) {
        console.warn(
            `⚠️ Port ${preferredPort} ocupado, usando ${port} en su lugar`
        );
    }

    const app = next({ dev, hostname, port });
    const handle = app.getRequestHandler();

    await app.prepare();

    const server = http.createServer((req, res) => {
        handle(req, res);
    });

    server.listen(port, hostname, () => {
        console.log(`🚀 Server listo en http://${hostname}:${port}`);
    });
};

