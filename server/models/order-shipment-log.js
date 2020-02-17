'use strict';

const logger = require('../../lib/logger')(module);
const ummaUtil = require('../../lib/umma-util');
const ummaMail = require('../../lib/umma-mail');
const ummaError = require('../../lib/umma-error');
const { disableAllMethods } = require('../../lib/loopback-helpers');

let app = {
  umma: require('../../reference'), // 개발 참조용 레퍼런스 파일
};

module.exports = function(OrderShipmentLog) {
  const Model = OrderShipmentLog;
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
   * 주문 배송상태 등록
   * acl: Admin
   * @param param
   * @param options
   */
  OrderShipmentLog.add = async function(param, options) {
    const token = ummaUtil.token.getAccessToken(options);
    const trackingInfo = param;
    const orderId = param[0].orderId;
    const findOrder = await app.models.Order.findOne({ where: { id: orderId }, fields: { id: true } });
    if (!findOrder) throw new ummaError.invalidParam('Order id');
    if (!param[0].orderKey) throw new ummaError.customMessage('No order key');
    const updateAll = trackingInfo.map(tracking => {
      OrderShipmentLog.upsert({
        id: tracking.id,
        adminRoleId: token.roleId,
        adminUserId: token.userId,
        comments: tracking.comments,
        orderId: tracking.orderId,
        orderKey: tracking.orderKey,
        totalWeight: tracking.totalWeight,
        trackingNumber: tracking.trackingNumber,
        trackingUrl: tracking.trackingUrl,
        exportDate: tracking.exportDate,
        status: tracking.status,
        created: new Date(),
        // 상태값들은 아직 미정
        status: 1,
      });
    });
    await Promise.all(updateAll);
    // return await OrderShipmentLog.find({
    //   where: { orderId: orderId, status: 1 },
    //   fields: { orderId: true, trackingNumber: true, trackingUrl: true, exportDate: true },
    // });
    return await app.models.Order.findOne({ where: { id: orderId }, include: ['user', { relation: 'shipping', scope: { where: { status: 1 } } }] });
  };

  OrderShipmentLog.remoteMethod('add', {
    description: '주문 배송상태 등록',
    notes: '{orderId, orderKey, trackingNumber, trackingUrl, exportDate, totalWeight}',
    accepts: ummaUtil.remoteMethod.accepts.paramArrayAndOptions,
    returns: { root: true, type: 'Order' },
    http: { path: '/add', verb: 'post' },
  });

  /**
   * 송장번호에 대한 이메일 보내기
   * @param id
   * @param options
   */
  OrderShipmentLog.sendTrackingEmail = async function(id, options, data) {
    const token = ummaUtil.token.getAccessToken(options);

    data = await app.models.Order.findById(id, { include: ['user', { relation: 'shipping', scope: { where: { status: 1, emailSent: 0 } } }] });
    data = data.toJSON();
    if (data.shipping.length === 0) throw new ummaError.customMessage('All emails have been sent.');

    await ummaMail.order.trackingInfoNotifyToBuyer.sendMail(app, data);

    // update emailSent 0 -> 1
    await OrderShipmentLog.updateAll(
      { orderId: id, status: 1, emailSent: 0 },
      {
        emailSent: 1,
      }
    );
    return true;
  };
  OrderShipmentLog.remoteMethod('sendTrackingEmail', {
    description: '송장번호에 대한 이메일 보내기',
    accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
    returns: { root: true, type: Boolean },
    http: { path: '/sendTrackingEmail/:id', verb: 'get' },
  });

  /**
   * 주문 배송상태 카운트
   * @param filter
   * @param options
   */
  OrderShipmentLog.listCount = async function(where, options) {
    const token = ummaUtil.token.getAccessToken(options);

    where = ummaUtil.where.addOwnerByTokenWithoutAdmin(token, where);
    return await OrderShipmentLog.count(where);
  };

  OrderShipmentLog.remoteMethod('listCount', {
    description: '주문 배송상태 카운트',
    accepts: ummaUtil.remoteMethod.accepts.whereAndOptions,
    returns: { root: true, type: Number },
    http: { path: '/listCount', verb: 'get' },
  });

  /**
   * 주문 배송상태 리스트
   * @param filter
   * @param options
   */
  OrderShipmentLog.list = async function(filter, options) {
    const token = ummaUtil.token.getAccessToken(options);

    filter = ummaUtil.filter.validate.limit(filter);
    filter = ummaUtil.filter.where.addOwnerByTokenWithoutAdmin(token, filter);

    return await OrderShipmentLog.find(filter);
  };

  OrderShipmentLog.remoteMethod('list', {
    description: '주문 배송상태 리스트',
    accepts: ummaUtil.remoteMethod.accepts.filterAndOptions,
    returns: { root: true, type: ['OrderShipmentLog'] },
    http: { path: '/list', verb: 'get' },
  });

  /**
   * 주문 배송 정보 상세
   * @param id
   * @param options
   */
  OrderShipmentLog.detail = async function(id, options) {
    return await OrderShipmentLog.findById(id);
  };
  OrderShipmentLog.remoteMethod('detail', {
    description: '주문 배송 정보 상세',
    accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
    returns: { root: true, type: 'OrderShipmentLog' },
    http: { path: '/detail/:id', verb: 'get' },
  });

  /**
   * 주문 송장번호 update
   * @param param
   * @param options
   */
  OrderShipmentLog.updateTracking = async function(param, options) {
    // 상태 0 -> 견적 대기; https://docs.google.com/spreadsheets/d/18uks34o1PMEpe7VeWVB2LawIJSGJPKkBL2G7Z9_QrLE/edit?ts=5baef430#gid=307450834 상태값 참조
    const token = ummaUtil.token.getAccessToken(options);
    if (!param.orderKey) throw new ummaError.customMessage('You have not provided an order key.');
    const checkIfOrderExists = await app.models.Order.findOne({ where: { orderKey: param.orderKey }, fields: { orderKey: true } });
    if (!checkIfOrderExists) throw new ummaError.customMessage('This order does not exist.');
    await OrderShipmentLog.updateAll({ id: param.id, orderId: param.orderId, orderKey: param.orderKey }, param);

    return true;
  };
  OrderShipmentLog.remoteMethod('updateTracking', {
    description: '주문 송장번호 update',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: Boolean },
    http: { path: '/updateTracking', verb: 'post' },
  });
  /**
   * delete by id
   * @param id
   */
  OrderShipmentLog.deleteTracking = async function(id) {
    // retrieve id from client and update the status of a tracking log from 1 to 0
    const checkIfDeleted = await OrderShipmentLog.findById(id);
    if (checkIfDeleted.status === 0) throw new ummaError.customMessage('You have already deleted this tracking log.');
    await OrderShipmentLog.destroyAll({ id: id });
    return true;
  };
  OrderShipmentLog.remoteMethod('deleteTracking', {
    description: 'delete by id',
    accepts: ummaUtil.remoteMethod.accepts.id,
    returns: { root: true, type: Boolean },
    http: { path: '/deleteTracking/:id', verb: 'post' },
  });
};
