import path from 'path';
import { fileURLToPath } from 'url';
import { beforeEach, describe, it, expect, vi } from 'vitest';

vi.mock('../src/libs/load_config.ts', () => ({
    configFileExists: vi.fn()
}));

vi.mock('fs', async (importOriginal) => {
    const actual = await importOriginal();
    const mocked = {
        readFileSync: vi.fn(),
        copyFileSync: vi.fn(),
        writeSync: vi.fn()
    };
    return {
        ...actual,
        __esModule: true,
        default: mocked,
        ...mocked
    };
});

vi.mock('../src/libs/app_utils.ts', () => ({
    __dirname: '/tmp'
}));

describe('gate-keeper-init', () => {
    let initGateKepper;
    let loadConfig;
    let fs;

    beforeEach(async () => {
        vi.clearAllMocks();
        const module = await import('../src/init.ts');
        initGateKepper = module.initGateKepper;
        loadConfig = await import('../src/libs/load_config.ts');
        fs = await import('fs');
    });

    it('creates configuration if missing', () => {
        loadConfig.configFileExists.mockReturnValue(false);

        const result = initGateKepper();
        expect(result).toBe(true);
        expect(fs.default.copyFileSync).toHaveBeenCalled();
    });

    it('does not create configuration if exists', () => {
        loadConfig.configFileExists.mockReturnValue(true);

        const result = initGateKepper();
        expect(result).toBe(false);
    });

    it('process.exit is invoked when copy fails', () => {
        loadConfig.configFileExists.mockReturnValue(false);
        fs.default.copyFileSync.mockImplementation(() => { throw new Error('copy fail'); });

        const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined);

        initGateKepper();

        expect(exitSpy).toHaveBeenCalledWith(1);
        exitSpy.mockRestore();
    });

    it('showHelp can be called without throwing', async () => {
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

        const { showHelp } = await import('../src/init.ts');
        showHelp();

        expect(consoleLogSpy).toHaveBeenCalled();

        consoleLogSpy.mockRestore();
    });

    it('showVersion prints version when package.json exists', async () => {
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
        fs.default.readFileSync.mockReturnValue(JSON.stringify({ version: '9.0.0' }));
        const expectedPackageJsonPath = path.resolve(
            path.dirname(fileURLToPath(new URL('../src/init.ts', import.meta.url))),
            '../package.json',
        );

        const { showVersion } = await import('../src/init.ts');
        showVersion();

        expect(fs.default.readFileSync).toHaveBeenCalledWith(
            expectedPackageJsonPath,
            'utf8',
        );
        expect(consoleLogSpy).toHaveBeenCalledWith('Gate Keeper v9.0.0');

        consoleLogSpy.mockRestore();
    });
});

describe('gate-keeper-init CLI mode', () => {
    let loadConfig;

    beforeEach(async () => {
        vi.resetModules();
        vi.clearAllMocks();
        const loadConfigModule = await import('../src/libs/load_config.ts');
        loadConfig = loadConfigModule;
    });

    it('shows help and exits with code 0 when --help is passed', async () => {
        const originalArgv = process.argv;
        process.argv = ['node', 'gate-keeper-init', '--help'];
        const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined);
        const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

        await import('../src/init.ts');

        expect(exitSpy).toHaveBeenCalledWith(0);

        exitSpy.mockRestore();
        logSpy.mockRestore();
        process.argv = originalArgv;
    });

    it('shows version and exits with code 0 when --version is passed', async () => {
        const originalArgv = process.argv;
        process.argv = ['node', 'gate-keeper-init', '--version'];
        const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined);
        const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

        await import('../src/init.ts');

        expect(exitSpy).toHaveBeenCalledWith(0);

        exitSpy.mockRestore();
        logSpy.mockRestore();
        process.argv = originalArgv;
    });

    it('calls initGateKepper in normal mode', async () => {
        const originalArgv = process.argv;
        process.argv = ['node', 'gate-keeper-init'];
        const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined);

        const module = await import('../src/init.ts');

        expect(module.initGateKepper).toBeDefined();

        exitSpy.mockRestore();
        process.argv = originalArgv;
    });

    it('handles invalid arguments', async () => {
        const originalArgv = process.argv;
        process.argv = ['node', 'gate-keeper-init', '--invalid'];
        const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined);
        const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

        await import('../src/init.ts');

        expect(exitSpy).toHaveBeenCalledWith(1);
        expect(logSpy).toHaveBeenCalledWith('❌ Unknown argument(s): --invalid');

        process.argv = originalArgv;
        exitSpy.mockRestore();
        logSpy.mockRestore();
    });

    it('handles --open option', async () => {
        const originalArgv = process.argv;
        process.argv = ['node', 'gate-keeper-init', '--open'];
        const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined);
        const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

        // Mock config
        loadConfig.configFileExists.mockReturnValue(true);

        // Mock exec
        vi.mock('child_process', () => ({
            exec: vi.fn((command, callback) => callback(null))
        }));

        await import('../src/init.ts');

        expect(logSpy).toHaveBeenCalledWith('\n✨ Gate Keeper is now ready! Run "gate-keeper" to start.');

        process.argv = originalArgv;
        exitSpy.mockRestore();
        logSpy.mockRestore();
    });
});
