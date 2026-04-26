import { __dirname, version, appReleasePreferences, betaStartupRibbonLines } from '../../src/libs/app_utils.js';
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
        expect(version).toMatch(/^\d+\.\d+\.\d+-beta\.\d+$/);
    });

    it('should derive beta startup preferences from the package version', () => {
        expect(appReleasePreferences.version).toBe(version);
        expect(appReleasePreferences.releaseChannel).toBe('beta');
        expect(appReleasePreferences.showBetaStartupRibbon).toBe(true);
        expect(betaStartupRibbonLines).toContain(`🧪 Gate Keeper BETA build detected (v${version})`);
    });

    it('__dirname should point to libs directory', () => {
        expect(__dirname).toContain('libs');
        expect(__dirname).toContain('gate-keeper');
    });
});
