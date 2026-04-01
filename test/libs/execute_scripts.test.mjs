import { vi } from 'vitest';
import * as executeScriptsModule from '../../src/libs/execute_scripts.mjs';

// Mock dependencies
vi.mock('../../src/libs/log.mjs');

describe('Execute Scripts', () => {
    it('should export executeScript function', () => {
        expect(typeof executeScriptsModule.executeScript).toBe('function');
    });

    it('should export executeAllScripts function', () => {
        expect(typeof executeScriptsModule.executeAllScripts).toBe('function');
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