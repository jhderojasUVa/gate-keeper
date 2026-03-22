#!/usr/bin/env node

// Gate Keeper Server Entry Point
// This script starts the Gate Keeper server, which provides a web interface and WebSocket for code quality checks.
// It can optionally open a browser to the server's URL when run with the --open flag.

// Import necessary modules
// Libs
import { fileURLToPath } from 'url';
import { expressLog } from '../libs/log.mjs';
import { getConfigurationData, loadPlugins } from '../libs/load_config.mjs';
import { executeAllScripts } from '../libs/execute_scripts.mjs';
// Models
// import { GATE_KEEPER_CONFIG_MODEL as CONFIG_MODEL } from '../models/configuration.model.mjs';
// State
import { STATE as GATE_KEEPER_STATE } from '../libs/state.mjs';
// Configuration
import { express_server, express_port, express_ws_port } from './server_conf.mjs';
import { startWebSocket } from './server_ws.mjs';
import { exec } from 'child_process';
import { isHTTPS } from './server_conf.mjs';

/**
 * Starts the Gate Keeper server.
 * This function initializes the Express server, loads configuration, executes initial scripts,
 * and starts the WebSocket server.
 * @async
 * @returns {Promise<void>} A promise that resolves when the server is fully started.
 */
export const startGateKeeper = async () => {
    // Start the Express server and wait for it to be listening
    await new Promise((resolve) => {
        express_server.listen(express_port, () => {
            expressLog({
                message: `${process.env.GATE_KEEPER_HTTPS === 'false' ? 'HTTP': 'HTTPS'} server started at ${process.env.GATE_KEEPER_HTTPS === 'false' ? 'http': 'https'}://localhost:${express_port}`,
                kind: `${process.env.GATE_KEEPER_HTTPS === 'false' ? 'HTTP': 'HTTPS'} SERVER`,
                severity: 'INFO'
            });
            resolve();
        });
    });

    // Load configuration data and plugins
    const GATE_KEEPER_CONFIG_MODEL = getConfigurationData();
    const GATE_KEEPER_PLUGINS = loadPlugins(GATE_KEEPER_CONFIG_MODEL);

    // Execute all configured scripts to check code quality
    try {
        const results = await executeAllScripts(GATE_KEEPER_PLUGINS);
        GATE_KEEPER_STATE.isWorking().setResults(results);
        const updatedState = await GATE_KEEPER_STATE.updateCanCommit();
        updatedState.isWorking();
    } catch (e) {
        expressLog({
            message: `Unable to execute the scripts\n        ${e}`,
            kind: 'SCRIPTS',
            severity: 'ERROR'
        });
    }

    // Start the WebSocket server for real-time communication
    startWebSocket(express_ws_port);
};

// Execute if run directly (not imported as a module)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const openBrowser = process.argv.includes('--open');
    (async () => {
        await startGateKeeper();
        if (openBrowser) {
            const protocol = isHTTPS ? 'https' : 'http';
            const url = `${protocol}://localhost:${express_port}`;
            let command;
            if (process.platform === 'darwin') {
                command = `open "${url}"`;
            } else if (process.platform === 'win32') {
                command = `start "${url}"`;
            } else {
                command = `xdg-open "${url}"`;
            }
            exec(command, (error) => {
                if (error) {
                    console.error('Failed to open browser:', error);
                }
            });
        }
    })();
}
