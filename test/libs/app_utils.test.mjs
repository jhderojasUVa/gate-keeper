import { __dirname, version } from '../../src/libs/app_utils.ts';
import path from 'path';

describe('App Utils', () => {
    it('should export __dirname', () => {
        expect(__dirname).toBeDefined();
        expect(typeof __dirname).toBe('string');
        expect(path.isAbsolute(__dirname)).toBe(true);
    });

    it('should export version from package.json', () => {
        expect(version).toBeDefined();
        expect(typeof version).toBe('string');
        // Version should be in semver format (basic check)
        expect(version).toMatch(/^\d+\.\d+\.\d+/);
    });

    it('__dirname should point to libs directory', () => {
        expect(__dirname).toContain('libs');
        expect(__dirname).toContain('gate-keeper');
    });
});