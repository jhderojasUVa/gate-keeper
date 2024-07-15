// State of the app - Singleton
import { canCommit } from "./scripts_check.mjs";

class State {
    // Initial State
    constructor() {
        this.canCommit = false;
        this.scripts = [];
    }

    // Actions
    // Add all
    setResults(results) {
        this.scripts = results;
        return this;
    }

    // Add one
    addResult(result) {
        this.scripts.push(result);
        return this;
    }

    // Get one by title
    getResult(scriptTitle) {
        return this.scripts.find((script) => script.title === scriptTitle);
    }

    // Replace
    replaceResult(scriptContent) {
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
    removeResult(scriptToRemove) {
        const { name } = scriptToRemove;

        this.scripts.forEach((script, index) => {
            // remove
            if (script.name === name) {
                this.scripts.slice(index, 1)
            }
        });

        return this;
    }

    // Clear all
    clearAll() {
        this.scripts = [];

        return this;
    }

    // Clear one
    clearOneResult(scriptToClear) {
        const { name } = scriptToClear;

        this.scripts.forEach((script, index) => {
            // remove
            if (script.name === name) {
                this.scripts[index] = {
                    ...this.scripts[index],
                    result: undefined
                }
            }
        });

        return this;
    }

    // Update canCommit
    // I don't like this way and will be changed in the future
    async updateCanCommit() {
        this.canCommit = await canCommit(this.scripts);

        return this;
    }
};

export const STATE = new State();