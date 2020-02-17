'use strict';

/**
 * [ Logger Levels ]
 * https://github.com/winstonjs/winston#logging-levels
 * Similarly, npm logging levels are prioritized from 0 to 5 (highest to lowest):
 * {
 *   error: 0,
 *   warn: 1,
 *   info: 2,
 *   verbose: 3,
 *   debug: 4,
 *   silly: 5
 * }
 * If you do not explicitly define the levels that winston should use, the npm levels above will be used.
 *
 * [ Logger Examples ]
 * // Any logger instance
 * logger.log('silly', "127.0.0.1 - there's no place like home");
 * logger.log('debug', "127.0.0.1 - there's no place like home");
 * logger.log('verbose', "127.0.0.1 - there's no place like home");
 * logger.log('info', "127.0.0.1 - there's no place like home");
 * logger.log('warn', "127.0.0.1 - there's no place like home");
 * logger.log('error', "127.0.0.1 - there's no place like home");
 * logger.info("127.0.0.1 - there's no place like home");
 * logger.warn("127.0.0.1 - there's no place like home");
 * logger.error("127.0.0.1 - there's no place like home");
 *
 * // Default logger
 * winston.log('info', "127.0.0.1 - there's no place like home");
 * winston.info("127.0.0.1 - there's no place like home");
 *
 * // Customized logger format
 * logger.info('test logger info', 1); // String, Number
 * logger.info('test logger info', { id: 'abc' }); // String, JSON Object
 * logger.error(new Error('test error1')); // Error Object
 * logger.error('failed: ', new Error('test error2')); // String, Error Object
 * logger.error(new Error('test error3'), { id: 'abc' }); // Error Object, JSON Object
 */

const os = require('os');
const fs = require('fs');
const path = require('path');
const { createLogger, transports, format } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const WinstonCloudWatch = require('winston-cloudwatch');
const config = require('../common/config');

// 로그 설정
const logConfig = {};

logConfig.path = path.join(config.appRoot, 'logs');
logConfig.filename = `${config.appPrefix}.${process.env.NODE_ENV}`;
logConfig.filePath = path.join(logConfig.path, logConfig.filename);
logConfig.cloudwatch = true;

// 로그 디렉터리 생성
if (!fs.existsSync(logConfig.path)) fs.mkdirSync(logConfig.path);

/**
 * custom log message function
 */
const enumerateErrorFormat = format((info, opts) => {
  // case: logger.error(err);
  if (info instanceof Error) {
    // console.log('info instanceof Error', info);
  }
  // case: logger.error(err, {});
  else if (info.message instanceof Error) {
    // format.json() result patched: "message": {}
    info.stack = info.message.stack;
    info.message = info.message.message;
  }
  return info;
});

// myFormat 함수는 콘솔과 파일 로그에만 사용한다.
const myFormat = format((info, opts) => {
  if (opts.simple && info.stack) {
    info.message += `\n${info.stack}\n`;
    delete info.stack;
  }
  return info;
});

// set logger options
const formatConsole = format.combine(myFormat({ simple: true }), format.colorize(), format.simple());
const formatFile = format.combine(myFormat({ simple: true }), format.simple());

function createAwsCloudWatchLogger(logLevel) {
  if (!process.env.AWS_CW_KEY_ID) throw new Error('AWS_CW_KEY_ID not found.');
  if (!process.env.AWS_CW_KEY) throw new Error('AWS_CW_KEY not found.');
  if (!process.env.AWS_CW_REGION) throw new Error('AWS_CW_REGION not found.');
  if (!process.env.AWS_CW_LOG_GROUP) throw new Error('AWS_CW_LOG_GROUP not found.');

  const levelName = logLevel || 'exceptions';
  return new WinstonCloudWatch({
    name: `cloudwatch-${levelName}-stream`,
    awsRegion: process.env.AWS_CW_REGION,
    awsAccessKeyId: process.env.AWS_CW_KEY_ID,
    awsSecretKey: process.env.AWS_CW_KEY,
    logGroupName: process.env.AWS_CW_LOG_GROUP,
    logStreamName: `server_${levelName}_${os.hostname()}_${process.env.pm_id || process.pid}`, // pm2 로 실행시 pm_id 값으로 설정
    uploadRate: 2000,
    jsonMessage: true,
  });
}

