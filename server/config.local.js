'use strict';

const config = require('../common/config');

module.exports = {
  restApiRoot: config.restApiRoot,
  host: '0.0.0.0',
  port: 4000,
  legacyExplorer: false,
  name: config.appName,
  version: config.appVersion,
  companyName: config.companyName,
};
