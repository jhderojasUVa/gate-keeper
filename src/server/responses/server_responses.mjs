// Server responses
import { version } from "../../libs/app_utils.mjs"

// Greeting of the app
export const connection = {
    sucess: true,
    message: `Welcome to Gate Keeper Web Socket server version ${version}!`
}

// Response of the app
export const response = (data) => {
    return {
        sucess: true,
        data,
    }
}