// Logging library
import fs from 'fs';
import { colors } from "./colors.mjs";

// Check if you want to log on disk
const logOnDisk = process.env.GATE_KEEPER_LOG_ON_DISK || false;

// Express standard log info
export const expressLog = ({
    message = undefined,
    severity = 'INFO',
    kind = undefined,
} = {}) => {
    // Change the color by severity
    switch (severity.toUpperCase()) {
        case 'WARNING':
            // Yellow for warning
            console.log(`${colors.text.yellow}[${kind}]: ${message}${colors.reset}`);
            break;
        case 'ERROR':
            // Red for error
            console.log(`${colors.text.red}[${kind}]: ${message}${colors.reset}`);
            break;
        case 'INFO':
            // Normal for info
            console.log(`${colors.text.white}[${kind}]: ${message}${colors.reset}`);
            break;
        default:
            // No change of color from previous
            console.log(`[${kind}]: ${message}`);
            break;
    }

    // if write to disk
    if (logOnDisk) {

    }
}