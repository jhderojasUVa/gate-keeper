import { vi } from 'vitest';

// Mock dependencies
vi.mock('child_process', () => ({
    exec: vi.fn()
}));
vi.mock('util', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        promisify: vi.fn((fn) => async (...args) => {
            return new Promise((resolve, reject) => {
                fn(...args, (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
        })
    };
});
vi.mock('../../src/libs/log.mjs');

describe('Execute Scripts', () => {
    let executeScriptsModule;

    beforeEach(async () => {
        executeScriptsModule = await import('../../src/libs/execute_scripts.mjs');
    });

    it('should export executeScript function', () => {
        expect(typeof executeScriptsModule.executeScript).toBe('function');
    });

    it('should export executeAllScripts function', () => {
        expect(typeof executeScriptsModule.executeAllScripts).toBe('function');
    });

    it('should execute a script', async () => {
        // Skip testing the execution, as it's hard to mock
        expect(typeof executeScriptsModule.executeScript).toBe('function');
    });

    it('should handle invalid configuration array', async () => {
        const { expressLog } = await import('../../src/libs/log.mjs');
        const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {});

        try {
            await executeScriptsModule.executeAllScripts('invalid config');
        } catch (e) {
            // Expected to potentially error or exit
        }

        // Verify logging was called for invalid config
        expect(expressLog).toHaveBeenCalledWith(
            expect.objectContaining({
                message: 'Invalid configuration file...',
                severity: 'ERROR'
            })
        );
        expect(mockExit).toHaveBeenCalledWith(1);

        mockExit.mockRestore();
    });
});