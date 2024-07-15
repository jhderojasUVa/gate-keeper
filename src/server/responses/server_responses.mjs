// Server responses
import { version } from "../../libs/app_utils.mjs"
import { TYPES_MESSAGES } from '../../models/wsServerRequest.model.mjs';
import { WS_RESPONSE_OK, WS_RESPONSE_KO } from '../../models/wsResponse.model.mjs'

// Greeting of the app
export const connection = {
    ...WS_RESPONSE_OK,
    ...TYPES_MESSAGES.FIRST_RUN,
    data: `Welcome to Gate Keeper Web Socket server version ${version}!`
}

// Response of the app
export const response = (data, isOK = true) => {
    return {
        ...(isOK ? WS_RESPONSE_OK : WS_RESPONSE_KO),
        data,
    }
}