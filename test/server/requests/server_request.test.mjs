import { welcomeMessage } from '../../../src/server/requests/server_request.mjs';

describe('Server Request', () => {
    it('should have the correct welcomeMessage structure', () => {
        expect(welcomeMessage).toHaveProperty('success', true);
        expect(welcomeMessage.data).toEqual({});
    });
});
