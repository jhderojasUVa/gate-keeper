// State of the app - Singleton

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
    }

    // Add one
    addResult(result) {
        this.scripts.push(result);
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
    }

    // Clear all
    clearAll() {
        this.scripts = [];
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
    }
};

export const STATE = new State();