/**
 * 운영 환경별 로거 추가 및 레벨 설정
 */
let logLevel;
const logTransports = [];
const logExceptionHandlers = [];

if (config.production) {
  logLevel = 'info';
  // console log combined
  logTransports.push(new transports.Console({ level: logLevel, format: formatConsole }));
  // cloudwatch log combined
  if (logConfig.cloudwatch) logTransports.push(createAwsCloudWatchLogger(logLevel));
  // cloudwatch log exceptions
  if (logConfig.cloudwatch) logExceptionHandlers.push(createAwsCloudWatchLogger());
} else if (config.staging) {
  logLevel = 'debug';
  // console log combined
  logTransports.push(new transports.Console({ level: logLevel, format: formatConsole }));
  // cloudwatch log combined
  if (logConfig.cloudwatch) logTransports.push(createAwsCloudWatchLogger(logLevel));
  // cloudwatch log exceptions
  if (logConfig.cloudwatch) logExceptionHandlers.push(createAwsCloudWatchLogger());
} else if (config.development) {
  // 개발환경에서 cloudwatch 끄기
  logConfig.cloudwatch = false;
  logLevel = 'silly';
  // console log combined
  logTransports.push(new transports.Console({ level: logLevel, format: formatConsole }));
  // cloudwatch log combined
  if (logConfig.cloudwatch) logTransports.push(createAwsCloudWatchLogger(logLevel));
  // cloudwatch log exceptions
  if (logConfig.cloudwatch) logExceptionHandlers.push(createAwsCloudWatchLogger());
  // file log combined
  logTransports.push(
    new DailyRotateFile({
      name: 'file-combined',
      level: logLevel,
      format: formatFile,
      datePattern: 'YYYY-MM-DD',
      filename: `${logConfig.filename}.combined.%DATE%.log`,
      dirname: logConfig.path,
      zippedArchive: false,
      maxSize: '100m',
      maxFiles: '30d',
    })
  );
  // file log exceptions
  logExceptionHandlers.push(
    new DailyRotateFile({
      name: 'file-exceptions',
      datePattern: 'YYYY-MM-DD',
      filename: `${logConfig.filename}.exceptions.%DATE%.log`,
      dirname: logConfig.path,
      zippedArchive: false,
      maxSize: '100m',
      maxFiles: '30d',
    })
  );
  // console log exceptions
  logExceptionHandlers.push(
    new transports.Console({
      name: 'console-exceptions',
    })
  );
}

/**
 * create root logger
 * NOTES: 아래 format 은 모든 로그에 공통 적용되며
 * splat, enumerateErrorFormat, timestamp 등이 적용된다.
 */
const rootLogger = createLogger({
  level: 'debug',
  format: format.combine(format.splat(), enumerateErrorFormat(), format.timestamp()),
  defaultMeta: { appName: config.appName, appVersion: config.appVersion, hostname: os.hostname(), pid: process.pid },
  transports: logTransports,
  exceptionHandlers: logExceptionHandlers,
  exitOnError: true,
  silent: false,
});

// initialize root logger
const logger = require('../server/components/logger-winston')(rootLogger);

// Test customized logger format
// logger.info('test logger info', 1); // String, Number
// logger.info('test logger info', { id: 'abc' }); // String, JSON Object
// logger.error(new Error('test error1')); // Error Object
// logger.error('failed:', new Error('test error2')); // String, Error Object
// logger.error(new Error('test error3'), { id: 'abc' }); // Error Object, JSON Object
// process.exit(0);

module.exports = logger;
