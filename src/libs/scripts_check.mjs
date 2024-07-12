// To check the result of all scripts

export const canCommit = (scripts) => {
    let canCommit = true;

    scripts.every((script) => {
        if (script.result === false) {
            canCommit = false;
            // stop we don't need to know more
            return false;
        }
        // go to the next
        return true;
    })

    return canCommit;
}