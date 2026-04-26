import { canCommit } from '../../src/libs/scripts_check.js';
import type { ScriptModel } from '../../src/models/configuration.model.js';

const createScript = (overrides: Partial<ScriptModel> = {}): ScriptModel => ({
    name: undefined,
    command: undefined,
    data: undefined,
    result: undefined,
    ...overrides,
});

describe('Scripts Check', () => {
    it('should return true when all scripts pass', () => {
        const scripts = [
            createScript({ name: 'test1', result: true }),
            createScript({ name: 'test2', result: true }),
        ];
        expect(canCommit(scripts)).toBe(true);
    });

    it('should return false when any script fails', () => {
        const scripts = [
            createScript({ name: 'test1', result: true }),
            createScript({ name: 'test2', result: false }),
        ];
        expect(canCommit(scripts)).toBe(false);
    });

    it('should return true for empty scripts array', () => {
        expect(canCommit([])).toBe(true);
    });

    it('should handle scripts without result property', () => {
        const scripts = [
            createScript({ name: 'test1' }),
            createScript({ name: 'test2' }),
        ];
        expect(canCommit(scripts)).toBe(true);
    });

    it('should handle scripts with undefined result', () => {
        const scripts = [
            createScript({ name: 'test1', result: undefined }),
            createScript({ name: 'test2', result: { success: true } as never }),
        ];
        expect(canCommit(scripts)).toBe(true);
    });
});
