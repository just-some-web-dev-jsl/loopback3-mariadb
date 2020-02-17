'use strict';

const logger = require('../../lib/logger')(module);
const ummaUtil = require('../../lib/umma-util');
const ummaError = require('../../lib/umma-error');
const ummaMail = require('../../lib/umma-mail');
const ummaExcel = require('../../lib/umma-excel');
const { disableAllMethods } = require('../../lib/loopback-helpers');

// 환경설정
const NODE_ENV = process.env.NODE_ENV;

let app = {
  umma: require('../../reference'), // 개발 참조용 레퍼런스 파일
};

module.exports = function(Proforma) {
  const Model = Proforma;
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
     * 가견적서 삭제
     * acl: Admin,Buyer
     * @param id
     * @param options
     */
    Model.deleteById = async function(id, options) {
      return await Model.deleteByIds([id], options);
    };
    Model.remoteMethod('deleteById', {
      description: '가견적서 삭제',
      accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
      returns: { root: true, type: { count: Number } },
      http: { path: '/:id', verb: 'delete' },
    });

    /**
     * 가견적서 다중 삭제
     * acl: Admin,Buyer
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
      description: '가견적서 다중 삭제',
      accepts: ummaUtil.remoteMethod.accepts.idsArrayAndOptions,
      returns: { root: true, type: { count: Number } },
      http: { path: '/deleteByIds', verb: 'post' },
    });
  });
  Model.on('dataSourceAttached', function() {});

  /**
   * 물류팀에서 가견적서 승인
   * @param id
   * @param options
   */
  Proforma.confirmById = async function(id, options) {
    const d = await Proforma.confirmByIds([id], options);
    return d[0] || {};
  };

  Proforma.remoteMethod('confirmById', {
    description: '물류팀에서 가견적서 승인',
    accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
    returns: { root: true, type: 'Proforma' },
    http: { path: '/confirmById/:id', verb: 'post' },
  });

  /**
   * 물류팀에서 가견적서 다중 승인
   * @param ids
   * @param options
   */
  Proforma.confirmByIds = async function(ids, options) {
    const token = ummaUtil.token.getAccessToken(options);
    const status = 1;
    const where = { id: { inq: ids }, status: { neq: status } };
    const date = new Date();

    const findAdmin = await app.models.Admin.findById(token.userId, { fields: { id: true, firstName: true, lastName: true } });

    await Proforma.updateAll(where, {
      status: status,
      statusUpdated: date,
      operatorUserId: findAdmin.id,
      operator: findAdmin.firstName + ' ' + findAdmin.lastName,
    });

    where.status = status;
    where.statusUpdated = ummaUtil.date.convertMysqlDateTime(date);
    return await Proforma.find({ where: where, include: 'user' });
  };

  Proforma.remoteMethod('confirmByIds', {
    description: '물류팀에서 가견적서 다중 승인',
    accepts: ummaUtil.remoteMethod.accepts.idsArrayAndOptions,
    returns: { root: true, type: ['Proforma'] },
    http: { path: '/confirmByIds', verb: 'post' },
  });

  // 승인 메일 발송
  Proforma.afterRemote('confirmByIds', async function(ctx, data) {
    if (NODE_ENV !== 'development') {
      if (!Array.isArray(data)) data = [data];
      // 메일 발송
      const p = data.map(function(d) {
        d = d.toJSON(); // include 데이터가 들어있으면 toJSON()으로 json 객체로 변환해서 사용해야한다.
        return ummaMail.proforma.confirm.sendMail(app, d);
      });
      await Promise.all(p);
    }
  });

  /**
   * 물류팀에서 가견적서 최종승인
   * @param id
   * @param options
   */
  Proforma.approveById = async function(id, options) {
    return await Proforma.approveByIds([id], options);
  };
  Proforma.remoteMethod('approveById', {
    description: '물류팀에서 가견적서 최종승인',
    accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
    returns: { root: true, type: { count: Number } },
    http: { path: '/approveById/:id', verb: 'post' },
  });

  /**
   * 물류팀에서 가견적서 다중 최종승인
   * @param ids
   * @param options
   */
  Proforma.approveByIds = async function(ids, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    const approved = 1;
    const where = { id: { inq: ids }, approved: { neq: approved } };
    const date = new Date();

    return await Proforma.updateAll(where, {
      approved: approved,
      approvedDate: date,
    });
  };
  Proforma.remoteMethod('approveByIds', {
    description: '물류팀에서 가견적서 다중 최종승인',
    accepts: ummaUtil.remoteMethod.accepts.idsArrayAndOptions,
    returns: { root: true, type: { count: Number } },
    http: { path: '/approveByIds', verb: 'post' },
  });

  /**
   * 가견적서 카운트
   * @param where
   * @param options
   */
  Proforma.countProforma = async function(where, options) {
    const token = ummaUtil.token.getAccessToken(options);

    where = ummaUtil.where.addOwnerByTokenWithoutAdmin(token, where);

    return await Proforma.count(where);
  };
  Proforma.remoteMethod('countProforma', {
    description: '가견적서 카운트',
    accepts: ummaUtil.remoteMethod.accepts.whereAndOptions,
    returns: { root: true, type: Number },
    http: { path: '/countProforma', verb: 'get' },
  });

  /**
   * 가견적서 리스트
   * @param where
   * @param options
   */
  Proforma.list = async function(filter, options) {
    const token = ummaUtil.token.getAccessToken(options);

    filter = ummaUtil.filter.validate.limit(filter);
    filter = ummaUtil.filter.where.addOwnerByTokenWithoutAdmin(token, filter);
    filter = ummaUtil.filter.include.add(filter, 'shippingCompany');

    return await Proforma.find(filter);
  };
  Proforma.remoteMethod('list', {
    description: '가견적서 리스트',
    accepts: ummaUtil.remoteMethod.accepts.filterAndOptions,
    returns: { root: true, type: ['Proforma'] },
    http: { path: '/list', verb: 'get' },
  });

  /**
   * 가견적서 허용된 리스트 조회
   * @param where
   * @param options
   */
  Proforma.approvedList = async function(filter, options) {
    filter = ummaUtil.filter.where.add(filter, { approved: 1 });
    return await Proforma.list(filter, options);
  };

  Proforma.remoteMethod('approvedList', {
    description: '가견적서 허용된 리스트 조회',
    accepts: ummaUtil.remoteMethod.accepts.filterAndOptions,
    returns: { root: true, type: ['Proforma'] },
    http: { path: '/approvedList', verb: 'get' },
  });

  /**
   * 가견적키 생성
   */
  Proforma.getNewProformaKey = async function() {
    const proforma = await Proforma.findOne(
      { where: { proformaKey: { like: `${ummaUtil.date.stringFormatDate()}%` } }, order: 'created DESC' },
      { fields: { proformaKey: true } }
    );
    const newProformaKey = ummaUtil.string.getNewProformaKey(proforma ? proforma.proformaKey : null);
    if (!ummaUtil.validate.proformaKey(newProformaKey)) throw new ummaError.customMessage('Invalid new proforma key');
    return newProformaKey;
  };

  /**
   * 가견적서 추가
   * @param param
   * @param options
   */
  Proforma.add = async function(param, options) {
    const token = ummaUtil.token.getAccessToken(options);
    if (NODE_ENV === 'production' && token.userId === 1)
      throw new ummaError.customMessage('You cannot request quotes with this account. Please use our test server.');
    // 파라미터내 문자열 트림
    param = ummaUtil.parameter.trim(param, ['recipientName', 'shippingPhone', 'shippingCity', 'shippingAddress1', 'shippingAddress2', 'shippingZipcode']);
    const cartIds = param.cartIds;
    let where = { id: { inq: cartIds } };

    // 관리자가 유저의 가견적서를 생성해주는 경우 roleId, userId 를 파라메터로 처리한다.
    if (token.isAdmin) {
      if (!param.roleId) throw new ummaError.invalidParam('roleId');
      if (!param.userId) throw new ummaError.invalidParam('userId');
      param.adminUserId = token.userId;
    } else {
      param.roleId = token.roleId;
      param.userId = token.userId;
    }

    if (!Array.isArray(cartIds) || cartIds.length === 0) throw new ummaError.invalidParam('cartIds');

    // 카트 상품 조회
    where = ummaUtil.where.add(where, { roleId: param.roleId, userId: param.userId, status: 1 });
    const cartProducts = await app.models.ViewProductCart.find({ where: where });
    if (cartProducts.length === 0) throw new ummaError.customMessage('Cart products not found.');

    // 가견적키 생성
    param.proformaKey = await Proforma.getNewProformaKey();
    param.created = new Date();

    // 데이터베이스 트랜잭션
    // https://loopback.io/doc/en/lb3/Using-database-transactions.html#higher-level-transaction-api
    try {
      await app.dataSources.ummaDs.transaction(async models => {
        const { Proforma, ProformaProduct, ProductCart, Buyer } = models;

        // 바이어 정보
        let findBuyer = await Buyer.findById(param.userId, { include: ['company'] });
        findBuyer = findBuyer.toJSON();
        // console.log(findBuyer.company);
        // 데이터 설정
        param.totalQuantity = 0;
        param.totalPrice = 0;
        cartProducts.forEach(cartProduct => {
          // 총 수량
          param.totalQuantity += cartProduct.quantity;
          // 총 상품금액
          param.totalPrice += cartProduct.productTotalPrice;
        });

        // 1.가견석서 생성
        // TODO: TESTING시에만 status = 1;
        param.status = 0;
        param.adminUserId = 0;
        param.totalWeight = 0;
        param.prType = cartProducts.length;
        param.shipmentServiceId = param.shipmentServiceId || 0;
        const proforma = await Proforma.create(param);

        // 2.가견적번호 생성
        const proformaNumber = `PI-${findBuyer.company.ctId}-000-${proforma.id}`;

        // 3.가견적서 업데이트
        await Proforma.updateAll({ id: proforma.id }, { proformaNumber: proformaNumber });

        // 4.가견적서 상품 등록
        // TODO: 카트에 있던 상품이 품절,단종 등으로 구매불가한 상태일때 처리 로직 필요.
        const products = cartProducts.map(cartProduct => {
          return {
            proformaId: proforma.id,
            proformaKey: proforma.proformaKey,
            userId: param.userId,
            brId: cartProduct.brandId,
            brName: cartProduct.brandName,
            prId: cartProduct.prId,
            prName: cartProduct.productName,
            poId: cartProduct.poId,
            poName: cartProduct.poName,
            catCd1depth: cartProduct.catCd1depth,
            catCd2depth: cartProduct.catCd2depth,
            catCd3depth: cartProduct.catCd3depth,
            images: cartProduct.productImages,
            // optionUsed: cartProduct.optionUsed,
            // optionType: cartProduct.optionType,
            capacity: cartProduct.productCapacity,
            capacityType: cartProduct.productCapacityType,
            sku: cartProduct.productSku,
            barcode: cartProduct.productBarcode,
            // discountId: cartProduct.discountId,
            retailPrice: cartProduct.productRetailPrice,
            totalPrice: cartProduct.productSupplyPrice * cartProduct.quantity,
            supplyPrice: cartProduct.productSupplyPrice,
            supplyRate: cartProduct.productSupplyRate,
            quantity: cartProduct.quantity,
            status: cartProduct.status,
            created: param.created,
          };
        });
        await ProformaProduct.create(products);

        // 5.카트 아이템 삭제 처리
        await ProductCart.destroyAll({ id: { inq: cartIds } });
      });
    } catch (err) {
      logger.error(err);
      throw err;
    }

    return await Proforma.findOne({ where: { proformaKey: param.proformaKey }, include: ['product', 'user'] });
  };
  Proforma.remoteMethod('add', {
    description: '가견적서 추가',
    notes: 'param {Proforma, "cartIds": Array}',
    accepts: ummaUtil.remoteMethod.accepts.paramModelAndOptions('Proforma'),
    returns: { root: true, type: 'Proforma' },
    http: { path: '/add', verb: 'post' },
  });
  Proforma.afterRemote('add', async function(ctx, data) {
    data = data.toJSON(); // include 데이터가 들어있으면 toJSON()으로 json 객체로 변환해서 사용해야한다.
    // 메일 발송
    if (NODE_ENV !== 'development') {
      await ummaMail.proforma.request.sendMail(app, data);
      await ummaMail.proforma.notifyAdmin.sendMail(app, data);
    }
  });

  /**
   * 참조 가견적서 추가 (관리자용)
   * @param param
   * @param options
   */
  Proforma.addReference = async function(param, options) {
    const token = ummaUtil.token.getAccessToken(options);
    // 파라미터내 문자열 트림
    param = ummaUtil.parameter.trim(param, ['recipientName', 'shippingPhone', 'shippingCity', 'shippingAddress1', 'shippingAddress2', 'shippingZipcode']);

    if (!param.refProformaNumber) throw new ummaError.invalidParam('refProformaNumber');

    if (!Array.isArray(param.products) || param.products.length === 0) throw new ummaError.invalidParam('products');

    // 상품 조회
    const whereOR = param.products.map(p => {
      return { id: p.prId, poId: p.poId || 0 };
    });
    const findProducts = await app.models.ViewProductDetailOption.find({ where: { or: whereOR } });
    if (findProducts.length === 0) throw new ummaError.customMessage('products not found.');

    // 파라메터 상품 수량 가져오기
    function getParamProductQuantity(prId, poId) {
      const p = param.products.find(o => o.prId === prId && o.poId === poId);
      return p && p.quantity;
    }

    // 데이터 설정
    param.totalQuantity = 0;
    param.subtotalPrice = 0;
    findProducts.forEach(p => {
      // 수량
      const quantity = getParamProductQuantity(p.id, p.poId);
      // 총 수량
      param.totalQuantity += quantity;
      // 총 상품금액
      param.subtotalPrice += ummaUtil.number.formatMoney(p.supplyPrice * quantity);
    });

    // 가견적서 상품 총액이 500 달러 미만일 경우
    if (param.subtotalPrice < 500) throw new ummaError.customMessage('Subtotal not over $500.00');

    // 참조 가견적서 번호가 존재하는지 확인 (관리자 전용)
    const refProforma = await Proforma.findOne({ where: { proformaNumber: param.refProformaNumber } });

    if (!refProforma) throw new ummaError.customMessage('Reference proforma not found.');

    param.adminUserId = token.userId;
    param.roleId = refProforma.roleId;
    param.userId = refProforma.userId;

    // 가견적키 생성
    param.proformaKey = await Proforma.getNewProformaKey();
    param.created = new Date();

    // 데이터베이스 트랜잭션
    // https://loopback.io/doc/en/lb3/Using-database-transactions.html#higher-level-transaction-api
    try {
      await app.dataSources.ummaDs.transaction(async models => {
        const { Proforma, ProformaProduct, Buyer } = models;

        // 바이어 정보
        let findBuyer = await Buyer.findById(param.userId, { include: ['company'] });
        findBuyer = findBuyer.toJSON();
        // 1.참조 가견적서 상태값 업데이트
        const updateResult = await Proforma.updateAll({ proformaNumber: param.refProformaNumber }, { status: -1, updated: new Date() });
        if (!updateResult || updateResult.count !== 1) throw new ummaError.customMessage('Reference proforma update failed.');

        // 2.가견석서 생성
        const pastProformas = refProforma.refProformaNumber2;
        const referenceNumbers = param.refProformaNumber;
        await pastProformas.push({ number: referenceNumbers, id: param.referenceId });
        param.refProformaNumber2 = pastProformas;
        param.status = 0;
        param.totalWeight = param.totalWeight || 0;
        param.shippingPrice = param.shippingPrice || 0;
        param.totalPrice = param.subtotalPrice + param.shippingPrice;
        param.prType = findProducts.length;
        param.shipmentServiceId = param.shipmentServiceId || 0;
        const proforma = await Proforma.create(param);

        // 3.가견적번호 생성
        const proformaNumber = `PI-${findBuyer.company.ctId}-000-${proforma.id}`;

        // 4.가견적서 업데이트
        await Proforma.updateAll({ id: proforma.id }, { proformaNumber: proformaNumber });

        // 5.가견적서 상품 등록
        const products = findProducts.map(p => {
          p = p.toJSON(); // include 데이터가 들어있으면 toJSON()으로 json 객체로 변환해서 사용해야한다.
          // 수량
          const quantity = getParamProductQuantity(p.id, p.poId);
          return {
            proformaId: proforma.id,
            proformaKey: proforma.proformaKey,
            userId: param.userId,
            brId: p.brId,
            brName: p.brName,
            prId: p.id,
            prName: p.name,
            poId: p.poId,
            poName: p.poName,
            catCd1depth: p.catCd1depth,
            catCd2depth: p.catCd2depth,
            catCd3depth: p.catCd3depth,
            images: p.images,
            // optionUsed: p.optionUsed,
            // optionType: p.optionType,
            capacity: p.capacity,
            capacityType: p.capacityType,
            sku: p.poId ? p.poSku : p.sku,
            barcode: p.poId ? p.poBarcode : p.barcode,
            // discountId: p.discountId,
            retailPrice: p.retailPrice,
            totalPrice: p.supplyPrice * quantity,
            supplyPrice: p.supplyPrice,
            supplyRate: p.supplyRate,
            quantity: quantity,
            status: 1,
            created: param.created,
          };
        });
        await ProformaProduct.create(products);
      });
    } catch (err) {
      logger.error(err);
      throw err;
    }

    return await Proforma.findOne({ where: { proformaKey: param.proformaKey }, include: ['product', 'user'] });
  };
  Proforma.remoteMethod('addReference', {
    description: '참조 가견적서 추가',
    notes: 'param {Proforma, "products": [ { prId: 0, poId: 0, quantity: 0 } ]}',
    accepts: ummaUtil.remoteMethod.accepts.paramModelAndOptions('Proforma'),
    returns: { root: true, type: 'Proforma' },
    http: { path: '/addReference', verb: 'post' },
  });
  Proforma.afterRemote('addReference', async function(ctx, data) {
    data = data.toJSON(); // include 데이터가 들어있으면 toJSON()으로 json 객체로 변환해서 사용해야한다.
    // 메일 발송
    // await ummaMail.proforma.requestCancel.sendMail(app, data); // 기존 가견적서 취소 메일 발송
    if (NODE_ENV !== 'development') {
      await ummaMail.proforma.reRequest.sendMail(app, data); // 현재 가견적서 생성 바이어 메일 발송
    }
    // await ummaMail.proforma.notifyAdmin.sendMail(app, data); // 현재 가견적서 생성 관리자 메일 발송
  });

  /**
   * Manually void proforma invoice
   * @param id
   * @param options
   */
  Proforma.manuallyVoid = async function(id, options) {
    const token = ummaUtil.token.getAccessToken(options);
    const where = { id: id };
    // 누가 void했는지 알기 위해 user id update
    const voidProforma = { operatorUserId: token.userId, status: -1, updated: new Date() };
    const getProforma = await Proforma.findById(id, { fields: { id: true, orderPlaced: true } });
    if (!getProforma) throw new ummaError.customMessage('This proforma invoice does not exist.');
    // 주문으로 넘어간 가견적서는 에러
    if (getProforma.orderPlaced === 1) throw new ummaError.customMessage('주문으로 넘어간 가견적서입니다.');
    await Proforma.updateAll(where, voidProforma);
    return true;
  };
  Proforma.remoteMethod('manuallyVoid', {
    description: 'Manually void proforma invoice.',
    accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
    returns: { root: true, type: Boolean },
    http: { path: '/manuallyVoid/:id', verb: 'get' },
  });

  /**
   * 가견적서 상세 조회 함수
   * @param id
   */
  Proforma.getDetail = async function(id) {
    let proforma = await Proforma.findById(id, {
      include: ['user', 'product', 'shippingCompany', { relation: 'shippingCountry', scope: { fields: { name: true } } }],
    });
    proforma = proforma.toJSON(); // include 데이터가 들어있으면 toJSON()으로 json 객체로 변환해서 사용해야한다.
    return proforma;
  };

  /**
   * 가견적서 디테일 보기
   * @param id
   * @param options
   */
  Proforma.detail = async function(id, options) {
    const token = ummaUtil.token.getAccessToken(options);

    // 가견적서 조회
    const proforma = await Proforma.getDetail(id);

    // 관리자가 아닌 경우
    if (!token.isAdmin) {
      // 자신의 가견적서 아닐 경우
      if (!token.isOwner(proforma)) throw new ummaError.forbidden();
      // 승인되지않은 가견적서일 경우
      // 정책 변경: 재기안 기능 추가
      // if (proforma.status === 0) throw new ummaError.customMessage('This proforma invoice has not been confirmed.');
    }

    return proforma;
  };
  Proforma.remoteMethod('detail', {
    description: '가견적서 상세 가져오기',
    accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
    returns: { root: true, type: 'Proforma' },
    http: { path: '/detail/:id', verb: 'get' },
  });

  /**
   * TODO: 클라이언트에서 사용하지 않으므로 하위 버전 호환을 유지하다가 제거해야함
   * 가견적서 상품들 보기
   * @param id
   * @param options
   */
  Proforma.detailProducts = async function(id, options) {
    const token = ummaUtil.token.getAccessToken(options);

    // 가견적서 조회
    const proforma = await Proforma.findById(id);
    if (!proforma) throw new ummaError.customMessage('Proforma not found.');

    const where = { proformaId: id };

    // 관리자가 아닌 경우
    if (!token.isAdmin) {
      // 자신의 가견적서 아닐 경우
      if (!token.isOwner(proforma)) throw new ummaError.forbidden();
      // 승인되지않은 가견적서일 경우
      if (proforma.status === 0) throw new ummaError.customMessage('This proforma invoice has not been confirmed.');
    }

    return await app.models.ProformaProduct.find({ where: where });
  };
  Proforma.remoteMethod('detailProducts', {
    description: '가견적서 상품들 가져오기',
    accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
    returns: { root: true, type: ['ProformaProduct'] },
    http: { path: '/detailProducts/:id', verb: 'get' },
  });

  /**
   * TODO: 클라이언트에서 사용하지 않으므로 하위 버전 호환을 유지하다가 제거해야함
   * 가견적서 상품 카운트
   * @param id
   * @param options
   */
  Proforma.detailProductCount = async function(id, options) {
    const token = ummaUtil.token.getAccessToken(options);

    let where = { proformaId: id };
    where = ummaUtil.where.addOwnerByTokenWithoutAdmin(token, where);

    // 관리자가 아니면 승인된 가견적서만 조회
    if (!token.isAdmin) {
      where = ummaUtil.where.add(where, { status: 1 });
    }

    return await app.models.ProformaProduct.count(where);
  };
  Proforma.remoteMethod('detailProductCount', {
    description: '가견적서 카운트',
    notes: '관리자 토큰이 아니면 status: 1 설정',
    accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
    returns: { root: true, type: Number },
    http: { path: '/detailProductCount/:id', verb: 'get' },
  });

  /**
   * Proforma Invocie Detail 엑셀 다운로드
   * @param res
   * @param id
   * @param options
   */
  Proforma.downloadDetailExcel = async function(res, id, options) {
    // const token = ummaUtil.token.getAccessToken(options);

    // 가견적서 조회
    const proforma = await Proforma.getDetail(id);

    // 관리자가 아닌 경우
    // if (!token.isAdmin) {
    //   // 자신의 가견적서 아닐 경우
    //   if (!token.isOwner(proforma)) throw new ummaError.forbidden();
    // }

    // TODO: 정책 결정후 적용
    // 컨펌된 가견적서만 다운로드 가능
    // if (proforma.status !== 1) throw new ummaError.customMessage('This proforma invoice has not been confirmed.');

    // 엑셀 템플릿에서 시트 가져오기
    const wb = ummaExcel.createWorkBook();
    await wb.xlsx.readFile(ummaExcel.getTemplatePath('proforma-invoice-detail.xlsx'));
    const ws = wb.getWorksheet('Proforma Invoice');
    if (!ws) throw new ummaError.customMessage('Cannot find "Proforma Invoice" sheet.');

    // 보더 설정
    const borderMedium = { style: 'medium', color: { argb: 'FF000000' } };
    const borderThin = { style: 'thin', color: { argb: 'FF000000' } };

    // 엑셀에 데이터 추가
    let row;
    const infoColName = 'D';
    const colValues = [];
    colValues[3] = proforma.proformaNumber; // PI No.
    colValues[4] = ummaUtil.date.stringFormatDateTime(proforma.created, '/', ' ', ':', true); // Request Date
    colValues[5] = proforma.incoterms + (proforma.shippingCompany ? ' / ' + proforma.shippingCompany.serviceName : ''); // Incoterms / Courier
    colValues[6] = proforma.shippingCountry ? proforma.shippingCountry.name : proforma.shippingCtId; // Country
    let shippingAddress = proforma.shippingAddress2 ? proforma.shippingAddress2 + ', ' : '';
    shippingAddress += proforma.shippingAddress1;
    shippingAddress += proforma.shippingCity ? ', ' + proforma.shippingCity : '';
    colValues[7] = shippingAddress; // Address
    colValues[8] = proforma.user ? proforma.user.companyName : ''; // Company Name
    colValues[9] = proforma.recipientName; // Name of Request
    ws.getColumn(`${infoColName}`).values = colValues;

    // 보더 설정
    ws.getCell(`${infoColName}3`).border = { top: borderMedium, left: borderThin, bottom: borderThin, right: borderMedium };
    ws.getCell(`${infoColName}4`).border = { top: borderThin, left: borderThin, bottom: borderThin, right: borderMedium };
    ws.getCell(`${infoColName}5`).border = { top: borderThin, left: borderThin, bottom: borderThin, right: borderMedium };
    ws.getCell(`${infoColName}6`).border = { top: borderThin, left: borderThin, bottom: borderThin, right: borderMedium };
    ws.getCell(`${infoColName}7`).border = { top: borderThin, left: borderThin, bottom: borderThin, right: borderMedium };
    ws.getCell(`${infoColName}8`).border = { top: borderThin, left: borderThin, bottom: borderThin, right: borderMedium };
    ws.getCell(`${infoColName}9`).border = { top: borderThin, left: borderThin, bottom: borderThin, right: borderMedium };
    ws.getCell(`${infoColName}10`).border = { top: borderThin, left: borderThin, bottom: borderMedium, right: borderMedium };

    // 엑셀에 상품 데이터 추가
    const lastColNum = 13;
    const startProductRowNum = 13;
    let currentRowNum = 0;
    proforma.product.forEach(function(product, i) {
      currentRowNum = startProductRowNum + i;
      row = ws.getRow(currentRowNum);
      const rowValues = [];
      rowValues[1] = ++i;
      rowValues[2] = product.sku;
      rowValues[3] = product.brName;
      rowValues[4] = product.prName;
      rowValues[5] = product.poName;
      rowValues[6] = product.retailPrice;
      rowValues[7] = product.supplyRate;
      rowValues[8] = product.supplyPrice;
      rowValues[9] = product.quantity;
      rowValues[10] = product.totalPrice;
      // rowValues[11] = '환율적용가'; // 관리자 입력
      // rowValues[12] = '구매가격'; // 관리자 입력
      // rowValues[13] = '예상상품마진'; // 관리자 입력
      row.values = rowValues;

      row.getCell(6).numFmt = ummaExcel.priceFormatUSD;
      // row.getCell(7).numFmt = '';
      row.getCell(8).numFmt = ummaExcel.priceFormatUSD;
      row.getCell(9).numFmt = ummaExcel.numberFormat;
      row.getCell(10).numFmt = ummaExcel.priceFormatUSD;
      row.getCell(11).numFmt = ummaExcel.priceFormatKRW;
      row.getCell(12).numFmt = ummaExcel.priceFormatKRW;
      row.getCell(13).numFmt = ummaExcel.priceFormatKRW;

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

    // Subtotal
    row = ws.getRow(++currentRowNum);
    currentCellNum = 4;
    row.getCell(currentCellNum).value = 'Subtotal';
    row.getCell(currentCellNum).font = footerCellFontStyle;
    currentCellNum = 10;
    row.getCell(currentCellNum).value = proforma.subtotalPrice;
    row.getCell(currentCellNum).numFmt = ummaExcel.priceFormatUSD;
    row.getCell(currentCellNum).font = footerCellFontStyle;
    row.commit();
    // Shipping Fee
    row = ws.getRow(++currentRowNum);
    currentCellNum = 4;
    row.getCell(currentCellNum).value = 'Shipping Fee';
    row.getCell(currentCellNum).font = footerCellFontStyle;
    currentCellNum = 10;
    row.getCell(currentCellNum).value = proforma.shippingPrice;
    row.getCell(currentCellNum).numFmt = ummaExcel.priceFormatUSD;
    row.getCell(currentCellNum).font = footerCellFontStyle;
    row.commit();
    // Total Amount
    row = ws.getRow(++currentRowNum);
    currentCellNum = 4;
    row.getCell(currentCellNum).value = 'Total Amount';
    row.getCell(currentCellNum).font = footerCellFontStyle;
    currentCellNum = 10;
    row.getCell(currentCellNum).value = proforma.totalPrice;
    row.getCell(currentCellNum).numFmt = ummaExcel.priceFormatUSD;
    row.getCell(currentCellNum).font = footerCellFontStyle;
    row.commit();

    // 엑셀 파일 다운로드
    await ummaExcel.send(res, wb, `umma-proforma-invoice-detail_${proforma.proformaNumber}`);
  };
  Proforma.remoteMethod('downloadDetailExcel', {
    description: 'Proforma Invocie Detail 엑셀 다운로드',
    accepts: [ummaUtil.remoteMethod.accepts.res, ummaUtil.remoteMethod.accepts.id, ummaUtil.remoteMethod.accepts.options],
    returns: { arg: 'body', type: 'file', root: true },
    http: { path: '/downloadDetailExcel/:id', verb: 'get' },
  });

  /**
   * Quote Request Detail 엑셀 다운로드
   * @param res
   * @param id
   * @param options
   */
  Proforma.downloadRequestDetailExcel = async function(res, id, options) {
    // const token = ummaUtil.token.getAccessToken(options);

    // 가견적서 조회
    const proforma = await Proforma.getDetail(id);

    // 관리자가 아닌 경우
    // if (!token.isAdmin) {
    //   // 자신의 가견적서 아닐 경우
    //   if (!token.isOwner(proforma)) throw new ummaError.forbidden();
    // }

    // TODO: 정책 결정후 적용
    // 컨펌된 가견적서는 다운로드 불가
    // if (proforma.status === 1) throw new ummaError.customMessage('This quote request has been confirmed.');

    // 엑셀 템플릿에서 시트 가져오기
    const wb = ummaExcel.createWorkBook();
    await wb.xlsx.readFile(ummaExcel.getTemplatePath('quote-request-detail.xlsx'));
    const ws = wb.getWorksheet('Quote Request');
    if (!ws) throw new ummaError.customMessage('Dannot find "Quote Request" sheet.');

    // 보더 설정
    const borderMedium = { style: 'medium', color: { argb: 'FF000000' } };
    const borderThin = { style: 'thin', color: { argb: 'FF000000' } };

    // 엑셀에 데이터 추가
    let row;
    const infoColName = 'D';
    const colValues = [];
    colValues[3] = proforma.proformaNumber; // PI No.
    colValues[4] = ummaUtil.date.stringFormatDateTime(proforma.created, '/', ' ', ':', true); // Request Date
    colValues[5] = proforma.incoterms + (proforma.shippingCompany ? ' / ' + proforma.shippingCompany.serviceName : ''); // Incoterms / Courier
    colValues[6] = proforma.shippingCountry ? proforma.shippingCountry.name : proforma.shippingCtId; // Country
    let shippingAddress = proforma.shippingAddress2 ? proforma.shippingAddress2 + ', ' : '';
    shippingAddress += proforma.shippingAddress1;
    shippingAddress += proforma.shippingCity ? ', ' + proforma.shippingCity : '';
    colValues[7] = shippingAddress; // Address
    colValues[8] = proforma.user ? proforma.user.companyName : ''; // Company Name
    colValues[9] = proforma.recipientName; // Name of Request
    ws.getColumn(`${infoColName}`).values = colValues;

    // 보더 설정
    ws.getCell(`${infoColName}3`).border = { top: borderMedium, left: borderThin, bottom: borderThin, right: borderMedium };
    ws.getCell(`${infoColName}4`).border = { top: borderThin, left: borderThin, bottom: borderThin, right: borderMedium };
    ws.getCell(`${infoColName}5`).border = { top: borderThin, left: borderThin, bottom: borderThin, right: borderMedium };
    ws.getCell(`${infoColName}6`).border = { top: borderThin, left: borderThin, bottom: borderThin, right: borderMedium };
    ws.getCell(`${infoColName}7`).border = { top: borderThin, left: borderThin, bottom: borderThin, right: borderMedium };
    ws.getCell(`${infoColName}8`).border = { top: borderThin, left: borderThin, bottom: borderThin, right: borderMedium };
    ws.getCell(`${infoColName}9`).border = { top: borderThin, left: borderThin, bottom: borderThin, right: borderMedium };
    ws.getCell(`${infoColName}10`).border = { top: borderThin, left: borderThin, bottom: borderMedium, right: borderMedium };

    // 엑셀에 상품 데이터 추가
    const lastColNum = 13;
    const startProductRowNum = 13;
    let currentRowNum = 0;
    proforma.product.forEach(function(product, i) {
      currentRowNum = startProductRowNum + i;
      row = ws.getRow(currentRowNum);
      const rowValues = [];
      rowValues[1] = ++i;
      rowValues[2] = product.sku;
      rowValues[3] = product.brName;
      rowValues[4] = product.prName;
      rowValues[5] = product.poName;
      rowValues[6] = product.retailPrice;
      rowValues[7] = product.supplyRate;
      rowValues[8] = product.supplyPrice;
      rowValues[9] = product.quantity;
      rowValues[10] = product.totalPrice;
      // rowValues[11] = '환율적용가'; // 관리자 입력
      // rowValues[12] = '구매가격'; // 관리자 입력
      // rowValues[13] = '예상상품마진'; // 관리자 입력
      row.values = rowValues;

      row.getCell(6).numFmt = ummaExcel.priceFormatUSD;
      // row.getCell(7).numFmt = '';
      row.getCell(8).numFmt = ummaExcel.priceFormatUSD;
      row.getCell(9).numFmt = ummaExcel.numberFormat;
      row.getCell(10).numFmt = ummaExcel.priceFormatUSD;
      row.getCell(11).numFmt = ummaExcel.priceFormatKRW;
      row.getCell(12).numFmt = ummaExcel.priceFormatKRW;
      row.getCell(13).numFmt = ummaExcel.priceFormatKRW;

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

    // 마지막 상품 라인 보더 설정
    row = ws.getRow(lastProductRowNum);
    for (let i = 1; i <= lastColNum; i++) {
      row.getCell(i).border.bottom = borderMedium;
    }
    row.commit();

    // 한줄 공백
    ++currentRowNum;

    const footerCellFontStyle = { size: 14, bold: true };
    let currentCellNum = 1;

    // Subtotal
    row = ws.getRow(++currentRowNum);
    currentCellNum = 4;
    row.getCell(currentCellNum).value = 'Subtotal';
    row.getCell(currentCellNum).font = footerCellFontStyle;
    currentCellNum = 10;
    row.getCell(currentCellNum).value = proforma.subtotalPrice;
    row.getCell(currentCellNum).numFmt = ummaExcel.priceFormatUSD;
    row.getCell(currentCellNum).font = footerCellFontStyle;
    row.commit();

    // 엑셀 파일 다운로드
    await ummaExcel.send(res, wb, `umma-quote-request-detail_${proforma.proformaNumber}`);
  };
  Proforma.remoteMethod('downloadRequestDetailExcel', {
    description: 'Quote Request Detail 엑셀 다운로드',
    accepts: [ummaUtil.remoteMethod.accepts.res, ummaUtil.remoteMethod.accepts.id, ummaUtil.remoteMethod.accepts.options],
    returns: { arg: 'body', type: 'file', root: true },
    http: { path: '/downloadRequestDetailExcel/:id', verb: 'get' },
  });

  /**
   * 정보수정 (배송비 추가)
   * @param param
   * @param options
   */
  Proforma.updateInfo = async function(param, options) {
    const token = ummaUtil.token.getAccessToken(options);
    const id = param.id;
    const proformaInfo = param.proformaInfo;

    // validate
    if (!ummaUtil.validate.price(proformaInfo.shippingPrice)) throw new ummaError.invalidParam('shippingPrice');

    const where = { id: id };

    if (token.isAdmin) {
      const findAdmin = await app.models.Admin.findById(token.userId, { fields: { id: true, firstName: true, lastName: true } });
      proformaInfo.adminUserId = findAdmin.id;
      proformaInfo.manager = findAdmin.firstName + ' ' + findAdmin.lastName;
    }

    const proforma = await Proforma.findById(id, { fields: { subtotalPrice: true } });
    proformaInfo.totalPrice = proforma.subtotalPrice + proformaInfo.shippingPrice;
    proformaInfo.approved = 1;
    proformaInfo.approvedDate = new Date();
    proformaInfo.updated = new Date();

    await Proforma.updateAll(where, proformaInfo);

    return await Proforma.findById(id, { include: 'user' });
  };
  Proforma.afterRemote('updateInfo', async function(ctx, data) {
    data = data.toJSON(); // include 데이터가 들어있으면 toJSON()으로 json 객체로 변환해서 사용해야한다.
    // 메일 발송
    if (NODE_ENV !== 'development') {
      await ummaMail.proforma.notifyAdmin.sendMail(app, data);
    }
  });
  Proforma.remoteMethod('updateInfo', {
    description: '정보수정 (배송비 추가)',
    notes: '{ "id": 1, "proformaInfo": { "shippingPrice": 12456 } }',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: 'Proforma' },
    http: { path: '/updateInfo', verb: 'post' },
  });

  /**
   * 가견적서 pdf 다중으로 생성
   * @param ids
   * @param options
   */
  Proforma.getPdfInfos = async function(ids, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    const proforma = await Proforma.find({
      where: { id: { inq: ids } },
      include: ['user', 'product'],
      fields: { id: true, proformaNumber: true, statusUpdated: true, userId: true, operator: true, totalPrice: true, totalQuantity: true },
    });

    const data = proforma.map(function(d) {
      d = d.toJSON(); // include 데이터가 들어있으면 toJSON()으로 json 객체로 변환해서 사용해야한다.
      d.docNumber = d.proformaNumber;
      d.docDate = d.statusUpdated;
      return d;
    });

    return data;
  };
  Proforma.remoteMethod('getPdfInfos', {
    description: '다중 pdf 생성 위한 라우트',
    accepts: ummaUtil.remoteMethod.accepts.idsArrayAndOptions,
    returns: { root: true, type: Array },
    http: { path: '/getPdfInfos', verb: 'post' },
  });
};
