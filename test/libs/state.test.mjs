import { STATE } from '../../src/libs/state.mjs';

describe('State Management', () => {
    beforeEach(() => {
        // Reset state before each test
        STATE.clearAll();
        STATE.canCommit = false;
        STATE.inProgress = false;
    });

    it('should initialize with default values', () => {
        expect(STATE.canCommit).toBe(false);
        expect(STATE.inProgress).toBe(false);
        expect(STATE.scripts).toEqual([]);
    });

    it('should set results correctly', () => {
        const results = [
            { name: 'test1', result: 'passed' },
            { name: 'test2', result: 'failed' }
        ];
        STATE.setResults(results);
        expect(STATE.scripts).toEqual(results);
    });

    it('should add result correctly', () => {
        const result = { name: 'test', result: 'passed' };
        STATE.addResult(result);
        expect(STATE.scripts).toContain(result);
    });

    it('should get result by name', () => {
        const result = { name: 'test', result: 'passed' };
        STATE.addResult(result);
        expect(STATE.getResult('test')).toEqual(result);
        expect(STATE.getResult('nonexistent')).toBeUndefined();
    });

    it('should replace result correctly', () => {
        const original = { name: 'test', result: 'passed' };
        const updated = { name: 'test', result: 'failed' };
        STATE.addResult(original);
        STATE.replaceResult(updated);
        expect(STATE.getResult('test')).toEqual(updated);
    });

    it('should clear all results', () => {
        STATE.addResult({ name: 'test', result: 'passed' });
        STATE.clearAll();
        expect(STATE.scripts).toEqual([]);
    });

    it('should clear one result', () => {
        STATE.addResult({ name: 'test1', result: 'passed' });
        STATE.addResult({ name: 'test2', result: 'failed' });
        STATE.clearOneResult({ name: 'test1' });
        expect(STATE.getResult('test1').result).toBeUndefined();
        expect(STATE.getResult('test2').result).toBe('failed');
    });

    it('should toggle inProgress state', () => {
        expect(STATE.isWorking()).toBe(STATE);
        expect(STATE.inProgress).toBe(true);
        expect(STATE.isWorking()).toBe(STATE);
        expect(STATE.inProgress).toBe(false);
    });

    it('should set inProgress explicitly', () => {
        expect(STATE.setWorking(true)).toBe(STATE);
        expect(STATE.inProgress).toBe(true);
        expect(STATE.setWorking(false)).toBe(STATE);
        expect(STATE.inProgress).toBe(false);
    });

    it('should expose a full status snapshot', () => {
        STATE.canCommit = true;
        STATE.setWorking(true);
        STATE.setResults([{ name: 'lint', result: 'ok' }]);

        expect(STATE.getStatus()).toEqual({
            canCommit: true,
            inProgress: true,
            scripts: [{ name: 'lint', result: 'ok' }]
        });
    });
});
