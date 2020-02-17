'use strict';

const logger = require('../../lib/logger')(module);
const ummaError = require('../../lib/umma-error');
const ummaUtil = require('../../lib/umma-util');

const started = new Date();

module.exports = function(app) {
  /**
   * robots.txt
   */
  app.get('/robots.txt', function(req, res) {
    res.send('User-agent: *\nDisallow: /');
  });

  /**
   * root index
   */
  // app.get('/', function(req, res) {
  //   res.status(404).send();
  // });

  /**
   * health check
   */
  app.get('/health', function(req, res) {
    res.json({
      version: app.get('version'),
    });
  });

  /**
   * monitoring
   */
  app.get('/monitoring', function(req, res) {
    // external ip blocking
    const allowIPs = [
      '127.0.0.1', // localhost
      '1.212.71.98', // b2labs
      '1.212.71.99', // b2link
    ];
    if (!req.ip || allowIPs.indexOf(req.ip) === -1) {
      return res.status(403).send();
    }

    // memory
    const used = process.memoryUsage();
    for (const key in used) {
      used[key] = `${Math.round((used[key] / 1024 / 1024) * 100) / 100} MB`;
    }

    res.json({
      environment: app.get('env'),
      name: app.get('name'),
      version: app.get('version'),
      loopback: app.loopback.version,
      remoting: app.get('remoting'),
      restApiRoot: app.get('restApiRoot'),
      memoryUsage: used,
      started: started,
      uptime: (Date.now() - Number(started)) / 1000,
      now: new Date(),
      requestIP: req.ip,
    });
  });
  // app.get('/monitoring/status', app.loopback.status());

  /**
   * 이메일을 받은 유저가 비밀번호를 변경하는 라우터
   */
  app.post('/reset-password', function(req, res) {
    const token = ummaUtil.token.getAccessToken(req);
    if (!token.userId) return res.status(401).send({ error: new ummaError.accessTokenNotFound() });
    const password = req.body.password;

    // 비밀번호 정책 체크
    if (!ummaUtil.validate.password(password)) return res.send(400).send({ error: new ummaError.invalidParam('password') });

    app.models[token.roleName].findById(token.userId, function(err, user) {
      if (err) {
        logger.error(err);
        return res.status(500).send({ error: new ummaError.customMessage('Find user account processed failed.') });
      }
      user.updateAttributes({ password: password, passwordUpdated: new Date() }, function(err, user) {
        if (err) {
          logger.error(err);
          return res.status(500).send({ error: new ummaError.customMessage('Password reset processed failed.') });
        }
        res.send(true);
      });
    });
  });
};
