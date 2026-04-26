// General application utils
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// __dirname patch
const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

interface PackageManifest {
    version: string;
}

const packageManifest = JSON.parse(
    fs.readFileSync(`${__dirname}/../../package.json`, 'utf8')
) as PackageManifest;

// Get version of the app
export const version: string = packageManifest.version;

const releaseChannel = /(?:^|-)beta(?:[.-]|$)/i.test(version) ? 'beta' : 'stable';

/**
 * Shared release preferences derived from the package version.
 */
export const appReleasePreferences = Object.freeze({
    version,
    releaseChannel,
    showBetaStartupRibbon: releaseChannel === 'beta',
});

/**
 * Startup ribbon lines shown when running a beta build.
 */
export const betaStartupRibbonLines: string[] = appReleasePreferences.showBetaStartupRibbon
    ? [
        '🧪 ==================================================',
        `🧪 Gate Keeper BETA build detected (v${version})`,
        '🧪 Features and behavior may still change before stable release.',
        '🧪 ==================================================',
    ]
    : [];
