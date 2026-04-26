#!/usr/bin/env node

// Gate Keeper Server Entry Point
import { fileURLToPath } from 'url';
import fs from 'fs';
import { betaStartupRibbonLines, version } from '../libs/app_utils.js';

// Import message types
import { TYPES_MESSAGES } from '../models/wsServerRequest.model.js';

// Determine if running as main module (works for npm-linked commands)
const currentFileUrl = import.meta.url;
const currentFilePath = fileURLToPath(currentFileUrl);
const isMainModule = process.argv[1].includes('gate-keeper') || process.argv[1] === currentFilePath;

// Ensure stdout is flushed immediately
const log = (msg: string): void => {
    console.log(msg);
};

/**
 * Helper function to exit with proper flushing
 */
const exitWithCode = (code: number): never => {
    process.exit(code);
};

/**
 * Converts a WSL Linux path to Windows path format
 */
export const toWindowsPath = (linuxPath: string): string => {
    if (!linuxPath.startsWith('/mnt/')) {
        return linuxPath;
    }
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
 */
export const isWSL = (): boolean => {
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
export const showHelp = (): void => {
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
    GATE_KEEPER_MCP_PORT MCP port for AI agents (default: 9002)
  GATE_KEEPER_HTTPS    Enable HTTPS (default: true)

Examples:
  gate-keeper server              Start the server
  gate-keeper server --open       Start and open browser
  gate-keeper client              Open graphical client in browser
  gate-keeper client-terminal     Open terminal client
  gate-keeper client-terminal     Open terminal client
  GATE_KEEPER_PORT=8080 gate-keeper server  Start on port 8080

For more information, see: https://github.com/jhderojasUVa/gate-keeper
`);
};

/**
 * Opens the graphical client in a browser pointing to the server's web interface
 */
export const openClient = async (): Promise<void> => {
    try {
        const { exec } = await import('child_process');

        const port = process.env.GATE_KEEPER_PORT || 9000;
        const isHttps = process.env.GATE_KEEPER_HTTPS !== 'false';
        const protocol = isHttps ? 'https' : 'http';
        const url = `${protocol}://localhost:${port}`;

        log(`🌐 Opening graphical client at ${url}...`);

        let command: string;

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
                log(`❌ Failed to open browser: ${error.message}`);
                log(`   You can manually open: ${url}`);
                exitWithCode(1);
            } else {
                log(`✅ Graphical client opened in your browser!`);
            }
        });
    } catch (error) {
        log(`❌ Error opening graphical client: ${(error as Error).message}`);
        exitWithCode(1);
    }
};

/**
 * Shows version information
 */
export const showVersion = (): void => {
    log(`Gate Keeper v${version}`);
};

