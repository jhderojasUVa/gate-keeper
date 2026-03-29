import { WS_RESPONSE_OK, WS_RESPONSE_KO } from '../../src/models/wsResponse.model.mjs';

describe('WS Response Model', () => {
    it('should define WS_RESPONSE_OK correctly', () => {
        expect(WS_RESPONSE_OK).toEqual({
            success: true,
            data: undefined
        });
    });

    it('should define WS_RESPONSE_KO correctly', () => {
        expect(WS_RESPONSE_KO).toEqual({
            success: false,
            data: undefined
        });
    });
});
