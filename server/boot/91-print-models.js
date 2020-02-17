'use strict';

module.exports = function(app) {
  // skip logger for mocha test
  if (require.main.filename.indexOf('mocha') > -1) return;

  // const models = [];
  // Object.keys(app.models).forEach(function(model) {
  //   const modelName = app.models[model].modelName;

  //   if (models.indexOf(modelName) < 0) models.push(modelName);
  // });
  // console.log({ Models: models });
};
