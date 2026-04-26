// Models of messages sent from server and sent from client

/**
 * Enumeration of available standard message types for the WebSocket communication.
 */
export const TYPES_MESSAGES = {
    RE_CHECK: 'RE_CHECK',
    FIRST_RUN: 'FIRST_RUN',
    STILL_WORKING: 'STILL_WORKING',
    ERROR: 'ERROR',
    EXIT: 'EXIT',
    UNKNOW: 'UNKNOW',
    FATAL_ERROR: 'FATAL_ERROR',
    STATUS_UPDATE: 'STATUS_UPDATE',
} as const;

export type MessageType = typeof TYPES_MESSAGES[keyof typeof TYPES_MESSAGES];
