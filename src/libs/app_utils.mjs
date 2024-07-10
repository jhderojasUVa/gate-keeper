// General application utils
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// __dirname patch
const __filename = fileURLToPath(
    import.meta.url);
export const __dirname = path.dirname(__filename);

// Get version of the app
export const version = (JSON.parse(fs.readFileSync(`${__dirname}/../../package.json`))).version;