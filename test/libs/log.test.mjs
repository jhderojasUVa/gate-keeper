import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const colorsMock = {
    text: {
        yellow: '<yellow>',
        red: '<red>',
        white: '<white>',
    },
    reset: '<reset>',
};

const loadLogModule = async ({ logOnDisk = false, logFile } = {}) => {
    vi.resetModules();

    if (logOnDisk) {
        process.env.GATE_KEEPER_LOG_ON_DISK = 'true';
    } else {
        delete process.env.GATE_KEEPER_LOG_ON_DISK;
    }

    if (logFile) {
        process.env.GATE_KEEPER_LOG_FILE = logFile;
    } else {
        delete process.env.GATE_KEEPER_LOG_FILE;
    }

    const appendFileSync = vi.fn();

    vi.doMock('fs', () => ({
        default: { appendFileSync },
    }));

    vi.doMock('../../src/libs/colors.js', () => ({
        colors: colorsMock,
    }));

    const { expressLog } = await import('../../src/libs/log.ts');
    return { expressLog, appendFileSync };
};

describe('Logging', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        delete process.env.GATE_KEEPER_LOG_ON_DISK;
        delete process.env.GATE_KEEPER_LOG_FILE;
    });

    it('logs INFO messages by default', async () => {
        const { expressLog, appendFileSync } = await loadLogModule();

        expressLog({
            message: 'Test message',
            kind: 'TEST',
        });

        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[TEST]: Test message'));
        expect(appendFileSync).not.toHaveBeenCalled();
    });

    it('logs WARNING and ERROR severities case-insensitively', async () => {
        const { expressLog } = await loadLogModule();

        expressLog({
            message: 'Warning message',
            kind: 'TEST',
            severity: 'warning',
        });
        expressLog({
            message: 'Error message',
            kind: 'TEST',
            severity: 'ERROR',
        });

        expect(console.log).toHaveBeenNthCalledWith(1, expect.stringContaining('[TEST]: Warning message'));
        expect(console.log).toHaveBeenNthCalledWith(2, expect.stringContaining('[TEST]: Error message'));
    });

    it('uses the default branch for unknown severities', async () => {
        const { expressLog } = await loadLogModule();

        expressLog({
            message: 'Plain message',
            kind: 'TEST',
            severity: 'debug',
        });

        expect(console.log).toHaveBeenCalledWith('[TEST]: Plain message');
    });

    it('writes logs to disk when configured', async () => {
        const { expressLog, appendFileSync } = await loadLogModule({
            logOnDisk: true,
            logFile: 'custom.log',
        });

        expressLog({
            message: 'Persist me',
            kind: 'DISK',
            severity: 'INFO',
        });

        expect(appendFileSync).toHaveBeenCalledTimes(1);
        expect(appendFileSync).toHaveBeenCalledWith(
            'custom.log',
            expect.stringContaining('[INFO] [DISK] Persist me')
        );
    });
});
