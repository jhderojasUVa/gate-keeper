// Websocket server configuration
import WebSocket, { WebSocketServer } from 'ws';
import { expressLog } from '../libs/log.mjs';
import { express_ws_port } from './server_conf.mjs';
// Messages
import * as WebSocketResponses from './responses/server_responses.mjs';
import * as WebSocketRequest from './requests/server_request.mjs';
// Constants
import { TYPES_MESSAGES } from '../models/wsServerRequest.model.mjs';
// State machine
import { STATE as GATE_KEEPER_STATE } from '../libs/state.mjs';

// Websocket creation
const wss = new WebSocketServer({
    port: express_ws_port,
    concurrencyLimit: 2,
    threshold: 1024
});

export const startWebSocket = () => {
    expressLog({
        message: `Websocket server started at ${process.env.GATE_KEEPER_HTTPS === 'false' ? 'ws': 'wss'}://localhost:${express_ws_port}`,
        kind: 'WEB SOCKET',
    });

    // Server events
    wss.on('connection', (ws) => {
        expressLog({
            message: `Connection stablished`,
            kind: 'WEB SOCKET',
        });

        // send welcome message
        ws.send(WebSocketResponses.connection, (error) => {
            if (error) {
                expressLog({
                    message: 'Error on client connection' + error,
                    kind: 'WEB SOCKET',
                    severity: 'INFO'
                });
            }

            // Send current status
        });

        // Socket events
        ws.on('message', (rawMessage) => {
            expressLog({
                message: `Message received: ${message}`,
                kind: 'WEB SOCKET',
                severity: 'INFO',
            });

            const message = JSON.parse(rawMessage);

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

        ws.on('error', (error) => {
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

        ws.send(JSON.stringify(WebSocketResponses.connection));
    });


};