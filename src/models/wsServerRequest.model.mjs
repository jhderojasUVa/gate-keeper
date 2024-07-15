// Models of messages sent from server and sent from client

export const TYPES_MESSAGES = {
    RE_CHECK: 'RE_CHECK', // check again
    FIRST_RUN: 'FIRST_RUN', // first time execution
    ERROR: 'ERROR', // error
    EXIT: 'EXIT', // normal exit
    FATAL_ERROR: 'FATAL_ERROR' // fatal error, something went really wrong
};