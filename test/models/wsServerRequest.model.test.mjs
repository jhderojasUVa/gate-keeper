import { TYPES_MESSAGES } from '../../src/models/wsServerRequest.model.mjs';

describe('WS Server Request Model', () => {
    it('should have expected message types', () => {
        expect(TYPES_MESSAGES).toEqual({
            RE_CHECK: 'RE_CHECK',
            FIRST_RUN: 'FIRST_RUN',
            STILL_WORKING: 'STILL_WORKING',
            ERROR: 'ERROR',
            EXIT: 'EXIT',
            UNKNOW: 'UNKNOW',
            FATAL_ERROR: 'FATAL_ERROR',
            STATUS_UPDATE: 'STATUS_UPDATE'
        });
    });
});
