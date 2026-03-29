import { startWebSocket } from '../../src/server/server_ws.mjs';

describe('WebSocket Server', () => {
    it('should define startWebSocket function', () => {
        expect(typeof startWebSocket).toBe('function');
    });
});
