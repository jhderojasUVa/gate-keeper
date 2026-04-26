#!/usr/bin/env node

// Gate Keeper Terminal Client
// Provides a terminal-based interface to monitor Gate Keeper status and logs

import * as blessed from 'blessed';
import { WebSocket } from 'ws';
import { colors } from '../libs/colors.js';

// Global state
let wsConnection: WebSocket | null = null;
let screen: blessed.Widgets.Screen | null = null;
let statusBox: blessed.Widgets.BoxElement | null = null;
let logBox: blessed.Widgets.BoxElement | null = null;
let wsStatusBox: blessed.Widgets.BoxElement | null = null;
let statusMessageBox: blessed.Widgets.BoxElement | null = null;

/**
 * Formats timestamp for logs
 */
const formatTime = (): string => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    }) + '.' + now.getMilliseconds().toString().padStart(3, '0');
};

/**
 * Gets WebSocket port from server
 */
const getWsPort = async (serverUrl: string): Promise<number> => {
    try {
        const response = await fetch(`${serverUrl}/ws-port`);
        const data = await response.json() as { port: number };
        return data.port;
    } catch (error) {
        console.error('Failed to get ws port:', error);
        return 9001; // Default fallback
    }
};

/**
 * Checks commit status from server
 */
const checkCommitStatus = async (serverUrl: string): Promise<boolean> => {
    try {
        const response = await fetch(`${serverUrl}/cancommit`);
        const data = await response.json() as { cancommit: boolean };
        return data.cancommit;
    } catch (error) {
        console.error('Failed to check commit permission:', error);
        return false;
    }
};

/**
 * Updates the commit status display
 */
const updateCommitStatus = (canCommit: boolean): void => {
    if (!statusBox) return;

    const title = canCommit ? 'Ready to Commit' : 'Commit Blocked';
    const desc = canCommit
        ? 'All checks passed. You can commit safely.'
        : 'Gates are currently closed. Check logs.';

    const color = canCommit ? colors.text.green : colors.text.red;
    const bgColor = canCommit ? colors.background.green : colors.background.red;

    statusBox.setContent(
        `${color}${bgColor} ${title} ${colors.reset}\n\n${desc}`
    );
    screen?.render();
};

/**
 * Adds a log entry to the log box
 */
const addLogEntry = (message: { success?: boolean; type?: string; data?: unknown }): void => {
    if (!logBox) return;

    const isError = message.success === false ||
                   message.type === 'ERROR' ||
                   message.type === 'FATAL_ERROR';

    const msgType = message.type || 'UNKNOWN';
    let dataContent = '';

    if (typeof message.data === 'object') {
        dataContent = JSON.stringify(message.data, null, 2);
    } else {
        dataContent = String(message.data || '');
    }

    const time = formatTime();
    const color = isError ? colors.text.red : colors.text.green;
    const icon = isError ? '⚠️' : 'ℹ️';

    const logEntry = `[${time}] ${color}${icon} ${msgType}${colors.reset}\n${dataContent}\n\n`;

    logBox.insertTop(logEntry);
    logBox.setScrollPerc(0);
    screen?.render();
};

/**
 * Updates WebSocket connection status
 */
const updateWsStatus = (status: string): void => {
    if (!wsStatusBox) return;

    let color: string, text: string;
    switch (status) {
        case 'connected':
            color = colors.text.green;
            text = 'Connected (Live)';
            break;
        case 'connecting':
            color = colors.text.yellow;
            text = 'Connecting...';
            break;
        case 'disconnected':
            color = colors.text.red;
            text = 'Disconnected';
            break;
        default:
            color = colors.text.gray;
            text = 'Unknown';
    }

    wsStatusBox.setContent(`${color}●${colors.reset} ${text}`);
    screen?.render();
};

/**
 * Updates the status message in the bottom left box
 */
const updateStatusMessage = (message: string): void => {
    if (!statusMessageBox) return;

    statusMessageBox.setContent(message);
    screen?.render();
};

/**
 * Connects to WebSocket server
 */
