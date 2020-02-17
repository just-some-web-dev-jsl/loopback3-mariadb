'use strict';
const logger = require('../../lib/logger')(module);
const ummaUtil = require('../../lib/umma-util');
const loopback = require('loopback');
const NODE_ENV = process.env.NODE_ENV;

module.exports = function createErrorLogger() {
  const ErrorLog = loopback.getModel('ErrorLog');
  const JandiWebhook = loopback.getModel('JandiWebhook');

  // skip logger for mocha test
  if (require.main.filename.indexOf('mocha') > -1) {
    return function logError(err, req, res, next) {
      next(err);
    };
  }

  return function logError(err, req, res, next) {
    const status = err.status || err.statusCode;

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

    meta.statusCode = status;
    meta.stack = err.stack;

    if (status >= 500) {
      // jandi webhook
      if (NODE_ENV === 'staging' || NODE_ENV === 'production') {
        const messages = [
          { title: 'ENV', description: NODE_ENV },
          { title: 'IP ADDRESS', description: req.ip },
          { title: 'DATE', description: new Date() },
          { title: 'ERROR', description: `INTERNAL SERVER ERROR [${req.method}] [${req.url}] from ${NODE_ENV} server. Complete log: ${JSON.stringify(meta)}` },
        ];
        // request body data
        if (NODE_ENV === 'staging') messages.push({ title: 'BODY', description: JSON.stringify(req.body) });
        // send
        JandiWebhook.sendMessage(`INTERNAL SERVER ERROR`, '#e0332a', messages);
      }
      // log Internal Server errors
      logger.error(`Unhandled error for request ${req.method} ${req.url}`, meta);
      // custom error log
      ErrorLog.create({
        method: req.method,
        requestUrl: req.url,
        rawHeaders: JSON.stringify(req.rawHeaders),
        meta: JSON.stringify(meta),
      });
    } else {
      logger.error(`Error for request ${req.method} ${req.url}`, meta);
    }

    // Let the next error handler middleware produce the HTTP response
    next(err);
  };
};
