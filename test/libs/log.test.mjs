import { expressLog } from '../../src/libs/log.mjs';

describe('Logging', () => {
    let originalConsoleLog;
    let consoleLogMock;

    beforeEach(() => {
        originalConsoleLog = console.log;
        consoleLogMock = jest.fn();
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
        expect(consoleLogMock).toHaveBeenCalledWith(
            expect.stringContaining('INFO')
        );
    });

    it('should log messages with specified severity', () => {
        expressLog({
            message: 'Error message',
            kind: 'TEST',
            severity: 'ERROR'
        });

        expect(consoleLogMock).toHaveBeenCalledWith(
            expect.stringContaining('ERROR')
        );
    });

    it('should handle missing severity', () => {
        expressLog({
            message: 'Test message',
            kind: 'TEST',
            severity: undefined
        });

        expect(consoleLogMock).toHaveBeenCalledWith(
            expect.stringContaining('INFO')
        );
    });

    it('should format log messages correctly', () => {
        const now = new Date();
        expressLog({
            message: 'Test message',
            kind: 'TEST',
            severity: 'INFO'
        });

        const logCall = consoleLogMock.mock.calls[0][0];
        expect(logCall).toContain('[INFO]');
        expect(logCall).toContain('TEST');
        expect(logCall).toContain('Test message');
    });
});