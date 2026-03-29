import { executeScript, executeAllScripts } from '../../src/libs/execute_scripts.mjs';

// Mock child_process.exec
jest.mock('child_process', () => ({
    exec: jest.fn()
}));

// Mock util.promisify
jest.mock('util', () => ({
    promisify: jest.fn((fn) => fn)
}));

// Mock log
jest.mock('../../src/libs/log.mjs', () => ({
    expressLog: jest.fn()
}));

describe('Execute Scripts', () => {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const { expressLog } = require('../../src/libs/log.mjs');

    beforeEach(() => {
        jest.clearAllMocks();
        exec.mockResolvedValue({ stdout: 'success', stderr: '' });
        promisify.mockReturnValue(exec);
    });

    it('should execute a single script', async () => {
        const script = { command: 'echo test' };
        const result = await executeScript(script);

        expect(exec).toHaveBeenCalledWith('echo test');
        expect(result).toEqual({ stdout: 'success', stderr: '' });
    });

    it('should execute all scripts', async () => {
        const scripts = [
            { command: 'echo test1' },
            { command: 'echo test2' }
        ];

        const results = await executeAllScripts(scripts);

        expect(results).toHaveLength(2);
        expect(exec).toHaveBeenCalledTimes(2);
        expect(exec).toHaveBeenCalledWith('echo test1');
        expect(exec).toHaveBeenCalledWith('echo test2');
    });

    it('should handle script execution errors', async () => {
        exec.mockRejectedValue(new Error('Command failed'));

        const scripts = [{ command: 'failing command' }];

        await expect(executeAllScripts(scripts)).rejects.toThrow('Command failed');
    });

    it('should exit on invalid configuration', async () => {
        const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
        const originalConsole = console.error;
        console.error = jest.fn();

        await executeAllScripts('invalid config');

        expect(expressLog).toHaveBeenCalledWith({
            message: 'Invalid configuration file...',
            severity: 'ERROR',
            kind: 'CONF FILE - CONFIGURATION'
        });
        expect(mockExit).toHaveBeenCalledWith(1);

        mockExit.mockRestore();
        console.error = originalConsole;
    });
});