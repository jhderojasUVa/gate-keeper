import * as serverResponses from '../../../src/server/responses/server_responses.ts';
import { TYPES_MESSAGES } from '../../../src/models/wsServerRequest.model.ts';

describe('Server Responses', () => {
    it('should define connection response', () => {
        expect(serverResponses.connection).toEqual(expect.objectContaining({
            success: true,
            type: TYPES_MESSAGES.FIRST_RUN,
            data: expect.stringContaining('Welcome to Gate Keeper')
        }));
    });

    it('should correctly build a success response', () => {
        const res = serverResponses.response({ data: 'test data', isOK: true, typeMessage: 'RE_CHECK' });
        expect(res).toEqual({
            success: true,
            type: TYPES_MESSAGES.RE_CHECK,
            data: 'test data'
        });
    });

    it('should correctly build a failure response', () => {
        const res = serverResponses.response({ data: 'error data', isOK: false, typeMessage: 'ERROR' });
        expect(res).toEqual({
            success: false,
            type: TYPES_MESSAGES.ERROR,
            data: 'error data'
        });
    });

    it('should fallback to UNKNOWN for invalid message types', () => {
        const res = serverResponses.response({ data: 'test data', isOK: true, typeMessage: 'INVALID_TYPE' });
        expect(res).toEqual({
            success: true,
            type: TYPES_MESSAGES.UNKNOW,
            data: 'test data'
        });
    });

    it('canCommit should return the passed parameter', () => {
        expect(serverResponses.canCommit(true)).toBe(true);
        expect(serverResponses.canCommit(false)).toBe(false);
    });
});