const connectWebSocket = (wsUrl: string): void => {
    updateWsStatus('connecting');

    try {
        wsConnection = new WebSocket(wsUrl);
    } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        updateWsStatus('disconnected');
        setTimeout(() => connectWebSocket(wsUrl), 5000);
        return;
    }

    wsConnection.onopen = () => {
        updateWsStatus('connected');
        checkCommitStatus('http://localhost:9000').then(updateCommitStatus);
    };

    wsConnection.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data as string) as {
                type?: string;
                success?: boolean;
                data?: { canCommit?: boolean; scripts?: Array<{ name?: string; result?: unknown }> };
            };

            if (message.type === 'STATUS_UPDATE' && message.data) {
                updateCommitStatus(message.data.canCommit ?? false);
                if (message.data.scripts) {
                    message.data.scripts.forEach((script) => {
                        addLogEntry({
                            success: script.result ? true : false,
                            type: 'SCRIPT_RESULT',
                            data: `${script.name}: ${script.result || 'Failed'}`,
                        });
                    });
                }
            } else {
                addLogEntry(message);
            }
        } catch (error) {
            console.error('Error processing WebSocket message:', error);
            addLogEntry({
                success: false,
                type: 'PARSE_ERROR',
                data: 'Failed to parse message: ' + event.data,
            });
        }
    };

    wsConnection.onclose = () => {
        updateWsStatus('disconnected');
        setTimeout(() => connectWebSocket(wsUrl), 5000);
    };

    wsConnection.onerror = (error) => {
        console.error('WebSocket error:', error);
        wsConnection?.close();
    };
};

/**
 * Initializes the terminal UI
 */
const initUI = (): void => {
    // Skip UI initialization in test environment
    if (typeof process !== 'undefined' && process.env.VITEST) {
        return;
    }

    // Create screen
    screen = blessed.screen({
        smartCSR: true,
        title: 'Gate Keeper Terminal Client',
    });

    // Quit on Ctrl+C or q
    screen.key(['escape', 'q', 'C-c'], () => {
        if (wsConnection) {
            wsConnection.close();
        }
        process.exit(0);
    });

    // Header with title and WS status
    const header = blessed.box({
        top: 0,
        left: 0,
        width: '100%',
        height: 3,
        content: `${colors.text.cyan}${colors.bright}Gate Keeper${colors.reset} - Live System Monitor`,
        border: {
            type: 'line',
        },
        style: {
            border: {
                fg: 'cyan',
            },
        },
    });

    wsStatusBox = blessed.box({
        top: 0,
        right: 0,
        width: 20,
        height: 3,
        content: `${colors.text.yellow}●${colors.reset} Connecting...`,
    });

    header.append(wsStatusBox);

    // Status section
    statusBox = blessed.box({
        top: 3,
        left: 0,
        width: '50%',
        height: 6,
        label: ' Commit Status ',
        border: {
            type: 'line',
        },
        style: {
            border: {
                fg: 'white',
            },
        },
        content: `${colors.text.yellow}Checking Permission${colors.reset}\n\nAwaiting server verification...`,
    });

    // Log section
    logBox = blessed.box({
        top: 3,
        right: 0,
        width: '50%',
        height: '100%-3',
        label: ' System Feed ',
        border: {
            type: 'line',
        },
        style: {
            border: {
                fg: 'white',
            },
        },
        scrollable: true,
        alwaysScroll: true,
        scrollbar: {
            ch: ' ',
            style: {
                bg: 'blue',
            },
        },
    });

    // Status message box at bottom left
    statusMessageBox = blessed.box({
        bottom: 0,
        left: 0,
        width: '50%',
        height: 3,
        content: '',
        border: {
            type: 'line',
        },
        style: {
            border: {
                fg: 'white',
            },
        },
    });

    // Add elements to screen
    screen.append(header);
    screen.append(statusBox);
    screen.append(logBox);
    screen.append(statusMessageBox);

    screen.render();
};

interface TerminalClientOptions {
    port?: number | string;
}

/**
 * Starts the terminal client
 */
export const startTerminalClient = async (options: TerminalClientOptions = {}): Promise<void> => {
    const port = options.port || process.env.GATE_KEEPER_PORT || 9000;
    const isHttps = process.env.GATE_KEEPER_HTTPS !== 'false';
    const protocol = isHttps ? 'https' : 'http';
    const serverUrl = `${protocol}://localhost:${port}`;

    // Initialize UI
    initUI();

    updateStatusMessage('🚀 Starting Gate Keeper Terminal Client...');

    // Get WebSocket port
    const wsPort = await getWsPort(serverUrl);
    const wsUrl = `ws://localhost:${wsPort}`;

    updateStatusMessage(`🔌 Connecting to WebSocket at ${wsUrl}...`);

    // Connect to WebSocket
    connectWebSocket(wsUrl);

    // Initial status check
    const canCommit = await checkCommitStatus(serverUrl);
    updateCommitStatus(canCommit);

    updateStatusMessage('✅ Terminal client started. Press q or Ctrl+C to exit.');
};

// Run if executed directly (skip in test environment)
if (import.meta.url === `file://${process.argv[1]}` && !(typeof process !== 'undefined' && process.env.VITEST)) {
    startTerminalClient();
}
