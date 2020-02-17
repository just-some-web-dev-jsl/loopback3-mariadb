'use strict';

const winston = require('winston');
const defaultLogger = winston.createLogger({
  name: 'defaultLogger',
  level: 'debug',
});
module.exports = defaultLogger;
