'use strict';

let rootLogger = null;
const defaultLogger = require('./lib/defaultLogger');
const loopbackHook = require('./lib/loopbackHook');
// const winston = require('winston');

let componentInitialized = false;
const loggerMap = {};
module.exports = function(app, config) {
  app = app || defaultLogger;
  if (app.hasOwnProperty('loopback')) {
    // check if the app instance is loopback. This is called when the component is getting initialized
    if (!rootLogger) {
      console.log('WARN: Logger not initialized correctly ', 'using defaultLogger');
      rootLogger = defaultLogger;
    }

    loopbackHook.init(app, config, rootLogger, loggerMap);
    componentInitialized = true;

    return;
  } else {
    if (typeof app === 'string') {
      const moduleName = app;
      if (!loggerMap.hasOwnProperty(moduleName)) {
        const childLogger = rootLogger.child({ submodule: moduleName });
        loggerMap[moduleName] = childLogger;
      }

      return loggerMap[moduleName];
    } else {
      // if app is not a string than its a instance of a winston logger. initialize only once
      if (!rootLogger) {
        if (app.constructor && app.constructor.name === 'DerivedLogger') {
          rootLogger = app;
          loggerMap['root'] = rootLogger;
        } else {
          const errStr = 'Logger provided is not an instance of winston';
          throw new TypeError(errStr);
        }
      }

      return rootLogger;
    }
  }
};
