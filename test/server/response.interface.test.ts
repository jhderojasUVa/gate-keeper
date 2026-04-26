import { WSResponse } from '../../src/server/response.interface.js';

describe('WSResponse Interface', () => {
    it('should correctly stringify a message object', () => {
        const message = { success: true, data: 'test' };
        expect(WSResponse(message)).toBe(JSON.stringify(message));
    });

    it('should handle complex objects', () => {
        const message = {
            success: true,
            type: 'TEST',
            data: {
                scripts: [
                    { name: 'test1', result: 'passed' },
                    { name: 'test2', result: 'failed' }
                ],
                canCommit: false
            }
        };
        const result = WSResponse(message);
        expect(result).toBe(JSON.stringify(message));
        expect(() => JSON.parse(result)).not.toThrow();
    });

    it('should handle empty objects', () => {
        const message = {};
        expect(WSResponse(message)).toBe(JSON.stringify(message));
    });

    it('should handle null and undefined values', () => {
        const message = { success: true, data: null, type: undefined };
        const result = WSResponse(message);
        expect(result).toBe(JSON.stringify(message));
    });
});
