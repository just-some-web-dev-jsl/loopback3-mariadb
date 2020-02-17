'use strict';

const path = require('path');
const app = require('../../server/server');
const ds = app.datasources.accountDS;
ds.discoverAndBuildModels('Account', { schema: 'loopback-example-mysql' }, function(err, models) {
  if (err) throw err;

  models.Account.find(function(err, accounts) {
    if (err) throw err;

    console.log('Found:', accounts);

    ds.disconnect();
  });
});
