const prod = require('./config.prod');
const dev = require('./config.dev');
const test = require('./config.test');

function loadConfig() {
  switch (process.env.NODE_ENV) {
    case 'production':
      return prod;
    case 'development':
      return dev;
    case 'test':
      return test;
    default:
      throw new Error('NODE_ENV environment variable is not set.');
  }
}

module.exports = loadConfig();
