import { exec } from 'child_process';
import { loadPlugins } from './load_config.mjs';
import { expressLog } from './log.mjs';

// TBC change to promises
export const executeScript = (script, callback) => {
    const { title, command } = script;
    exec(script, (error, stdout, stderr) => {
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
    if (!Array.isArray(scripts)) {
        expressLog({
            message: 'Invalid configuration file...',
            severity: 'ERROR',
            kind: 'CONF FILE - CONFIGURATION'
        });

        process.exit(1);
    }

    scripts.forEach((script) => {
        executeScript(script, callback);
    });
};