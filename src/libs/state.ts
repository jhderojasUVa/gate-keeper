// State of the app - Singleton
import { canCommit } from './scripts_check.js';
import type { ScriptModel } from '../models/configuration.model.js';

interface StateSnapshot {
    canCommit: boolean;
    inProgress: boolean;
    scripts: ScriptModel[];
}

class State {
    public canCommit: boolean;
    public inProgress: boolean;
    public scripts: ScriptModel[];

    // Initial State
    constructor() {
        this.canCommit = false;
        this.inProgress = false;
        this.scripts = [];
    }

    // Actions
    // Add all
    setResults(results: ScriptModel[]): this {
        this.scripts = results;
        return this;
    }

    // Add one
    addResult(result: ScriptModel): this {
        this.scripts.push(result);
        return this;
    }

    // Get one by title
    getResult(scriptTitle: string): ScriptModel | undefined {
        return this.scripts.find((script) => script.name === scriptTitle);
    }

    // Replace
    replaceResult(scriptContent: ScriptModel): this {
        const { name } = scriptContent;
        // replace
        this.scripts.forEach((script, index) => {
            if (script.name === name) {
                this.scripts[index] = scriptContent;
            }
        });

        return this;
    }

    // Remove one
    removeResult(scriptToRemove: ScriptModel): this {
        const { name } = scriptToRemove;

        this.scripts.forEach((script, index) => {
            // remove
            if (script.name === name) {
                this.scripts.splice(index, 1);
            }
        });

        return this;
    }

    // Clear all
    clearAll(): this {
        this.scripts = [];

        return this;
    }

    // Clear one
    clearOneResult(scriptToClear: ScriptModel): this {
        const { name } = scriptToClear;

        this.scripts.forEach((script, index) => {
            // remove
            if (script.name === name) {
                this.scripts[index] = {
                    ...this.scripts[index],
                    result: undefined,
                };
            }
        });

        return this;
    }

    // Update canCommit
    async updateCanCommit(): Promise<this> {
        this.canCommit = await canCommit(this.scripts);

        return this;
    }

    // Explicit working state setter for long-running flows
    setWorking(isWorking: boolean): this {
        this.inProgress = isWorking;

        return this;
    }

    // Snapshot of the current status for HTTP, WebSocket and MCP consumers
    getStatus(): StateSnapshot {
        return {
            canCommit: this.canCommit,
            inProgress: this.inProgress,
            scripts: this.scripts,
        };
    }

    // Working in progress
    isWorking(): this {
        this.inProgress = !this.inProgress;

        return this;
    }
}

export const STATE = new State();
