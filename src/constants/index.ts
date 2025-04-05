import { dirname, join } from "path";
import { fileURLToPath } from "url";

export const JSON_CONTENT_TYPE = "application/json";
export const CSE_NAME = "onem2m";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export const DB_FILE = join(__dirname, '../db/db.json');