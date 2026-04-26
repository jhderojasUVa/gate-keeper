// WS Response model

/**
 * Interface representing a WebSocket response payload.
 */
export interface WsResponsePayload {
    success: boolean;
    data: unknown;
}

/**
 * Default successful WebSocket payload representation.
 */
export const WS_RESPONSE_OK: WsResponsePayload = {
    success: true,
    data: undefined,
};

/**
 * Default erroneous WebSocket payload representation.
 */
export const WS_RESPONSE_KO: WsResponsePayload = {
    success: false,
    data: undefined,
};
