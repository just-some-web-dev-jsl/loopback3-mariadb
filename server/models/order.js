/* eslint-disable camelcase */
'use strict';

const logger = require('../../lib/logger')(module);
const ummaUtil = require('../../lib/umma-util');
const ummaError = require('../../lib/umma-error');
const ummaMail = require('../../lib/umma-mail');
const ummaExcel = require('../../lib/umma-excel');
const paypal = require('../../lib/paypal');
const { disableAllMethods } = require('../../lib/loopback-helpers');

// 환경설정
const NODE_ENV = process.env.NODE_ENV;

let app = {
  umma: require('../../reference'), // 개발 참조용 레퍼런스 파일
};

const currencyCode = 'USD';

module.exports = function(Order) {
  const Model = Order;
  /**
   * Disable Remote Method
   */
  disableAllMethods(Model, ['count', 'find', 'findOne', 'findById', 'deleteById', 'prototype.__get__product', 'prototype.__findById__product']);

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
      description: '주문 다중 삭제',
      accepts: ummaUtil.remoteMethod.accepts.idsArrayAndOptions,
      returns: { root: true, type: { count: Number } },
      http: { path: '/deleteByIds', verb: 'post' },
    });
  });
  Model.on('dataSourceAttached', function() {});

  /**
   * 어드민 주문 승인
   * @param id
   * @param options
   * @param param
   */
  Order.confirmById = async function(id, options) {
    const token = ummaUtil.token.getAccessToken(options);
    const where = { id: id };
    const findOrder = await Order.findOne({ where: where, fields: { id: true, shippingCtId: true, userId: true } });
    if (!findOrder) throw new ummaError.customMessage('Cannot find this order.');
    const confirm = { status: 5, statusUpdated: new Date() };

    if (token.isAdmin) {
      const findAdmin = await app.models.Admin.findById(token.userId, { fields: { id: true, firstName: true, lastName: true } });
      confirm.operator = findAdmin.firstName + ' ' + findAdmin.lastName;
    }

    let findBuyer = await app.models.Buyer.findById(findOrder.userId, { include: ['company'] });
    // console.log(findBuyer);
    findBuyer = findBuyer.toJSON();

    // 인보이스 번호 생성
    confirm.invoiceNumber = `IN-${findBuyer.company.ctId}-${findOrder.id}`;
    await Order.updateAll({ id: findOrder.id }, confirm);

    return await Order.findOne({ where: where, include: 'user' });
  };
  Order.remoteMethod('confirmById', {
    description: '물류팀에서 주문 승인',
    accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
    returns: { root: true, type: 'Order' },
    http: { path: '/confirmById/:id', verb: 'post' },
  });

  /**
   * 어드민 주문 다중 승인
   * @param ids
   * @param options
   */
  Order.confirmByIds = async function(ids, options) {
    const token = ummaUtil.token.getAccessToken(options);

    // 배열 아이디로 주문 조회
    const where = { id: { inq: ids } };
    const findOrders = await Order.find({ where: where, fields: { id: true, shippingCtId: true, userId: true } });
    if (findOrders.length === 0) throw new ummaError.customMessage('Cannot find this order.');

    // operator가 주문을 완료함
    const confirm = { status: 5, statusUpdated: new Date() };

    if (token.isAdmin) {
      const findAdmin = await app.models.Admin.findById(token.userId, { fields: { id: true, firstName: true, lastName: true } });
      confirm.operator = findAdmin.firstName + ' ' + findAdmin.lastName;
    }
    try {
      await app.dataSources.ummaDs.transaction(async models => {
        const { Buyer, Order } = models;
        const updateConfirmOrders = findOrders.forEach(findOrder => {
          let findBuyer = Buyer.findById(findOrder.userId, { include: ['company'] });
          // console.log(findBuyer);
          findBuyer = findBuyer.toJSON();

          // 인보이스 번호 생성
          confirm.invoiceNumber = `IN-${findBuyer.company.ctId}-${findOrder.id}`;
          return Order.updateAll({ id: findOrder.id }, confirm);
        });
        await Promise.all(updateConfirmOrders);
      });
    } catch (err) {
      throw err;
    }

    return await Order.find({ where: where, include: ['user'] });
  };
  Order.remoteMethod('confirmByIds', {
    description: '물류팀에서 주문 다중 승인',
    accepts: ummaUtil.remoteMethod.accepts.idsArrayAndOptions,
    returns: { root: true, type: ['Order'] },
    http: { path: '/confirmByIds', verb: 'post' },
  });

  // 승인 메일 발송
  Order.afterRemote('confirmById', async function(ctx, data) {
    // if (!Array.isArray(data)) data = [data];
    // 메일 발송
    data = data.toJSON();
    return ummaMail.order.confirm.sendMail(app, data);
  });

  /**
   * 주문 상태값 변경
   * @param param
   * @param options
   */
  Order.updateOrderStatus = async function(param, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    const where = { orderKey: param.orderKey };
    const findOrder = await Order.findOne({
      where: where,
      fields: { id: true, userId: true, shippingCtId: true, actualShippingPrice: true, totalCostPrice: true, paymentConfirmPrice: true, totalPrice: true },
    });
    if (!findOrder) throw new ummaError.customMessage('Cannot find this order.');
    // totalprice 으로 비교 (debit 때문에 )
    // const notAllPayed = findOrder.paymentConfirmPrice < findOrder.totalPrice;

    const data = { status: param.status, statusUpdated: new Date() };
    if (param.status === 5) {
      let findBuyer = await app.models.Buyer.findById(findOrder.userId, { include: ['company'] });
      findBuyer = findBuyer.toJSON();
      // 주문을 완료 못함 = > 모든 부서 정보가 없거나 paymentConfirmPrice 가 totalprice 와 일치하지 않을 때
      // if (!findOrder.actualShippingPrice || notAllPayed || !findOrder.totalCostPrice)
      //   throw new ummaError.customMessage(
      //     'Cannot complete order at this time. Please check all fields before confirming this order. (Logistics, Finance, Sourcing)'
      //   );
      // 인보이스 번호 생성
      data.invoiceNumber = `IN-${findBuyer.company.ctId}-${findOrder.id}`;
      data.orderCompleteDate = new Date();
    }
    await Order.updateAll(where, data);

    return await Order.findOne({ where: where, include: 'user' });
  };
  Order.remoteMethod('updateOrderStatus', {
    description: '주문 상태값 변경',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: Boolean },
    http: { path: '/updateOrderStatus', verb: 'post' },
  });
  Order.afterRemote('updateOrderStatus', async function(ctx, data) {
    data = data.toJSON();
    // 주문 완료 메일 발송
    if (data.status === 5) {
      await ummaMail.order.confirm.sendMail(app, data);
    }
  });

  /**
   * 주문 추가하기 (가견적서 테이블에서)
   * @param req
   * @param options
   */
  Order.add = async function(param, options) {
    const token = ummaUtil.token.getAccessToken(options);
    if (NODE_ENV === 'production' && token.userId === 1)
      throw new ummaError.customMessage('You cannot add orders with this account. Please use our test server.');
    // paymentMethod 파라미터 오류시 페이팔 결제 환불 불가능함
    if (!param.paymentMethod) throw new ummaError.invalidParam('paymentMethod');
    if (Object.values(app.umma.commonCode.PAYMENT_METHOD).indexOf(param.paymentMethod) < 0) throw new ummaError.invalidParam('paymentMethod');

    const isPayed = {
      TT: param.paymentMethod === app.umma.commonCode.PAYMENT_METHOD.TT,
      PAYPAL: param.paymentMethod === app.umma.commonCode.PAYMENT_METHOD.PAYPAL,
      ALL_DEBIT: param.paymentMethod === app.umma.commonCode.PAYMENT_METHOD.ALL_DEBIT,
    };

    try {
      // 클라이언트에서 아래 변수를 보낼 경우를 대비해 변수 초기화로 보안 처리
      param.pgCaptureId = null;
      param.pgStatus = null;
      param.pgResponse = undefined; // 모델 데이터타입이 Object 라서 null 설정하면 문자 null 로 들어가므로 undefined 로 설정
      param.pgCurrencyCode = null;
      param.paymentConfirmPrice = null;
      param.paymentConfirmDate = null;

      // 주문 오류시 페이팔 결제 환불(취소) 처리를 위해 최상단에서 확인
      if (isPayed.PAYPAL) {
        // pgOrderId 파라미터 오류는 페이팔 결제 환불 불가능함
        if (!param.pgOrderId) throw new ummaError.invalidParam('pgOrderId');

        // 페이팔 결제 확인
        param.pgResponse = await paypal.getOrder(param.pgOrderId);
        if (!param.pgResponse || !param.pgResponse.result) throw new ummaError.customMessage('Paypal order not found.');

        // 단일 건 결제 정보
        const purchase_unit = param.pgResponse.result.purchase_units[0];

        // param.pgOrderId = pgResponse.result.id;
        param.pgCaptureId = purchase_unit.payments.captures[0].id; // 페이팔 결제 환불시 필요
        param.pgStatus = param.pgResponse.result.status;

        // 결제 통화 - 페이팔 결제 환불시 필요
        param.pgCurrencyCode = purchase_unit.amount.currency_code;
        // 결제 금액 - 페이팔 결제 환불시 필요
        param.paymentConfirmPrice = Number.parseFloat(purchase_unit.amount.value);
        // 결제 일시
        param.paymentConfirmDate = new Date();

        // proformaKey 가져오기
        param.proformaKey = purchase_unit.reference_id;
        if (!param.proformaKey) throw new ummaError.customMessage('Proforma key not found.');
      } else if (isPayed.TT || isPayed.ALL_DEBIT) {
        if (!param.proformaKey) throw new ummaError.invalidParam('proformaKey');
      }

      // validate
      if (!ummaUtil.validate.price(param.creditAmountUsed)) throw new ummaError.invalidParam('creditAmountUsed');

      // 관리자가 유저의 주문 생성해주는 경우 roleId, userId 를 파라메터로 처리한다.
      if (token.isAdmin) {
        if (!param.roleId) throw new ummaError.invalidParam('roleId');
        if (!param.userId) throw new ummaError.invalidParam('userId');
      } else {
        param.roleId = token.roleId;
        param.userId = token.userId;
      }

      // 해당 유저의 가견적서 상품 조회
      let findProforma = { proformaKey: param.proformaKey };
      findProforma = ummaUtil.where.add(findProforma, { roleId: param.roleId, userId: param.userId });
      // 가견적서 조회
      const proforma = await app.models.Proforma.findOne({ where: findProforma });
      if (!proforma) throw new ummaError.customMessage('Proforma not found.');
      if (proforma.status === 0) throw new ummaError.customMessage('This order has not been approved by us at this time.');
      // 가견적서 상품 확인
      const findProformaProducts = { proformaKey: proforma.proformaKey };
      const proformaProduct = await app.models.ProformaProduct.find({ where: findProformaProducts });
      if (proformaProduct.length === 0) throw new ummaError.customMessage('Order products not found.');
      // 총수량, 총상품금액(subtotal) 생성
      const orderQuantities = proformaProduct.map(orderQuant => orderQuant.quantity).reduce((a, b) => a + b);
      const orderSubTotal = proformaProduct.map(orderSub => orderSub.totalPrice).reduce((a, b) => a + b);

      // 주문 총액이 500 달러 미만일 경우
      if (orderSubTotal < 500) throw new ummaError.customMessage('Subtotal not over $500.00');

      // 주문 데이터 매핑
      param.paymentType = app.umma.commonCode.PAYMENT_TYPE.PAYMENT;
      param.operator = proforma.operator;

      param.recipientName = proforma.recipientName;
      param.shippingPhone = proforma.shippingPhone;
      param.shippingCtId = proforma.shippingCtId;
      param.shippingCsId = proforma.shippingCsId;
      param.shippingCity = proforma.shippingCity;
      param.shippingAddress1 = proforma.shippingAddress1;
      param.shippingAddress2 = proforma.shippingAddress2;
      param.shippingZipcode = proforma.shippingZipcode;
      param.incoterms = proforma.incoterms;
      param.shipmentServiceId = proforma.shipmentServiceId;
      param.estShipDate = proforma.estShipDate;
      param.totalWeight = proforma.totalWeight;

      param.prType = proforma.prType;
      param.totalQuantity = orderQuantities;
      param.subtotalPrice = orderSubTotal;
      param.shippingPrice = proforma.shippingPrice;
      param.totalPrice = proforma.totalPrice;
      param.creditUsed = param.creditAmountUsed > 0 ? 1 : 0;
      param.checkoutPrice = ummaUtil.number.formatMoney(proforma.totalPrice - param.creditAmountUsed);
      // reference number array
      param.refProformaNumber2 = proforma.refProformaNumber2;
      param.refProformaNumber2.push({
        number: `${proforma.proformaNumber} (final)`,
        latest: 1,
      });
      // verify
      if (isPayed.PAYPAL) {
        // 페이팔 결제 통화 코드 확인
        if (param.pgCurrencyCode !== currencyCode) throw new ummaError.customMessage('Invalid currency code.');
        // 페이팔 결제 금액 확인
        if (param.paymentConfirmPrice !== param.checkoutPrice) throw new ummaError.customMessage('Invalid payment amount.');
      } else if (isPayed.ALL_DEBIT) {
        // 적립금 결제시 결제금액이 0 인지 확인
        if (param.checkoutPrice !== 0) throw new ummaError.customMessage('Invalid checkout price.');
      }

      // 주문키 생성
      const order = await Order.findOne({
        where: { orderKey: { like: `${ummaUtil.date.stringFormatDate()}%` } },
        order: 'created DESC',
        fields: { orderKey: true },
      });
      const newOrderKey = ummaUtil.string.getNewOrderKey(order && order.orderKey);
      if (!ummaUtil.validate.orderKey(newOrderKey)) throw new ummaError.customMessage('Invalid new order key');

      param.orderKey = newOrderKey;
      param.created = new Date();

      // 데이터베이스 트랜잭션
      // https://loopback.io/doc/en/lb3/Using-database-transactions.html#higher-level-transaction-api
      await app.dataSources.ummaDs.transaction(async models => {
        const { Order, OrderProduct, Buyer, DebitHistory, Proforma, PaymentHistory } = models;

        // 1.적립금 사용
        // TODO: 적립금 잔액에 대한 시간차 사용 막기 필요
        // TODO: 주문 생성전에 등록하므로 뷰단에 안보이도록 임시 status 상태값 처리 등 필요
        if (param.creditAmountUsed > 0) {
          const findDebit = await DebitHistory.getCurrentCredit(param.roleId, param.userId);
          if (!findDebit) throw new ummaError.customMessage('No debit points!');
          if (param.creditAmountUsed > findDebit.creditBalance) throw new ummaError.customMessage('Not enough points!');

          // 적립금 차감
          await DebitHistory.create({
            userName: findDebit.userName,
            userEmail: findDebit.userEmail,
            companyId: findDebit.companyId,
            roleId: findDebit.roleId,
            userId: findDebit.userId,
            orderKey: newOrderKey,
            orderNumber: param.orderNumber,
            proformaKey: param.proformaKey,
            credit: param.creditAmountUsed * -1,
            creditBalance: findDebit.creditBalance - param.creditAmountUsed, // TODO: 마이너스 금액이 발생할 수 있으며, 해당 정책 필요.
            status: param.creditUsed,
            created: param.created,
          });
        }

        // 2.주문서 생성
        const order = await Order.create(param);

        // 3.주문서 상품 등록
        const products = proformaProduct.map(p => {
          return {
            orderId: order.id,
            orderKey: order.orderKey,
            userId: order.userId,
            brId: p.brId,
            prId: p.prId,
            brName: p.brName,
            prName: p.prName,
            poId: p.poId,
            poName: p.poName,
            catCd1depth: p.catCd1depth,
            catCd2depth: p.catCd2depth,
            catCd3depth: p.catCd3depth,
            discountId: p.discountId,
            sku: p.sku,
            barcode: p.barcode,
            discountId: p.discountId,
            images: p.images,
            totalPrice: p.totalPrice,
            capacity: p.capacity,
            capacityType: p.capacityType,
            retailPrice: p.retailPrice,
            supplyPrice: p.supplyPrice,
            supplyRate: p.supplyRate,
            quantity: p.quantity,
            status: 1,
            created: param.created,
          };
        });
        await OrderProduct.create(products);

        // 4.가견적서 주문상태값 업데이트
        const updateOrderPlaced = await Proforma.updateAll({ proformaKey: param.proformaKey }, { orderPlaced: 1 });
        if (updateOrderPlaced && updateOrderPlaced.count === 0) throw new ummaError.customMessage('Update Proforma orderPlaced failed.');

        // 5.결제 내역 등록
        await PaymentHistory.create({
          paymentMethod: param.paymentMethod,
          paymentType: app.umma.commonCode.PAYMENT_TYPE.PAYMENT,
          paymentPartialed: 0,
          paymentAmount: param.checkoutPrice,
          orderKey: param.orderKey,
          proformaKey: param.proformaKey,
          pgOrderId: param.pgOrderId,
          pgCaptureId: param.pgCaptureId,
          pgResponse: param.pgResponse,
          pgStatus: param.pgStatus,
          roleId: param.roleId,
          userId: param.userId,
          created: param.created,
        });

        // 6.주문번호 생성
        let findBuyer = await Buyer.findById(param.userId, { include: ['company'] });
        findBuyer = findBuyer.toJSON();
        const orderNumber = `OR-${findBuyer.company.ctId}-000-${order.id}`;

        // 7.주문서 업데이트
        param.status = isPayed.TT ? 0 : 1;
        await DebitHistory.updateAll({ orderKey: param.orderKey }, { orderNumber: orderNumber });
        await Order.updateAll({ orderKey: param.orderKey }, { orderNumber: orderNumber, pgStatus: param.pgStatus, status: param.status });
        // 다중 송정번호 지원하기 위한 주석
        // await OrderShipmentLog.create({
        //   orderKey: param.orderKey,
        //   orderId: order.id,
        //   comments: param.comments,
        //   // 상태 0 -> 견적 대기; https://docs.google.com/spreadsheets/d/18uks34o1PMEpe7VeWVB2LawIJSGJPKkBL2G7Z9_QrLE/edit?ts=5baef430#gid=307450834 상태값 참조
        //   status: 0,
        // });
      });

      // 주문 성공후 주문서 리턴
      return await Order.findOne({ where: { orderKey: newOrderKey }, include: ['product', 'user'] });
    } catch (err) {
      logger.error(err);

      // 주문 트랜잭션 실패시 페이팔 결제 환불(취소) 처리
      if (isPayed.PAYPAL && param.pgCaptureId && param.paymentConfirmPrice && param.pgCurrencyCode) {
        try {
          logger.debug('주문 오류로 인한 페이팔 결제 환불 처리', param.pgCaptureId);
          await paypal.refundCapture(param.pgCaptureId, {
            amount: {
              value: param.paymentConfirmPrice,
              currency_code: param.pgCurrencyCode,
            },
          });
        } catch (err2) {
          logger.error(err2);
          throw err2;
        }
      }

      throw err;
    }
  };
  Order.afterRemote('add', async function(ctx, data) {
    data = data.toJSON(); // include 데이터가 들어있으면 toJSON()으로 json 객체로 변환해서 사용해야한다.
    // 메일 발송
    if (NODE_ENV !== 'development') {
      await ummaMail.order.request.sendMail(app, data);
      await ummaMail.order.notifyAdmin.sendMail(app, data);
    }
  });
  Order.remoteMethod('add', {
    description: '주문 추가',
    notes: 'param { paymentMethod: String, pgOrderId: String, proformaKey: String, creditAmountUsed: Number }',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: 'Order' },
    http: { path: '/add', verb: 'post' },
  });

  /**
   * 주문 취소하기
   * @param param
   * @param options
   */
  Order.refund = async function(param, options) {
    if (!param.orderKey) throw new ummaError.invalidParam('orderKey');
    if (!param.refundAmount) throw new ummaError.invalidParam('refundAmount');

    // 데이터베이스 트랜잭션
    // https://loopback.io/doc/en/lb3/Using-database-transactions.html#higher-level-transaction-api
    try {
      await app.dataSources.ummaDs.transaction(async models => {
        const { Order, DebitHistory, PaymentHistory, Buyer, OrderRefundLog } = models;
        const token = ummaUtil.token.getAccessToken(options);

        if (!token.isAdmin) throw new ummaError.forbidden();

        const operatorRoleId = token.roleId;
        const operatorUserId = token.userId;

        // 해당 주문서 조회
        const order = await Order.findOne({ where: { orderKey: param.orderKey } });
        if (!order) throw new ummaError.customMessage('Order not found.');

        // verify
        if (!order.checkoutPrice) throw new ummaError.customMessage('Checkout amount is zero.');
        // 같은 주문에서 다시 반품이 일어날 수 있음
        if (order.status === 0) throw new ummaError.customMessage('Cannot refund this order.');
        if (!order.paymentMethod) throw new ummaError.customMessage('Payment method not found.');

        // 결제 수단
        const isPayed = {
          TT: order.paymentMethod === app.umma.commonCode.PAYMENT_METHOD.TT,
          PAYPAL: order.paymentMethod === app.umma.commonCode.PAYMENT_METHOD.PAYPAL,
          ALL_DEBIT: order.paymentMethod === app.umma.commonCode.PAYMENT_METHOD.ALL_DEBIT,
        };

        // 결제 및 환불 내역 조회
        const paymentHistory = await app.models.PaymentHistory.find({ where: { orderKey: param.orderKey }, order: ['created DESC'] });
        if (paymentHistory.length === 0) throw new ummaError.customMessage('Payment history not found.');

        // 과거 총 결제 금액
        let prevTotalPaymentAmount = 0;
        // 과거 총 환불 금액
        let prevTotalRefundAmount = 0;

        // PG사 트랜잭션 정보
        let pgCaptureId = null;

        // 총 결제 금액 및 환불 금액 합산
        paymentHistory.forEach(function(payment) {
          // 총 결제 금액 합산
          if (payment.paymentType === app.umma.commonCode.PAYMENT_TYPE.PAYMENT) {
            prevTotalPaymentAmount += payment.paymentAmount;
            if (!pgCaptureId) pgCaptureId = payment.pgCaptureId; // 가장 마지막에 결제한 아이디를 찾는다.
          } else if (payment.paymentType === app.umma.commonCode.PAYMENT_TYPE.PARTIAL_PAYMENT) {
            prevTotalPaymentAmount += payment.paymentAmount;
            if (!pgCaptureId) pgCaptureId = payment.pgCaptureId; // 가장 마지막에 결제한 아이디를 찾는다.
          }
          // 총 환불 금액 합산
          else if (payment.paymentType === app.umma.commonCode.PAYMENT_TYPE.REFUND) {
            prevTotalRefundAmount += payment.paymentAmount;
          } else if (payment.paymentType === app.umma.commonCode.PAYMENT_TYPE.PARTIAL_REFUND) {
            prevTotalRefundAmount += payment.paymentAmount;
          }
        });

        // 총 환불 금액 = 과거 총 환불 금액 + 현재 환불 요청 금액
        const totalRefundAmount = ummaUtil.number.formatMoney(prevTotalRefundAmount + param.refundAmount);

        // verify: 과거 총 환불 금액과 과거 총 결제한 금액 비교 (금액이 같으면 이미 환불 완료됨)
        if (prevTotalRefundAmount === prevTotalPaymentAmount) throw new ummaError.customMessage('This order was already refunded.');

        // verify: 총 환불 금액이 주문 결제 금액보다 클 수 없음
        if (totalRefundAmount > order.checkoutPrice) throw new ummaError.customMessage('Payment amount does not match the checkout amount.');

        // verify: 현재 환불 요청 금액이 총 결제액보다 클 수 없음
        if (param.refundAmount > prevTotalPaymentAmount) throw new ummaError.customMessage('Payment amount does not match the refund amount.');

        // 환불 구분: 전액 환불, 부분 환불
        const isRefund = {
          ALL: totalRefundAmount === prevTotalPaymentAmount,
          PARTIAL: totalRefundAmount < prevTotalPaymentAmount,
        };

        // PG사 트랜잭션 정보
        let pgRefundId = null;
        let pgStatus = null;
        let pgResponse = undefined; // 모델 데이터타입이 Object 라서 null 설정하면 문자 null 로 들어가므로 undefined 로 설정

        // 적립금 지급 여부
        let isCreateDebit = false;
        const created = new Date();

        // 환불 트랜잭션
        if (isPayed.PAYPAL) {
          if (!pgCaptureId) throw new ummaError.customMessage('Capture ID not found.');

          // 페이팔 결제 환불
          pgResponse = await paypal.refundOrder(pgCaptureId, {
            amount: {
              value: param.refundAmount,
              currency_code: currencyCode,
            },
          });
          pgRefundId = pgResponse.result.id;
          pgStatus = pgResponse.result.status;

          // 페이팔 트랜잭션 실패일 경우
          if (pgStatus !== 'COMPLETED') {
            logger.error(pgResponse);
            throw new ummaError.customMessage('Paypal online transaction failed.');
          }
        } else if (isPayed.TT) {
          isCreateDebit = true;
        } else if (isPayed.ALL_DEBIT) {
          // 해당 주문의 적립금 사용 내역이 존재하는지 확인
          if (order.creditUsed === 0 || order.creditAmountUsed === 0) throw new ummaError.customMessage('This order is not used debit.');

          // 해당 주문의 적립금 결제 내역이 존재하는지 확인
          const orderDebit = await DebitHistory.findOne({
            where: { orderKey: param.orderKey, status: 1 },
            order: 'created DESC',
          });
          if (!orderDebit || orderDebit.credit >= 0) throw new ummaError.customMessage('Debit payment not found.');

          isCreateDebit = true;
        }

        // 적립금 지급
        if (isCreateDebit) {
          // 적립금 잔액 가져오기
          let findDebit = await DebitHistory.getCurrentCredit(order.roleId, order.userId);
          // 적립금 내역이 없는 유저일 경우
          if (!findDebit) {
            const buyer = await Buyer.findOne({ where: { roleId: order.roleId, id: order.userId } });
            if (!buyer) throw new ummaError.customMessage('Buyer info not found.');
            findDebit = {
              userName: buyer.firstName + ' ' + buyer.lastName,
              userEmail: buyer.email,
              companyId: buyer.companyId,
              roleId: buyer.roleId,
              userId: buyer.id,
              creditBalance: 0,
            };
          }

          // 적립금 지급
          await DebitHistory.create({
            userName: findDebit.userName,
            userEmail: findDebit.userEmail,
            companyId: findDebit.companyId,
            roleId: findDebit.roleId,
            userId: findDebit.userId,
            operatorRoleId: operatorRoleId,
            operatorUserId: operatorUserId,
            orderNumber: order.orderNumber,
            orderKey: param.orderKey,
            proformaKey: order.proformaKey,
            credit: param.refundAmount,
            creditBalance: findDebit.creditBalance + param.refundAmount,
            eventDetail: param.eventDetail,
            remark: param.remark,
            status: 1,
            created: created,
          });
        }

        // 결제 환불 내역 추가
        const paymentHistoryParam = {
          paymentMethod: order.paymentMethod,
          paymentType: isRefund.ALL ? app.umma.commonCode.PAYMENT_TYPE.REFUND : app.umma.commonCode.PAYMENT_TYPE.PARTIAL_REFUND,
          paymentPartialed: isRefund.ALL ? 0 : 1,
          paymentAmount: param.refundAmount,
          orderKey: param.orderKey,
          proformaKey: order.proformaKey,
          roleId: order.roleId,
          userId: order.userId,
          created: created,
        };
        // PG사 결과값 설정
        if (pgStatus) {
          paymentHistoryParam.pgResponse = pgResponse;
          paymentHistoryParam.pgOrderId = pgRefundId;
          paymentHistoryParam.pgCaptureId = pgCaptureId;
          paymentHistoryParam.pgStatus = pgStatus;
        }
        await PaymentHistory.create(paymentHistoryParam);

        // 반품/환불 로그
        const refundParam = {
          orderKey: param.orderKey,
          orderId: order.id,
          adminRoleId: operatorRoleId,
          adminUserId: operatorUserId,
          roleId: order.roleId,
          userId: order.userId,
          orderRefundAmount: totalRefundAmount,
          orderCheckOutPrice: order.checkoutPrice,
          // 상태값 (1 = 반품 요청; 2 = 반품확인 중; 3 = 반품 완료; 10 = 환불요청; 20 = 환불 처리중; 30 = 환불완료;)
          comments: param.remark,
          refundStatus: param.refundStatus,
        };
        await OrderRefundLog.create(refundParam);

        //  반품/환불은 Order refund log에서 관리. refundstatus 1은 반품이 있었다는 듯.
        // TODO:  COMMON CODE
        await Order.updateAll({ orderKey: param.orderKey }, { refundAmount: totalRefundAmount, refundStatus: 1 });
      });
    } catch (err) {
      logger.error(err);
      throw err;
    }

    // TODO: 주문 환불 메일 전송, 알림 등 처리

    return true;
  };
  Order.remoteMethod('refund', {
    description: '주문 환불',
    notes: 'param { orderKey: String, refundAmount: Number, refundStatus: 1,2,3,10,20,30 }',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: Boolean },
    http: { path: '/refund', verb: 'post' },
  });

  /**
   * 반품 환불 상태값 변경
   * @param param
   */
  Order.updateRefundStatus = async function(param) {
    const findOrder = await Order.findOne({ orderKey: param.orderKey });
    if (!findOrder) throw new ummaError.customMessage('Cannot find this order!');

    await Order.updateAll({ orderKey: param.orderKey }, { refundStatus: param.refundStatus });

    return true;
  };

  Order.remoteMethod('updateRefundStatus', {
    description: '주문 반품/환불 상태 변경',
    notes: 'param { "orderKey": String, "refundStatus": 1~30 }',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: Boolean },
    http: { path: '/updateRefundStatus', verb: 'post' },
  });

  /**
   * 주문 카운트
   * @param where
   * @param options
   */
  Order.countOrder = async function(where, options) {
    const token = ummaUtil.token.getAccessToken(options);

    where = ummaUtil.where.addOwnerByTokenWithoutAdmin(token, where);

    return await Order.count(where);
  };

  Order.remoteMethod('countOrder', {
    description: '주문 카운트',
    accepts: ummaUtil.remoteMethod.accepts.whereAndOptions,
    returns: { root: true, type: Number },
    http: { path: '/countOrder', verb: 'get' },
  });

  /**
   * 주문조회
   * @param filter
   * @param options
   */
  Order.list = async function(filter, options) {
    const token = ummaUtil.token.getAccessToken(options);

    filter = ummaUtil.filter.validate.limit(filter);
    filter = ummaUtil.filter.where.addOwnerByTokenWithoutAdmin(token, filter);
    filter = ummaUtil.filter.include.add(filter, {
      relation: 'shipping',
      scope: {
        fields: ['id'],
      },
    });
    return await Order.find(filter);
  };

  Order.remoteMethod('list', {
    description: '로그인한 유저의 주문 리스트',
    accepts: ummaUtil.remoteMethod.accepts.filterAndOptions,
    returns: { root: true, type: ['Order'] },
    http: { path: '/list', verb: 'get' },
  });

  /**
   * 주문 디테일 보기
   * @param id
   * @param options
   */
  Order.detail = async function(id, options) {
    const token = ummaUtil.token.getAccessToken(options);

    const order = await Order.findById(id, {
      include: [
        // 1 대 다
        // {
        //   relation: 'remark',
        //   scope: {
        //     fields: ['adminRoleId', 'remark', 'description'],
        //   },
        // },
        // 1 대 다
        // {
        //   relation: 'refund',
        //   scope: {
        //     fields: ['adminRoleId', 'comments', 'orderRefundAmount', 'created'],
        //   },
        // },
        // 1 대 다
        {
          relation: 'shipping',
          scope: {
            where: { status: 1 },
            fields: ['trackingNumber', 'trackingUrl', 'exportDate', 'totalWeight'],
          },
        },
      ],
    });
    if (!order) throw new ummaError.customMessage('Order not found.');

    // 관리자가 아닌 경우
    if (!token.isAdmin) {
      // 자신의 주문 아닐 경우
      if (!token.isOwner(order)) throw new ummaError.forbidden();
    }

    return order;
  };
  Order.remoteMethod('detail', {
    description: '주문 상세 가져오기',
    accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
    returns: { root: true, type: 'Order' },
    http: { path: '/detail/:id', verb: 'get' },
  });

  /**
   * 주문 디테일 보기 - 관리자용
   * @param id
   * @param options
   */
  Order.detailForAdmin = async function(id, options) {
    const token = ummaUtil.token.getAccessToken(options);

    const order = await Order.findById(id, {
      include: [
        // 1 대 다
        // {
        //   relation: 'remark',
        //   scope: {
        //     fields: ['adminRoleId', 'remark', 'description'],
        //   },
        // },
        // 1 대 다
        {
          relation: 'user',
          scope: {
            fields: ['companyName', 'firstName', 'lastName', 'email'],
          },
        },
        {
          relation: 'refund',
          scope: {
            fields: ['adminRoleId', 'comments', 'orderRefundAmount', 'refundStatus', 'created'],
          },
        },
        // 1 대 다
        {
          relation: 'shipping',
          scope: {
            where: { status: 1 },
            fields: ['id', 'adminRoleId', 'comments', 'trackingNumber', 'trackingUrl', 'exportDate', 'status', 'totalWeight', 'orderKey', 'emailSent'],
          },
        },
      ],
    });
    if (!order) throw new ummaError.customMessage('Order not found.');

    // 관리자가 아닌 경우
    if (!token.isAdmin) {
      // 자신의 주문 아닐 경우
      if (!token.isOwner(order)) throw new ummaError.forbidden();
    }

    return order;
  };
  Order.remoteMethod('detailForAdmin', {
    description: '주문 상세 가져오기 (관리자용)',
    accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
    returns: { root: true, type: 'Order' },
    http: { path: '/detailForAdmin/:id', verb: 'get' },
  });

  /**
   * 주문 상품들 보기
   * @param id
   * @param options
   */
  Order.detailProducts = async function(id, options) {
    const token = ummaUtil.token.getAccessToken(options);

    const order = await Order.findById(id);
    if (!order) throw new ummaError.customMessage('Order not found.');

    let where = { orderId: id };

    // 관리자가 아닌 경우
    if (!token.isAdmin) {
      // 자신의 주문 아닐 경우
      if (!token.isOwner(order)) throw new ummaError.forbidden();
      // 승인되지않은 주문
      // if (order.status === 0) throw new ummaError.customMessage('This order has not been confirmed.');

      where = ummaUtil.where.add(where, { status: 1 });
    }

    return await app.models.OrderProduct.find({ where: where });
  };

  Order.remoteMethod('detailProducts', {
    description: '주문 상품들 가져오기',
    notes: '관리자 토큰이 아니면 status: 1 설정',
    accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
    returns: { root: true, type: ['OrderProduct'] },
    http: { path: '/detailProducts/:id', verb: 'get' },
  });

  /**
   * 주문 상품 카운트
   * @param id
   * @param options
   */
  Order.detailProductCount = async function(id, options) {
    const token = ummaUtil.token.getAccessToken(options);

    let where = { orderId: id };
    where = ummaUtil.where.addOwnerByTokenWithoutAdmin(token, where);

    // 관리자가 아닌 경우
    if (!token.isAdmin) {
      where = ummaUtil.where.add(where, { status: 1 });
    }

    return await app.models.OrderProduct.count(where);
  };
  Order.remoteMethod('detailProductCount', {
    description: '주문 상품 카운트',
    notes: '관리자 토큰이 아니면 status: 1 설정',
    accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
    returns: { root: true, type: Number },
    http: { path: '/detailProductCount/:id', verb: 'get' },
  });

  /**
   * 주문한 상품들을 다시 장바구니에 추가
   * @param ids
   * @param options
   */
  Order.addToCart = async function(ids, options) {
    const token = ummaUtil.token.getAccessToken(options);
    let where = { id: { inq: ids } };
    where = ummaUtil.where.addOwnerByToken(token, where);
    const findNewCartItems = await app.models.OrderProduct.find({ where: where });
    if (findNewCartItems.length === 0) throw new ummaError.customMessage('Items do not exist!');

    try {
      await app.dataSources.ummaDs.transaction(async model => {
        const { ProductCart } = model;
        // 주문서 상품 재등록
        const cartProducts = findNewCartItems.map(p => {
          return {
            roleId: token.roleId,
            userId: token.userId,
            prId: p.prId,
            poId: p.poId,
            poName: p.poName,
            catCd1depth: p.catCd1depth,
            catCd2depth: p.catCd2depth,
            catCd3depth: p.catCd3depth,
            sku: p.sku,
            barcode: p.barcode,
            discountId: p.discountId,
            // generated column 으로 처리
            // totalPrice: p.totalPrice,
            supplyPrice: p.supplyPrice,
            status: 1,
            quantity: p.quantity,
            created: new Date(),
          };
        });
        // 장바구니 비우기
        // TODO: 정책 재수립 필요. 사용자에게 메세지를 보여주어야 할듯.
        await ProductCart.destroyAll({ roleId: token.roleId, userId: token.userId });
        // bulk insert
        await ProductCart.create(cartProducts);
      });
    } catch (err) {
      logger.error(err);
      throw err;
    }

    return true;
  };
  Order.remoteMethod('addToCart', {
    description: '주문한 상품들을 다시 장바구니에 추가',
    accepts: ummaUtil.remoteMethod.accepts.idsArrayAndOptions,
    returns: { root: true, type: Boolean },
    http: { path: '/addToCart', verb: 'post' },
  });

  /**
   * CI (commercial invoice) 리스트
   * @param filter
   * @param options
   */
  Order.invoiceList = async function(filter, options) {
    const token = ummaUtil.token.getAccessToken(options);
    filter = ummaUtil.filter.validate.limit(filter);
    filter = ummaUtil.filter.where.addOwnerByTokenWithoutAdmin(token, filter);

    // 관리자가 아닌 경우
    if (!token.isAdmin) {
      filter = ummaUtil.filter.where.add(filter, { status: 5 });
    }

    return await Order.find(filter);
  };
  Order.remoteMethod('invoiceList', {
    description: '로그인한 유저의 주문 리스트',
    notes: '관리자 토큰이 아니면 status: 5 설정',
    accepts: ummaUtil.remoteMethod.accepts.filterAndOptions,
    returns: { root: true, type: ['Order'] },
    http: { path: '/invoiceList', verb: 'get' },
  });

  /**
   * 인보이스 카운트
   * @param where
   * @param options
   */
  Order.countInvoice = async function(where, options) {
    const token = ummaUtil.token.getAccessToken(options);

    where = ummaUtil.where.addOwnerByTokenWithoutAdmin(token, where);

    // 관리자가 아닌 경우
    if (!token.isAdmin) {
      where = ummaUtil.where.add(where, { status: 5 });
    }

    return await Order.count(where);
  };
  Order.remoteMethod('countInvoice', {
    description: '인보이스 카운트',
    notes: '관리자 토큰이 아니면 status: 5 설정',
    accepts: ummaUtil.remoteMethod.accepts.whereAndOptions,
    returns: { root: true, type: Number },
    http: { path: '/countInvoice', verb: 'get' },
  });

  /**
   * 인보이스 디테일 보기
   * @param id
   * @param options
   */
  Order.invoiceDetail = async function(id, options) {
    const token = ummaUtil.token.getAccessToken(options);

    const order = await Order.findById(id);
    if (!order) throw new ummaError.customMessage('Order not found.');

    // 관리자가 아닌 경우
    if (!token.isAdmin) {
      // 자신의 주문 아닐 경우
      if (!token.isOwner(order)) throw new ummaError.forbidden();
      // 승인되지않은 인보이스 열람 불가
      if (order.status !== 5) throw new ummaError.customMessage('This invoice does not exist at this time.');
    }

    return order;
  };
  Order.remoteMethod('invoiceDetail', {
    description: '주문 상세 가져오기',
    accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
    returns: { root: true, type: 'Order' },
    http: { path: '/invoiceDetail/:id', verb: 'get' },
  });

  /**
   * 결제 내역 조회
   * @param where
   * @param options
   */
  Order.getPaymentHistory = async function(orderKey, options) {
    const token = ummaUtil.token.getAccessToken(options);

    const order = await Order.find({ where: { orderKey: orderKey } });
    if (!order) throw new ummaError.customMessage('Order not found.');

    // 관리자가 아닌 경우
    if (!token.isAdmin) {
      // 자신의 주문 아닐 경우
      if (!token.isOwner(order)) throw new ummaError.forbidden();
      // 승인되지않은 인보이스 열람 불가
      if (order.status === 0) throw new ummaError.customMessage('This invoice does not exist at this time.');
    }

    let filter = {};
    filter = ummaUtil.filter.where.add(filter, { orderKey: orderKey });
    filter.order = 'created DESC';

    // 관리자가 아닌 경우
    if (!token.isAdmin) {
      filter.fields = {
        id: true,
        paymentMethod: true,
        paymentType: true,
        paymentPartialed: true,
        paymentAmount: true,
        proformaKey: true,
        orderKey: true,
        created: true,
      };
    }

    return await app.models.PaymentHistory.find(filter);
  };
  Order.remoteMethod('getPaymentHistory', {
    description: '결제 내역 조회',
    accepts: [ummaUtil.remoteMethod.accepts.orderKey, ummaUtil.remoteMethod.accepts.options],
    returns: { root: true, type: ['PaymentHistory'] },
    http: { path: '/getPaymentHistory/:orderKey', verb: 'get' },
  });

  /**
   * 인보이스 pdf 다중으로 생성
   * @param docType (order/invoice)
   * @param ids
   * @param options
   */
  Order.getPdfInfos = async function(docType, ids, options) {
    // const token = ummaUtil.token.getAccessToken(options);

    const docTypes = { ORDER: 'order', INVOICE: 'invoice' };

    if (Object.values(docTypes).indexOf(docType) < 0) throw new ummaError.invalidParam('docType');

    // isDocType.ORDER = true | false;
    // isDocType.INVOICE = true | false;
    const isDocType = {};
    Object.keys(docTypes).map(function(key) {
      isDocType[key] = docType === docTypes[key];
    });

    const where = { id: { inq: ids } };
    const orders = await Order.find({
      where: where,
      include: ['user', 'product'],
      fields: {
        id: true,
        invoiceNumber: isDocType.INVOICE,
        statusUpdated: isDocType.INVOICE,
        orderNumber: isDocType.ORDER,
        created: isDocType.ORDER,
        userId: true,
        operator: true,
        paymentMethod: true,
        totalPrice: true,
        totalQuantity: true,
        subtotalPrice: true,
        shippingPrice: true,
        creditAmountUsed: true,
        checkoutPrice: true,
        incoterms: true,
        shippingCtId: true,
        shippingCity: true,
      },
    });

    const data = [];
    orders.forEach(function(order) {
      const o = order.toJSON(); // include 데이터가 들어있으면 toJSON()으로 json 객체로 변환해서 사용해야한다.
      if (isDocType.ORDER) {
        o.docNumber = o.orderNumber;
        o.docDate = o.created;
      } else if (isDocType.INVOICE) {
        o.docNumber = o.invoiceNumber;
        o.docDate = o.statusUpdated;
      } else {
        o.docNumber = null;
        o.docDate = null;
      }

      data.push({
        id: o.id,
        docNumber: o.docNumber,
        docDate: o.docDate,
        userId: o.userId,
        operator: o.operator,
        totalPrice: o.totalPrice,
        totalQuantity: o.totalQuantity,
        paymentInfo: {
          currency: currencyCode,
          paymentMethod: o.paymentMethod,
          totalPrice: o.totalPrice,
          subtotalPrice: o.subtotalPrice,
          shippingPrice: o.shippingPrice,
          creditAmountUsed: o.creditAmountUsed,
          checkoutPrice: o.checkoutPrice,
        },
        shipmentInfo: {
          incoterms: o.incoterms,
          shippingCtId: o.shippingCtId,
          shippingCity: o.shippingCity,
        },
        user: o.user,
        product: o.product,
      });
    });

    return data;
  };
  Order.remoteMethod('getPdfInfos', {
    description: '다중 pdf 생성 위한 라우트',
    accepts: [
      { arg: 'docType', type: 'string', require: true, http: { source: 'path' }, description: '문서 종류' },
      ummaUtil.remoteMethod.accepts.idsArray,
      ummaUtil.remoteMethod.accepts.options,
    ],
    returns: { root: true, type: Object },
    http: { path: '/getPdfInfos/:docType', verb: 'post' },
  });

  /**
   * operator가 리마크 달기
   * @param param
   * @param options
   */
  Order.submitOperatorRemark = async function(param, options) {
    const token = ummaUtil.token.getAccessToken(options);
    const findOrder = await Order.findOne({ where: { orderKey: param.orderKey } });
    await app.models.OrderRemarkLog.create({
      orderKey: param.orderKey,
      adminRoleId: token.roleId,
      adminUserId: token.userId,
      orderId: findOrder.id,
      actionName: 'submitOperatorRemark',
      remark: param.remark,
      description: param.description,
    });
    return true;
  };
  Order.remoteMethod('submitOperatorRemark', {
    description: 'operator가 리마크 달기  ',
    notes: '{ "orderKey": "orderKey", "remark": "remark"}',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: Boolean },
    http: { path: '/submitOperatorRemark', verb: 'post' },
  });

  /**
   * operator 최근 리마크
   * @param param
   * @param options
   */
  Order.getLatestOperRemark = async function(param, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    return await app.models.OrderRemarkLog.findOne({
      where: { actionName: 'submitOperatorRemark', orderKey: param.orderKey },
      fields: { id: true, created: true, remark: true, orderKey: true },
      order: 'created DESC',
    });
  };
  Order.remoteMethod('getLatestOperRemark', {
    description: '물류 팀 최근 리마크',
    notes: '{ "orderKey": "orderKey" }',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: 'OrderRemarkLog' },
    http: { path: '/getLatestOperRemark', verb: 'post' },
  });

  /**
   * 주문 트래킹 정보수정
   * @param param
   * @param options
   */
  Order.updateTrackingInfo = async function(param, options) {
    const token = ummaUtil.token.getAccessToken(options);
    const orderKey = param.orderKey;
    const orderInfo = param.orderInfo;
    const findOrder = await Order.findOne({ where: { orderKey: orderKey } });
    const date = new Date();
    // 주문 왼료된 수정은 lock
    if (findOrder.status === 5) throw new ummaError.customMessage('You cannot edit this order any further.');
    // 정리해야할 필요. 마진을 계산을 할 것인지 마는지
    orderInfo.updated = date;

    await Order.updateAll({ orderKey: orderKey }, orderInfo);

    await app.models.OrderRemarkLog.create({
      actionName: 'updateTrackingInfo',
      orderKey: orderKey,
      orderId: findOrder.id,
      // token error 수정 후
      adminRoleId: token.roleId,
      adminUserId: token.userId,
      actualShippingPrice: param.actualShippingPrice,
      remark: param.remark,
      description: param.description,
      created: new Date(),
    });

    return await Order.findOne({ where: { orderKey: orderKey }, include: ['user'] });
  };
  Order.remoteMethod('updateTrackingInfo', {
    description: '주문 트래킹 정보수정 ',
    notes: '{ "orderKey": "orderKey", "orderInfo": { "trackingNumber": "test", "trackingUrl": String, "actualShippingPrice": 123 } }',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: 'Order' },
    http: { path: '/updateTrackingInfo', verb: 'post' },
  });

  /**
   * 물류 팀 최근 리마크
   * @param param
   * @param options
   */
  Order.getLatestLogRemark = async function(param, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    return await app.models.OrderRemarkLog.findOne({
      where: { actionName: 'updateTrackingInfo', orderKey: param.orderKey },
      fields: { id: true, created: true, remark: true, orderKey: true },
      order: 'created DESC',
    });
  };
  Order.remoteMethod('getLatestLogRemark', {
    description: '물류 팀 최근 리마크',
    notes: '{ "orderKey": "orderKey" }',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: 'OrderRemarkLog' },
    http: { path: '/getLatestLogRemark', verb: 'post' },
  });

  /**
   * 재무 관리자가 입금일, 입금자명, 입금된 금액 업데이트
   * @param param
   * @param options
   */
  Order.updateTtInfo = async function(param, options) {
    const token = ummaUtil.token.getAccessToken(options);
    const orderKey = param.orderKey;
    const findOrder = await Order.findOne({ where: { orderKey: param.orderKey } });
    // 주문 완료된 수정은 lock
    if (findOrder.paymentMethod === app.umma.commonCode.PAYMENT_METHOD.PAYPAL) throw new ummaError.customMessage('The customer paid with Paypal.');
    if (findOrder.status === 5) throw new ummaError.customMessage('You cannot edit this order any further.');

    await Order.updateAll({ orderKey: orderKey }, param);

    await app.models.OrderRemarkLog.create({
      actionName: 'updateTtInfo',
      orderKey: param.orderKey,
      orderId: findOrder.id,
      adminRoleId: token.roleId,
      adminUserId: token.userId,
      ttDepositor: param.ttDepositor,
      paymentConfirmPrice: param.paymentConfirmPrice,
      paymentConfirmDate: param.paymentConfirmDate,
      remark: param.remark,
      description: param.description,
      created: new Date(),
    });

    return await Order.findOne({ where: { orderKey: orderKey } });
  };
  Order.remoteMethod('updateTtInfo', {
    description: '주문 입금 정보 수정',
    notes:
      '{ "orderKey": "orderKey", "orderInfo": { "ttDepositor": "test", "paymentConfirmPrice":" 1232", "paymentConfirmDate": date, "remark": "testingfdgfdg", "description": "test" } }',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: 'Order' },
    http: { path: '/updateTtInfo', verb: 'post' },
  });
  Order.afterRemote('updateTtInfo', async function(ctx, data) {
    data = data.toJSON();
    await ummaMail.order.tTNotify.sendMail(app, data);
  });
  /**
   * 재무 팀 최근 리마크
   * @param param
   * @param options
   */
  Order.getLatestFinRemark = async function(param, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    return await app.models.OrderRemarkLog.findOne({
      where: { actionName: 'updateTtInfo', orderKey: param.orderKey },
      fields: { id: true, created: true, remark: true, orderKey: true },
      order: 'created DESC',
    });
  };
  Order.remoteMethod('getLatestFinRemark', {
    description: '재무 팀 최근 리마크',
    notes: '{ "orderKey": "orderKey" }',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: 'String' },
    http: { path: '/getLatestFinRemark', verb: 'post' },
  });

  /**
   * 벤더 관리자가 총 상품 구입가 입력
   * @param param
   * @param options
   */
  Order.updateCostPrice = async function(param, options) {
    const token = ummaUtil.token.getAccessToken(options);
    const orderKey = param.orderKey;
    const findOrder = await Order.findOne({ where: { orderKey: orderKey } });
    if (findOrder.status === 5) throw new ummaError.customMessage('You cannot edit this order any further.');
    param.totalMarginPrice = findOrder.subtotalPrice - param.totalCostPrice;

    await Order.updateAll({ orderKey: orderKey }, param);

    await app.models.OrderRemarkLog.create({
      actionName: 'updateCostPrice',
      orderId: findOrder.id,
      orderKey: param.orderKey,
      adminRoleId: token.roleId,
      adminUserId: token.userId,
      // 총구입가 입력
      totalCostPrice: param.totalCostPrice,
      remark: param.remark,
      description: param.description,
      created: new Date(),
    });

    return await Order.findOne({ where: { orderKey: orderKey } });
  };
  Order.remoteMethod('updateCostPrice', {
    description: '총 상품 구입가 입력',
    notes: '{ "orderKey": "orderKey", "orderInfo": { "totalCostPrice": 12323, "remark": "testingfdgfdg", "description": "test" } }',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: 'Order' },
    http: { path: '/updateCostPrice', verb: 'post' },
  });
  Order.afterRemote('updateCostPrice', async function(ctx, data) {
    data = data.toJSON();
    await ummaMail.order.costPriceNotify.sendMail(app, data);
  });

  /**
   * 벤더 팀 최근 리마크
   * @param param
   * @param options
   */
  Order.getLatestVenRemark = async function(param, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    return await app.models.OrderRemarkLog.findOne({
      where: { actionName: 'updateCostPrice', orderKey: param.orderKey },
      fields: { id: true, created: true, remark: true, orderKey: true },
      order: 'created DESC',
    });
  };
  Order.remoteMethod('getLatestVenRemark', {
    description: '벤더 팀 최근 리마크',
    notes: '{ "orderKey": "orderKey" }',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: 'String' },
    http: { path: '/getLatestVenRemark', verb: 'post' },
  });

  /**
   * 물류팀 배송정보 엑셀 다운로드
   * @param res
   * @param param
   * @param options
   */
  Order.downloadLogisticsExcel = async function(res, param, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    const findOrders = await Order.find({
      where: { orderKey: { inq: param } },
      include: ['user', 'product', { relation: 'shippingCountry', scope: { fields: { name: true } } }],
    });

    // 엑셀 템플릿에서 시트 가져오기
    const wb = ummaExcel.createWorkBook();
    await wb.xlsx.readFile(ummaExcel.getTemplatePath('order-logistics.xlsx'));
    const ws = wb.getWorksheet('Pantos Upload');
    if (!ws) throw new ummaError.customMessage('Cannot find "Pantos Upload" sheet.');

    /* 엑셀 템플릿 헤더 */
    // A:구분
    // B:*Order #
    // C:*Box unit
    // D:Barcode
    // E:*ShipTo  Name
    // F:*ShipTo First Name
    // G:*ShipTo Last Name
    // H:Buyer Address 1(상세주소)
    // I:Buyer Address 2(상세주소)
    // J:City
    // K:State (반드시 약호로 기입)
    // L:*ShipTo Postal Code
    // M:*ShipTo Country (도착지국가)
    // N:*ShipTo Phone (10자리 필수)
    // O:Email
    // P:*POL(출발공항)
    // Q:*POD(도착공항)
    // R:*item category
    // S:*Item Name
    // T:*Origin country
    // U:*Unit Price
    // V:*Currency Code
    // W:*Quantity
    // X:*HS Code
    // Y:Goods Link URL
    // Z:Width (Cm)
    // AA:Length (Cm)
    // AB:High (Cm)
    // AC:*Weight(kg)
    // AD:measure(1:Kg, 2:Lbs)
    // AE:Memo
    // AF:옵션명
    // AG:Freight Term
    // AH:Product code
    // AI:Carrier

    // 엑셀 데이터 추가
    let idx = 0;
    findOrders.forEach(function(order) {
      order = order.toJSON(); // include 데이터가 들어있으면 toJSON()으로 json 객체로 변환해서 사용해야한다.
      order.product.forEach(function(product) {
        const rowValues = [];
        rowValues[1] = ++idx;
        rowValues[2] = order.orderNumber;
        rowValues[5] = order.recipientName; // shipTo Name
        rowValues[6] = order.recipientName; // shipTo First Name
        rowValues[7] = order.recipientName; // shipTo Last Name
        rowValues[8] = order.shippingAddress1;
        rowValues[9] = order.shippingAddress2;
        rowValues[10] = order.shippingCity;
        // rowValues[11] = ''; // TODO: state
        rowValues[12] = order.shippingZipcode;
        rowValues[13] = order.shippingCtId;
        rowValues[14] = order.shippingPhone.indexOf('*') > -1 ? order.shippingPhone.split('*')[1] : order.shippingPhone;
        rowValues[15] = order.user ? order.user.email : '';
        rowValues[16] = 'KRICN'; // POL
        // rowValues[17] = ''; // POD
        rowValues[18] = 'COSMETICS'; // item category
        rowValues[19] = product.prName + (product.poName ? ` (${product.poName})` : ''); // item name
        rowValues[20] = 'KR'; // origin country
        rowValues[21] = product.supplyPrice; // unit price
        rowValues[22] = 'USD'; // currency code
        rowValues[23] = product.quantity; // quantity
        rowValues[24] = product.catCd1depth === '002' ? '3304.99.2000' : '3304.99.1000'; // HS code (카테고리 002로 시작하는 메이크업 제품은 3304.99.2000 카테고리 나머지로 시작하는 제품들은 3304.99.1000)
        rowValues[35] = order.shipmentServiceId === 0 ? order.incoterms : order.shippingCompany ? order.shippingCompany.serviceName : ''; // carrier (EMS or PX or EXW 표기)
        ws.addRow(rowValues);
      });
    });

    // 엑셀 파일 다운로드
    await ummaExcel.send(res, wb, 'umma-order-logistics');
  };
  Order.remoteMethod('downloadLogisticsExcel', {
    description: '물류팀 배송정보 엑셀 다운로드',
    notes: 'Array [ "orderKey", "orderKey2" ]',
    accepts: [ummaUtil.remoteMethod.accepts.res, ummaUtil.remoteMethod.accepts.paramArray, ummaUtil.remoteMethod.accepts.options],
    returns: { arg: 'body', type: 'file', root: true },
    http: { path: '/downloadLogisticsExcel', verb: 'post' },
  });

  /**
   * 주문 상세 엑셀 다운로드
   * @param res
   * @param id
   * @param options
   */
  Order.downloadDetailExcel = async function(res, id, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    let order = await Order.findById(id, {
      include: ['user', 'product', 'shippingCompany', { relation: 'shippingCountry', scope: { fields: { name: true } } }],
    });
    if (!order) throw new ummaError.customMessage('Order not found.');
    order = order.toJSON(); // include 데이터가 들어있으면 toJSON()으로 json 객체로 변환해서 사용해야한다.

    // 엑셀 템플릿에서 시트 가져오기
    const wb = ummaExcel.createWorkBook();
    await wb.xlsx.readFile(ummaExcel.getTemplatePath('order-management-detail.xlsx'));
    const ws = wb.getWorksheet('Order Management');
    if (!ws) throw new ummaError.customMessage('Cannot find "Order Management" sheet.');

    // 보더 설정
    const borderMedium = { style: 'medium', color: { argb: 'FF000000' } };
    const borderThin = { style: 'thin', color: { argb: 'FF000000' } };

    // 엑셀에 데이터 추가
    let row;
    const infoColName = 'D';
    const colValues = [];
    colValues[3] = order.orderNumber; // Order No.
    colValues[4] = ummaUtil.date.stringFormatDateTime(order.created, '/', ' ', ':', true); // Order Date
    colValues[5] = order.incoterms + (order.shippingCompany ? ' / ' + order.shippingCompany.serviceName : ''); // Incoterms / Courier
    colValues[6] = order.shippingCountry ? order.shippingCountry.name : order.shippingCtId; // 수취 국가
    let shippingAddress = order.shippingAddress2 ? order.shippingAddress2 + ', ' : '';
    shippingAddress += order.shippingAddress1;
    shippingAddress += order.shippingCity ? ', ' + order.shippingCity : '';
    colValues[7] = shippingAddress; // 수취 주소
    colValues[8] = ummaUtil.string.convertPhoneNumber(order.shippingPhone); // 수취인 전화번호
    colValues[9] = order.user ? order.user.companyName : ''; // Company Name
    colValues[10] = order.recipientName; // Name of Request
    ws.getColumn(`${infoColName}`).values = colValues;

    // 보더 설정
    ws.getCell(`${infoColName}3`).border = { top: borderMedium, left: borderThin, bottom: borderThin, right: borderMedium };
    ws.getCell(`${infoColName}4`).border = { top: borderThin, left: borderThin, bottom: borderThin, right: borderMedium };
    ws.getCell(`${infoColName}5`).border = { top: borderThin, left: borderThin, bottom: borderThin, right: borderMedium };
    ws.getCell(`${infoColName}6`).border = { top: borderThin, left: borderThin, bottom: borderThin, right: borderMedium };
    ws.getCell(`${infoColName}7`).border = { top: borderThin, left: borderThin, bottom: borderThin, right: borderMedium };
    ws.getCell(`${infoColName}8`).border = { top: borderThin, left: borderThin, bottom: borderThin, right: borderMedium };
    ws.getCell(`${infoColName}9`).border = { top: borderThin, left: borderThin, bottom: borderThin, right: borderMedium };
    ws.getCell(`${infoColName}10`).border = { top: borderThin, left: borderThin, bottom: borderThin, right: borderMedium };
    ws.getCell(`${infoColName}11`).border = { top: borderThin, left: borderThin, bottom: borderMedium, right: borderMedium };

    // 엑셀에 상품 데이터 추가
    const lastColNum = 17;
    const startProductRowNum = 14;
    let currentRowNum = 0;
    order.product.forEach(function(product, i) {
      currentRowNum = startProductRowNum + i;
      row = ws.getRow(currentRowNum);
      const rowValues = [];
      rowValues[1] = ++i;
      rowValues[2] = product.sku;
      rowValues[3] = product.brName;
      rowValues[4] = product.prName;
      rowValues[5] = product.poName;
      rowValues[6] = product.retailPrice;
      rowValues[7] = product.supplyPrice;
      rowValues[8] = product.quantity;
      rowValues[9] = product.totalPrice;
      // rowValues[10] = '환율적용상품가(KRW)'; // 관리자 입력
      // rowValues[11] = '실제상품구매가격(KRW)'; // 관리자 입력
      // rowValues[12] = '상품마진(KRW)'; // 관리자 입력
      // rowValues[13] = ''; // Shipping Fee(USD)
      // rowValues[14] = '환율적용배송비(KRW)'; // 관리자 입력
      // rowValues[15] = 'ShippingCost(KRW)'; // 관리자 입력
      // rowValues[16] = '배송비마진(KRW)'; // 관리자 입력
      // rowValues[17] = '총마진(KRW)'; // 관리자 입력
      row.values = rowValues;

      row.getCell(6).numFmt = ummaExcel.priceFormatUSD;
      row.getCell(7).numFmt = ummaExcel.priceFormatUSD;
      row.getCell(8).numFmt = ummaExcel.numberFormat;
      row.getCell(9).numFmt = ummaExcel.priceFormatUSD;
      row.getCell(10).numFmt = ummaExcel.priceFormatKRW;
      row.getCell(11).numFmt = ummaExcel.priceFormatKRW;
      row.getCell(12).numFmt = ummaExcel.priceFormatKRW;
      row.getCell(13).numFmt = ummaExcel.priceFormatUSD;
      row.getCell(14).numFmt = ummaExcel.priceFormatKRW;
      row.getCell(15).numFmt = ummaExcel.priceFormatKRW;
      row.getCell(16).numFmt = ummaExcel.priceFormatKRW;
      row.getCell(17).numFmt = ummaExcel.priceFormatKRW;

      // 보더 설정
      for (let i = 1; i <= lastColNum; i++) {
        row.getCell(i).border = { top: borderThin, left: borderThin, bottom: borderThin, right: borderThin };
        if (i === lastColNum) {
          row.getCell(i).border.right = borderMedium;
        }
      }

      row.commit();
    });

    // 마지막 상품 행
    const lastProductRowNum = currentRowNum;

    // 마지막 상품 행 보더 설정
    row = ws.getRow(lastProductRowNum);
    for (let i = 1; i <= lastColNum; i++) {
      row.getCell(i).border.bottom = borderMedium;
    }
    row.commit();

    // 한줄 공백
    ++currentRowNum;

    const footerCellFontStyle = { size: 14, bold: true };
    let currentCellNum = 1;

    // Total Amount
    row = ws.getRow(++currentRowNum);
    currentCellNum = 4;
    row.getCell(currentCellNum).value = 'Total Amount';
    row.getCell(currentCellNum).font = footerCellFontStyle;
    currentCellNum = 8;
    row.getCell(currentCellNum).value = order.totalQuantity; // Quantity
    row.getCell(currentCellNum).numFmt = ummaExcel.numberFormat;
    row.getCell(currentCellNum).font = footerCellFontStyle;
    ++currentCellNum;
    row.getCell(currentCellNum).value = order.subtotalPrice; // Amount(USD)
    row.getCell(currentCellNum).numFmt = ummaExcel.priceFormatUSD;
    row.getCell(currentCellNum).font = footerCellFontStyle;
    ++currentCellNum;
    row.getCell(currentCellNum).value = { formula: `SUM(J${startProductRowNum}:J${lastProductRowNum})` }; // 환율적용 상품가(KRW)
    row.getCell(currentCellNum).numFmt = ummaExcel.priceFormatKRW;
    row.getCell(currentCellNum).font = footerCellFontStyle;
    ++currentCellNum;
    row.getCell(currentCellNum).value = { formula: `SUM(K${startProductRowNum}:K${lastProductRowNum})` }; // 실제상품 구매가격(KRW)
    row.getCell(currentCellNum).numFmt = ummaExcel.priceFormatKRW;
    row.getCell(currentCellNum).font = footerCellFontStyle;
    ++currentCellNum;
    row.getCell(currentCellNum).value = { formula: `SUM(L${startProductRowNum}:L${lastProductRowNum})` }; // 상품 마진(KRW)
    row.getCell(currentCellNum).numFmt = ummaExcel.priceFormatKRW;
    row.getCell(currentCellNum).font = footerCellFontStyle;
    row.getCell(currentCellNum).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFA500' } };
    ++currentCellNum;
    row.getCell(currentCellNum).value = order.shippingPrice; // Shipping Fee(USD)
    row.getCell(currentCellNum).numFmt = ummaExcel.priceFormatUSD;
    row.getCell(currentCellNum).font = footerCellFontStyle;
    ++currentCellNum;
    row.getCell(currentCellNum).value = { formula: `SUM(N${startProductRowNum}:N${lastProductRowNum})` }; // 환율적용 배송비(KRW)
    row.getCell(currentCellNum).numFmt = ummaExcel.priceFormatKRW;
    row.getCell(currentCellNum).font = footerCellFontStyle;
    ++currentCellNum;
    row.getCell(currentCellNum).value = { formula: `SUM(O${startProductRowNum}:O${lastProductRowNum})` }; // Shipping Cost(KRW)
    row.getCell(currentCellNum).numFmt = ummaExcel.priceFormatKRW;
    row.getCell(currentCellNum).font = footerCellFontStyle;
    ++currentCellNum;
    row.getCell(currentCellNum).value = { formula: `SUM(P${startProductRowNum}:P${lastProductRowNum})` }; // 배송비 마진(KRW)
    row.getCell(currentCellNum).numFmt = ummaExcel.priceFormatKRW;
    row.getCell(currentCellNum).font = footerCellFontStyle;
    row.getCell(currentCellNum).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFA500' } };
    ++currentCellNum;
    row.getCell(currentCellNum).value = { formula: `SUM(Q${startProductRowNum}:Q${lastProductRowNum})` }; // 총 마진(KRW)
    row.getCell(currentCellNum).numFmt = ummaExcel.priceFormatKRW;
    row.getCell(currentCellNum).font = footerCellFontStyle;
    row.getCell(currentCellNum).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00BFFF' } };
    ++currentCellNum;
    row.commit();

    // 엑셀 파일 다운로드
    await ummaExcel.send(res, wb, `umma-order-management-detail_${order.orderNumber}`);
  };
  Order.remoteMethod('downloadDetailExcel', {
    description: '주문 상세 엑셀 다운로드',
    accepts: [ummaUtil.remoteMethod.accepts.res, ummaUtil.remoteMethod.accepts.id, ummaUtil.remoteMethod.accepts.options],
    returns: { arg: 'body', type: 'file', root: true },
    http: { path: '/downloadDetailExcel/:id', verb: 'get' },
  });
};
