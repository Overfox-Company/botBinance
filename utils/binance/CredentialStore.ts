import crypto from "crypto";
import fs from "fs";
import path from "path";

export type StoredBinanceCredentials = {
    apiKey: string;
    apiSecret: string;
    updatedAt: number;
};

type EncryptedPayload = {
    version: 1;
    iv: string;
    tag: string;
    ciphertext: string;
    updatedAt: number;
};

const STORAGE_DIR = path.join(process.cwd(), ".localdb", "binance");
const KEY_FILE = path.join(STORAGE_DIR, "master.key");

function resolveCredentialPort(port?: number) {
    if (port !== undefined) {
        return port;
    }

    return Number(process.env.BOT_PORT ?? process.env.PORT_BOT) || 4000;
}

function getEncryptedFilePath(port?: number) {
    return path.join(
        STORAGE_DIR,
        `binance.credentials.${resolveCredentialPort(port)}.enc.json`
    );
}

function getLegacyFilePath(port?: number) {
    return path.join(
        process.cwd(),
        `binance.credentials.${resolveCredentialPort(port)}.json`
    );
}

function ensureStorageDir() {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

function getMasterKey() {
    ensureStorageDir();

    const envKey = process.env.BINANCE_CREDENTIALS_MASTER_KEY;
    if (envKey) {
        return crypto.createHash("sha256").update(envKey).digest();
    }

    if (!fs.existsSync(KEY_FILE)) {
        fs.writeFileSync(KEY_FILE, crypto.randomBytes(32), { mode: 0o600 });
    }

    const key = fs.readFileSync(KEY_FILE);
    if (key.length !== 32) {
        throw new Error("Invalid local credentials master key length");
    }

    return key;
}

function encryptCredentials(credentials: StoredBinanceCredentials): EncryptedPayload {
    const key = getMasterKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const plaintext = JSON.stringify(credentials);
    const ciphertext = Buffer.concat([
        cipher.update(plaintext, "utf8"),
        cipher.final(),
    ]);

    return {
        version: 1,
        iv: iv.toString("base64"),
        tag: cipher.getAuthTag().toString("base64"),
        ciphertext: ciphertext.toString("base64"),
        updatedAt: credentials.updatedAt,
    };
}

function decryptPayload(payload: EncryptedPayload): StoredBinanceCredentials {
    const key = getMasterKey();
    const decipher = crypto.createDecipheriv(
        "aes-256-gcm",
        key,
        Buffer.from(payload.iv, "base64")
    );

    decipher.setAuthTag(Buffer.from(payload.tag, "base64"));

    const plaintext = Buffer.concat([
        decipher.update(Buffer.from(payload.ciphertext, "base64")),
        decipher.final(),
    ]).toString("utf8");

    return JSON.parse(plaintext) as StoredBinanceCredentials;
}

function parseLegacyCredentials(port?: number): StoredBinanceCredentials | null {
    const legacyFilePath = getLegacyFilePath(port);
    if (!fs.existsSync(legacyFilePath)) {
        return null;
    }

    const parsed = JSON.parse(fs.readFileSync(legacyFilePath, "utf8"));
    if (!parsed?.apiKey || !parsed?.apiSecret) {
        return null;
    }

    return {
        apiKey: String(parsed.apiKey),
        apiSecret: String(parsed.apiSecret),
        updatedAt: Number(parsed.updatedAt ?? Date.now()),
    };
}

export function writeLocalCredentials(
    credentials: Omit<StoredBinanceCredentials, "updatedAt"> & { updatedAt?: number },
    port?: number
) {
    ensureStorageDir();

    const normalized: StoredBinanceCredentials = {
        apiKey: String(credentials.apiKey).trim(),
        apiSecret: String(credentials.apiSecret).trim(),
        updatedAt: Number(credentials.updatedAt ?? Date.now()),
    };

    if (!normalized.apiKey || !normalized.apiSecret) {
        throw new Error("Binance credentials are required");
    }

    const encrypted = encryptCredentials(normalized);
    fs.writeFileSync(
        getEncryptedFilePath(port),
        JSON.stringify(encrypted, null, 2),
        "utf8"
    );

    return normalized;
}

export function migrateLegacyCredentialsToSecureStore(port?: number) {
    const encryptedFilePath = getEncryptedFilePath(port);
    if (fs.existsSync(encryptedFilePath)) {
        return false;
    }

    const legacy = parseLegacyCredentials(port);
    if (!legacy) {
        return false;
    }

    writeLocalCredentials(legacy, port);
    return true;
}

export function readLocalCredentials(port?: number): StoredBinanceCredentials {
    migrateLegacyCredentialsToSecureStore(port);

    const encryptedFilePath = getEncryptedFilePath(port);
    if (!fs.existsSync(encryptedFilePath)) {
        throw new Error("Binance credentials not configured");
    }

    const payload = JSON.parse(
        fs.readFileSync(encryptedFilePath, "utf8")
    ) as EncryptedPayload;

    return decryptPayload(payload);
}

export function getLocalCredentialStatus(port?: number) {
    try {
        const credentials = readLocalCredentials(port);
        return {
            configured: true,
            updatedAt: credentials.updatedAt,
        };
    } catch {
        return {
            configured: false,
            updatedAt: null,
        };
    }
}

export function clearLocalCredentials(port?: number) {
    const encryptedFilePath = getEncryptedFilePath(port);
    if (fs.existsSync(encryptedFilePath)) {
        fs.unlinkSync(encryptedFilePath);
    }
}