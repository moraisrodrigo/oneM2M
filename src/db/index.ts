import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import { DBType } from '../types/index';
import { DB_FILE_PATH } from '../constants/index';
import data from './db.json';

const defaultStructure: DBType = { AEs: [], containers: [], contentInstances: [] };

export function getDB() {
    if (!data) return defaultStructure;

    if (!data.AEs || !data.containers || !data.contentInstances) return defaultStructure;

    return data as DBType;
}

export function saveDB(data: DBType): void {
    const dir = dirname(DB_FILE_PATH);

    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }

    writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2));
}

export function resetDataBase(): void {
    saveDB(defaultStructure);
}