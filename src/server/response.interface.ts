// Response interface
// All messages need to pass from here to be normalised

export const WSResponse = (message: unknown): string => JSON.stringify(message);
