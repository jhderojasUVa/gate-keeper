import { WSResponse } from '../../src/server/response.interface.mjs';

describe('WSResponse Interface', () => {
    it('should correctly stringify a message object', () => {
        const message = { success: true, data: 'test' };
        expect(WSResponse(message)).toBe(JSON.stringify(message));
    });
});
