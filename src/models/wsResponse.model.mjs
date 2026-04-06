// WS Response model

/**
 * Default successful WebSocket payload representation.
 * @type {{ success: boolean, data: any }}
 */
export const WS_RESPONSE_OK = {
    success: true,
    data: undefined
};

/**
 * Default erroneous WebSocket payload representation.
 * @type {{ success: boolean, data: any }}
 */
export const WS_RESPONSE_KO = {
    success: false,
    data: undefined
};