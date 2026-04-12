import http from 'http';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import * as z from 'zod/v4';
import { STATE } from '../libs/state.mjs';
import { version } from '../libs/app_utils.mjs';
import { expressLog } from '../libs/log.mjs';

export const mcp_port = Number(process.env.GATE_KEEPER_MCP_PORT || 9002);
export const mcp_host = process.env.GATE_KEEPER_MCP_HOST || '127.0.0.1';
export const mcp_path = '/mcp';

/**
 * Builds the current Gate Keeper status payload for API and MCP consumers.
 * @returns {{canCommit: boolean, inProgress: boolean, scripts: Array<object>, summary: string}} Current status snapshot.
 */
export const getGateKeeperStatus = () => {
    const status = STATE.getStatus();

    return {
        ...status,
        summary: status.inProgress
            ? 'Gate Keeper is still running the configured scripts.'
            : `Gate Keeper finished running the configured scripts. Commit is ${status.canCommit ? 'allowed' : 'blocked'}.`
    };
};

/**
 * Creates an MCP server instance exposing Gate Keeper tools.
 * @returns {McpServer} Configured MCP server.
 */
export const createGateKeeperMcpServer = () => {
    const server = new McpServer({
        name: 'gate-keeper',
        version,
    });

    // Single MCP tool consumed by agents to query commit/readiness state.
    server.registerTool('get_gate_keeper_status', {
        title: 'Get Gate Keeper Status',
        description: 'Returns whether Gate Keeper is still running scripts and whether the user can commit.',
        outputSchema: {
            canCommit: z.boolean(),
            inProgress: z.boolean(),
            summary: z.string(),
            scripts: z.array(z.object({}).passthrough())
        }
    }, async () => {
        const status = getGateKeeperStatus();

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(status, null, 2)
                }
            ],
            structuredContent: status
        };
    });

    return server;
};

/**
 * Sends a JSON-RPC method not allowed error response.
 * @param {import('express').Response} res - Express response object.
 * @returns {void}
 */
const methodNotAllowed = (res) => {
    res.status(405).json({
        jsonrpc: '2.0',
        error: {
            code: -32000,
            message: 'Method not allowed.'
        },
        id: null
    });
};

/**
 * Creates an Express application that serves the MCP endpoint.
 * @param {string} [host=mcp_host] - Host used for MCP host validation.
 * @returns {import('express').Express} Configured MCP Express app.
 */
export const createMcpApp = (host = mcp_host) => {
    const app = createMcpExpressApp({ host });

    app.get('/status', (req, res) => {
        res.json(getGateKeeperStatus());
    });

    app.post(mcp_path, async (req, res) => {
        // Create a short-lived MCP server per HTTP request to keep this endpoint stateless.
        const server = createGateKeeperMcpServer();
        const transport = new StreamableHTTPServerTransport({
            // Stateless mode: no long-lived MCP session ids are required.
            sessionIdGenerator: undefined
        });
        let cleanedUp = false;

        const cleanup = () => {
            if (cleanedUp) {
                return;
            }

            cleanedUp = true;
            void transport.close();
            void server.close();
        };

        res.once('close', cleanup);
        res.once('finish', cleanup);

        try {
            await server.connect(transport);
            await transport.handleRequest(req, res, req.body);
        } catch (error) {
            expressLog({
                message: `MCP request handling failed: ${error instanceof Error ? error.message : error}`,
                kind: 'MCP SERVER',
                severity: 'ERROR'
            });

            if (!res.headersSent) {
                res.status(500).json({
                    jsonrpc: '2.0',
                    error: {
                        code: -32603,
                        message: 'Internal server error'
                    },
                    id: null
                });
            }

            cleanup();
        }
    });

    app.get(mcp_path, (req, res) => methodNotAllowed(res));
    app.delete(mcp_path, (req, res) => methodNotAllowed(res));

    return app;
};

/**
 * Starts the standalone MCP HTTP server.
 * @param {number} [port=mcp_port] - TCP port for the MCP server.
 * @param {string} [host=mcp_host] - Host address for the MCP server.
 * @returns {Promise<import('http').Server>} Started HTTP server instance.
 */
export const startMcpServer = async (port = mcp_port, host = mcp_host) => {
    const app = createMcpApp(host);
    const server = http.createServer(app);

    await new Promise((resolve, reject) => {
        server.listen(port, host, () => {
            expressLog({
                message: `MCP server started at http://${host}:${port}${mcp_path}`,
                kind: 'MCP SERVER',
                severity: 'INFO'
            });
            resolve();
        });

        server.on('error', reject);
    });

    return server;
};
