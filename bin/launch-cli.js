import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Launches a built CLI entrypoint when available.
 *
 * @param {object} options Launcher options.
 * @param {string} options.commandName Command name shown in user-facing messages.
 * @param {string} options.targetRelativePath Relative path from this file to the built entrypoint.
 * @returns {never}
 */
export const launchCli = ({ commandName, targetRelativePath }) => {
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    const targetPath = path.resolve(currentDir, targetRelativePath);

    if (!existsSync(targetPath)) {
        console.error(
            `${commandName} has not been built yet.\nRun "npm run build" in the package root, then try again.`,
        );
        process.exit(1);
    }

    const { error, status } = spawnSync(process.execPath, [targetPath, ...process.argv.slice(2)], {
        stdio: 'inherit',
        env: process.env,
    });

    if (error) {
        console.error(`Failed to start ${commandName}: ${error.message}`);
        process.exit(1);
    }

    process.exit(status ?? 1);
};
