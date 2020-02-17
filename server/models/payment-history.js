'use strict';

/*****
 * [paymentType] enum
 * PAYMENT: 결제
 * REFUND: 환불
 * PARTIAL_PAYMENT: 부분 결제
 * PARTIAL_REFUND: 부분 환불
 *
 * [pgStatus] enum
 * The order status. The possible values are:
 * CREATED: The order was created with the specified context.
 * SAVED: The order was saved and persisted. The order status continues to be in progress until a capture is made with final_capture = true for all purchase units within the order.
 * APPROVED: The customer approved the payment through the PayPal wallet or another form of guest or unbranded payment. For example, a card, bank account, or so on.
 * VOIDED: All purchase units in the order are voided.
 * COMPLETED: The payment was authorized or the authorized payment was captured for the order.
 */

const logger = require('../../lib/logger')(module);
const ummaUtil = require('../../lib/umma-util');
const ummaError = require('../../lib/umma-error');
const ummaMail = require('../../lib/umma-mail');
const { disableAllMethods } = require('../../lib/loopback-helpers');

let app = {
  umma: require('../../reference'), // 개발 참조용 레퍼런스 파일
};

module.exports = function(PaymentHistory) {
  const Model = PaymentHistory;
  /**
   * Disable Remote Method
   */
  disableAllMethods(Model, ['count', 'find', 'findOne', 'findById']);

  Model.on('attached', function(a) {
    app = a;
  });
  Model.on('dataSourceAttached', function() {});

  /**
   * 결제 내역 추가
   * acl: Admin
   * @param param
   * @param options
   */
  PaymentHistory.add = async function(param, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    if (!param.roleId) throw new ummaError.invalidParam('roleId');
    if (!param.userId) throw new ummaError.invalidParam('userId');
    if (Object.values(app.umma.commonCode.PAYMENT_METHOD).indexOf(param.paymentMethod) < 0) throw new ummaError.invalidParam('paymentMethod');
    if (Object.values(app.umma.commonCode.PAYMENT_TYPE).indexOf(param.paymentType) < 0) throw new ummaError.invalidParam('paymentType');

    param.created = new Date();

    return await PaymentHistory.create(param);
  };
  PaymentHistory.remoteMethod('add', {
    description: '결제 내역 추가',
    accepts: ummaUtil.remoteMethod.accepts.paramModelAndOptions('PaymentHistory'),
    returns: { root: true, type: 'PaymentHistory' },
    http: { path: '/add', verb: 'post' },
  });

  /**
   * 결제 내역 카운트
   * acl: Buyer
   * @param where
   * @param options
   */
  PaymentHistory.countPayment = async function(where, options) {
    const token = ummaUtil.token.getAccessToken(options);

    where = ummaUtil.where.addOwnerByToken(token, where);

    return await PaymentHistory.count(where);
  };
  PaymentHistory.remoteMethod('countPayment', {
    description: '결제 내역 카운트',
    accepts: ummaUtil.remoteMethod.accepts.whereAndOptions,
    returns: { root: true, type: Number },
    http: { path: '/countPayment', verb: 'get' },
  });

  /**
   * 관리자가 유저의 결제 내역 카운트
   * acl: Admin
   * @param where
   * @param options
   */
  PaymentHistory.countPaymentForAdmin = async function(where, options) {
    const token = ummaUtil.token.getAccessToken(options);

    where = ummaUtil.where.addOwnerByTokenWithoutAdmin(token, where);

    return await PaymentHistory.count(where);
  };
  PaymentHistory.remoteMethod('countPaymentForAdmin', {
    description: '관리자가 유저의 결제 내역 카운트',
    accepts: ummaUtil.remoteMethod.accepts.whereAndOptions,
    returns: { root: true, type: Number },
    http: { path: '/countPaymentForAdmin', verb: 'get' },
  });

  /**
   * 결제 내역 리스트
   * acl: Buyer
   * @param filter
   * @param options
   */
  PaymentHistory.list = async function(filter, options) {
    const token = ummaUtil.token.getAccessToken(options);

    filter = ummaUtil.filter.validate.limit(filter);
    filter = ummaUtil.filter.where.addOwnerByToken(token, filter);

    if (!filter.order) filter.order = ['created DESC'];

    return await PaymentHistory.find(filter);
  };
  PaymentHistory.remoteMethod('list', {
    description: '결제 내역 리스트',
    accepts: ummaUtil.remoteMethod.accepts.filterAndOptions,
    returns: { root: true, type: ['PaymentHistory'] },
    http: { path: '/list', verb: 'get' },
  });

  /**
   * 관리자가 유저의 결제 내역 리스트 조회
   * acl: Admin
   * @param filter
   * @param options
   */
  PaymentHistory.listForAdmin = async function(filter, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    filter = ummaUtil.filter.validate.limit(filter);
    return await PaymentHistory.find(filter);
  };
  PaymentHistory.remoteMethod('listForAdmin', {
    description: '관리자가 유저의 결제 내역 리스트 조회',
    accepts: ummaUtil.remoteMethod.accepts.filterAndOptions,
    returns: { root: true, type: ['PaymentHistory'] },
    http: { path: '/listForAdmin', verb: 'get' },
  });

  /**
   * 결제 상세정보
   * @param id
   * @param options
   */
  PaymentHistory.detailForAdmin = async function(id, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    const detail = await PaymentHistory.findById(id);
    if (!detail) throw new ummaError.customMessage('This payment does not exist.');
    return detail;
  };
  PaymentHistory.remoteMethod('detailForAdmin', {
    description: '결제 내역 상세 ',
    accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
    returns: { root: true, type: 'PaymentHistory' },
    http: { path: '/detailForAdmin/:id', verb: 'get' },
  });
};
