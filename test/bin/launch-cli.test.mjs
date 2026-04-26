import { beforeEach, describe, expect, it, vi } from 'vitest';

const existsSyncMock = vi.hoisted(() => vi.fn());
const spawnSyncMock = vi.hoisted(() => vi.fn());

vi.mock('node:fs', () => ({
    existsSync: existsSyncMock,
}));

vi.mock('node:child_process', () => ({
    spawnSync: spawnSyncMock,
}));

describe('launchCli', () => {
    let launchCli;

    beforeEach(async () => {
        vi.resetModules();
        vi.clearAllMocks();
        ({ launchCli } = await import('../../bin/launch-cli.js'));
    });

    it('shows a build-first message and exits when the built target is missing', () => {
        const originalArgv = process.argv;
        process.argv = ['node', 'gate-keeper', '--version'];
        existsSyncMock.mockReturnValue(false);

        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
            throw new Error(`process.exit:${code}`);
        });

        expect(() => launchCli({
            commandName: 'gate-keeper',
            targetRelativePath: '../dist/server/index.js',
        })).toThrow('process.exit:1');

        expect(consoleErrorSpy).toHaveBeenCalledWith(
            'gate-keeper has not been built yet.\nRun "npm run build" in the package root, then try again.',
        );
        expect(spawnSyncMock).not.toHaveBeenCalled();

        process.argv = originalArgv;
        exitSpy.mockRestore();
        consoleErrorSpy.mockRestore();
    });

    it('launches the built cli with forwarded arguments when the built target exists', () => {
        const originalArgv = process.argv;
        process.argv = ['node', 'gate-keeper', '--version'];
        existsSyncMock.mockReturnValue(true);
        spawnSyncMock.mockReturnValue({ status: 0 });

        const exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
            throw new Error(`process.exit:${code}`);
        });

        expect(() => launchCli({
            commandName: 'gate-keeper',
            targetRelativePath: '../dist/server/index.js',
        })).toThrow('process.exit:0');

        expect(existsSyncMock).toHaveBeenCalledTimes(1);
        expect(spawnSyncMock).toHaveBeenCalledWith(
            process.execPath,
            [existsSyncMock.mock.calls[0][0], '--version'],
            {
                stdio: 'inherit',
                env: process.env,
            },
        );

        process.argv = originalArgv;
        exitSpy.mockRestore();
    });
});
