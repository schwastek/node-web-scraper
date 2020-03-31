const path = require('path');

module.exports = {
  database: {
    filename: path.resolve(__dirname, '../db/files/test.db'),
  },
  logger: {
    silent: true,
  },
};
