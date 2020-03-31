const Sqlite = require('better-sqlite3');
const config = require('../config/config');

class Database {
  static open() {
    return new Sqlite(config.database.filename);
  }
}

module.exports = Database;
