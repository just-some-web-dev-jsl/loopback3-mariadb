'use strict';

const url = require('url');
const config = require('../common/config');

module.exports = {
  restApiHost: url.format({
    protocol: 'http',
    slashes: true,
    hostname: 'localhost',
    port: 4000,
    pathname: '/',
  }),
  restApiUrl: url.format({
    protocol: 'http',
    slashes: true,
    hostname: 'localhost',
    port: 4000,
    pathname: config.restApiRoot,
  }),
  adminUrl: url.format({
    protocol: 'http',
    slashes: true,
    hostname: 'localhost',
    port: 4201,
    pathname: '/',
  }),
  buyerUrl: url.format({
    protocol: 'http',
    slashes: true,
    hostname: 'localhost',
    port: 4202,
    pathname: '/',
  }),
  buyerMobileUrl: url.format({
    protocol: 'http',
    slashes: true,
    hostname: 'localhost',
    port: 4203,
    pathname: '/',
  }),
};
