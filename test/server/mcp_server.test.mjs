import http from 'http';
import { afterEach, beforeEach } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { STATE } from '../../src/libs/state.ts';
import { createMcpApp } from '../../src/server/mcp_server.ts';

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
});
