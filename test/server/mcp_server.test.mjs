import http from 'http';
import request from 'supertest';
import { afterEach, beforeEach, vi } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { STATE } from '../../src/libs/state.ts';
import {
    createMcpApp,
    getGateKeeperStatus,
    mcp_host,
    mcp_path,
    mcp_port,
    startMcpServer,
} from '../../src/server/mcp_server.ts';

const MCP_SERVER_MODULE_PATH = '../../src/server/mcp_server.ts';
const STATE_MODULE_PATH = '../../src/libs/state.ts';

const resetMcpServerModuleMocks = () => {
    vi.doUnmock('@modelcontextprotocol/sdk/server/mcp.js');
    vi.doUnmock('@modelcontextprotocol/sdk/server/streamableHttp.js');
};

const importFreshMcpServerArtifacts = async ({
    MockMcpServer,
    MockStreamableHTTPServerTransport,
} = {}) => {
    vi.resetModules();
    resetMcpServerModuleMocks();

    if (MockMcpServer) {
        vi.doMock('@modelcontextprotocol/sdk/server/mcp.js', () => ({
            McpServer: MockMcpServer,
        }));
    }

    if (MockStreamableHTTPServerTransport) {
        vi.doMock('@modelcontextprotocol/sdk/server/streamableHttp.js', () => ({
            StreamableHTTPServerTransport: MockStreamableHTTPServerTransport,
        }));
    }

    const [mcpServerModule, stateModule] = await Promise.all([
        import(MCP_SERVER_MODULE_PATH),
        import(STATE_MODULE_PATH),
    ]);

    return {
        ...mcpServerModule,
        STATE: stateModule.STATE,
    };
};

const flushPromises = async () => {
    await new Promise((resolve) => setImmediate(resolve));
};

