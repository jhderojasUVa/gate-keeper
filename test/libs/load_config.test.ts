import { beforeEach, describe, expect, it, vi } from 'vitest';
import { configFileExists, getConfigurationData, loadPlugins } from '../../src/libs/load_config.js';
import type { GateKeeperConfigModel, ScriptModel } from '../../src/models/configuration.model.js';

const existsSyncMock = vi.hoisted(() => vi.fn());
const readFileSyncMock = vi.hoisted(() => vi.fn());

const createScript = (overrides: Partial<ScriptModel> = {}): ScriptModel => ({
    name: undefined,
    command: undefined,
    data: undefined,
    result: undefined,
    ...overrides,
});

const createConfig = (overrides: Partial<GateKeeperConfigModel> = {}): GateKeeperConfigModel => ({
    port: undefined,
    host: undefined,
    scripts: [],
    ...overrides,
});

vi.mock('fs', () => ({
    default: {
        existsSync: existsSyncMock,
        readFileSync: readFileSyncMock,
    },
    existsSync: existsSyncMock,
    readFileSync: readFileSyncMock,
}));

vi.mock('../../src/libs/app_utils.js', () => ({
    __dirname: '/mock/dir',
}));

vi.mock('../../src/models/configuration.model.js', () => ({
    CONFIGURATION_FILE: '/path/to/config.json',
    DEFAULT_CONFIGURATION_FILE: 'default.gate-keeper.conf.json',
}));

describe('Load Config', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('configFileExists', () => {
        it('should return true when config file exists', () => {
            existsSyncMock.mockReturnValue(true);
            expect(configFileExists()).toBe(true);
            expect(existsSyncMock).toHaveBeenCalledWith('/path/to/config.json');
        });

        it('should return false when config file does not exist', () => {
            existsSyncMock.mockReturnValue(false);
            expect(configFileExists()).toBe(false);
        });
    });

    describe('getConfigurationData', () => {
        it('should load config file when it exists', () => {
            existsSyncMock.mockReturnValue(true);
            readFileSyncMock.mockReturnValue('{"test": "config"}');

            const result = getConfigurationData();
            expect(result).toEqual({ test: 'config' });
            expect(readFileSyncMock).toHaveBeenCalledWith('/path/to/config.json', { encoding: 'utf-8' });
        });

        it('should load default config when file does not exist', () => {
            existsSyncMock.mockReturnValue(false);
            readFileSyncMock.mockReturnValue('{"default": "config"}');

            const result = getConfigurationData();
            expect(result).toEqual({ default: 'config' });
            expect(readFileSyncMock).toHaveBeenCalledWith(
                expect.stringContaining('default.gate-keeper.conf.json'),
                { encoding: 'utf-8' },
            );
        });
    });

    describe('loadPlugins', () => {
        it('should return scripts when valid config is provided', () => {
            const config = createConfig({
                scripts: [
                    createScript({ name: 'test1', command: 'echo test1' }),
                    createScript({ name: 'test2', command: 'echo test2' }),
                ],
            });

            const result = loadPlugins(config);
            expect(result).toEqual(config.scripts);
        });

        it('should return error when scripts is not an array', () => {
            const config = createConfig({
                scripts: 'not an array' as never,
            });

            const result = loadPlugins(config);
            expect(result).toEqual({
                error: true,
                data: 'Scripts are not following the standard',
            });
        });

        it('should return error when scripts is missing', () => {
            const config = createConfig({
                scripts: undefined as never,
            });

            const result = loadPlugins(config);
            expect(result).toEqual({
                error: true,
                data: 'Scripts are not following the standard',
            });
        });
    });
});
