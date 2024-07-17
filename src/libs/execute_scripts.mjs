import { exec } from 'child_process';
import util from 'util';
import { expressLog } from './log.mjs';

// Promisify the exec
const execute = util.promisify(exec);

// Execute script in Promise
export const executeScript = (script) => {
    const { command } = script;

    return execute(command);
};

// Execute all scripts and return as a Promises
export const executeAllScripts = (scripts, callback) => {
    if (!Array.isArray(scripts)) {
        expressLog({
            message: 'Invalid configuration file...',
            severity: 'ERROR',
            kind: 'CONF FILE - CONFIGURATION'
        });

        process.exit(1);
    }

    // Create the array of promises
    let scriptArrayOfPromises = scripts.map(async(script) => {
        return executeScript(script, callback)
    });

    // Return the array of promises
    return Promise.all(scriptArrayOfPromises);
};