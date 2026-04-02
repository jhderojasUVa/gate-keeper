#!/usr/bin/env node

// Gate Keeper Server Entry Point
// This script starts the Gate Keeper server, which provides a web interface and WebSocket for code quality checks.
// It can optionally open a browser to the server's URL when run with the --open flag.

// Import necessary modules
import { fileURLToPath } from 'url';
import fs from 'fs';

// Import message types
import { TYPES_MESSAGES } from '../models/wsServerRequest.model.mjs';

// Determine if running as main module (works for npm-linked commands)
const currentFileUrl = import.meta.url;
const currentFilePath = fileURLToPath(currentFileUrl);
const isMainModule = process.argv[1].includes('gate-keeper') || process.argv[1] === currentFilePath;

// Ensure stdout is flushed immediately
const log = (msg) => {
    console.log(msg);
};

/**
 * Helper function to exit with proper flushing
 * @param {number} code - Exit code
 */
const exitWithCode = (code) => {
    // Use setImmediate to ensure all IO is flushed before exit
    setImmediate(() => {
        process.exit(code);
    });
};

/**
 * Converts a WSL Linux path to Windows path format
 * Example: /mnt/c/Users/... -> C:\Users\...
 * @param {string} linuxPath - The Linux path
 * @returns {string} The Windows path
 */
export const toWindowsPath = (linuxPath) => {
    if (!linuxPath.startsWith('/mnt/')) {
        return linuxPath;
    }
    // /mnt/c/path -> C:\path
    const parts = linuxPath.split('/');
    if (parts[2]) {
        const drive = parts[2].toUpperCase();
        const remaining = parts.slice(3).join('\\');
        return `${drive}:\\${remaining}`;
    }
    return linuxPath;
};

/**
 * Detects if running in WSL (Windows Subsystem for Linux)
 * @returns {boolean} True if running in WSL
 */
export const isWSL = () => {
    try {
        const releaseInfo = fs.readFileSync('/proc/version', 'utf8').toLowerCase();
        return releaseInfo.includes('microsoft') || releaseInfo.includes('wsl');
    } catch {
        return false;
    }
};

/**
 * Shows help information
 */
export const showHelp = () => {
    log(`
Gate Keeper - Code Quality Guardian

Usage: gate-keeper <command> [options]

Commands:
  server           Start the Gate Keeper server
  client           Open the graphical client in a browser
  client-terminal  Open the terminal client

Options:
  --help, -h    Show this help message
  --open        Open browser to the web interface after starting (server mode only)
  --version, -v Show version information

Environment Variables:
  GATE_KEEPER_PORT     HTTP/HTTPS port (default: 9000)
  GATE_KEEPER_WS_PORT  WebSocket port (default: 9001)
  GATE_KEEPER_HTTPS    Enable HTTPS (default: true)

Examples:
  gate-keeper server              Start the server
  gate-keeper server --open       Start and open browser
  gate-keeper client              Open graphical client in browser
  gate-keeper client-terminal     Open terminal client
  GATE_KEEPER_PORT=8080 gate-keeper server  Start on port 8080

For more information, see: https://github.com/jhderojasUVa/gate-keeper
`);
};

/**
 * Opens the graphical client in a browser pointing to the server's web interface
 * @async
 * @returns {Promise<void>}
 */
export const openClient = async () => {
    try {
        const { exec } = await import('child_process');
        
        const port = process.env.GATE_KEEPER_PORT || 9000;
        const isHttps = process.env.GATE_KEEPER_HTTPS !== 'false';
        const protocol = isHttps ? 'https' : 'http';
        const url = `${protocol}://localhost:${port}`;
        
        log(`🌐 Opening graphical client at ${url}...`);
        
        let command;
        
        if (process.platform === 'darwin') {
            command = `open "${url}"`;
        } else if (process.platform === 'win32') {
            command = `start "${url}"`;
        } else if (isWSL()) {
            // In WSL, use PowerShell to open the URL
            log('   (Running in WSL, opening host browser...)');
            command = `powershell.exe -Command "Start-Process '${url}'"`;
        } else {
            command = `xdg-open "${url}"`;
        }
        
        exec(command, (error) => {
            if (error) {
                log(`❌ Failed to open browser: ${error.message}`);
                log(`   You can manually open: ${url}`);
                exitWithCode(1);
            } else {
                log(`✅ Graphical client opened in your browser!`);
            }
        });
    } catch (error) {
        log(`❌ Error opening graphical client: ${error.message}`);
        exitWithCode(1);
    }
};

