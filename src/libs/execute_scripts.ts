import { exec } from 'child_process';
import util from 'util';
import { expressLog } from './log.js';
import type { ScriptModel } from '../models/configuration.model.js';

// Promisify the exec
const execute = util.promisify(exec);

// Execute script in Promise
export const executeScript = (script: ScriptModel): Promise<{ stdout: string; stderr: string }> => {
    const { command } = script;

    return execute(command as string);
};

// Execute all scripts and return as Promises
export const executeAllScripts = (scripts: ScriptModel[]): Promise<{ stdout: string; stderr: string }[]> => {
    if (!Array.isArray(scripts)) {
        expressLog({
            message: 'Invalid configuration file...',
            severity: 'ERROR',
            kind: 'CONF FILE - CONFIGURATION',
        });

        process.exit(1);
    }

    // Create the array of promises
    const scriptArrayOfPromises = scripts.map(async (script) => {
        return executeScript(script);
    });

    // Return the array of promises
    return Promise.all(scriptArrayOfPromises);
};
