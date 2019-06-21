/**
 * Configuration module.
 *
 * @author Alex TSANG <alextsang@live.com>
 *
 * @license BSD-3-Clause
 */

const dotenv = require('dotenv');

const path = require('path');

const config = {
  interface: null,
  logFile: null
};

const result = dotenv.config();
if (result.error !== undefined) {
  throw new Error(`Unable to read .env: ${result.error.message}`);
}
const envConfig = result.parsed;
config.interface = envConfig.INTERFACE;
if (path.isAbsolute(envConfig.LOG_FILE)) {
  config.logFile = envConfig.LOG_FILE;
} else {
  config.logFile = path.join(__dirname, envConfig.LOG_FILE);
}

module.exports = config;
