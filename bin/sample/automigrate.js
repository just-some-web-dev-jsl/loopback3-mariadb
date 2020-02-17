'use strict';

const path = require('path');
const app = require('../../server/server');
const ds = app.datasources.ummaDs;

ds.automigrate('Account', function(err) {
  if (err) throw err;

  const accounts = [
    {
      email: 'john.doe@ibm.com',
      createdAt: new Date(),
      lastModifiedAt: new Date(),
    },
    {
      email: 'jane.doe@ibm.com',
      createdAt: new Date(),
      lastModifiedAt: new Date(),
    },
  ];
  let count = accounts.length;
  accounts.forEach(function(account) {
    app.models.Account.create(account, function(err, model) {
      if (err) throw err;

      console.log('Created:', model);

      count--;
      if (count === 0) {
        ds.disconnect();
      }
    });
  });
});
