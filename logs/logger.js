const { createLogger } = require('winston');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const config = require('../config/config');

// Assign unqiue id to each log entry (unqiue per npm script, not `Logger` class instance)
const id = uuidv4();

// Create a winston logger instance
const logger = createLogger(config.logger);

function loadLogger(moduleName) {
  // Add calling module name to log entries (https://stackoverflow.com/a/42966914)
  const filename = path.basename(moduleName);

  return {
    // Add additional properties to each log entry
    info: (message) => {
      logger.info({ id, filename, message });
    },

    error: (message) => {
      logger.error({ id, filename, message });
    },
  };
}

module.exports = loadLogger;
