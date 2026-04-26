import path from 'path';
import { fileURLToPath } from 'url';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const configFileExistsMock = vi.hoisted(() => vi.fn());
const readFileSyncMock = vi.hoisted(() => vi.fn());
const copyFileSyncMock = vi.hoisted(() => vi.fn());
const writeSyncMock = vi.hoisted(() => vi.fn());
const execMock = vi.hoisted(() => vi.fn());

vi.mock('../src/libs/load_config.js', () => ({
    configFileExists: configFileExistsMock,
}));

vi.mock('fs', () => {
    const mocked = {
        readFileSync: readFileSyncMock,
        copyFileSync: copyFileSyncMock,
        writeSync: writeSyncMock,
    };

    return {
        __esModule: true,
        default: mocked,
        ...mocked,
    };
});

vi.mock('child_process', () => ({
    exec: execMock,
}));

vi.mock('../src/libs/app_utils.js', () => ({
    __dirname: '/tmp',
}));

type InitModule = typeof import('../src/init.js');

const mockProcessExit = () => vi.spyOn(process, 'exit').mockImplementation((() => undefined as never) as typeof process.exit);

describe('gate-keeper-init', () => {
    let initModule: InitModule;

    beforeEach(async () => {
        vi.resetModules();
        vi.clearAllMocks();
        initModule = await import('../src/init.js');
    });

    it('creates configuration if missing', () => {
        configFileExistsMock.mockReturnValue(false);

        const result = initModule.initGateKepper();
        expect(result).toBe(true);
        expect(copyFileSyncMock).toHaveBeenCalled();
    });

    it('does not create configuration if exists', () => {
        configFileExistsMock.mockReturnValue(true);

        const result = initModule.initGateKepper();
        expect(result).toBe(false);
    });

    it('process.exit is invoked when copy fails', () => {
        configFileExistsMock.mockReturnValue(false);
        copyFileSyncMock.mockImplementation(() => {
            throw new Error('copy fail');
        });

        const exitSpy = mockProcessExit();

        initModule.initGateKepper();

        expect(exitSpy).toHaveBeenCalledWith(1);
        exitSpy.mockRestore();
    });

    it('showHelp can be called without throwing', async () => {
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

        const { showHelp } = await import('../src/init.js');
        showHelp();

        expect(consoleLogSpy).toHaveBeenCalled();

        consoleLogSpy.mockRestore();
    });

    it('showVersion prints version when package.json exists', async () => {
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
        readFileSyncMock.mockReturnValue(JSON.stringify({ version: '9.0.0' }));
        const expectedPackageJsonPath = path.resolve(
            path.dirname(fileURLToPath(new URL('../src/init.js', import.meta.url))),
            '../package.json',
        );

        const { showVersion } = await import('../src/init.js');
        showVersion();

        expect(readFileSyncMock).toHaveBeenCalledWith(
            expectedPackageJsonPath,
            'utf8',
        );
        expect(consoleLogSpy).toHaveBeenCalledWith('Gate Keeper v9.0.0');

        consoleLogSpy.mockRestore();
    });
});

describe('gate-keeper-init CLI mode', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
    });

    it('shows help and exits with code 0 when --help is passed', async () => {
        const originalArgv = process.argv;
        process.argv = ['node', 'gate-keeper-init', '--help'];
        const exitSpy = mockProcessExit();
        const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

        await import('../src/init.js');

        expect(exitSpy).toHaveBeenCalledWith(0);

        exitSpy.mockRestore();
        logSpy.mockRestore();
        process.argv = originalArgv;
    });

    it('shows version and exits with code 0 when --version is passed', async () => {
        const originalArgv = process.argv;
        process.argv = ['node', 'gate-keeper-init', '--version'];
        const exitSpy = mockProcessExit();
        const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

        await import('../src/init.js');

        expect(exitSpy).toHaveBeenCalledWith(0);

        exitSpy.mockRestore();
        logSpy.mockRestore();
        process.argv = originalArgv;
    });

    it('calls initGateKepper in normal mode', async () => {
        const originalArgv = process.argv;
        process.argv = ['node', 'gate-keeper-init'];
        const exitSpy = mockProcessExit();

        const module = await import('../src/init.js');

        expect(module.initGateKepper).toBeDefined();

        exitSpy.mockRestore();
        process.argv = originalArgv;
    });

    it('handles invalid arguments', async () => {
        const originalArgv = process.argv;
        process.argv = ['node', 'gate-keeper-init', '--invalid'];
        const exitSpy = mockProcessExit();
        const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

        await import('../src/init.js');

        expect(exitSpy).toHaveBeenCalledWith(1);
        expect(logSpy).toHaveBeenCalledWith('❌ Unknown argument(s): --invalid');

        process.argv = originalArgv;
        exitSpy.mockRestore();
        logSpy.mockRestore();
    });

    it('handles --open option', async () => {
        const originalArgv = process.argv;
        process.argv = ['node', 'gate-keeper-init', '--open'];
        const exitSpy = mockProcessExit();
        const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

        configFileExistsMock.mockReturnValue(true);
        execMock.mockImplementation((_command: string, callback?: (error: Error | null) => void) => callback?.(null));

        await import('../src/init.js');

        expect(logSpy).toHaveBeenCalledWith('\n✨ Gate Keeper is now ready! Run "gate-keeper" to start.');

        process.argv = originalArgv;
        exitSpy.mockRestore();
        logSpy.mockRestore();
    });
});
