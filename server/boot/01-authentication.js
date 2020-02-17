'use strict';

module.exports = function enableAuthentication(app) {
  // skip logger for mocha test
  if (require.main.filename.indexOf('mocha') > -1) return;

  // enable authentication
  app.enableAuth();
};