/**
 * Shows version information
 */
export const showVersion = () => {
    try {
        const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
        log(`Gate Keeper v${packageJson.version}`);
    } catch (error) {
        log('Gate Keeper (version unknown)');
    }
};

/**
 * Starts the Gate Keeper server.
 * This function initializes the Express server, loads configuration, executes initial scripts,
 * and starts the WebSocket server.
 * @async
 * @returns {Promise<void>} A promise that resolves when the server is fully started.
 */
export const startGateKeeper = async () => {
    try {
        log('🚀 Starting Gate Keeper server...');

        // Dynamic imports to avoid issues when just showing help
        let expressLog, getConfigurationData, loadPlugins, configFileExists, executeAllScripts, GATE_KEEPER_STATE;
        let express_server, express_port, express_ws_port, isHTTPS, startWebSocket, broadcast;

        try {
            log('📦 Loading dependencies...');
            const logModule = await import('../libs/log.mjs');
            expressLog = logModule.expressLog;
            
            const confModule = await import('../libs/load_config.mjs');
            getConfigurationData = confModule.getConfigurationData;
            loadPlugins = confModule.loadPlugins;
            configFileExists = confModule.configFileExists;
            
            const scriptsModule = await import('../libs/execute_scripts.mjs');
            executeAllScripts = scriptsModule.executeAllScripts;
            
            const stateModule = await import('../libs/state.mjs');
            GATE_KEEPER_STATE = stateModule.STATE;
            
            log('📦 Loading server configuration...');
            const serverConfModule = await import('./server_conf.mjs');
            express_server = serverConfModule.express_server;
            express_port = serverConfModule.express_port;
            express_ws_port = serverConfModule.express_ws_port;
            isHTTPS = serverConfModule.isHTTPS;
            
            const wsModule = await import('./server_ws.mjs');
            startWebSocket = wsModule.startWebSocket;
            broadcast = wsModule.broadcast;
        } catch (importError) {
            log(`❌ Error loading dependencies: ${importError.message}`);
            if (importError.stack) {
                console.error(importError.stack);
            }
            exitWithCode(1);
        }

        // Check configuration
        log('📋 Checking configuration...');
        if (!configFileExists()) {
            log('⚠️  Warning: Configuration file not found. Using defaults.');
            log('   Run "gate-keeper-init" to create a configuration file.');
        }

        // Start the Express server and wait for it to be listening
        log(`🌐 Starting ${isHTTPS ? 'HTTPS' : 'HTTP'} server on port ${express_port}...`);
        await new Promise((resolve, reject) => {
            express_server.listen(express_port, () => {
                const protocol = isHTTPS ? 'https' : 'http';
                const url = `${protocol}://localhost:${express_port}`;
                log(`✅ Server started successfully!`);
                log(`   Web interface: ${url}`);
                log(`   WebSocket port: ${express_ws_port}`);

                expressLog({
                    message: `${isHTTPS ? 'HTTPS' : 'HTTP'} server started at ${url}`,
                    kind: `${isHTTPS ? 'HTTPS' : 'HTTP'} SERVER`,
                    severity: 'INFO'
                });
                resolve();
            });

            express_server.on('error', (error) => {
                log(`❌ Failed to start server: ${error.message}`);
                reject(error);
            });
        });

        // Load configuration data and plugins
        log('⚙️  Loading configuration and plugins...');
        const GATE_KEEPER_CONFIG_MODEL = getConfigurationData();
        const GATE_KEEPER_PLUGINS = loadPlugins(GATE_KEEPER_CONFIG_MODEL);

        if (GATE_KEEPER_PLUGINS.error) {
            log(`❌ Configuration error: ${GATE_KEEPER_PLUGINS.data}`);
            log('   Please check your gate-keeper.conf.json file.');
            exitWithCode(1);
        }

        log(`📜 Loaded ${GATE_KEEPER_PLUGINS.length} script(s) to execute.`);

        // Execute all configured scripts to check code quality
        log('🔍 Executing initial code quality checks...');
        try {
            const results = await executeAllScripts(GATE_KEEPER_PLUGINS);
            GATE_KEEPER_STATE.isWorking().setResults(results);
            const updatedState = await GATE_KEEPER_STATE.updateCanCommit();
            const canCommit = updatedState.canCommit;

            log('✅ Initial checks completed.');
            log(`   Can commit: ${canCommit ? '✅ Yes' : '❌ No'}`);

            if (!canCommit) {
                log('   Some checks failed. Check the web interface for details.');
            }

            // Broadcast the updated status to all connected clients
            const statusUpdate = {
                type: TYPES_MESSAGES.STATUS_UPDATE,
                data: {
                    canCommit: canCommit,
                    scripts: results
                },
                success: true
            };
            broadcast(statusUpdate);
        } catch (e) {
            log(`❌ Error executing scripts: ${e.message}`);
            expressLog({
                message: `Unable to execute the scripts\n        ${e}`,
                kind: 'SCRIPTS',
                severity: 'ERROR'
            });
        }

        // Start the WebSocket server for real-time communication
        log('🔌 Starting WebSocket server...');
        startWebSocket(express_ws_port);
        log('✅ WebSocket server started.');

        log('\n🎉 Gate Keeper is now running!');
        log('   Press Ctrl+C to stop the server.');

    } catch (error) {
        log(`💥 Failed to start Gate Keeper: ${error.message}`);
        if (error.stack) {
            console.error(error.stack);
        }
        log('   Make sure you have run "npm install" in the gate-keeper project directory.');
        exitWithCode(1);
    }
};

