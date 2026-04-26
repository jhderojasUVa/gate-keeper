import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('blessed', () => ({
    screen: vi.fn(),
    box: vi.fn(),
}));

vi.mock('ws', () => ({
    WebSocket: vi.fn(() => ({
        onopen: null,
        onmessage: null,
        onclose: null,
        onerror: null,
        close: vi.fn(),
    })),
}));

import * as blessed from 'blessed';
import {
    addLogEntry,
    checkCommitStatus,
    connectWebSocket,
    getWsPort,
    initUI,
    setTerminalUiRefs,
    startTerminalClient,
    updateCommitStatus,
    updateStatusMessage,
    updateWsStatus,
} from '../../src/terminal/client-terminal.ts';

const createBox = () => ({
    setContent: vi.fn(),
    insertTop: vi.fn(),
    setScrollPerc: vi.fn(),
    append: vi.fn(),
});

describe('Terminal Client', () => {
    let mockScreen;
    let mockStatusBox;
    let mockLogBox;
    let mockWsStatusBox;
    let mockStatusMessageBox;

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.useFakeTimers();

        process.env.VITEST = 'true';
        delete process.env.GATE_KEEPER_PORT;
        delete process.env.GATE_KEEPER_HTTPS;

        global.fetch = vi.fn();
        vi.spyOn(console, 'error').mockImplementation(() => {});

        mockScreen = {
            key: vi.fn(),
            append: vi.fn(),
            render: vi.fn(),
        };
        mockStatusBox = createBox();
        mockLogBox = createBox();
        mockWsStatusBox = createBox();
        mockStatusMessageBox = createBox();

        setTerminalUiRefs({
            screen: mockScreen,
            statusBox: mockStatusBox,
            logBox: mockLogBox,
            wsStatusBox: mockWsStatusBox,
            statusMessageBox: mockStatusMessageBox,
        });

        blessed.screen.mockReturnValue(mockScreen);
        blessed.box.mockImplementation((options = {}) => {
            if (options.label === ' Commit Status ') {
                return mockStatusBox;
            }
            if (options.label === ' System Feed ') {
                return mockLogBox;
            }
            if (Object.prototype.hasOwnProperty.call(options, 'right')) {
                return mockWsStatusBox;
            }
            if (options.content?.includes('Gate Keeper')) {
                return { append: vi.fn() };
            }
            return mockStatusMessageBox;
        });
    });

    it('gets the WebSocket port and falls back on failure', async () => {
        global.fetch
            .mockResolvedValueOnce({ json: async () => ({ port: 9100 }) })
            .mockRejectedValueOnce(new Error('offline'));

        await expect(getWsPort('http://localhost:9000')).resolves.toBe(9100);
        await expect(getWsPort('http://localhost:9000')).resolves.toBe(9001);
    });

    it('checks commit status and falls back to false on errors', async () => {
        global.fetch
            .mockResolvedValueOnce({ json: async () => ({ cancommit: true }) })
            .mockRejectedValueOnce(new Error('offline'));

        await expect(checkCommitStatus('http://localhost:9000')).resolves.toBe(true);
        await expect(checkCommitStatus('http://localhost:9000')).resolves.toBe(false);
    });

    it('updates commit, log, websocket, and status message UI states', () => {
        updateCommitStatus(true);
        updateCommitStatus(false);
        updateCommitStatus(true, { statusBox: null });

        addLogEntry({ type: 'INFO', data: { task: 'lint' } });
        addLogEntry({ success: false, type: 'FATAL_ERROR', data: 'boom' });
        addLogEntry({ type: 'INFO', data: 'ignored' }, { logBox: null });

        updateWsStatus('connected');
        updateWsStatus('connecting');
        updateWsStatus('disconnected');
        updateWsStatus('mystery');
        updateWsStatus('connected', { wsStatusBox: null });

        updateStatusMessage('hello');
        updateStatusMessage('ignored', { statusMessageBox: null });

        expect(mockStatusBox.setContent).toHaveBeenNthCalledWith(
            1,
            expect.stringContaining('Ready to Commit')
        );
        expect(mockStatusBox.setContent).toHaveBeenNthCalledWith(
            2,
            expect.stringContaining('Commit Blocked')
        );
        expect(mockLogBox.insertTop).toHaveBeenNthCalledWith(
            1,
            expect.stringContaining('"task": "lint"')
        );
        expect(mockLogBox.insertTop).toHaveBeenNthCalledWith(
            2,
            expect.stringContaining('⚠️ FATAL_ERROR')
        );
        expect(mockWsStatusBox.setContent).toHaveBeenNthCalledWith(
            4,
            expect.stringContaining('Unknown')
        );
        expect(mockStatusMessageBox.setContent).toHaveBeenCalledWith('hello');
    });

    it('setTerminalUiRefs preserves existing refs on partial updates while allowing explicit null', () => {
        const replacementStatusBox = createBox();

        setTerminalUiRefs({ statusBox: replacementStatusBox });
        updateCommitStatus(true);
        addLogEntry({ type: 'INFO', data: 'still active' });
        updateWsStatus('connected');
        updateStatusMessage('still active');

        expect(replacementStatusBox.setContent).toHaveBeenCalledWith(
            expect.stringContaining('Ready to Commit')
        );
        expect(mockLogBox.insertTop).toHaveBeenCalledWith(expect.stringContaining('still active'));
        expect(mockWsStatusBox.setContent).toHaveBeenCalledWith(expect.stringContaining('Connected (Live)'));
        expect(mockStatusMessageBox.setContent).toHaveBeenCalledWith('still active');

        setTerminalUiRefs({ statusBox: null });
        updateCommitStatus(false);

        expect(replacementStatusBox.setContent).toHaveBeenCalledTimes(1);
    });

    it('connectWebSocket reconnects after constructor failures and closes on errors', async () => {
        const scheduleReconnect = vi.fn((callback) => callback());
        const goodSocket = {
            onopen: null,
            onmessage: null,
            onclose: null,
            onerror: null,
            close: vi.fn(),
        };
        const createWebSocket = vi.fn()
            .mockImplementationOnce(() => {
                throw new Error('creation failed');
            })
            .mockImplementationOnce(() => goodSocket);

        connectWebSocket('ws://localhost:9001', {
            createWebSocket,
            reconnectDelay: 10,
            scheduleReconnect,
        });

        expect(createWebSocket).toHaveBeenCalledTimes(2);
        expect(mockWsStatusBox.setContent).toHaveBeenLastCalledWith(expect.stringContaining('Connecting...'));

        goodSocket.onerror({ type: 'socket-error' });

        expect(goodSocket.close).toHaveBeenCalled();
    });

    it('connectWebSocket handles open, status updates, generic messages, parse errors, and close reconnects', async () => {
        const socket = {
            onopen: null,
            onmessage: null,
            onclose: null,
            onerror: null,
            close: vi.fn(),
        };
        const scheduleReconnect = vi.fn();

        global.fetch
            .mockResolvedValueOnce({ json: async () => ({ cancommit: true }) });

        connectWebSocket('ws://localhost:9001', {
            createWebSocket: vi.fn(() => socket),
            statusCheckUrl: 'http://localhost:9000',
            scheduleReconnect,
            reconnectDelay: 25,
        });

        await socket.onopen();
        socket.onmessage({
            data: JSON.stringify({
                type: 'STATUS_UPDATE',
                data: {
                    canCommit: false,
                    scripts: [
                        { name: 'lint', result: 'ok' },
                        { name: 'test', result: '' },
                    ],
                },
            }),
        });
        socket.onmessage({
            data: JSON.stringify({
                type: 'INFO',
                data: 'Heads up',
            }),
        });
        socket.onmessage({ data: 'not json' });
        socket.onclose();

        expect(global.fetch).toHaveBeenCalledWith('http://localhost:9000/cancommit');
        expect(mockStatusBox.setContent).toHaveBeenCalledWith(expect.stringContaining('Commit Blocked'));
        expect(mockLogBox.insertTop).toHaveBeenCalledWith(expect.stringContaining('lint: ok'));
        expect(mockLogBox.insertTop).toHaveBeenCalledWith(expect.stringContaining('test: Failed'));
        expect(mockLogBox.insertTop).toHaveBeenCalledWith(expect.stringContaining('Heads up'));
        expect(mockLogBox.insertTop).toHaveBeenCalledWith(expect.stringContaining('PARSE_ERROR'));
        expect(scheduleReconnect).toHaveBeenCalledWith(expect.any(Function), 25);
    });

    it('initializes the real blessed UI when not running under vitest', () => {
        delete process.env.VITEST;
        const headerBox = { append: vi.fn() };

        blessed.box.mockImplementation((options = {}) => {
            if (options.content?.includes('Gate Keeper')) {
                return headerBox;
            }
            if (options.label === ' Commit Status ') {
                return mockStatusBox;
            }
            if (options.label === ' System Feed ') {
                return mockLogBox;
            }
            if (Object.prototype.hasOwnProperty.call(options, 'right')) {
                return mockWsStatusBox;
            }
            return mockStatusMessageBox;
        });

        initUI();

        expect(blessed.screen).toHaveBeenCalledWith(expect.objectContaining({
            smartCSR: true,
            title: 'Gate Keeper Terminal Client',
        }));
        expect(mockScreen.key).toHaveBeenCalled();
        expect(headerBox.append).toHaveBeenCalledWith(mockWsStatusBox);
        expect(mockScreen.append).toHaveBeenCalledTimes(4);
        expect(mockScreen.render).toHaveBeenCalled();
    });

    it('starts the terminal client with custom port and http mode', async () => {
        global.fetch.mockImplementation((url) => {
            if (url === 'http://localhost:8080/ws-port') {
                return Promise.resolve({ json: async () => ({ port: 9555 }) });
            }
            if (url === 'http://localhost:8080/cancommit') {
                return Promise.resolve({ json: async () => ({ cancommit: false }) });
            }
            return Promise.reject(new Error(`Unexpected URL: ${url}`));
        });

        process.env.GATE_KEEPER_HTTPS = 'false';

        await startTerminalClient({ port: 8080 });

        expect(global.fetch).toHaveBeenCalledWith('http://localhost:8080/ws-port');
        expect(global.fetch).toHaveBeenCalledWith('http://localhost:8080/cancommit');
        expect(mockStatusMessageBox.setContent).toHaveBeenCalledWith(
            '🔌 Connecting to WebSocket at ws://localhost:9555...'
        );
        expect(mockStatusBox.setContent).toHaveBeenCalledWith(expect.stringContaining('Commit Blocked'));
    });
});
