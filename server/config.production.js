'use strict';

const url = require('url');
const config = require('../common/config');

module.exports = {
  restApiHost: url.format({
    protocol: 'https',
    slashes: true,
    hostname: 'api.umma.io',
    port: '',
    pathname: '/',
  }),
  restApiUrl: url.format({
    protocol: 'https',
    slashes: true,
    hostname: 'api.umma.io',
    port: '',
    pathname: config.restApiRoot,
  }),
  adminUrl: url.format({
    protocol: 'https',
    slashes: true,
    hostname: 'admin.umma.io',
    port: '',
    pathname: '/',
  }),
  buyerUrl: url.format({
    protocol: 'https',
    slashes: true,
    hostname: 'umma.io',
    port: '',
    pathname: '/',
  }),
  buyerMobileUrl: url.format({
    protocol: 'https',
    slashes: true,
    hostname: 'm.umma.io',
    port: '',
    pathname: '/',
  }),
};
