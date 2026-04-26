// Express server configuration and exports
import express from 'express';
import http from 'http';
import https from 'https';
// SSL
import selfsigned from 'selfsigned';
// Directory utils
import { __dirname } from '../libs/app_utils.js';

// Certificate creation
const pems = selfsigned.generate(undefined, { days: 365 });

// Import state
import { STATE } from '../libs/state.js';

// Application creation and setup

/**
 * Express application used by Gate Keeper HTTP(S) server.
 */
export const express_app = express();

/**
 * HTTP(S) port used by the main web server.
 */
export const express_port: number = Number(process.env.GATE_KEEPER_PORT || 9000);

/**
 * Port used by the WebSocket server.
 */
export const express_ws_port: number = Number(process.env.GATE_KEEPER_WS_PORT || 9001);

/**
 * Whether the main server should run in HTTPS mode.
 */
export const isHTTPS: boolean = process.env.GATE_KEEPER_HTTPS !== 'false';

// Static assets
express_app.use(express.static(`${__dirname}/../../public`));

// Can commit endpoint
express_app.get('/cancommit', (req, res) => {
    res.json({ cancommit: STATE.getStatus().canCommit });
});

// Full status endpoint
express_app.get('/status', (req, res) => {
    res.json(STATE.getStatus());
});

// WS port endpoint
express_app.get('/ws-port', (req, res) => {
    res.json({ port: express_ws_port });
});

// Create server
let express_server: http.Server;

if (isHTTPS) {
    express_server = https.createServer({
        key: pems.private,
        cert: pems.cert,
    }, express_app);
} else {
    express_server = http.createServer(express_app);
}

export { express_server };
