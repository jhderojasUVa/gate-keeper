// Websocket server configuration
import WebSocket, { WebSocketServer } from 'ws';
import { expressLog } from '../libs/log.js';
import { express_ws_port } from './server_conf.js';
// Messages
import * as WebSocketResponses from './responses/server_responses.js';
import { WSResponse } from './response.interface.js';
// Constants
import { TYPES_MESSAGES } from '../models/wsServerRequest.model.js';
// State machine
import { STATE as GATE_KEEPER_STATE } from '../libs/state.js';

// Keep track of connected clients
export const clients: Set<WebSocket> = new Set();

/**
 * Broadcasts a payload to all currently connected WebSocket clients.
 */
export const broadcast = (message: unknown): void => {
    const messageStr = JSON.stringify(message);
    clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(messageStr, (error) => {
                if (error) {
                    expressLog({
                        message: 'Error broadcasting message: ' + error,
                        kind: 'WEB SOCKET',
                        severity: 'ERROR',
                    });
                }
            });
        }
    });
};

/**
 * Starts the Gate Keeper WebSocket server and registers socket handlers.
 */
export const startWebSocket = (): void => {
    const wss = new WebSocketServer({
        port: express_ws_port,
    });

    expressLog({
        message: `Websocket server started at ${process.env.GATE_KEEPER_HTTPS === 'false' ? 'ws' : 'wss'}://localhost:${express_ws_port}`,
        kind: 'WEB SOCKET',
    });

    // Server events
    wss.on('connection', (ws: WebSocket) => {
        // Add client to the set
        clients.add(ws);

        expressLog({
            message: `Connection established`,
            kind: 'WEB SOCKET',
        });

        // Send welcome message
        ws.send(WSResponse(WebSocketResponses.connection), (error) => {
            if (error) {
                expressLog({
                    message: 'Error on client connection' + error,
                    kind: 'WEB SOCKET',
                    severity: 'INFO',
                });
            }
        });

        // Send current status after connection
        const currentStatus = {
            type: TYPES_MESSAGES.STATUS_UPDATE,
            data: GATE_KEEPER_STATE.getStatus(),
            success: true,
        };
        ws.send(WSResponse(currentStatus), (error) => {
            if (error) {
                expressLog({
                    message: 'Error sending current status: ' + error,
                    kind: 'WEB SOCKET',
                    severity: 'ERROR',
                });
            }
        });

        // Socket events
        ws.on('message', (rawMessage: Buffer | string) => {
            expressLog({
                message: `Message received: ${rawMessage}`,
                kind: 'WEB SOCKET',
                severity: 'INFO',
            });

            const message = JSON.parse(rawMessage.toString()) as { type: string };

            // Check message if is for running things again
            switch (message.type.toUpperCase()) {
                case TYPES_MESSAGES.RE_CHECK:
                    expressLog({
                        message: `ReCheck asked by client`,
                        kind: 'WEB SOCKET',
                        severity: 'INFO',
                    });
                    break;
                case TYPES_MESSAGES.FIRST_RUN:
                    expressLog({
                        message: `First run`,
                        kind: 'WEB SOCKET',
                        severity: 'INFO',
                    });
                    break;
                case TYPES_MESSAGES.EXIT:
                    expressLog({
                        message: `Client asked for exit`,
                        kind: 'WEB SOCKET',
                        severity: 'INFO',
                    });
                    break;
                case TYPES_MESSAGES.FATAL_ERROR:
                    expressLog({
                        message: `Error message by client`,
                        kind: 'WEB SOCKET',
                        severity: 'ERROR',
                    });
                    break;
                default:
                    expressLog({
                        message: `Unknow message... we do nothing`,
                        kind: 'WEB SOCKET',
                        severity: 'INFO',
                    });
                    break;
            }
        });

        ws.on('error', (error: Error) => {
            expressLog({
                message: `An error has happened!\n${error}`,
                kind: 'WEB SOCKET',
                severity: 'ERROR',
            });

            expressLog({
                message: 'Exiting',
                kind: 'APPLICATION',
                severity: 'ERROR',
            });

            process.exit(1);
        });

        ws.on('close', () => {
            // Remove client from the set
            clients.delete(ws);
            expressLog({
                message: 'Client disconnected',
                kind: 'WEB SOCKET',
                severity: 'INFO',
            });
        });
    });
};
