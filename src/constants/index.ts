import { join } from "path";

export const JSON_CONTENT_TYPE = "application/json";

export const DB_FILE_PATH = join(__dirname, '../db/db.json');

export const ENV_FILE_PATH = join(__dirname, '../../.env');

export const PORT = isNaN(Number(process.env.PORT)) ? 3000 : Number(process.env.PORT);

export const CSE_NAME = process.env.CSE_NAME || '';