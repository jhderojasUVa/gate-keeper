// Server request
import { WS_RESPONSE_OK, WS_RESPONSE_KO } from '../../models/wsResponse.model.mjs';
import { TYPES_MESSAGES } from '../../models/wsServerRequest.model.mjs';

export const welcomeMessage = {
    ...WS_RESPONSE_OK,
    type: TYPES_MESSAGES.FIRST_RUN,
    data: {},
}