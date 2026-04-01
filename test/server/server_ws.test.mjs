import { vi } from 'vitest';
import * as serverWsModule from '../../src/server/server_ws.mjs';

// Mock dependencies
vi.mock('ws');
vi.mock('../../src/libs/log.mjs');
vi.mock('../../src/server/server_conf.mjs');
vi.mock('../../src/libs/state.mjs');

describe('WebSocket Server', () => {
    it('should export startWebSocket function', () => {
        expect(typeof serverWsModule.startWebSocket).toBe('function');
    });

    it('should export broadcast function', () => {
        expect(typeof serverWsModule.broadcast).toBe('function');
    });

    it('module should be properly importable', async () => {
        const wsModule = await import('../../src/server/server_ws.mjs');
        expect(wsModule.startWebSocket).toBeDefined();
        expect(wsModule.broadcast).toBeDefined();
    });
});
