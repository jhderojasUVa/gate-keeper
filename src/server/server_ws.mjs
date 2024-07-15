// Websocket server configuration
import WebSocket, { WebSocketServer } from 'ws';
import { expressLog } from '../libs/log.mjs';
import { express_ws_port } from './server_conf.mjs';
// Messages
import * as WebSocketResponses from './responses/server_responses.mjs';
import * as WebSocketRequest from './requests/server_request.mjs';
// Constants
import { TYPES_MESSAGES } from '../models/wsServerRequest.model.mjs';

// Websocket creation
const wss = new WebSocketServer({
    port: express_ws_port,
    concurrencyLimit: 2,
    threshold: 1024
});

export const startWebSocket = () => {
    expressLog({
        message: `Websocket server started at port ${express_ws_port}`,
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
            expressLog({
                message: 'Error on client connection' + error,
                kind: 'WEB SOCKET',
                severity: 'INFO'
            });
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
                    break;
                case TYPES_MESSAGES.FIRST_RUN:
                    break;
                case TYPES_MESSAGES.EXIT:
                    break;
                case TYPES_MESSAGES.FATAL_ERROR:
                    break;
                default:
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