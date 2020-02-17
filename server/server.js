'use strict';

// 타임존 설정 - 로컬 및 AWS 서버 환경의 타임존을 동일하게 맞춘다.
process.env.TZ = 'GMT';

/**
 * init reference files
 */
require('../reference/init');

/**
 * load to process.env
 */
const results = require('../lib/aws-ssm-env').loadEnv(`/umma/${process.env.NODE_ENV}`);
if (!process.env.MYSQL_HOST) throw new Error('aws ssm env not loaded.');

/**
 * create rootLogger
 */
const logger = require('../lib/root-logger-winston');

/**
 * Server
 */
const path = require('path');
const loopback = require('loopback');
const boot = require('loopback-boot');
const qs = require('qs');
const app = (module.exports = loopback());

app.set('trust proxy', true); // set trust proxy
app.set('view engine', 'ejs'); // LoopBack comes with EJS out-of-box
app.set('views', path.resolve(__dirname, 'views'));
// app.set('json spaces', 2); // format json responses for easier viewing

// override query parser array limit
app.set('query parser', function(value, option) {
  return qs.parse(value, { arrayLimit: 100 });
});

app.use(loopback.token({ model: app.models.CustomAccessToken }));

// Remove default header
app.disable('x-powered-by'); // X-Powered-By: Express

let server;

app.start = function() {
  // start the web server
  return (server = app.listen(function() {
    // 리스너 제한 에러 해결
    // MaxListenersExceededWarning: Possible EventEmitter memory leak detected.
    // 11 error listeners added to [EventEmitter]. Use emitter.setMaxListeners() to increase limit
    process.setMaxListeners(0);
    Object.keys(app.dataSources).forEach(k => {
      const ds = app.dataSources[k];
      // 리스너 제한 수정
      ds.setMaxListeners(0);
    });

    app.emit('started');

    const baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at %s', baseUrl);

    const explorer = app.get('loopback-component-explorer');
    if (explorer) {
      console.log('Browse your REST API at %s%s', baseUrl, explorer.mountPath);
    }
  }));
};

app.stop = async function() {
  try {
    if (!server) return;
    // Stops the server from accepting new connections and finishes existing connections.
    server.on('close', () => {
      console.log('http server closed.');
      app.emit('stopped');
    });
    await server.close();

    // Disconnect all datasources connections.
    const disconnectedDsNames = [];
    Object.keys(app.dataSources).forEach(k => {
      const ds = app.dataSources[k];
      // console.log(ds.settings);
      if (disconnectedDsNames.indexOf(ds.settings.name) > -1) return;
      // This call is forwarded to the connector if the connector have ability to connect/disconnect.
      ds.disconnect();
      disconnectedDsNames.push(ds.settings.name);
    });
    console.log(`datasources ${disconnectedDsNames.join(',')} disconnected.`);
  } catch (err) {
    throw err;
  }
};

try {
  // Bootstrap the application, configure models, datasources and middleware.
  // Sub-apps like REST API are mounted via boot scripts.
  boot(app, __dirname, function(err) {
    if (err) throw err;

    // start the server if `$ node server.js`
    if (require.main === module) {
      // 토큰 기간 연장
      // app.use(function updateToken(req, res, next) {
      //   const token = req.accessToken; // get the accessToken from the request
      //   if (!token) return next(); // if there's no token we use next() to delegate handling back to loopback
      //
      //   const now = new Date();
      //
      //   // EDIT: to make sure we don't use a token that's already expired, we don't update it
      //   // this line is not really needed, because the framework will catch invalid tokens already
      //   if (token.created.getTime() + (token.ttl * 1000) < now.getTime()) return next();
      //   // performance optimization, we do not update the token more often than once per five seconds
      //   if (now.getTime() - token.created.getTime() < 3600) return next();
      //
      //   token.updateAttributes({ created: now }, next); // save to db and move on
      // });
      app.start();
    }
  });
} catch (err) {
  console.error('----- server/server.js / boot error -----');
  console.error(err);
  throw err;
}

/**
 * Graceful shutdown
 */
// Prevents the program from closing instantly
process.stdin.resume();

function shutdown(callback) {
  // Stops the server from accepting new connections and finishes existing connections.
  app
    .stop()
    .then()
    .catch(err => {
      logger.error(err);
    })
    .then(() => {
      // 1000ms wait for logger
      setTimeout(() => {
        if (callback && typeof callback === 'function') callback();
      }, 1000);
    });
}

// catch app is closing
process.on('exit', code => {
  console.log(`About to exit with code: ${code}`);
});

// catch ctrl+c event and exit normally
process.on('SIGINT', () => {
  console.log('SIGINT signal received.');
  shutdown(() => process.exit(2));
});

// catch console is closing on windows
process.on('SIGHUP', () => {
  console.log('Got SIGHUP signal.');
  shutdown(() => process.exit(2));
});

// catch "kill pid"
process.on('SIGUSR1', () => {
  shutdown(() => process.exit(3));
});
process.on('SIGUSR2', () => {
  shutdown(() => process.exit(3));
});

// catch uncaught exceptions
process.on('uncaughtException', err => {
  logger.error(err);
  shutdown(() => process.exit(99));
});
