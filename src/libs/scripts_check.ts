// To check the result of all scripts
import type { ScriptModel } from '../models/configuration.model.js';

export const canCommit = (scripts: ScriptModel[]): boolean => {
    let canCommitResult = true;

    scripts.forEach((script) => {
        if (script.result === false) {
            canCommitResult = false;
        }
    });

    return canCommitResult;
};
