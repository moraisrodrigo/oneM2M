import { readFileSync } from 'fs';
import { ENV_FILE_PATH } from '../constants';

export const loadEnv = () => {
    try {
        const content = readFileSync(ENV_FILE_PATH, 'utf-8');

        const lines = content.split('\n');

        for (const line of lines) {
            const trimmed = line.trim();

            // Skip empty lines or comments
            if (!trimmed || trimmed.startsWith('#')) continue;

            const [key, ...rest] = trimmed.split('=');
            const value = rest.join('=').trim().replace(/^['"]|['"]$/g, '');

            process.env[key.trim()] = value;
        }
    } catch (error) {
        console.error('Error loading .env file:', error);
    }
}
