import http from 'http';
import { afterEach, beforeEach } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { STATE } from '../../src/libs/state.mjs';
import { createMcpApp } from '../../src/server/mcp_server.mjs';

describe('MCP Server', () => {
    let server;
    let transport;
    let client;
    let baseUrl;

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
        if (transport) {
            await transport.close();
        }

        if (server) {
            await new Promise((resolve) => server.close(resolve));
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
