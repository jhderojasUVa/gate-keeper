import { scriptResult } from '../../src/models/scriptResult.model.mjs';

describe('Script Result Model', () => {
    it('should have the correct initial values', () => {
        expect(scriptResult).toHaveProperty('success', false); // Match typo from source
        expect(scriptResult).toHaveProperty('data', undefined);
    });
});
