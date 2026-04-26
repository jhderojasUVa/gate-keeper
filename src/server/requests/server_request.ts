// Server request
import { WS_RESPONSE_OK } from '../../models/wsResponse.model.js';
import { TYPES_MESSAGES } from '../../models/wsServerRequest.model.js';

export const welcomeMessage = {
    ...WS_RESPONSE_OK,
    type: TYPES_MESSAGES.FIRST_RUN,
    data: {},
};
