'use strict';

const responseTime = require('./responseTime');

module.exports = function(app, config, logger) {
  // skip logger for mocha test
  if (require.main.filename.indexOf('mocha') > -1) return;

  app.middleware('initial:before', function(req, res, next) {
    let ended = false;
    const end = res.end;
    const startTime = responseTime();
    // const forwardedIp = req.headers['x-forwarded-for'];
    // const ip = forwardedIp ? forwardedIp.split(',')[0] : req.ip;

    res.end = function(chunk, encoding) {
      if (ended) return;

      ended = true;
      end.call(this, chunk, encoding);

      const meta = {
        'req.url': req.originalUrl,
        'req.method': req.method,
        'req.ip': req.ip,
      };

      const accessToken = req.headers['x-access-token'] || (req.query && req.query.accessToken) || null;
      if (accessToken) meta.accessToken = accessToken;
      const clientName = req.headers['x-client-name'] || null;
      if (accessToken) meta.clientName = clientName;
      const clientVersion = req.headers['x-client-version'] || null;
      if (accessToken) meta.clientVersion = clientVersion;

      meta.statusCode = res.statusCode;
      meta.APIResponseTime = res.perf || 'NOT_AN_API';
      meta.OverallResponseTime = responseTime(startTime);

      logger.info('perfLogger', meta);
    };

    next();
  });
};
