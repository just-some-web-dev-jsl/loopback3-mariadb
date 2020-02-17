'use strict';

const path = require('path');
const packageInfo = require('../package.json');

const NODE_ENV = process.env.NODE_ENV || 'development';

// 기본 설정
const config = {};
config.production = NODE_ENV === 'production'; // 운영 환경 모드 여부
config.staging = NODE_ENV === 'staging'; // 스테이징 환경 모드 여부
config.development = NODE_ENV === 'development'; // 개발 환경 모드 여부
config.appRoot = path.resolve(__dirname, '../');
config.appPrefix = packageInfo.name.toLowerCase();
config.appName = packageInfo.name;
config.appProductName = packageInfo.productName;
config.appVersion = packageInfo.version;
config.companyName = packageInfo.companyName;
config.majorVersion = Number.parseInt(packageInfo.version.split('.').shift());
config.restApiVersion = 'v' + config.majorVersion;
config.restApiRoot = '/api/' + config.restApiVersion;

module.exports = config;
