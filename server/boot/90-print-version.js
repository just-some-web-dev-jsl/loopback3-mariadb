'use strict';

module.exports = function(app) {
  // skip logger for mocha test
  if (require.main.filename.indexOf('mocha') > -1) return;

  console.log('');
  console.log('--------------------------------------------------');
  console.log('  %s v%s ', app.get('name'), app.get('version'));
  console.log('  with LoopBack v%s', app.loopback.version);
  console.log('  environment: %s', app.get('env'));
  console.log('  [ %s ] ', app.get('companyName'));
  console.log('--------------------------------------------------');
  console.log('');
};