describe('MCP Server', () => {
    let server;
    let transport;
    let client;
    let baseUrl;

    const closeWithTimeout = async (promiseFactory, timeoutMs = 3000) => {
        await Promise.race([
            promiseFactory(),
            new Promise((resolve) => setTimeout(resolve, timeoutMs))
        ]);
    };

    beforeEach(async () => {
        STATE.clearAll();
        STATE.canCommit = true;
        STATE.setWorking(false);
        STATE.setResults([{ name: 'lint', result: 'passed' }]);

        const app = createMcpApp('127.0.0.1');
        server = http.createServer(app);

        await new Promise((resolve) => {
            server.listen(0, '127.0.0.1', resolve);
        });

        const { port } = server.address();
        baseUrl = `http://127.0.0.1:${port}/mcp`;
        client = new Client({ name: 'gate-keeper-test-client', version: '1.0.0' });
        transport = new StreamableHTTPClientTransport(new URL(baseUrl));
        await client.connect(transport);
    });

    afterEach(async () => {
        if (client) {
            await closeWithTimeout(() => client.close());
            client = undefined;
        }

        if (transport) {
            await closeWithTimeout(() => transport.close());
            transport = undefined;
        }

        if (server) {
            // Ensure keep-alive sockets do not outlive test teardown.
            if (typeof server.closeAllConnections === 'function') {
                server.closeAllConnections();
            }
            await closeWithTimeout(() => new Promise((resolve) => server.close(resolve)));
            server = undefined;
        }

        vi.restoreAllMocks();
        resetMcpServerModuleMocks();
    });

    it('should export the MCP configuration constants', () => {
        expect(mcp_port).toBe(Number(process.env.GATE_KEEPER_MCP_PORT || 9002));
        expect(mcp_host).toBe(process.env.GATE_KEEPER_MCP_HOST || '127.0.0.1');
        expect(mcp_path).toBe('/mcp');
    });

    it('should build a finished summary when commits are allowed', () => {
        STATE.canCommit = true;
        STATE.setWorking(false);

        expect(getGateKeeperStatus()).toEqual({
            canCommit: true,
            inProgress: false,
            summary: 'Gate Keeper finished running the configured scripts. Commit is allowed.',
            scripts: [{ name: 'lint', result: 'passed' }],
        });
    });

    it('should build a finished summary when commits are blocked', () => {
        STATE.canCommit = false;
        STATE.setWorking(false);

        expect(getGateKeeperStatus()).toEqual({
            canCommit: false,
            inProgress: false,
            summary: 'Gate Keeper finished running the configured scripts. Commit is blocked.',
            scripts: [{ name: 'lint', result: 'passed' }],
        });
    });

    it('should expose the gate keeper status tool', async () => {
        const tools = await client.listTools();

        expect(tools.tools.map((tool) => tool.name)).toContain('get_gate_keeper_status');
    });

    it('should return commit and progress status through MCP', async () => {
        STATE.canCommit = false;
        STATE.setWorking(true);

        const result = await client.callTool({
            name: 'get_gate_keeper_status'
        });

        expect(result.structuredContent).toEqual({
            canCommit: false,
            inProgress: true,
            summary: 'Gate Keeper is still running the configured scripts.',
            scripts: [{ name: 'lint', result: 'passed' }]
        });
    });

    it('should return the HTTP status payload', async () => {
        STATE.canCommit = false;
        STATE.setWorking(true);

        const response = await request(createMcpApp())
            .get('/status')
            .expect(200);

        expect(response.body).toEqual({
            canCommit: false,
            inProgress: true,
            summary: 'Gate Keeper is still running the configured scripts.',
            scripts: [{ name: 'lint', result: 'passed' }],
        });
    });

    it('should reject unsupported GET and DELETE calls to /mcp', async () => {
        const app = createMcpApp();
        const expectedBody = {
            jsonrpc: '2.0',
            error: {
                code: -32000,
                message: 'Method not allowed.',
            },
            id: null,
        };

        const [getResponse, deleteResponse] = await Promise.all([
            request(app).get('/mcp'),
            request(app).delete('/mcp'),
        ]);

        expect(getResponse.status).toBe(405);
        expect(getResponse.body).toEqual(expectedBody);
        expect(deleteResponse.status).toBe(405);
        expect(deleteResponse.body).toEqual(expectedBody);
    });

    it('should register the MCP tool and return structured content', async () => {
        const registrations = [];

        class MockMcpServer {
            constructor(config) {
                this.config = config;
            }

            registerTool(name, definition, handler) {
                registrations.push({ name, definition, handler });
            }
        }

        const { createGateKeeperMcpServer, STATE: isolatedState } = await importFreshMcpServerArtifacts({
            MockMcpServer,
        });

        isolatedState.clearAll();
        isolatedState.canCommit = false;
        isolatedState.setWorking(false);
        isolatedState.setResults([{ name: 'tests', result: 'failed' }]);

        const serverInstance = createGateKeeperMcpServer();
        const [{ name, definition, handler }] = registrations;
        const result = await handler();

        expect(serverInstance).toBeInstanceOf(MockMcpServer);
        expect(serverInstance.config).toMatchObject({
            name: 'gate-keeper',
            version: expect.any(String),
        });
        expect(name).toBe('get_gate_keeper_status');
        expect(definition).toMatchObject({
            title: 'Get Gate Keeper Status',
            description: expect.stringContaining('Returns whether Gate Keeper'),
            outputSchema: expect.objectContaining({
                canCommit: expect.any(Object),
                inProgress: expect.any(Object),
                summary: expect.any(Object),
                scripts: expect.any(Object),
            }),
        });
        expect(result.structuredContent).toEqual({
            canCommit: false,
            inProgress: false,
            summary: 'Gate Keeper finished running the configured scripts. Commit is blocked.',
            scripts: [{ name: 'tests', result: 'failed' }],
        });
        expect(result.content).toEqual([
            {
                type: 'text',
                text: JSON.stringify(result.structuredContent, null, 2),
            },
        ]);
    });

    it('should return an internal error when connecting the MCP server fails', async () => {
        const connectError = new Error('connect failed');
        const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
        const closeTransport = vi.fn();
        const closeServer = vi.fn();

        class MockMcpServer {
            registerTool() {}
            connect = vi.fn(async () => {
                throw connectError;
            });
            close = closeServer;
        }

        class MockStreamableHTTPServerTransport {
            close = closeTransport;
            async handleRequest() {}
        }

        const { createMcpApp: createMockedMcpApp } = await importFreshMcpServerArtifacts({
            MockMcpServer,
            MockStreamableHTTPServerTransport,
        });

        const response = await request(createMockedMcpApp())
            .post('/mcp')
            .send({ jsonrpc: '2.0', id: 1, method: 'tools/list' })
            .expect(500);

        await flushPromises();

        expect(response.body).toEqual({
            jsonrpc: '2.0',
            error: {
                code: -32603,
                message: 'Internal server error',
            },
            id: null,
        });
        expect(closeTransport).toHaveBeenCalledTimes(1);
        expect(closeServer).toHaveBeenCalledTimes(1);
        expect(consoleLog).toHaveBeenCalledWith(
            expect.stringContaining('MCP request handling failed: connect failed')
        );
    });

    it('should return an internal error when handling the MCP request fails before headers are sent', async () => {
        const requestError = new Error('handle failed');
        const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
        const closeTransport = vi.fn();
        const closeServer = vi.fn();

        class MockMcpServer {
            registerTool() {}
            connect = vi.fn(async () => {});
            close = closeServer;
        }

        class MockStreamableHTTPServerTransport {
            close = closeTransport;
            async handleRequest() {
                throw requestError;
            }
        }

        const { createMcpApp: createMockedMcpApp } = await importFreshMcpServerArtifacts({
            MockMcpServer,
            MockStreamableHTTPServerTransport,
        });

        const response = await request(createMockedMcpApp())
            .post('/mcp')
            .send({ jsonrpc: '2.0', id: 2, method: 'tools/call' })
            .expect(500);

        await flushPromises();

        expect(response.body).toEqual({
            jsonrpc: '2.0',
            error: {
                code: -32603,
                message: 'Internal server error',
            },
            id: null,
        });
        expect(closeTransport).toHaveBeenCalledTimes(1);
        expect(closeServer).toHaveBeenCalledTimes(1);
        expect(consoleLog).toHaveBeenCalledWith(
            expect.stringContaining('MCP request handling failed: handle failed')
        );
    });

    it('should log non-Error request failures', async () => {
        const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});

        class MockMcpServer {
            registerTool() {}
            connect = vi.fn(async () => {});
            close = vi.fn();
        }

        class MockStreamableHTTPServerTransport {
            close = vi.fn();
            async handleRequest() {
                throw 'plain failure';
            }
        }

        const { createMcpApp: createMockedMcpApp } = await importFreshMcpServerArtifacts({
            MockMcpServer,
            MockStreamableHTTPServerTransport,
        });

        await request(createMockedMcpApp())
            .post('/mcp')
            .send({ jsonrpc: '2.0', id: 5, method: 'tools/call' })
            .expect(500);

        await flushPromises();

        expect(consoleLog).toHaveBeenCalledWith(
            expect.stringContaining('MCP request handling failed: plain failure')
        );
    });

    it('should only clean up once after a successful MCP response', async () => {
        const closeTransport = vi.fn();
        const closeServer = vi.fn();

        class MockMcpServer {
            registerTool() {}
            connect = vi.fn(async () => {});
            close = closeServer;
        }

        class MockStreamableHTTPServerTransport {
            close = closeTransport;
            async handleRequest(req, res) {
                res.status(200).json({ ok: true });
            }
        }

        const { createMcpApp: createMockedMcpApp } = await importFreshMcpServerArtifacts({
            MockMcpServer,
            MockStreamableHTTPServerTransport,
        });

        const response = await request(createMockedMcpApp())
            .post('/mcp')
            .send({ jsonrpc: '2.0', id: 3, method: 'tools/list' })
            .expect(200);

        await flushPromises();

        expect(response.body).toEqual({ ok: true });
        expect(closeTransport).toHaveBeenCalledTimes(1);
        expect(closeServer).toHaveBeenCalledTimes(1);
    });

    it('should log and avoid overwriting the response when headers were already sent', async () => {
        const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
        const closeTransport = vi.fn();
        const closeServer = vi.fn();

        class MockMcpServer {
            registerTool() {}
            connect = vi.fn(async () => {});
            close = closeServer;
        }

        class MockStreamableHTTPServerTransport {
            close = closeTransport;
            async handleRequest(req, res) {
                res.status(202).json({ accepted: true });
                throw new Error('late failure');
            }
        }

        const { createMcpApp: createMockedMcpApp } = await importFreshMcpServerArtifacts({
            MockMcpServer,
            MockStreamableHTTPServerTransport,
        });

        const response = await request(createMockedMcpApp())
            .post('/mcp')
            .send({ jsonrpc: '2.0', id: 4, method: 'tools/list' })
            .expect(202);

        await flushPromises();

        expect(response.body).toEqual({ accepted: true });
        expect(closeTransport).toHaveBeenCalledTimes(1);
        expect(closeServer).toHaveBeenCalledTimes(1);
        expect(consoleLog).toHaveBeenCalledWith(
            expect.stringContaining('MCP request handling failed: late failure')
        );
    });

    it('should start the standalone MCP server and log its URL', async () => {
        const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
        const standaloneServer = await startMcpServer(0, '127.0.0.1');

        try {
            const { port } = standaloneServer.address();

            expect(standaloneServer.listening).toBe(true);
            expect(consoleLog).toHaveBeenCalledWith(
                expect.stringContaining(`MCP server started at http://127.0.0.1:${port}/mcp`)
            );
        } finally {
            if (typeof standaloneServer.closeAllConnections === 'function') {
                standaloneServer.closeAllConnections();
            }
            await closeWithTimeout(() => new Promise((resolve) => standaloneServer.close(resolve)));
        }
    });

    it('should reject when the standalone MCP server cannot listen', async () => {
        const blocker = http.createServer();

        await new Promise((resolve) => blocker.listen(0, '127.0.0.1', resolve));
        const { port } = blocker.address();

        try {
            await expect(startMcpServer(port, '127.0.0.1')).rejects.toThrow();
        } finally {
            if (typeof blocker.closeAllConnections === 'function') {
                blocker.closeAllConnections();
            }
            await closeWithTimeout(() => new Promise((resolve) => blocker.close(resolve)));
        }
    });
});
