import { configFileExists, getConfigurationData, loadPlugins } from '../../src/libs/load_config.mjs';
import fs from 'fs';

// Mock fs
jest.mock('fs', () => ({
    existsSync: jest.fn(),
    readFileSync: jest.fn()
}));

// Mock app_utils
jest.mock('../../src/libs/app_utils.mjs', () => ({
    __dirname: '/mock/dir'
}));

// Mock configuration model
jest.mock('../../src/models/configuration.model.mjs', () => ({
    CONFIGURATION_FILE: '/path/to/config.json',
    DEFAULT_CONFIGURATION_FILE: 'default.gate-keeper.conf.json'
}));

describe('Load Config', () => {
    const { existsSync, readFileSync } = require('fs');

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('configFileExists', () => {
        it('should return true when config file exists', () => {
            existsSync.mockReturnValue(true);
            expect(configFileExists()).toBe(true);
            expect(existsSync).toHaveBeenCalledWith('/path/to/config.json');
        });

        it('should return false when config file does not exist', () => {
            existsSync.mockReturnValue(false);
            expect(configFileExists()).toBe(false);
        });
    });

    describe('getConfigurationData', () => {
        it('should load config file when it exists', () => {
            existsSync.mockReturnValue(true);
            readFileSync.mockReturnValue('{"test": "config"}');

            const result = getConfigurationData();
            expect(result).toEqual({ test: 'config' });
            expect(readFileSync).toHaveBeenCalledWith('/path/to/config.json', { encoding: 'utf-8' });
        });

        it('should load default config when file does not exist', () => {
            existsSync.mockReturnValue(false);
            readFileSync.mockReturnValue('{"default": "config"}');

            const result = getConfigurationData();
            expect(result).toEqual({ default: 'config' });
            expect(readFileSync).toHaveBeenCalledWith('/mock/dir/../../default.gate-keeper.conf.json', { encoding: 'utf-8' });
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