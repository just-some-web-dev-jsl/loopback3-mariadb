'use strict';

const logger = require('../../lib/logger')(module);
const ummaUtil = require('../../lib/umma-util');
const ummaError = require('../../lib/umma-error');
const { disableAllMethods } = require('../../lib/loopback-helpers');

let app = {
  umma: require('../../reference'), // 개발 참조용 레퍼런스 파일
};

module.exports = function(OrderRemarkLog) {
  const Model = OrderRemarkLog;
  /**
   * Disable Remote Method
   * 기존 룹벡 메서드 비활성화
   */
  disableAllMethods(Model, ['count', 'find', 'findOne', 'findById']);

  Model.on('attached', function(a) {
    app = a;
  });
  Model.on('dataSourceAttached', function() {});

  /**
   * 리마크 등록
   * acl: Admin
   * @param param
   * @param options
   */
  OrderRemarkLog.add = async function(param, options) {
    const token = ummaUtil.token.getAccessToken(options);
    // 파라미터내 문자열 트림
    param = ummaUtil.parameter.trim(param, ['comments']);
    param.adminRoleId = token.roleId;
    param.adminUserId = token.userId;
    param.create = new Date();

    return await OrderRemarkLog.create(param);
  };

  OrderRemarkLog.remoteMethod('add', {
    description: '리마크 등록',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: 'OrderRemarkLog' },
    http: { path: '/add', verb: 'post' },
  });

  /**
   * 리마크 카운트
   * @param filter
   * @param options
   */
  OrderRemarkLog.listCount = async function(where, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    return await OrderRemarkLog.count(where);
  };

  OrderRemarkLog.remoteMethod('listCount', {
    description: '리마크 카운트',
    accepts: ummaUtil.remoteMethod.accepts.whereAndOptions,
    returns: { root: true, type: Number },
    http: { path: '/listCount', verb: 'get' },
  });

  /**
   * 리마크 리스트
   * @param filter
   * @param options
   */
  OrderRemarkLog.list = async function(filter, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    return await OrderRemarkLog.find(filter);
  };

  OrderRemarkLog.remoteMethod('list', {
    description: '리마크 리스트',
    accepts: ummaUtil.remoteMethod.accepts.filterAndOptions,
    returns: { root: true, type: ['OrderRemarkLog'] },
    http: { path: '/list', verb: 'get' },
  });
};
