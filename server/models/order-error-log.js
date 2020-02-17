/* eslint-disable camelcase */
'use strict';

const logger = require('../../lib/logger')(module);
const ummaUtil = require('../../lib/umma-util');
const ummaError = require('../../lib/umma-error');
const ummaMail = require('../../lib/umma-mail');
const ummaExcel = require('../../lib/umma-excel');
const { disableAllMethods } = require('../../lib/loopback-helpers');

let app = {
  umma: require('../../reference'), // 개발 참조용 레퍼런스 파일
};

module.exports = function(OrderErrorLog) {
  const Model = OrderErrorLog;
  /**
   * Disable Remote Method
   */

  // TODO: 등록자 아이다, 수정자 아이디, 삭제자 아이디 등을 토큰에서 읽어 처리해야한다.

  Model.on('attached', function(a) {
    app = a;

    // override method
    Model.destroyById = Model.deleteById;

    /**
     * 주문 삭제
     * acl: Admin
     * @param id
     * @param options
     */
    Model.deleteById = async function(id, options) {
      return await Model.deleteByIds([id], options);
    };
    Model.remoteMethod('deleteById', {
      description: '주문 삭제',
      accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
      returns: { root: true, type: { count: Number } },
      http: { path: '/:id', verb: 'delete' },
    });

    /**
     * 주문 다중 삭제
     * acl: Admin
     * @param ids
     * @param options
     */
    Model.deleteByIds = async function(ids, options) {
      const token = ummaUtil.token.getAccessToken(options);
      const status = 0;
      let where = { id: { inq: ids }, status: { neq: status } };

      // 관리자가 아닌 경우 OWNER 조건 추가
      where = ummaUtil.where.addOwnerByTokenWithoutAdmin(token, where);

      return await Model.updateAll(where, {
        status: status,
        deleted: new Date(),
      });
    };
    Model.remoteMethod('deleteByIds', {
      description: '주문 오류 사항 다중 삭제',
      accepts: ummaUtil.remoteMethod.accepts.idsArrayAndOptions,
      returns: { root: true, type: { count: Number } },
      http: { path: '/deleteByIds', verb: 'post' },
    });
  });
  Model.on('dataSourceAttached', function() {});

  /**
   * create operation error log
   * @param param
   * @param options
   */
  OrderErrorLog.createLog = async function(param, options) {
    const token = ummaUtil.token.getAccessToken(options);
    const getProforma = await app.models.Proforma.findOne({ where: { proformaKey: param.orderKey } });
    param.roleId = getProforma.roleId;
    param.userId = getProforma.userId;
    if (!getProforma) throw new ummaError.customMessage('No quote found.');
    // console.log(param);
    const getAdminDetails = await app.models.Admin.findById(token.userId);
    await OrderErrorLog.create({
      orderType: param.orderType,
      orderNumber: param.orderNumber,
      orderKey: param.orderKey,
      errorType: param.errorType,
      adminRoleId: token.roleId,
      adminUserId: token.userId,
      adminUserEmail: getAdminDetails.email,
      roleId: param.roleId,
      userId: param.userId,
      comments: param.comments,
      status: 0,
      newQuote: param.newQuote,
      created: new Date(),
    });
  };
  OrderErrorLog.remoteMethod('createLog', {
    description: 'create operation error log',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: ['OrderErrorLog'] },
    http: { path: '/create-log', verb: 'post' },
  });

  /**
   * get logs per order or quote request
   * @param param
   * @param options
   */
  OrderErrorLog.listByOrder = async function(param, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    const where = { orderKey: param.orderKey, orderType: param.orderType };
    return await OrderErrorLog.find({ where: where, order: 'created DESC' });
  };
  OrderErrorLog.remoteMethod('listByOrder', {
    description: 'get logs per order or quote request',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: ['OrderErrorLog'] },
    http: { path: '/list-by-order', verb: 'post' },
  });
};
