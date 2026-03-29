// Models of messages sent from server and sent from client

/**
 * Enumeration of available standard message types for the WebSocket communication.
 * @type {{ RE_CHECK: string, FIRST_RUN: string, STILL_WORKING: string, ERROR: string, EXIT: string, UNKNOW: string, FATAL_ERROR: string, STATUS_UPDATE: string }}
 */
export const TYPES_MESSAGES = {
    RE_CHECK: 'RE_CHECK', // check again
    FIRST_RUN: 'FIRST_RUN', // first time execution
    STILL_WORKING: 'STILL_WORKING', // still doing the work
    ERROR: 'ERROR', // error
    EXIT: 'EXIT', // normal exit
    UNKNOW: 'UNKNOW', // message unknow
    FATAL_ERROR: 'FATAL_ERROR', // fatal error, something went really wrong
    STATUS_UPDATE: 'STATUS_UPDATE' // status update with current state
};