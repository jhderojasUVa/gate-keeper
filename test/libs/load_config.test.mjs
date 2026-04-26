import { configFileExists, getConfigurationData, loadPlugins } from '../../src/libs/load_config.ts';
import fs from 'fs';
import { vi } from 'vitest';

// Mock fs
vi.mock('fs', () => ({
    default: {
        existsSync: vi.fn(),
        readFileSync: vi.fn()
    },
    existsSync: vi.fn(),
    readFileSync: vi.fn()
}));

// Mock app_utils
vi.mock('../../src/libs/app_utils.ts', () => ({
    __dirname: '/mock/dir'
}));

// Mock configuration model
vi.mock('../../src/models/configuration.model.ts', () => ({
    CONFIGURATION_FILE: '/path/to/config.json',
    DEFAULT_CONFIGURATION_FILE: 'default.gate-keeper.conf.json'
}));

describe('Load Config', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('configFileExists', () => {
        it('should return true when config file exists', () => {
            fs.existsSync.mockReturnValue(true);
            expect(configFileExists()).toBe(true);
            expect(fs.existsSync).toHaveBeenCalledWith('/path/to/config.json');
        });

        it('should return false when config file does not exist', () => {
            fs.existsSync.mockReturnValue(false);
            expect(configFileExists()).toBe(false);
        });
    });

    describe('getConfigurationData', () => {
        it('should load config file when it exists', () => {
            fs.existsSync.mockReturnValue(true);
            fs.readFileSync.mockReturnValue('{"test": "config"}');

            const result = getConfigurationData();
            expect(result).toEqual({ test: 'config' });
            expect(fs.readFileSync).toHaveBeenCalledWith('/path/to/config.json', { encoding: 'utf-8' });
        });

        it('should load default config when file does not exist', () => {
            fs.existsSync.mockReturnValue(false);
            fs.readFileSync.mockReturnValue('{"default": "config"}');

            const result = getConfigurationData();
            expect(result).toEqual({ default: 'config' });
            expect(fs.readFileSync).toHaveBeenCalledWith(
                expect.stringContaining('default.gate-keeper.conf.json'),
                { encoding: 'utf-8' }
            );
        });
    });

    describe('loadPlugins', () => {
        it('should return scripts when valid config is provided', () => {
            const config = {
                scripts: [
                    { name: 'test1', command: 'echo test1' },
                    { name: 'test2', command: 'echo test2' }
                ]
            };

            const result = loadPlugins(config);
            expect(result).toEqual(config.scripts);
        });

        it('should return error when scripts is not an array', () => {
            const config = {
                scripts: 'not an array'
            };

            const result = loadPlugins(config);
            expect(result).toEqual({
                error: true,
                data: 'Scripts are not following the standard'
            });
        });

        it('should return error when scripts is missing', () => {
            const config = {};

            const result = loadPlugins(config);
            expect(result).toEqual({
                error: true,
                data: 'Scripts are not following the standard'
            });
        });
    });
});