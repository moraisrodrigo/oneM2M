import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import { DBType } from '../types/index';
import { DB_FILE } from '../constants/index';
import data from './db.json';

export function getDB() {
    const defaultStructure: DBType = { AEs: [], containers: [], contentInstances: [] };

    if (!data) return defaultStructure;

    if (!data.AEs || !data.containers || !data.contentInstances) return defaultStructure;

    return data as DBType;
}

export function saveDB(data: DBType): void {
    const dir = dirname(DB_FILE);

    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }

    writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}