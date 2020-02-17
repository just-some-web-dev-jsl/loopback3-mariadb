'use strict';

const ummaUtil = require('../../lib/umma-util');
const ummaError = require('../../lib/umma-error');
const { disableAllMethods } = require('../../lib/loopback-helpers');

let app = {
  umma: require('../../reference'), // 개발 참조용 레퍼런스 파일
};

module.exports = function(ProductCart) {
  const Model = ProductCart;
  /**
   * Disable Remote Method
   */
  disableAllMethods(Model, ['deleteById']);

  Model.on('attached', function(a) {
    app = a;

    // override method
    Model.destroyById = Model.deleteById;

    /**
     * 카트 상품 삭제
     * @param id
     * @param options
     */
    Model.deleteById = async function(id, options) {
      return await Model.deleteByIds([id], options);
    };
    Model.remoteMethod('deleteById', {
      description: '카트 상품 삭제',
      accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
      returns: { root: true, type: { count: Number } },
      http: { path: '/:id', verb: 'delete' },
    });

    /**
     * 카트 상품 다중 삭제
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
    Model.remoteMethod('removeByIds', {
      description: '카트 상품 다중 삭제',
      accepts: ummaUtil.remoteMethod.accepts.idsArrayAndOptions,
      returns: { root: true, type: { count: Number } },
      http: { path: '/deleteByIds', verb: 'post' },
    });
  });
  Model.on('dataSourceAttached', function() {});

  /**
   * 로그인한 유저의 카트 상품 카운트
   * @param where
   * @param options
   */
  ProductCart.myCount = async function(where, options) {
    const token = ummaUtil.token.getAccessToken(options);

    where = ummaUtil.where.add(where, { status: 1 });
    where = ummaUtil.where.addOwnerByToken(token, where);
    const cnt = await ProductCart.count(where);
    return { count: cnt };
  };

  ProductCart.remoteMethod('myCount', {
    description: '유저의 카트 상품 카운트',
    accepts: ummaUtil.remoteMethod.accepts.whereAndOptions,
    returns: { root: true, type: { count: Number } },
    http: { path: '/myCount', verb: 'get' },
  });

  /**
   * 로그인한 유저의 카트 상품 리스트
   * @param filter
   * @param options
   */
  ProductCart.myList = async function(filter, options) {
    const token = ummaUtil.token.getAccessToken(options);

    // filter = ummaUtil.filter.validate.limit(filter);
    filter = ummaUtil.filter.where.add(filter, { status: 1 });
    filter = ummaUtil.filter.where.addOwnerByToken(token, filter);

    return await app.models.ViewProductCart.find(filter);
  };

  ProductCart.remoteMethod('myList', {
    description: '로그인한 유저의 카트 상품 리스트',
    accepts: ummaUtil.remoteMethod.accepts.filterAndOptions,
    returns: { root: true, type: ['ViewProductCart'] },
    http: { path: '/myList', verb: 'get' },
  });

  /**
   * 관리자 위한 리스트
   * @param where
   * @param options
   */
  ProductCart.listForAdmin = async function(where, options) {
    const token = ummaUtil.token.getAccessToken(options);
    where = { status: 1 };

    return await ProductCart.find({
      where: where,
      include: [
        {
          relation: 'user',
          scope: {
            fields: ['id', 'roleId', 'firstName', 'lastName', 'userId', 'email'],
          },
        },
      ],
    });
  };
  ProductCart.remoteMethod('listForAdmin', {
    description: '관리자 위한 리스트',
    accepts: ummaUtil.remoteMethod.accepts.filterAndOptions,
    returns: { root: true, type: ['ProductCart'] },
    http: { path: '/listForAdmin', verb: 'get' },
  });

  /**
   * admin cart count
   * @param where
   * @param options
   */
  ProductCart.countForAdmin = async function(where, options) {
    const token = ummaUtil.token.getAccessToken(options);

    where = ummaUtil.where.addOwnerByTokenWithoutAdmin(token, where);
    where = { status: 1 };

    return await ProductCart.count(where);
  };
  ProductCart.remoteMethod('countForAdmin', {
    description: 'admin cart count',
    accepts: ummaUtil.remoteMethod.accepts.whereAndOptions,
    returns: { root: true, type: Number },
    http: { path: '/countForAdmin', verb: 'get' },
  });

  /**
   * 카트 상품 추가
   * 장바구니에 이미 있으면 갯수만 업데이트
   * TODO: 배포와 동시에 기존 유저들의 카트의 중복 상품을 머지해서 삭제하는 쿼리를 실행해야한다.
   * @param param
   * @param options
   */
  ProductCart.add = async function(param, options) {
    const token = ummaUtil.token.getAccessToken(options);
    const where = {
      userId: token.userId,
      roleId: token.roleId,
      prId: param.prId,
      poId: param.poId,
      status: 1,
    };
    const product = await app.models.ViewProductDetail2.findById(param.prId, {
      fields: { supplyPrice: true, catCd1depth: true, catCd2depth: true, catCd3depth: true, moq: true },
    });
    if (!product) throw new ummaError.customMessage('Product not found.');

    const ifInCart = await ProductCart.findOne({
      where: where,
      fields: { quantity: true },
    });
    if (!ifInCart) {
      // 클라이언트에서 전송
      // param.prId = param.prId;
      // param.poId = param.poId;
      // param.poName = param.poName;
      // param.barcode = param.barcode;
      // param.sku = param.sku;
      param.roleId = token.roleId;
      param.userId = token.userId;
      param.catCd1depth = product.catCd1depth;
      param.catCd2depth = product.catCd2depth;
      param.catCd3depth = product.catCd3depth;
      param.supplyPrice = product.supplyPrice;
      param.quantity = product.moq;
      param.status = 1;
      param.created = new Date();

      return await ProductCart.create(param);
    } else {
      return await ProductCart.updateAll(where, {
        quantity: ifInCart.quantity + product.moq,
        updated: new Date(),
      });
    }
  };

  ProductCart.remoteMethod('add', {
    description: '카트 상품 추가',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: 'ProductCart' },
    http: { path: '/add', verb: 'post' },
  });

  /**
   * 카트 수량 변경하기
   * @param param
   * @param options
   */
  ProductCart.updateQuantity = async function(param, options) {
    const token = ummaUtil.token.getAccessToken(options);
    const id = param.id;
    const cartInfo = param.cartInfo;
    const prId = param.prId;

    // validation
    if (!Number.isInteger(id)) throw new ummaError.invalidParam('id');
    if (typeof cartInfo !== 'object') throw new ummaError.invalidParam('cartInfo');

    // moq 확인
    const getMoq = await app.models.Product.findOne({ where: { id: prId } }, { fields: { id: true, moq: true } });
    if (getMoq.moq > cartInfo.quantity) throw new ummaError.customMessage('You need to order at least ' + getMoq.moq + '.');

    // 최소 주문 수량은 1개로 설정
    cartInfo.quantity = cartInfo.quantity < 1 ? 1 : cartInfo.quantity;

    let where = { id: id };
    where = ummaUtil.where.addOwnerByToken(token, where);
    await ProductCart.updateAll(where, { quantity: cartInfo.quantity, updated: new Date() });

    return await app.models.ViewProductCart.findById(id, { fields: { id: true, quantity: true, productTotalPrice: true } });
  };

  ProductCart.remoteMethod('updateQuantity', {
    description: '카트 별 상품 수량 변경하기',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: { id: Number, quantity: Number, productTotalPrice: Number } },
    http: { path: '/updateQuantity', verb: 'post' },
  });

  /**
   * 카트 상품 삭제
   * @param id
   * @param options
   */
  ProductCart.removeItem = async function(id, options) {
    return await ProductCart.removeByIds([id], options);
  };

  ProductCart.remoteMethod('removeItem', {
    description: '카트 상품 삭제',
    accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
    returns: { root: true, type: { count: Number } },
    http: { path: '/removeItem/:id', verb: 'post' },
  });

  /**
   * 카트 상품 다중 삭제
   * @param ids
   * @param options
   */
  ProductCart.removeByIds = async function(ids, options) {
    const token = ummaUtil.token.getAccessToken(options);

    const status = 0;
    let where = { id: { inq: ids }, status: { neq: status } };
    where = ummaUtil.where.addOwnerByToken(token, where);

    return await ProductCart.destroyAll(where);
  };

  ProductCart.remoteMethod('removeByIds', {
    description: '카트 상품 다중 삭제',
    accepts: ummaUtil.remoteMethod.accepts.idsArrayAndOptions,
    returns: { root: true, type: { count: Number } },
    http: { path: '/removeByIds', verb: 'post' },
  });
};
