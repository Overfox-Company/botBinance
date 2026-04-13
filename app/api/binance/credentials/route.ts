// app/api/binance/credentials/route.ts

import {
    clearLocalCredentials,
    getLocalCredentialStatus,
} from "@/utils/binance/CredentialStore";

export async function GET() {
    const status = getLocalCredentialStatus();

    return Response.json({
        ok: true,
        configured: status.configured,
        updatedAt: status.updatedAt,
    });
}

export async function DELETE() {
    clearLocalCredentials();

    return Response.json({
        ok: true,
    });
}