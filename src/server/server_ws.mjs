// Websocket server configuration
import WebSocket, { WebSocketServer } from 'ws';
import { expressLog } from '../libs/log.mjs';
import { express_ws_port } from './server_conf.mjs';
// Messages
import * as WebSocketResponses from './responses/server_responses.mjs'

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

        // Socket events
        ws.on('message', (message) => {
            expressLog({
                message: `Message received: ${message}`,
                kind: 'WEB SOCKET',
                severity: 'INFO',
            });
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