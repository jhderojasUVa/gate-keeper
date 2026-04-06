import { expressLog } from '../../src/libs/log.mjs';
import { vi } from 'vitest';

// Mock colors
vi.mock('../../src/libs/colors.mjs', () => ({
    colors: {
        text: {
            yellow: '',
            red: '',
            white: ''
        },
        reset: ''
    }
}));

describe('Logging', () => {
    let originalConsoleLog;
    let consoleLogMock;

    beforeEach(() => {
        originalConsoleLog = console.log;
        consoleLogMock = vi.fn();
        console.log = consoleLogMock;
    });

    afterEach(() => {
        console.log = originalConsoleLog;
    });

    it('should log messages with default INFO severity', () => {
        expressLog({
            message: 'Test message',
            kind: 'TEST'
        });

        expect(consoleLogMock).toHaveBeenCalledWith(
            expect.stringContaining('Test message')
        );
        expect(consoleLogMock).toHaveBeenCalledWith(
            expect.stringContaining('TEST')
        );
    });

    it('should log messages with specified severity', () => {
        expressLog({
            message: 'Error message',
            kind: 'TEST',
            severity: 'ERROR'
        });

        expect(consoleLogMock).toHaveBeenCalledWith(
            expect.stringContaining('Error message')
        );
        expect(consoleLogMock).toHaveBeenCalledWith(
            expect.stringContaining('TEST')
        );
    });

    it('should log WARNING messages', () => {
        expressLog({
            message: 'Warning message',
            kind: 'TEST',
            severity: 'WARNING'
        });

        expect(consoleLogMock).toHaveBeenCalledWith(
            expect.stringContaining('Warning message')
        );
    });

    it('should handle missing severity', () => {
        expressLog({
            message: 'Test message',
            kind: 'TEST',
            severity: undefined
        });

        expect(consoleLogMock).toHaveBeenCalledWith(
            expect.stringContaining('Test message')
        );
        expect(consoleLogMock).toHaveBeenCalledWith(
            expect.stringContaining('TEST')
        );
    });

    it('should format log messages correctly', () => {
        expressLog({
            message: 'Test message',
            kind: 'TEST',
            severity: 'INFO'
        });

        const logCall = consoleLogMock.mock.calls[0][0];
        expect(logCall).toContain('TEST');
        expect(logCall).toContain('Test message');
    });
});