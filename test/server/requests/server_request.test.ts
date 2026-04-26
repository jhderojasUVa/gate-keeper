import { welcomeMessage } from '../../../src/server/requests/server_request.js';

describe('Server Request', () => {
    it('should have the correct welcomeMessage structure', () => {
        expect(welcomeMessage).toHaveProperty('success', true);
        expect(welcomeMessage.data).toEqual({});
    });
});
