// State of the app - Singleton

class State {
    constructor() {
        this.canCommit = false;
        this.scripts = [];
    }

    setResults(results) {
        this.scripts = results;
    }

    getResult(scriptTitle) {
        return this.scripts.find((script) => script.title === scriptTitle);
    }

    setResult(scriptContent) {
        const { title, }
        this.scripts.forEach((script, index) => {
            if (script.title === scriptContent)
        })
    }

    removeResult(scriptToRemove) {
        this.scripts.forEach((script, index) => {

        })
    }
}