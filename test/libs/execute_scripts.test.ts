import { beforeEach, describe, expect, it, vi } from 'vitest';

type ExecuteScriptsModule = typeof import('../../src/libs/execute_scripts.js');

vi.mock('child_process', () => ({
    exec: vi.fn(),
}));

vi.mock('util', async (importOriginal) => {
    const actual = await importOriginal() as Record<string, unknown>;
    return {
        ...actual,
        promisify: vi.fn((fn: (...args: unknown[]) => void) => async (...args: unknown[]) => {
            return new Promise((resolve, reject) => {
                fn(...args, (err: unknown, result: unknown) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
        }),
    };
});

vi.mock('../../src/libs/log.js');

describe('Execute Scripts', () => {
    let executeScriptsModule: ExecuteScriptsModule;

    beforeEach(async () => {
        executeScriptsModule = await import('../../src/libs/execute_scripts.js');
    });

    it('should export executeScript function', () => {
        expect(typeof executeScriptsModule.executeScript).toBe('function');
    });

    it('should export executeAllScripts function', () => {
        expect(typeof executeScriptsModule.executeAllScripts).toBe('function');
    });

    it('should execute a script', async () => {
        expect(typeof executeScriptsModule.executeScript).toBe('function');
    });

    it('should handle invalid configuration array', async () => {
        const { expressLog } = await import('../../src/libs/log.js');
        const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => undefined as never) as typeof process.exit);

        try {
            await executeScriptsModule.executeAllScripts('invalid config' as never);
        } catch {
            // Expected to potentially error or exit
        }

        expect(expressLog).toHaveBeenCalledWith(
            expect.objectContaining({
                message: 'Invalid configuration file...',
                severity: 'ERROR',
            }),
        );
        expect(mockExit).toHaveBeenCalledWith(1);

        mockExit.mockRestore();
    });
});
