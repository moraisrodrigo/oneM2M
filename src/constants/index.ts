import { join } from "path";

export function getEnvVar(key: string, fallback?: string): string {
    const val = process.env[key];

    if (!val && fallback === undefined) throw new Error(`Missing env var ${key}`);

    return val ?? fallback!;
}

export const JSON_CONTENT_TYPE = "application/json";

export const DB_FILE_PATH = join(__dirname, '../db/db.json');

export const ENV_FILE_PATH = join(__dirname, '../../.env');

export const PORT = () => getEnvVar('PORT', '3000');

export const CSE_NAME = () => getEnvVar('CSE_NAME', '');
