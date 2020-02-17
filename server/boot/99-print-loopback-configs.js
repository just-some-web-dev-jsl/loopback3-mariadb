'use strict';

module.exports = function(app) {
  // skip logger for mocha test
  if (require.main.filename.indexOf('mocha') > -1) return;

  console.log('');
  console.log('===== start print loopback configs =====');
  console.log({ name: app.get('name') });
  console.log({ version: app.get('version') });
  console.log({ companyName: app.get('companyName') });
  console.log({ host: app.get('host') });
  console.log({ port: app.get('port') });
  console.log({ restApiHost: app.get('restApiHost') });
  console.log({ restApiRoot: app.get('restApiRoot') });
  console.log({ restApiUrl: app.get('restApiUrl') });
  console.log({ adminUrl: app.get('adminUrl') });
  console.log({ buyerUrl: app.get('buyerUrl') });
  console.log({ buyerMobileUrl: app.get('buyerMobileUrl') });
  console.log({ env: app.get('env') });
  console.log({ MYSQL_HOST: process.env.MYSQL_HOST });
  console.log({ MYSQL_DB: process.env.MYSQL_DB });
  console.log('===== end print loopback configs =====');
  console.log('');
};
