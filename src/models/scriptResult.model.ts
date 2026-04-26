// Script result model

/**
 * Interface representing the result of a script's execution.
 */
export interface ScriptResult {
    success: boolean;
    data: unknown;
}

/**
 * Base model representing the result of a script's execution.
 */
export const scriptResult: ScriptResult = {
    success: false,
    data: undefined,
};