// Execute if run directly (not imported as a module)
// Check if running as main - works for both direct execution and npm-linked commands
if (isMainModule) {
    // Parse command line arguments
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h')) {
        showHelp();
        exitWithCode(0);
    }

    if (args.includes('--version') || args.includes('-v')) {
        showVersion();
        exitWithCode(0);
    }

    // Check if a command was provided
    if (args.length === 0) {
        log(`❌ Missing required command`);
        log('');
        showHelp();
        exitWithCode(1);
    }

    // Determine the mode: server, client, or client-terminal
    let mode = null;
    let modeIndex = -1;
    
    if (args.includes('server')) {
        mode = 'server';
        modeIndex = args.indexOf('server');
    } else if (args.includes('client')) {
        mode = 'client';
        modeIndex = args.indexOf('client');
    } else if (args.includes('client-terminal')) {
        mode = 'client-terminal';
        modeIndex = args.indexOf('client-terminal');
    } else {
        // Invalid command provided
        log(`❌ Unknown command: ${args[0]}`);
        log('');
        showHelp();
        exitWithCode(1);
    }

    // Extract options after the mode command
    const options = [
        ...args.slice(0, modeIndex),
        ...args.slice(modeIndex + 1)
    ];

    const openBrowser = options.includes('--open');

    // Check for invalid arguments based on mode
    let validOptions = [];
    if (mode === 'server') {
        validOptions = ['--open'];
    } // client and client-terminal have no options

    const invalidArgs = options.filter(arg => !validOptions.includes(arg));
    if (invalidArgs.length > 0) {
        log(`❌ Unknown argument(s): ${invalidArgs.join(', ')}`);
        log('   Use --help for usage information.');
        exitWithCode(1);
    }

    if (mode === 'client') {
        // Client mode: just open the browser to the public directory
        if (openBrowser) {
            log('⚠️  --open flag ignored in client mode');
        }
        openClient();
    } else if (mode === 'client-terminal') {
        // Terminal client mode: start the terminal client
        if (openBrowser) {
            log('⚠️  --open flag ignored in client-terminal mode');
        }
        (async () => {
            try {
                const { startTerminalClient } = await import('../terminal/client-terminal.mjs');
                await startTerminalClient();
            } catch (error) {
                exitWithCode(1);
            }
        })();
    } else {
        // Server mode: start the server (and optionally open browser)
        (async () => {
            try {
                await startGateKeeper();
                if (openBrowser) {
                    const { exec } = await import('child_process');
                    const { isHTTPS, express_port } = await import('./server_conf.mjs');
                    const protocol = isHTTPS ? 'https' : 'http';
                    const url = `${protocol}://localhost:${express_port}`;
                    log(`🌐 Opening browser to ${url}...`);
                    let command;
                    if (process.platform === 'darwin') {
                        command = `open "${url}"`;
                    } else if (process.platform === 'win32') {
                        command = `start "${url}"`;
                    } else if (isWSL()) {
                        log('   (Running in WSL, opening host browser...)');
                        command = `powershell.exe -Command "Start-Process '${url}'"`;
                    } else {
                        command = `xdg-open "${url}"`;
                    }
                    exec(command, (error) => {
                        if (error) {
                            log(`Failed to open browser: ${error.message}`);
                        }
                    });
                }
            } catch (error) {
                log(`❌ Fatal error: ${error.message}`);
                if (error.stack) {
                    console.error(error.stack);
                }
                exitWithCode(1);
            }
        })();
    }
}