/**
 * Starts the Gate Keeper server.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const startGateKeeper = async (): Promise<void> => {
    try {
        betaStartupRibbonLines.forEach(log);
        log('🚀 Starting Gate Keeper server...');

        // Use dynamic imports to avoid loading modules when just showing help
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let expressLog: any,
            getConfigurationData: any,
            loadPlugins: any,
            configFileExists: any,
            executeAllScripts: any,
            GATE_KEEPER_STATE: any,
            express_server: any,
            express_port: any,
            express_ws_port: any,
            isHTTPS: any,
            startWebSocket: any,
            broadcast: any,
            startMcpServer: any,
            mcp_port: any;

        try {
            log('📦 Loading dependencies...');
            ({ expressLog } = await import('../libs/log.js'));
            ({ getConfigurationData, loadPlugins, configFileExists } = await import('../libs/load_config.js'));
            ({ executeAllScripts } = await import('../libs/execute_scripts.js'));
            ({ STATE: GATE_KEEPER_STATE } = await import('../libs/state.js'));

            log('📦 Loading server configuration...');
            ({ express_server, express_port, express_ws_port, isHTTPS } = await import('./server_conf.js'));
            ({ startWebSocket, broadcast } = await import('./server_ws.js'));
            ({ startMcpServer, mcp_port } = await import('./mcp_server.js'));
        } catch (importError) {
            log(`❌ Error loading dependencies: ${(importError as Error).message}`);
            if ((importError as Error).stack) {
                console.error((importError as Error).stack);
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
        await new Promise<void>((resolve, reject) => {
            express_server.listen(express_port, () => {
                const protocol = isHTTPS ? 'https' : 'http';
                const url = `${protocol}://localhost:${express_port}`;
                log(`✅ Server started successfully!`);
                log(`   Web interface: ${url}`);
                log(`   WebSocket port: ${express_ws_port}`);

                expressLog({
                    message: `${isHTTPS ? 'HTTPS' : 'HTTP'} server started at ${url}`,
                    kind: `${isHTTPS ? 'HTTPS' : 'HTTP'} SERVER`,
                    severity: 'INFO',
                });
                resolve();
            });

            express_server.on('error', (error: Error) => {
                log(`❌ Failed to start server: ${error.message}`);
                reject(error);
            });
        });

        log(`🤖 Starting MCP server on port ${mcp_port}...`);
        await startMcpServer();
        log(`✅ MCP server started at http://127.0.0.1:${mcp_port}/mcp`);

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
        GATE_KEEPER_STATE.setWorking(true);
        try {
            const results = await executeAllScripts(GATE_KEEPER_PLUGINS);
            GATE_KEEPER_STATE.setResults(results);
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
                data: GATE_KEEPER_STATE.getStatus(),
                success: true,
            };
            broadcast(statusUpdate);
        } catch (e) {
            log(`❌ Error executing scripts: ${(e as Error).message}`);
            expressLog({
                message: `Unable to execute the scripts\n        ${e}`,
                kind: 'SCRIPTS',
                severity: 'ERROR',
            });
        } finally {
            GATE_KEEPER_STATE.setWorking(false);
        }

        // Start the WebSocket server for real-time communication
        log('🔌 Starting WebSocket server...');
        startWebSocket(express_ws_port);
        log('✅ WebSocket server started.');

        log('\n🎉 Gate Keeper is now running!');
        log('   Press Ctrl+C to stop the server.');

    } catch (error) {
        log(`💥 Failed to start Gate Keeper: ${(error as Error).message}`);
        if ((error as Error).stack) {
            console.error((error as Error).stack);
        }
        log('   Make sure you have run "npm install" in the gate-keeper project directory.');
        exitWithCode(1);
    }
};

// Execute if run directly (not imported as a module)
if (isMainModule) {
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h')) {
        showHelp();
        exitWithCode(0);
    }

    if (args.includes('--version') || args.includes('-v')) {
        showVersion();
        exitWithCode(0);
    }

    if (args.length === 0) {
        log(`❌ Missing required command`);
        log('');
        showHelp();
        exitWithCode(1);
    }

    let mode: string | null = null;
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
        log(`❌ Unknown command: ${args[0]}`);
        log('');
        showHelp();
        exitWithCode(1);
    }

    const options = [
        ...args.slice(0, modeIndex),
        ...args.slice(modeIndex + 1),
    ];

    const openBrowser = options.includes('--open');

    let validOptions: string[] = [];
    if (mode === 'server') {
        validOptions = ['--open'];
    }

    const invalidArgs = options.filter((arg) => !validOptions.includes(arg));
    if (invalidArgs.length > 0) {
        log(`❌ Unknown argument(s): ${invalidArgs.join(', ')}`);
        log('   Use --help for usage information.');
        exitWithCode(1);
    }

    if (mode === 'client') {
        if (openBrowser) {
            log('⚠️  --open flag ignored in client mode');
        }
        openClient();
    } else if (mode === 'client-terminal') {
        if (openBrowser) {
            log('⚠️  --open flag ignored in client-terminal mode');
        }
        (async () => {
            try {
                const { startTerminalClient } = await import('../terminal/client-terminal.js');
                await startTerminalClient();
            } catch (error) {
                console.error('Failed to start terminal client:', error);
                exitWithCode(1);
            }
        })();
    } else {
        (async () => {
            try {
                await startGateKeeper();
                if (openBrowser) {
                    const { exec } = await import('child_process');
                    const { isHTTPS, express_port } = await import('./server_conf.js');
                    const protocol = isHTTPS ? 'https' : 'http';
                    const url = `${protocol}://localhost:${express_port}`;
                    log(`🌐 Opening browser to ${url}...`);
                    let command: string;
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
                log(`❌ Fatal error: ${(error as Error).message}`);
                if ((error as Error).stack) {
                    console.error((error as Error).stack);
                }
                exitWithCode(1);
            }
        })();
    }
}
