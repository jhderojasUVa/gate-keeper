import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Public JS main', () => {
    beforeEach(() => {
        process.env.VITEST = 'true';

        // Simple DOM stubs
        global.document = {
            body: { innerHTML: '' },
            createElement: (tag) => ({ tagName: tag, className: '', innerHTML: '', appendChild: function(child) { this.children.push(child); }, children: [] }),
            getElementById: (id) => {
                if (!document[id]) {
                    document[id] = { className: '', textContent: '', querySelector: () => ({ textContent: '', className: '' }), children: [], appendChild: function(child) { this.children.push(child); } };
                }
                return document[id];
            }
        };

        global.window = { location: { hostname: 'localhost' }, setTimeout };

        global.fetch = vi.fn();
        global.WebSocket = vi.fn();
    });

    it('getWsPort returns data.port on success', async () => {
        const { getWsPort } = await import('../../public/js/main.mjs');
        global.fetch.mockResolvedValue({ json: async () => ({ port: 1234 }) });

        const port = await getWsPort();
        expect(port).toBe(1234);
        expect(global.fetch).toHaveBeenCalledWith('/ws-port');
    });

    it('getWsPort returns fallback on fetch failure', async () => {
        const { getWsPort } = await import('../../public/js/main.mjs');
        global.fetch.mockRejectedValue(new Error('no net'));

        const port = await getWsPort();
        expect(port).toBe(8080);
    });

    it('formatTime returns a string with time components', async () => {
        const { formatTime } = await import('../../public/js/main.mjs');
        const time = formatTime();
        expect(typeof time).toBe('string');
        expect(time).toMatch(/\d{2}:\d{2}:\d{2}\.\d{3}/);
    });

    it('createLogElement builds correct error markup and structure', async () => {
        const { createLogElement } = await import('../../public/js/main.mjs');

        const logEl = createLogElement({success: false, type: 'ERROR', data: 'boom'});
        expect(logEl.className).toContain('log-entry');
        expect(logEl.innerHTML).toContain('⚠️');
        expect(logEl.innerHTML).toContain('boom');
    });

    it('updateCommitStatus toggles commit status class and text when override set', async () => {
        const { updateCommitStatus } = await import('../../public/js/main.mjs');
        const commitStatusDiv = document.getElementById('commit-status');
        await updateCommitStatus(commitStatusDiv, true);

        expect(commitStatusDiv.className).toContain('success');
        expect(document.getElementById('commit-status-title').textContent).toBe('Ready to Commit');
    });

    it('updateCommitStatus handles server error gracefully', async () => {
        const { updateCommitStatus } = await import('../../public/js/main.mjs');
        const commitStatusDiv = document.getElementById('commit-status');

        global.fetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });

        await updateCommitStatus(commitStatusDiv);

        expect(commitStatusDiv.className).toContain('error');
        expect(document.getElementById('commit-status-title').textContent).toBe('Status Unknown');
    });

    it('connectToWs establishes WebSocket connection and handles onopen', async () => {
        const { connectToWs } = await import('../../public/js/main.mjs');
        const mockWs = {
            onopen: null,
            onmessage: null,
            onclose: null,
            onerror: null,
            close: vi.fn(),
            send: vi.fn()
        };
        global.WebSocket.mockImplementation(() => mockWs);

        // Start connection
        await connectToWs();

        // Simulate onopen
        mockWs.onopen();

        expect(document.getElementById('ws-status').className).toContain('connected');
        expect(document.getElementById('msg-type').textContent).toBe('Listening...');
    });

    it('connectToWs handles WebSocket messages', async () => {
        const { connectToWs } = await import('../../public/js/main.mjs');
        const mockWs = {
            onopen: null,
            onmessage: null,
            onclose: null,
            onerror: null,
            close: vi.fn(),
            send: vi.fn()
        };
        global.WebSocket.mockImplementation(() => mockWs);

        await connectToWs();
        mockWs.onopen();

        // Simulate message
        const message = { type: 'STATUS_UPDATE', data: { canCommit: true, scripts: [{ name: 'test', result: 'pass' }] } };
        mockWs.onmessage({ data: JSON.stringify(message) });

        expect(document.getElementById('msg-type').textContent).toBe('Last Event: STATUS_UPDATE');
        // Check if log was added
        expect(document.getElementById('log-window').children.length).toBeGreaterThan(0);
    });

    it('connectToWs handles invalid JSON messages', async () => {
        const { connectToWs } = await import('../../public/js/main.mjs');
        const mockWs = {
            onopen: null,
            onmessage: null,
            onclose: null,
            onerror: null,
            close: vi.fn(),
            send: vi.fn()
        };
        global.WebSocket.mockImplementation(() => mockWs);

        await connectToWs();
        mockWs.onopen();

        // Simulate invalid JSON
        mockWs.onmessage({ data: 'invalid json' });

        expect(document.getElementById('log-window').children.length).toBeGreaterThan(0);
    });

    it('connectToWs handles WebSocket error', async () => {
        const { connectToWs } = await import('../../public/js/main.mjs');
        const mockWs = {
            onopen: null,
            onmessage: null,
            onclose: null,
            onerror: null,
            close: vi.fn(),
            send: vi.fn()
        };
        global.WebSocket.mockImplementation(() => mockWs);

        await connectToWs();
        mockWs.onopen();

        // Simulate error
        mockWs.onerror();

        expect(mockWs.close).toHaveBeenCalled();
    });
});