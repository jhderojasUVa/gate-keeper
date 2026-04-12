import { vi } from 'vitest';

// Keep a reference to the mocked WebSocket server instance created by the module.
let mockWss = null;

vi.mock('ws', () => {
    mockWss = {
        on: vi.fn()
    };
    return {
        default: { OPEN: 1 },
        WebSocketServer: vi.fn(() => mockWss)
    };
});

vi.mock('../../src/libs/log.mjs', () => ({
    expressLog: vi.fn()
}));

vi.mock('../../src/server/server_conf.mjs', () => ({
    express_ws_port: 9001
}));

vi.mock('../../src/libs/state.mjs', () => ({
    STATE: {
        canCommit: true,
        scripts: [],
        getStatus: vi.fn(() => ({
            canCommit: true,
            inProgress: false,
            scripts: []
        }))
    }
}));

describe('WebSocket Server', () => {
    let serverWsModule;
    let expressLog;

    beforeEach(async () => {
        vi.clearAllMocks();
        serverWsModule = await import('../../src/server/server_ws.mjs');
        expressLog = (await import('../../src/libs/log.mjs')).expressLog;
        serverWsModule.clients.clear();
    });

    it('should export startWebSocket function', () => {
        expect(typeof serverWsModule.startWebSocket).toBe('function');
    });

    it('should export broadcast function', () => {
        expect(typeof serverWsModule.broadcast).toBe('function');
    });

    it('should create a WebSocketServer and register connection handler', () => {
        serverWsModule.startWebSocket();
        expect(mockWss.on).toHaveBeenCalledWith('connection', expect.any(Function));
    });

    it('should set up connection handlers and support status updates', async () => {
        serverWsModule.startWebSocket();
        const connectHandler = mockWss.on.mock.calls.find(call => call[0] === 'connection')[1];

        const messageHandlers = {};
        const ws = {
            readyState: 1,
            send: vi.fn((data, cb) => cb && cb()),
            on: (event, fn) => { messageHandlers[event] = fn; }
        };

        const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined);

        connectHandler(ws);

        // Send a STATUS_UPDATE message (branch in message handler)
        messageHandlers.message(JSON.stringify({ type: 'STATUS_UPDATE', data: { canCommit: true, scripts: [] } }));

        // Send an unknown message type
        messageHandlers.message(JSON.stringify({ type: 'UNKNOWN_EVENT' }));

        // Send RE_CHECK message
        messageHandlers.message(JSON.stringify({ type: 'RE_CHECK' }));

        // Send FIRST_RUN message
        messageHandlers.message(JSON.stringify({ type: 'FIRST_RUN' }));

        // Send EXIT message
        messageHandlers.message(JSON.stringify({ type: 'EXIT' }));

        // Send FATAL_ERROR message
        messageHandlers.message(JSON.stringify({ type: 'FATAL_ERROR' }));

        // Simulate error and close events
        messageHandlers.error(new Error('test-error'));
        messageHandlers.close();

        expect(ws.send).toHaveBeenCalled();
        expect(exitSpy).toHaveBeenCalledWith(1);
        exitSpy.mockRestore();
    });

    it('should broadcast message to open clients', () => {
        const sendFn = vi.fn((data, cb) => cb && cb());
        const client = { readyState: 1, send: sendFn };
        serverWsModule.clients.add(client);

        serverWsModule.broadcast({ type: 'TEST' });

        expect(sendFn).toHaveBeenCalledTimes(1);
        expect(sendFn).toHaveBeenCalledWith(JSON.stringify({ type: 'TEST' }), expect.any(Function));
    });

    it('should not broadcast to closed clients', () => {
        const sendFn = vi.fn();
        const openClient = { readyState: 1, send: sendFn };
        const closedClient = { readyState: 0, send: sendFn };
        serverWsModule.clients.add(openClient);
        serverWsModule.clients.add(closedClient);

        serverWsModule.broadcast({ type: 'TEST' });

        expect(sendFn).toHaveBeenCalledTimes(1);
    });

    it('should log errors when broadcast send fails', () => {
        const sendFn = vi.fn((data, cb) => cb && cb(new Error('fail')));
        const client = { readyState: 1, send: sendFn };
        serverWsModule.clients.add(client);

        serverWsModule.broadcast({ type: 'FAILED_SEND' });

        expect(expressLog).toHaveBeenCalledWith(expect.objectContaining({
            message: expect.stringContaining('Error broadcasting message:'),
            kind: 'WEB SOCKET',
            severity: 'ERROR'
        }));
    });
});
