import { beforeEach, describe, expect, it, vi } from 'vitest';

const launchCliMock = vi.hoisted(() => vi.fn());

vi.mock('../../bin/launch-cli.js', () => ({
    launchCli: launchCliMock,
}));

describe('bin wrappers', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
    });

    it('gate-keeper wrapper launches the built server entrypoint', async () => {
        await import('../../bin/gate-keeper.js');

        expect(launchCliMock).toHaveBeenCalledWith({
            commandName: 'gate-keeper',
            targetRelativePath: '../dist/server/index.js',
        });
    });

    it('gate-keeper-init wrapper launches the built init entrypoint', async () => {
        await import('../../bin/gate-keeper-init.js');

        expect(launchCliMock).toHaveBeenCalledWith({
            commandName: 'gate-keeper-init',
            targetRelativePath: '../dist/init.js',
        });
    });
});
