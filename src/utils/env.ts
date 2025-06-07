import { readFileSync } from 'fs';
import { ENV_FILE_PATH, ENV_KEYS } from '../constants';
import { getTimestamp } from "./misc";

type EnvConfig = Record<ENV_KEYS, string>;

const parseArgs = (): Partial<EnvConfig> => {
    const args = process.argv.slice(2);

    const config: Partial<EnvConfig> = {};

    // Set CSEBase creation time
    config.CSE_CREATION_TIME = getTimestamp();

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--')) {
            const key = arg.slice(2).toUpperCase();
            const value = args[i + 1];
            if (value && !value.startsWith('--')) {
                config[key as keyof EnvConfig] = value;
                i++; // Skip the next argument since it's the value
            }
        }
    }

    return config;
}

export const loadEnv = () => {
    try {
        // First load from .env file
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

        // Then override with command line arguments
        const argsConfig = parseArgs();
        Object.entries(argsConfig).forEach(([key, value]) => process.env[key] = value);

    } catch (error) {
        console.error('Error loading .env file:', error);

        // Even if .env fails, still try to load command line arguments
        const argsConfig = parseArgs();
        Object.entries(argsConfig).forEach(([key, value]) => process.env[key] = value);
    }

    // SHOW ALL ENV VARS
    printAllEnvVars();
}

const printAllEnvVars = () => {
    const ApplicationEnvKeys = Object.values(ENV_KEYS).map(key => key.toUpperCase());

    console.log('-----------------------------------');
    console.log('Environment Variables:');
    const applicationEnvs = Object.entries(process.env).filter(([key]) => ApplicationEnvKeys.includes(key)).map(([key, value]) => ({ key, value }));

    console.table(applicationEnvs);

    console.log('-----------------------------------');
}
