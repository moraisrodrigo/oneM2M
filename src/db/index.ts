import fs from 'fs';
import path from 'path';
import { DBType } from "../types";

const DB_FILE = path.join(__dirname, '..', 'db.json');

export const getDB = (): DBType => {
    if (!fs.existsSync(DB_FILE)) return {
        AEs: [],
        containers: [],
        contentInstances: [],
    };

    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}

export const saveDB = (data: DBType): void => {
    const dir = path.dirname(DB_FILE);    

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}