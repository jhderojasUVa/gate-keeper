import { canCommit } from '../../src/libs/scripts_check.mjs';

describe('Scripts Check', () => {
    it('should return true when all scripts pass', () => {
        const scripts = [
            { name: 'test1', result: { success: true } },
            { name: 'test2', result: { success: true } }
        ];
        expect(canCommit(scripts)).toBe(true);
    });

    it('should return false when any script fails', () => {
        const scripts = [
            { name: 'test1', result: { success: true } },
            { name: 'test2', result: { success: false } }
        ];
        expect(canCommit(scripts)).toBe(false);
    });

    it('should return true for empty scripts array', () => {
        expect(canCommit([])).toBe(true);
    });

    it('should handle scripts without result property', () => {
        const scripts = [
            { name: 'test1' },
            { name: 'test2' }
        ];
        expect(canCommit(scripts)).toBe(true);
    });

    it('should handle scripts with undefined result', () => {
        const scripts = [
            { name: 'test1', result: undefined },
            { name: 'test2', result: { success: true } }
        ];
        expect(canCommit(scripts)).toBe(true);
    });
});