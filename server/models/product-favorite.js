'use strict';

const ummaUtil = require('../../lib/umma-util');
const ummaError = require('../../lib/umma-error');
const { disableAllMethods } = require('../../lib/loopback-helpers');

let app = {
  umma: require('../../reference'), // 개발 참조용 레퍼런스 파일
};

module.exports = function(ProductFavorite) {
  const Model = ProductFavorite;
  /**
   * Disable Remote Method
   */
  disableAllMethods(Model, ['deleteById']);

  Model.on('attached', function(a) {
    app = a;

    // override method
    Model.destroyById = Model.deleteById;

    /**
     * 상품 좋아요 삭제
     * @param id
     * @param options
     */
    Model.deleteById = async function(id, options) {
      return await Model.deleteByIds([id], options);
    };
    Model.remoteMethod('deleteById', {
      description: '상품 좋아요 삭제',
      accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
      returns: { root: true, type: { count: Number } },
      http: { path: '/:id', verb: 'delete' },
    });

    /**
     * 상품 좋아요 다중 삭제
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
      description: '상품 좋아요 다중 삭제',
      accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
      returns: { root: true, type: { count: Number } },
      http: { path: '/deleteByIds', verb: 'post' },
    });
  });
  Model.on('dataSourceAttached', function() {});

  /**
   * 로그인한 유저의 좋아요 상품 카운트
   * @param where
   * @param options
   */
  ProductFavorite.myCount = async function(where, options) {
    const token = ummaUtil.token.getAccessToken(options);

    where = ummaUtil.where.add(where, { status: 1 });
    where = ummaUtil.where.addOwnerByToken(token, where);
    const cnt = await app.models.ViewProductFavorite.count(where);
    return { count: cnt };
  };

  ProductFavorite.remoteMethod('myCount', {
    description: '로그인한 유저의 좋아요 상품 카운트',
    accepts: ummaUtil.remoteMethod.accepts.whereAndOptions,
    returns: { root: true, type: { count: Number } },
    http: { path: '/myCount', verb: 'get' },
  });

  /**
   * 로그인한 유저의 좋아요 상품 리스트
   * TODO: 프런트단에서 단종상품, 삭제상품 처리 등 상품 상태값에 따른 뷰처리 필요.
   * @param filter
   * @param options
   */
  ProductFavorite.myList = async function(filter, options) {
    const token = ummaUtil.token.getAccessToken(options);

    filter = ummaUtil.filter.validate.limit(filter);
    filter = ummaUtil.filter.where.add(filter, { status: 1 });
    filter = ummaUtil.filter.where.addOwnerByToken(token, filter);

    return await app.models.ViewProductFavorite.find(filter);
  };

  ProductFavorite.remoteMethod('myList', {
    description: '로그인한 유저의 좋아요 상품 리스트',
    accepts: ummaUtil.remoteMethod.accepts.filterAndOptions,
    returns: { root: true, type: ['ViewProductFavorite'] },
    http: { path: '/myList', verb: 'get' },
  });

  /**
   * 좋아요 상품 추가
   * @param options
   * @param param
   */
  ProductFavorite.like = async function(param, options) {
    const token = ummaUtil.token.getAccessToken(options);
    const id = param.prId;

    // 상품 옵션 체크
    const ifOption = await app.models.ViewProductDetail2.findOne({
      where: { id: id },
      fields: { catCd1depth: true, catCd2depth: true, catCd3depth: true, moq: true, optionUsed: true },
    });
    if (ifOption.optionUsed) {
      if (!param.poName && !param.poId) throw new ummaError.customMessage('Please choose options first');
    }

    let where = { prId: id };
    where = ummaUtil.where.addOwnerByToken(token, where);

    param.roleId = token.roleId;
    param.userId = token.userId;
    param.catCd1depth = ifOption.catCd1depth;
    param.catCd2depth = ifOption.catCd2depth;
    param.catCd3depth = ifOption.catCd3depth;
    param.quantity = ifOption.moq;
    param.status = 1;
    param.updated = new Date();

    return await ProductFavorite.upsertWithWhere(where, param);
  };

  ProductFavorite.remoteMethod('like', {
    description: '좋아요 상품 추가',
    notes: '{prId: 상품아이디, poName:"", poId: 1}',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: 'ProductFavorite' },
    http: { path: '/like', verb: 'post' },
  });

  /**
   * 좋아요 상품 삭제
   * @param id
   * @param options
   */
  ProductFavorite.unlike = async function(id, options) {
    const token = ummaUtil.token.getAccessToken(options);

    let where = { prId: id };
    where = ummaUtil.where.addOwnerByToken(token, where);

    return await ProductFavorite.updateAll(where, { status: 0, updated: new Date() });
  };

  ProductFavorite.remoteMethod('unlike', {
    description: '좋아요 상품 삭제',
    accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
    returns: { root: true, type: { count: Number } },
    http: { path: '/unlike/:id', verb: 'post' },
  });

  /**
   * 좋아요 상품 다중 삭제
   * @param ids
   * @param options
   */
  ProductFavorite.unlikeByIds = async function(ids, options) {
    const token = ummaUtil.token.getAccessToken(options);
    const status = 0;
    let where = { id: { inq: ids }, status: { neq: status } };
    where = ummaUtil.where.addOwnerByToken(token, where);

    return await ProductFavorite.updateAll(where, {
      status: status,
      deleted: new Date(),
    });
  };

  ProductFavorite.remoteMethod('unlikeByIds', {
    description: '좋아요 상품 다중 삭제',
    accepts: ummaUtil.remoteMethod.accepts.idsArrayAndOptions,
    returns: { root: true, type: { count: Number } },
    http: { path: '/unlikeByIds', verb: 'post' },
  });

  /**
   * 수량 변경하기
   * @param param
   * @param options
   */
  ProductFavorite.updateQuantity = async function(param, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    const id = param.id;
    const favoriteInfo = param.favoriteInfo;
    favoriteInfo.updated = new Date();

    return await ProductFavorite.updateAll({ id: id }, favoriteInfo);
  };

  ProductFavorite.remoteMethod('updateQuantity', {
    description: '상품 수량 변경하기',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: { count: Number } },
    http: { path: '/updateQuantity', verb: 'post' },
  });

  /**
   * 위시리스트에서 장바구니로 추가하기
   * TODO: 배포와 동시에 기존 유저들의 카트의 중복 상품을 머지해서 삭제하는 쿼리를 실행해야한다.
   * @param ids
   * @param options
   */
  ProductFavorite.addToCart = async function(ids, options) {
    const token = ummaUtil.token.getAccessToken(options);
    try {
      await app.dataSources.ummaDs.transaction(async model => {
        const { ProductCart, ViewProductCart, ViewProductFavorite } = model;

        // 선택한 좋아요 상품 가져오기
        const findItemInfo = await ViewProductFavorite.find({ where: { id: { inq: ids }, roleId: token.roleId, userId: token.userId } });

        // 카트에 이미 등록된 상품 가져오기
        const where = {};
        where.or = findItemInfo.map(item => {
          return { roleId: token.roleId, userId: token.userId, prId: item.prId, poId: item.poId };
        });
        const findInCart = await ViewProductCart.find({
          where: where,
          fields: { id: true, roleId: true, userId: true, prId: true, poId: true, productMoq: true, quantity: true, status: true },
        });

        const date = new Date();

        // 카트에 이미 등록된 상품은 업데이트
        const updateCart = findInCart.map(cart => {
          return ProductCart.updateAll(
            { id: cart.id },
            {
              sku: cart.productSku,
              barcode: cart.productBarcode,
              supplyPrice: cart.productSupplyPrice,
              // 카트에서 사용중인 상품과 삭제되었던 상품 처리
              quantity: cart.status === 1 ? cart.quantity + cart.productMoq : cart.productMoq,
              status: 1,
              updated: date,
            }
          );
        });
        const updateResults = await Promise.all(updateCart);

        // 카트에 새로 등록할 상품 만들기
        const params = [];
        findItemInfo.forEach(item => {
          if (findInCart.find(o => o.prId === item.prId && o.poId === item.poId)) return; // 이미 업데이트된 상품은 스킵
          params.push({
            roleId: item.roleId,
            userId: item.userId,
            prId: item.prId,
            poId: item.poId,
            poName: item.poName,
            catCd1depth: item.catCd1depth,
            catCd2depth: item.catCd2depth,
            catCd3depth: item.catCd3depth,
            sku: item.productSku,
            barcode: item.productBarcode,
            supplyPrice: item.productSupplyPrice,
            status: 1,
            quantity: item.productMoq,
            created: date,
          });
        });
        // bulk insert
        const cartProducts = await ProductCart.create(params);

        return { count: updateResults.length + cartProducts.length };
      });
    } catch (err) {
      throw err;
    }
  };

  ProductFavorite.remoteMethod('addToCart', {
    description: '위시리스트에서 장바구니로 추가하기',
    accepts: ummaUtil.remoteMethod.accepts.idsArrayAndOptions,
    returns: { root: true, type: { count: Number } },
    http: { path: '/addToCart', verb: 'post' },
  });
};
