import { startWebSocket, broadcast } from '../../src/server/server_ws.mjs';
import { WSResponse } from '../../src/server/response.interface.mjs';
import { TYPES_MESSAGES } from '../../src/models/wsServerRequest.model.mjs';
import * as serverResponses from '../../src/server/responses/server_responses.mjs';

// Mock WebSocket and WebSocketServer
const mockSend = jest.fn();
const mockClient = {
    readyState: 1, // WebSocket.OPEN
    send: mockSend
};

const mockClients = new Set([mockClient]);

// Mock the wss object
jest.mock('ws', () => ({
    WebSocketServer: jest.fn(() => ({
        on: jest.fn(),
        clients: mockClients
    })),
    WebSocket: {
        OPEN: 1
    }
}));

// Mock expressLog
jest.mock('../../src/libs/log.mjs', () => ({
    expressLog: jest.fn()
}));

// Mock server_conf
jest.mock('../../src/server/server_conf.mjs', () => ({
    express_ws_port: 9001
}));

// Mock state
jest.mock('../../src/libs/state.mjs', () => ({
    STATE: {
        canCommit: true,
        scripts: [{ name: 'test', result: 'passed' }]
    }
}));

describe('WebSocket Server', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should define startWebSocket function', () => {
        expect(typeof startWebSocket).toBe('function');
    });

    it('should define broadcast function', () => {
        expect(typeof broadcast).toBe('function');
    });

    it('should broadcast messages to connected clients', () => {
        const testMessage = { type: 'TEST', data: 'test data', success: true };
        broadcast(testMessage);

        expect(mockSend).toHaveBeenCalledWith(JSON.stringify(testMessage), expect.any(Function));
    });

    it('should not send to clients that are not open', () => {
        const closedClient = {
            readyState: 3, // WebSocket.CLOSED
            send: jest.fn()
        };
        mockClients.add(closedClient);

        const testMessage = { type: 'TEST', data: 'test data', success: true };
        broadcast(testMessage);

        expect(mockSend).toHaveBeenCalledTimes(1); // Only the open client
        expect(closedClient.send).not.toHaveBeenCalled();

        mockClients.delete(closedClient);
    });

    it('should handle broadcast errors gracefully', () => {
        const errorClient = {
            readyState: 1,
            send: jest.fn((data, callback) => callback(new Error('Send failed')))
        };
        mockClients.add(errorClient);

        const { expressLog } = require('../../src/libs/log.mjs');
        const testMessage = { type: 'TEST', data: 'test data', success: true };
        broadcast(testMessage);

        expect(expressLog).toHaveBeenCalledWith({
            message: 'Error broadcasting message: Error: Send failed',
            kind: 'WEB SOCKET',
            severity: 'ERROR'
        });

        mockClients.delete(errorClient);
    });
});
