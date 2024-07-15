import { exec } from 'child_process';
import { loadPlugins } from './load_config.mjs';
import { expressLog } from './log.mjs';

// TBC change to promises
export const executeScript = (script, callback) => {
    return exec(script, (error, stdout, stderr) => {
        if (error) {
            expressLog({
                message: stderr,
                severity: 'ERROR',
                kind: 'CONF FILE - SCRIPTS'
            });

            process.exit(1);
        }

        // Execute the callback with the exit of the command
        if (callback) {
            callback(stdout);
        } else {
            // if not, return the stdout
            return stdout;
        }
    });
};

// TBC change to promises
export const executeAllScripts = (scripts, callback) => {
    let result = [];

    if (!Array.isArray(scripts)) {
        expressLog({
            message: 'Invalid configuration file...',
            severity: 'ERROR',
            kind: 'CONF FILE - CONFIGURATION'
        });

        process.exit(1);
    }

    return scripts.map((script) => {
        const { name, command } = script;
        return executeScript(command, callback);
    });
};