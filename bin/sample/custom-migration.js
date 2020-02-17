// auto updating of custom models.
/*
'use strict';

const models = ['Admin', 'Buyer', 'Seller'];

module.exports = function updateCustomModels(app, next) {
  const ds = app.dataSources.ummaDs;
  ds.isActual(models, (err, actual) => {
    if (err) throw err;

    let syncStatus = actual ? 'in sync' : 'out of sync';
    console.log(`Custom models are ${syncStatus}`);
    console.log('');

    if (actual) return next();

    console.log('Migrating Custom Models...');

    ds.autoupdate(models, (err, result) => {
      if (err) throw err;

      console.log('');
      console.log('Custom models migration successful!');
      console.log('');

      next();
    });
  });
};
*/
