// 'use strict';

// const logger = require('../../lib/logger')(module);

// module.exports = function(options) {
//   return function tracker(req, res, next) {
//     logger.silly('Request tracking middleware triggered on %s', req.url);
//     const start = process.hrtime();
//     res.once('finish', function() {
//       const diff = process.hrtime(start);
//       const ms = diff[0] * 1e3 + diff[1] * 1e-6;
//       logger.silly('The request processing time is %d ms.', ms);
//     });
//     next();
//   };
// };
