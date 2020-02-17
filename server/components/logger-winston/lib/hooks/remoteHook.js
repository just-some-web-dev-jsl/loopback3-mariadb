'use strict';

const responseTime = require('../responseTime');

const loadRemoteHooks = function(app, config) {
  const models = app.models();
  models.forEach(function(Model) {
    Model.beforeRemote('*', function(context, unused, next) {
      const key = context.methodString;
      context.res.perf = context.res.perf || {};
      context.res.perf[key] = {};
      context.res.perf[key].api = responseTime();

      next();
    });

    // remote method after hook
    Model.afterRemote('*', function(context, remoteMethodOutput, next) {
      const key = context.methodString;
      context.res.perf[key].api = responseTime(context.res.perf[key].api);
      next();
    });
  });
};

module.exports = loadRemoteHooks;
