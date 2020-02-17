'use strict';

const sampleData = require('./sample-data.json');

module.exports = function(app, cb) {
  let promises = [];

  Object.keys(sampleData).forEach(modelName => {
    const Model = app.models[modelName];
    const modelItems = sampleData[modelName];

    promises = modelItems.map(modelItem => {
      return new Promise(resolve => {
        Model.upsert(modelItem).then(resolve);
      });
    });
  });

  return Promise.all(promises)
    .then(res => {
      console.log('Created %s items', res.length);
      return cb();
    })
    .catch(cb);
};
