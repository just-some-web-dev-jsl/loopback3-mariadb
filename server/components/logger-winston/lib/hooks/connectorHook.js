'use strict';

// function to calculate response time by ms
const responseTime = require('../responseTime');

const restKey = function(ctx, name) {
  return ctx.req.uri;
};

const mongoKey = function(ctx, name) {
  return ctx.model + '-' + ctx.req.command;
};

const memoryKey = function(ctx, name) {
  return name;
};

const connectorObj = {
  rest: restKey,
  memory: memoryKey,
  mongodb: mongoKey,
};

const loadHooks = function(app, config) {
  const models = app.models();
  // console.log('Adding connector hooks for models');
  models.forEach(function(Model) {
    console.log('Found Model', Model.modelName);
    if (!Model.getDataSource() || !Model.getDataSource().connector) return;

    const connector = Model.getDataSource().connector;

    const name = Model.getDataSource().settings.name;
    const type = connector.dataSource.name || '';
    // console.log('Found connector ', name, 'of type', type);

    connector.observe('before execute', function(ctx, next) {
      // console.log('connector before execute for', name);
      ctx.perf = responseTime();
      next();
    });

    connector.observe('after execute', function(ctx, next) {
      // console.log('connector after execute for', name);
      const loopbackContext = ctx;
      // console.log('loopbackContext', loopbackContext);
      if (loopbackContext && loopbackContext.active && loopbackContext.active.http) {
        const httpContext = loopbackContext.active.http;
        const key = connectorObj[type] && connectorObj[type](ctx, name);
        httpContext.res.perf = httpContext.res.perf || {};
        httpContext.res.perf[name] = httpContext.res.perf[name] || [];

        const perfData = {
          key: key,
          responseTime: responseTime(ctx.perf),
        };

        httpContext.res.perf[name].push(perfData);
      }
      next();
    });
  });
};

module.exports = loadHooks;
