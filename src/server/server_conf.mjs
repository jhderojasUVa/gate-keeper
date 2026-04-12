// Express server configuration and exports
import express from 'express';
import http from 'http';
import https from 'https';
// SSL
import selfsigned from 'selfsigned';
// Directory utils
import { __dirname } from '../libs/app_utils.mjs';

// Certificate creation
const pems = selfsigned.generate(null, { days: 365 });

// Import state
import { STATE } from '../libs/state.mjs';

// Application creation and setup

/**
 * Express application used by Gate Keeper HTTP(S) server.
 * @type {import('express').Express}
 */
export const express_app = express();

// If no port is setted use the standard 9000
/**
 * HTTP(S) port used by the main web server.
 * @type {number|string}
 */
export const express_port = process.env.GATE_KEEPER_PORT || 9000;
/**
 * Port used by the WebSocket server.
 * @type {number|string}
 */
export const express_ws_port = process.env.GATE_KEEPER_WS_PORT || 9001;
/**
 * Whether the main server should run in HTTPS mode.
 * @type {boolean}
 */
export const isHTTPS = process.env.GATE_KEEPER_HTTPS !== 'false';

// Static assets
express_app.use(express.static(`${__dirname}/../../public`));

// Can commit endpoint
/**
 * Returns whether the current state allows committing.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {void}
 */
express_app.get('/cancommit', (req, res) => {
    res.json({ cancommit: STATE.getStatus().canCommit });
});

// Full status endpoint
/**
 * Returns the full Gate Keeper status snapshot.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {void}
 */
express_app.get('/status', (req, res) => {
    res.json(STATE.getStatus());
});

// WS port endpoint
/**
 * Returns the WebSocket server port.
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @returns {void}
 */
express_app.get('/ws-port', (req, res) => {
    res.json({ port: express_ws_port });
});

// Create server
let express_server = undefined;

if (isHTTPS) {
    express_server = https.createServer({
        key: pems.private,
        cert: pems.cert,
    }, express_app);
} else {
    express_server = http.createServer(express_app);
}

export { express_server };