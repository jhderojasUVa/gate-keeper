import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

type ServerWsModule = typeof import('../../src/server/server_ws.js');

interface MockWss {
    on: Mock;
}

interface MockSocketServerClient {
    readyState: number;
    send: Mock;
    on: (event: 'message' | 'error' | 'close', fn: (payload?: unknown) => void) => void;
}

let mockWss: MockWss = {
    on: vi.fn(),
};

vi.mock('ws', () => {
    mockWss = {
        on: vi.fn(),
    };
    return {
        default: { OPEN: 1 },
        WebSocketServer: vi.fn(() => mockWss),
    };
});

vi.mock('../../src/libs/log.js', () => ({
    expressLog: vi.fn(),
}));

vi.mock('../../src/server/server_conf.js', () => ({
    express_ws_port: 9001,
}));

vi.mock('../../src/libs/state.js', () => ({
    STATE: {
        canCommit: true,
        scripts: [],
        getStatus: vi.fn(() => ({
            canCommit: true,
            inProgress: false,
            scripts: [],
        })),
    },
}));

describe('WebSocket Server', () => {
    let serverWsModule: ServerWsModule;
    let expressLog: Mock;

    beforeEach(async () => {
        vi.clearAllMocks();
        serverWsModule = await import('../../src/server/server_ws.js');
        expressLog = (await import('../../src/libs/log.js')).expressLog as Mock;
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
        const connectHandler = mockWss.on.mock.calls.find((call: unknown[]) => call[0] === 'connection')?.[1] as
            ((ws: MockSocketServerClient) => void) | undefined;

        if (!connectHandler) {
            throw new Error('Expected connection handler to be registered.');
        }

        const messageHandlers: Partial<Record<'message' | 'error' | 'close', (payload?: unknown) => void>> = {};
        const ws: MockSocketServerClient = {
            readyState: 1,
            send: vi.fn((_data, callback?: (error?: Error) => void) => callback?.()),
            on: (event, fn) => {
                messageHandlers[event] = fn;
            },
        };

        const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => undefined as never) as typeof process.exit);

        connectHandler(ws);

        messageHandlers.message?.(JSON.stringify({ type: 'STATUS_UPDATE', data: { canCommit: true, scripts: [] } }));
        messageHandlers.message?.(JSON.stringify({ type: 'UNKNOWN_EVENT' }));
        messageHandlers.message?.(JSON.stringify({ type: 'RE_CHECK' }));
        messageHandlers.message?.(JSON.stringify({ type: 'FIRST_RUN' }));
        messageHandlers.message?.(JSON.stringify({ type: 'EXIT' }));
        messageHandlers.message?.(JSON.stringify({ type: 'FATAL_ERROR' }));
        messageHandlers.error?.(new Error('test-error'));
        messageHandlers.close?.();

        expect(ws.send).toHaveBeenCalled();
        expect(exitSpy).toHaveBeenCalledWith(1);
        exitSpy.mockRestore();
    });

    it('should broadcast message to open clients', () => {
        const sendFn = vi.fn((data, cb) => cb && cb());
        const client = { readyState: 1, send: sendFn };
        serverWsModule.clients.add(client as never);

        serverWsModule.broadcast({ type: 'TEST' });

        expect(sendFn).toHaveBeenCalledTimes(1);
        expect(sendFn).toHaveBeenCalledWith(JSON.stringify({ type: 'TEST' }), expect.any(Function));
    });

    it('should not broadcast to closed clients', () => {
        const sendFn = vi.fn();
        const openClient = { readyState: 1, send: sendFn };
        const closedClient = { readyState: 0, send: sendFn };
        serverWsModule.clients.add(openClient as never);
        serverWsModule.clients.add(closedClient as never);

        serverWsModule.broadcast({ type: 'TEST' });

        expect(sendFn).toHaveBeenCalledTimes(1);
    });

    it('should log errors when broadcast send fails', () => {
        const sendFn = vi.fn((data, cb) => cb && cb(new Error('fail')));
        const client = { readyState: 1, send: sendFn };
        serverWsModule.clients.add(client as never);

        serverWsModule.broadcast({ type: 'FAILED_SEND' });

        expect(expressLog).toHaveBeenCalledWith(expect.objectContaining({
            message: expect.stringContaining('Error broadcasting message:'),
            kind: 'WEB SOCKET',
            severity: 'ERROR',
        }));
    });
});
