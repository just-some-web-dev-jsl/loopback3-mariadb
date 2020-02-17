'use strict';

const path = require('path');
const app = require('../../server/server');
const ds = app.datasources.accountDS;
ds.discoverSchema('Account', { schema: 'loopback-example-mysql' }, function(err, schema) {
  if (err) throw err;

  const json = JSON.stringify(schema, null, '  ');
  console.log(json);

  ds.disconnect();
});
