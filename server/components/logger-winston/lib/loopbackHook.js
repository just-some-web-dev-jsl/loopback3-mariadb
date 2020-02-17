'use strict';

const loggerModel = require('./loggerModel');

exports.init = function(app, config, rootLogger, loggerMap) {
  // adding basic performance logger
  const perfLogger = rootLogger.child({ submodule: 'perfLogger' });
  loggerMap['perfLogger'] = perfLogger;
  require('./basicPerfLogger')(app, config, perfLogger);

  require('./hooks/remoteHook.js')(app, config);
  // require('./hooks/connectorHook.js')(app, config);

  const enableAPI = config.enableAPI || false;
  if (enableAPI) {
    // adding log management api
    loggerModel.addModel(app);
    app.once('started', function() {
      loggerModel.attachLoggerMap(loggerMap);
    });
  }
};
