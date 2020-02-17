'use strict';

const logger = require('../../lib/logger')(module);
const ummaUtil = require('../../lib/umma-util');
const ummaError = require('../../lib/umma-error');
const ummaMail = require('../../lib/umma-mail');
const { disableAllMethods } = require('../../lib/loopback-helpers');

let app = {
  umma: require('../../reference'), // 개발 참조용 레퍼런스 파일
};

module.exports = function(ErrorLog) {
  const Model = ErrorLog;
  /**
   * Disable Remote Method
   */
  disableAllMethods(Model, ['create', 'count', 'find', 'findById']);

  Model.on('attached', function(a) {
    app = a;
  });
  Model.on('dataSourceAttached', function() {});

  /**
   * 에러 로그 리스트
   * @param filter
   * @param options
   */
  ErrorLog.list = async function(filter, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    // filter = ummaUtil.filter.where.addOwnerByTokenWithoutAdmin(token, filter);

    return await ErrorLog.find(filter);
  };
  ErrorLog.remoteMethod('list', {
    description: '에러 로그 리스트',
    accepts: ummaUtil.remoteMethod.accepts.filterAndOptions,
    returns: { root: true, type: ['ErrorLog'] },
    http: { path: '/list', verb: 'get' },
  });
};
