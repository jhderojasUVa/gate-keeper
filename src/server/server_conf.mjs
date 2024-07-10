// Express server configuration and exports
import express from 'express';
import http from 'http';

// Application creation and setup

export const express_app = express();

// If no port is setted use the standard 9000
export const express_port = process.env.GATE_KEEPER_PORT || 9000;
export const express_ws_port = process.env.GATE_KEEPER_WS_PORT || 9001;

// Create server
export const express_server = http.createServer(express_app);