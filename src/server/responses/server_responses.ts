// Server responses
import { version } from '../../libs/app_utils.js';
import { TYPES_MESSAGES } from '../../models/wsServerRequest.model.js';
import { WS_RESPONSE_OK, WS_RESPONSE_KO } from '../../models/wsResponse.model.js';

// Greeting of the app
export const connection = {
    ...WS_RESPONSE_OK,
    type: TYPES_MESSAGES.FIRST_RUN,
    data: `Welcome to Gate Keeper Web Socket server version ${version}!`,
};

interface ResponseOptions {
    data?: unknown;
    isOK?: boolean;
    typeMessage?: string;
}

// Response of the app
export const response = ({
    data,
    isOK,
    typeMessage,
}: ResponseOptions = {}) => {
    return {
        ...(isOK ? WS_RESPONSE_OK : WS_RESPONSE_KO),
        type: typeMessage !== undefined && TYPES_MESSAGES[typeMessage as keyof typeof TYPES_MESSAGES] !== undefined
            ? TYPES_MESSAGES[typeMessage as keyof typeof TYPES_MESSAGES]
            : TYPES_MESSAGES.UNKNOW,
        data,
    };
};

export const canCommit = (commit: unknown): unknown => commit;
