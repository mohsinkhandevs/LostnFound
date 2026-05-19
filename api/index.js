import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly pull the modern ES module export of your Express app
import app from '../server/server.js';

export default app;