'use strict';

const logger = require('../../lib/logger')(module);
const ummaUtil = require('../../lib/umma-util');
const ummaError = require('../../lib/umma-error');
const { disableAllMethods } = require('../../lib/loopback-helpers');

let app = {
  umma: require('../../reference'), // 개발 참조용 레퍼런스 파일
};

module.exports = function(OrderRefundLog) {
  const Model = OrderRefundLog;
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
   * 반품/환불 등록
   * acl: Admin
   * @param param
   * @param options
   */
  OrderRefundLog.add = async function(param, options) {
    const token = ummaUtil.token.getAccessToken(options);
    // 파라미터내 문자열 트림
    param = ummaUtil.parameter.trim(param, ['comments']);
    param.adminRoleId = token.roleId;
    param.adminUserId = token.userId;
    param.create = new Date();

    return await OrderRefundLog.create(param);
  };

  OrderRefundLog.remoteMethod('add', {
    description: '반품/환불 등록',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: 'OrderRefundLog' },
    http: { path: '/add', verb: 'post' },
  });

  /**
   * 반품/환불 카운트
   * @param filter
   * @param options
   */
  OrderRefundLog.listCount = async function(where, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    return await OrderRefundLog.count(where);
  };

  OrderRefundLog.remoteMethod('listCount', {
    description: '반품/환불 카운트',
    accepts: ummaUtil.remoteMethod.accepts.whereAndOptions,
    returns: { root: true, type: Number },
    http: { path: '/listCount', verb: 'get' },
  });

  /**
   * 반품/환불 리스트
   * @param filter
   * @param options
   */
  OrderRefundLog.list = async function(filter, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    return await OrderRefundLog.find(filter);
  };

  OrderRefundLog.remoteMethod('list', {
    description: '반품/환불 리스트',
    accepts: ummaUtil.remoteMethod.accepts.filterAndOptions,
    returns: { root: true, type: ['OrderRefundLog'] },
    http: { path: '/list', verb: 'get' },
  });
};
