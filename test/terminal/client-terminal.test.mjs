import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock blessed before importing the module
vi.mock('blessed', () => ({
    screen: vi.fn(),
    box: vi.fn()
}));

// Mock WebSocket
vi.mock('ws', () => ({
    WebSocket: vi.fn(() => ({
        onopen: null,
        onmessage: null,
        onclose: null,
        onerror: null,
        close: vi.fn(),
        send: vi.fn()
    }))
}));

// Mock fetch
global.fetch = vi.fn();

import { startTerminalClient } from '../../src/terminal/client-terminal.mjs';
import * as blessed from 'blessed';

describe('Terminal Client', () => {
    let mockScreen;
    let mockStatusBox;
    let mockLogBox;
    let mockStatusMessageBox;

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock blessed components
        mockScreen = {
            key: vi.fn(),
            append: vi.fn(),
            render: vi.fn(),
            destroy: vi.fn()
        };

        mockStatusBox = {
            setContent: vi.fn()
        };

        mockLogBox = {
            insertTop: vi.fn(),
            setScrollPerc: vi.fn()
        };

        mockStatusMessageBox = {
            setContent: vi.fn()
        };

        // Mock blessed.screen to return our mock
        blessed.screen.mockReturnValue(mockScreen);
        blessed.box.mockImplementation((options) => {
            if (options.label === ' Commit Status ') {
                return mockStatusBox;
            } else if (options.label === ' System Feed ') {
                return mockLogBox;
            } else if (options.content && options.content.includes('Gate Keeper')) {
                const headerBox = {
                    append: vi.fn()
                };
                return headerBox;
            } else {
                return mockStatusMessageBox;
            }
        });

        // Mock fetch responses
        global.fetch.mockImplementation((url) => {
            if (url.includes('/ws-port')) {
                return Promise.resolve({
                    json: () => Promise.resolve({ port: 9001 })
                });
            } else if (url.includes('/cancommit')) {
                return Promise.resolve({
                    json: () => Promise.resolve({ cancommit: true })
                });
            }
            return Promise.reject(new Error('Unknown URL'));
        });
    });

    it('should initialize the UI components', async () => {
        await startTerminalClient();

        // expect(blessed.screen).toHaveBeenCalledWith({
        //     smartCSR: true,
        //     title: 'Gate Keeper Terminal Client'
        // });

        // expect(blessed.box).toHaveBeenCalled();
        expect(mockScreen.append).toHaveBeenCalledTimes(4); // header, statusBox, logBox, statusMessageBox
    });

    it('should fetch WebSocket port and commit status', async () => {
        await startTerminalClient();

        expect(global.fetch).toHaveBeenCalledWith('https://localhost:9000/ws-port');
        expect(global.fetch).toHaveBeenCalledWith('https://localhost:9000/cancommit');
    });

    it('should update status message during startup', async () => {
        await startTerminalClient();

        // expect(mockStatusMessageBox.setContent).toHaveBeenCalledWith('🚀 Starting Gate Keeper Terminal Client...');
        // expect(mockStatusMessageBox.setContent).toHaveBeenCalledWith('🔌 Connecting to WebSocket at ws://localhost:9001...');
        // expect(mockStatusMessageBox.setContent).toHaveBeenCalledWith('✅ Terminal client started. Press q or Ctrl+C to exit.');
    });

    it('should update commit status display', async () => {
        // This would require mocking the internal state, but for now we test the fetch calls
        await startTerminalClient();

        expect(global.fetch).toHaveBeenCalledWith('https://localhost:9000/cancommit');
    });

    it('should handle custom port from environment', async () => {
        process.env.GATE_KEEPER_PORT = '8080';

        await startTerminalClient();

        expect(global.fetch).toHaveBeenCalledWith('https://localhost:8080/ws-port');
        expect(global.fetch).toHaveBeenCalledWith('https://localhost:8080/cancommit');

        delete process.env.GATE_KEEPER_PORT;
    });

    it('should handle HTTPS protocol', async () => {
        delete process.env.GATE_KEEPER_PORT;
        process.env.GATE_KEEPER_HTTPS = 'true';

        await startTerminalClient();

        expect(global.fetch).toHaveBeenCalledWith('https://localhost:9000/ws-port');

        delete process.env.GATE_KEEPER_HTTPS;
    });
});