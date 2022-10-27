/* eslint-disable global-require */
// Disable `global-require` rule as it's overhead to load config for every environment

function loadConfig() {
  switch (process.env.NODE_ENV) {
    case 'production':
      return require('./config.prod');
    case 'development':
      return require('./config.dev');
    case 'test':
      return require('./config.test');
    default:
      throw new Error('NODE_ENV environment variable is not set.');
  }
}

module.exports = loadConfig();
