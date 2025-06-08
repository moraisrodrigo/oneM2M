import { join } from "path";
import { getTimestamp } from "../utils/misc";

export function getEnvVar(key: string, fallback?: string): string {
    const val = process.env[key];

    if (!val && fallback === undefined) throw new Error(`Missing env var ${key}`);

    return val ?? fallback!;
}

export enum ENV_KEYS {
    PORT = 'PORT',
    APP_URL = 'APP_URL',
    CSE_NAME = 'CSE_NAME',
    CSE_ID = 'CSE_ID',
    CSE_CREATION_TIME = 'CSE_CREATION_TIME',
}

export const JSON_CONTENT_TYPE = "application/json";

export const DB_FILE_PATH = join(__dirname, '../db/db.json');

export const ENV_FILE_PATH = join(__dirname, '../../.env');

export const PORT = () => getEnvVar(ENV_KEYS.PORT, '3000');

export const APP_URL = () => getEnvVar(ENV_KEYS.APP_URL, 'localhost');

export const CSE_ID = () => getEnvVar(ENV_KEYS.CSE_ID, 'cse_' + getTimestamp());

export const CSE_NAME = () => getEnvVar(ENV_KEYS.CSE_NAME, 'onem2m');

export const CSE_CREATION_TIME = () => getEnvVar(ENV_KEYS.CSE_CREATION_TIME, getTimestamp());