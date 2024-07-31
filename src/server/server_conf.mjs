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

export const express_app = express();

// If no port is setted use the standard 9000
export const express_port = process.env.GATE_KEEPER_PORT || 9000;
export const express_ws_port = process.env.GATE_KEEPER_WS_PORT || 9001;
export const isHTTPS = (process.env.GATE_KEEPER_HTTPS === 'false' ? false : true) || true

// Static assets
express_app.use(express.static(`${__dirname}/../../public`));

// Can commit endpoint
express_app.get('/cancommit', (req, res) => {
    res.json({ cancommit: STATE.canCommit });
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