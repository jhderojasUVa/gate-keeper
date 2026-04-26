import { beforeEach, describe, expect, it, vi } from 'vitest';

const createNode = (overrides = {}) => ({
    className: '',
    textContent: '',
    innerHTML: '',
    children: [],
    scrollTop: 0,
    scrollHeight: 0,
    appendChild(child) {
        this.children.push(child);
        this.scrollHeight = this.children.length;
    },
    querySelector: vi.fn(() => null),
    ...overrides,
});

describe('Public JS main', () => {
    let elements;
    let module;

    beforeEach(async () => {
        vi.restoreAllMocks();
        vi.useFakeTimers();
        vi.resetModules();

        process.env.VITEST = 'true';

        const wsText = createNode();
        elements = {
            'ws-status': createNode({
                querySelector: vi.fn(() => wsText),
            }),
            'log-window': createNode(),
            'msg-type': createNode(),
            'commit-status': createNode(),
            'commit-status-title': createNode(),
            'commit-status-desc': createNode(),
        };

        global.document = {
            createElement: vi.fn(() => createNode()),
            getElementById: vi.fn((id) => elements[id]),
        };

        global.window = {
            location: { hostname: 'localhost' },
        };

        global.fetch = vi.fn();
        global.WebSocket = vi.fn();
        vi.spyOn(console, 'error').mockImplementation(() => {});

        module = await import('../../public/js/main.mjs');
    });

    it('getWsPort returns data.port on success', async () => {
        global.fetch.mockResolvedValue({ json: async () => ({ port: 1234 }) });

        const port = await module.getWsPort();

        expect(port).toBe(1234);
        expect(global.fetch).toHaveBeenCalledWith('/ws-port');
    });

    it('getWsPort returns fallback on fetch failure', async () => {
        global.fetch.mockRejectedValue(new Error('no net'));

        const port = await module.getWsPort();

        expect(port).toBe(8080);
        expect(console.error).toHaveBeenCalled();
    });

    it('formatTime returns a string with time components', () => {
        const time = module.formatTime();

        expect(time).toMatch(/\d{2}:\d{2}:\d{2}\.\d{3}/);
    });

    it('createLogElement renders info messages with object payloads', () => {
        const logEl = module.createLogElement({
            type: 'NOTICE',
            data: { step: 'lint', ok: true },
        });

        expect(logEl.className).toBe('log-entry log-info');
        expect(logEl.innerHTML).toContain('NOTICE');
        expect(logEl.innerHTML).toContain('"step": "lint"');
        expect(logEl.innerHTML).not.toContain('⚠️');
    });

    it('createLogElement renders fatal errors with failed action text', () => {
        const logEl = module.createLogElement({
            success: false,
            type: 'FATAL_ERROR',
            data: 'boom',
        });

        expect(logEl.className).toBe('log-entry log-error');
        expect(logEl.innerHTML).toContain('Action Failed');
        expect(logEl.innerHTML).toContain('boom');
    });

    it('updateCommitStatus uses override values for both success and failure', async () => {
        const commitStatusDiv = elements['commit-status'];

        await module.updateCommitStatus(commitStatusDiv, true);
        expect(commitStatusDiv.className).toContain('success');
        expect(elements['commit-status-title'].textContent).toBe('Ready to Commit');

        await module.updateCommitStatus(commitStatusDiv, false);
        expect(commitStatusDiv.className).toContain('error');
        expect(elements['commit-status-title'].textContent).toBe('Commit Blocked');
        expect(elements['commit-status-desc'].textContent).toBe('Gates are currently closed. Check logs.');
    });

    it('updateCommitStatus fetches server status when override is omitted', async () => {
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ cancommit: true }),
        });

        await module.updateCommitStatus(elements['commit-status']);

        expect(global.fetch).toHaveBeenCalledWith('/cancommit', expect.objectContaining({ method: 'GET' }));
        expect(elements['commit-status'].className).toContain('success');
    });

    it('updateCommitStatus handles server error gracefully', async () => {
        global.fetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });

        await module.updateCommitStatus(elements['commit-status']);

        expect(elements['commit-status'].className).toContain('error');
        expect(elements['commit-status-title'].textContent).toBe('Status Unknown');
        expect(elements['commit-status-desc'].textContent).toBe('Failed to verify commit permission.');
    });

    it('connectToWs reconnects when WebSocket construction fails', async () => {
        global.fetch.mockResolvedValue({ json: async () => ({ port: 4321 }) });
        global.WebSocket.mockImplementation(() => {
            throw new Error('socket creation failed');
        });

        await module.connectToWs();

        expect(elements['ws-status'].className).toContain('disconnected');

        global.WebSocket.mockImplementation(() => ({
            close: vi.fn(),
            send: vi.fn(),
        }));

        await vi.advanceTimersByTimeAsync(5000);

        expect(global.WebSocket).toHaveBeenCalledTimes(2);
    });

    it('connectToWs handles status updates with failing scripts and close reconnects', async () => {
        const sockets = [];
        global.fetch.mockResolvedValue({ json: async () => ({ port: 5555 }) });
        global.WebSocket.mockImplementation(() => {
            const socket = {
                onopen: null,
                onmessage: null,
                onclose: null,
                onerror: null,
                close: vi.fn(),
                send: vi.fn(),
            };
            sockets.push(socket);
            return socket;
        });

        await module.connectToWs();
        await sockets[0].onopen();
        sockets[0].onmessage({
            data: JSON.stringify({
                type: 'STATUS_UPDATE',
                data: {
                    canCommit: false,
                    scripts: [{ name: 'tests', result: '' }],
                },
            }),
        });

        expect(elements['commit-status-title'].textContent).toBe('Commit Blocked');
        expect(elements['log-window'].children).toHaveLength(1);
        expect(elements['log-window'].children[0].innerHTML).toContain('tests: Failed');

        sockets[0].onclose();
        expect(elements['msg-type'].textContent).toBe('Offline');

        await vi.advanceTimersByTimeAsync(5000);
        expect(global.WebSocket).toHaveBeenCalledTimes(2);
    });

    it('connectToWs logs non-status messages and refreshes commit status', async () => {
        const socket = {
            onopen: null,
            onmessage: null,
            onclose: null,
            onerror: null,
            close: vi.fn(),
            send: vi.fn(),
        };

        global.fetch
            .mockResolvedValueOnce({ json: async () => ({ port: 8088 }) })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ cancommit: true }),
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ cancommit: false }),
            });
        global.WebSocket.mockImplementation(() => socket);

        await module.connectToWs();
        await socket.onopen();
        await socket.onmessage({
            data: JSON.stringify({
                type: 'INFO',
                data: 'Heads up',
            }),
        });

        expect(elements['msg-type'].textContent).toBe('Last Event: INFO');
        expect(elements['log-window'].children).toHaveLength(1);
        expect(elements['commit-status-title'].textContent).toBe('Commit Blocked');

        await vi.advanceTimersByTimeAsync(1000);
        expect(elements['msg-type'].className).toBe('badge-type live');
    });

    it('connectToWs handles invalid JSON messages and websocket errors', async () => {
        const socket = {
            onopen: null,
            onmessage: null,
            onclose: null,
            onerror: null,
            close: vi.fn(),
            send: vi.fn(),
        };

        global.fetch.mockResolvedValue({ json: async () => ({ port: 9009 }) });
        global.WebSocket.mockImplementation(() => socket);

        await module.connectToWs();
        socket.onmessage({ data: 'invalid json' });
        socket.onerror();

        expect(elements['log-window'].children).toHaveLength(1);
        expect(elements['log-window'].children[0].innerHTML).toContain('PARSE_ERROR');
        expect(socket.close).toHaveBeenCalled();
    });
});
