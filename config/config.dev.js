const { format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

module.exports = {
  database: {
    filename: path.resolve(__dirname, '../db/files/dev.db'),
  },
  logger: {
    format: format.combine(
      format.timestamp(),
      format.json(),
    ),
    transports: [
      // Log to the console
      new transports.Console(),

      // Log to the file (1 log file for each day)
      new DailyRotateFile({
        filename: '%DATE%',
        extension: '.log',
        dirname: path.resolve(__dirname, '../logs/files/dev'),
        datePattern: 'YYYY-MM-DD',
        maxFiles: '60d',
      }),
    ],
  },
};
