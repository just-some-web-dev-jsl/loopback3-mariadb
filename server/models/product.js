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

module.exports = function(Product) {
  const Model = Product;
  /**
   * Disable Remote Method
   */
  disableAllMethods(Model, [
    'count',
    'find',
    'findOne',
    'findById',
    'deleteById',
    'prototype.__get__brand',
    'prototype.__get__productOption',
    'prototype.__findById__productOption',
  ]);

  // TODO: 등록자 아이다, 수정자 아이디, 삭제자 아이디 등을 토큰에서 읽어 처리해야한다.

  Model.on('attached', function(a) {
    app = a;

    // override method
    Model.destroyById = Model.deleteById;

    /**
     * 상품 삭제
     * acl: Admin
     * @param id
     * @param options
     */
    Model.deleteById = async function(id, options) {
      return await Model.deleteByIds([id], options);
    };
    Model.remoteMethod('deleteById', {
      description: '상품 삭제',
      accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
      returns: { root: true, type: { count: Number } },
      http: { path: '/:id', verb: 'delete' },
    });

    /**
     * 등록된 상품 삭제
     * acl: Admin
     * @param ids
     * @param options
     */
    Model.deleteByIds = async function(ids, options) {
      // const token = ummaUtil.token.getAccessToken(options);
      const status = app.umma.commonCode.PRODUCT_STATUS.DELETED;
      const where = { id: { inq: ids }, status: { neq: status } };
      return await Model.updateAll(where, {
        status: status,
        deleted: new Date(),
      });
    };
    Model.remoteMethod('deleteByIds', {
      description: '등록된 상품 삭제',
      accepts: ummaUtil.remoteMethod.accepts.idsArrayAndOptions,
      returns: { root: true, type: { count: Number } },
      http: { path: '/deleteByIds', verb: 'post' },
    });
  });
  Model.on('dataSourceAttached', function() {});

  /**
   * 등록된 상품 승인
   * acl: Admin
   * @param id
   * @param options
   */
  Product.approvalById = async function(id, options) {
    const d = await Product.approvalByIds([id], options);
    return d[0] || {};
  };

  Product.remoteMethod('approvalById', {
    description: '등록된 상품 승인',
    accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
    returns: { root: true, type: 'ViewProductAdmin2' },
    http: { path: '/approvalById/:id', verb: 'post' },
  });

  /**
   * 등록된 상품 승인
   * acl: Admin
   * @param ids
   * @param options
   */
  Product.approvalByIds = async function(ids, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    const status = app.umma.commonCode.PRODUCT_STATUS.APPROVAL;
    const where = { id: { inq: ids }, status: { neq: status } };
    const date = new Date();

    await Product.updateAll(where, {
      status: status,
      statusUpdated: date,
      approved: date,
    });

    where.status = status;
    where.approved = ummaUtil.date.convertMysqlDateTime(date);
    return await app.models.ViewProductAdmin2.find({ where: where });
  };

  Product.remoteMethod('approvalByIds', {
    description: '등록된 상품 승인',
    accepts: ummaUtil.remoteMethod.accepts.idsArrayAndOptions,
    returns: { root: true, type: ['ViewProductAdmin2'] },
    http: { path: '/approvalByIds', verb: 'post' },
  });

  // 상품 승인 메일 발송
  Product.afterRemote('approvalByIds', async function(ctx, data) {
    if (!Array.isArray(data)) data = [data];
    // 상품 승인 메일 발송
    const p = data.map(function(d) {
      return ummaMail.product.approval.sendMail(app, d);
    });
    await Promise.all(p);
  });

  /**
   * 상품 정보 등록
   * acl: Admin
   * @param param
   * @param options
   */
  Product.createProduct = async function(param, options) {
    const token = ummaUtil.token.getAccessToken(options);
    const getLatestUpdate = await app.models.CurrencyRate.findOne({
      where: { adminRoleId: 13 },
      fields: { currencyRate: true },
      order: 'created DESC',
      limit: 1,
    });
    const theRate = getLatestUpdate.currencyRate;
    if (!theRate) throw new ummaError.customMessage('환율부터 등록해주세요.');
    if (!param.retailPriceKRW) throw new ummaError.invalidParam('retailPriceKRW');

    // 파라미터내 문자열 트림
    param = ummaUtil.parameter.trim(param, [
      'name',
      'sku',
      'barcode',
      'asin',
      'refUrl',
      'videoUrl',
      'comments',
      'contents',
      'ingredient',
      'manufactured',
      'distributor',
      'producerArea',
    ]);
    // 파라미터내 JSON 문자열 JSON 객체로 변환
    param = ummaUtil.parameter.toJson(param, ['images', 'pricingTable', 'msds', 'certificate', 'suppliedChannel', 'validCountry', 'invalidCountry']);

    // 정책: 등록하는 상품은 바로 display: 1?
    if (param.contents === '<p><br></p>') param.contents = null;
    param.retailPrice = ummaUtil.number.formatMoney(param.retailPriceKRW / theRate);
    param.adminRoleId = token.roleId;
    param.adminUserId = token.userId;
    param.companyId = param.companyId || 1; // 회사아이디 비투링크로 설정
    param.retailPrice = param.retailPrice || 0;
    param.retailPriceKRW = param.retailPriceKRW || 0;
    param.supplyRate = param.supplyRate || 0;
    param.salePrice = param.salePrice || 0;
    param.stock = param.stock || 0;
    param.display = 1;
    param.bestSeller = 0;
    param.status = app.umma.commonCode.PRODUCT_STATUS.WAITING;
    param.created = new Date();
    return await Product.create(param);
  };

  Product.remoteMethod('createProduct', {
    description: '상품 정보 등록',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: 'Product' },
    http: { path: '/createProduct', verb: 'post' },
  });

  /**
   * 메인 베스트셀러 상품 삭제
   * acl: Admin
   * @param id
   * @param options
   */
  Product.deleteBestsellerById = async function(id, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    const bestSeller = 0;
    const where = { id: id, bestSeller: { neq: bestSeller } };
    const date = new Date();

    return await Product.updateAll(where, {
      bestSeller: bestSeller,
      sort: 0,
      updated: date,
    });
  };

  Product.remoteMethod('deleteBestsellerById', {
    description: '메인 베스트셀러 상품 삭제',
    accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
    returns: { root: true, type: { count: Number } },
    http: { path: '/deleteBestsellerById/:id', verb: 'post' },
  });

  /**
   * 관리자용 상품 정보
   * acl: Admin
   * @param id
   * @param options
   */
  Product.detail = async function(id, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    return await app.models.ViewProductAdmin2.findById(id, {
      include: [
        {
          relation: 'productOption',
          scope: {
            fields: ['id', 'name', 'sku', 'barcode', 'status', 'display', 'adminRoleId', 'created', 'updated', 'sort'],
            order: ['sort ASC, id ASC', 'name ASC'],
          },
        },
      ],
    });
  };

  Product.remoteMethod('detail', {
    description: '관리자용 상품 정보',
    accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
    returns: { root: true, type: 'ViewProductAdmin2' },
    http: { path: '/detail/:id', verb: 'get' },
  });

  /**
   * 로그인한 유저의 좋아요가 포함된 뷰 상품 상세 정보 조회
   * acl: Buyer
   * @param id
   * @param options
   */
  Product.detailWithFavorite = async function(id, options) {
    const token = ummaUtil.token.getAccessToken(options);

    // 상품 상세 정보
    const filter = {
      where: {
        id: id,
        status: app.umma.commonCode.PRODUCT_STATUS.APPROVAL,
      },
      // 바이어일 경우 노출금지 property
      fields: { retailPriceKRW: false },
      include: [
        {
          relation: 'productOption',
          scope: {
            fields: ['id', 'name', 'sku', 'barcode', 'status', 'display'],
            where: { status: 1, display: 1 },
            order: ['sort ASC, id ASC', 'name ASC'],
          },
        },
        // 바이어일 경우 유저 좋아요 데이터 추가
        {
          relation: 'productFavorite',
          scope: {
            fields: ['id', 'prId'],
            where: { roleId: token.roleId, userId: token.userId, status: 1 },
          },
        },
      ],
    };

    let detail = await app.models.ViewProductDetail2.findOne(filter);
    if (!detail || detail.display === 0) throw new ummaError.customMessage('Product not found!');

    detail = detail.toJSON(); // include 데이터가 들어있으면 toJSON()으로 json 객체로 변환해서 사용해야한다.
    detail.isUserFavorite = detail.productFavorite ? 1 : 0;

    // TODO: 클라이언트 수정 배포 후 구버전 클라이언트가 더이상 사용하지 않을때 삭제
    // 20190522: 구버전 호환 코드: userFavorite 속성 지원
    detail.userFavorite = detail.isUserFavorite;

    return detail;
  };

  Product.remoteMethod('detailWithFavorite', {
    description: '로그인한 유저의 좋아요가 포함된 뷰 상품 상세 정보',
    notes: '응답결과에 isUserFavorite 추가',
    accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
    returns: { root: true, type: 'ViewProductDetail2' },
    http: { path: '/detailWithFavorite/:id', verb: 'get' },
  });

  /**
   * PIMS의 상품마스터를 조회한다.
   * acl: Admin
   * @param {String} productName
   * @param {String} brandName
   * @param {Number} page
   <test>
   http://222.239.10.123:44320/product/product_all_info/getSearchList?find={find_master:{},find_option:{},find_standard:{},find_renewal:{}}&skip=0&limit=5&sort={}&sid=6457356b5a575a70626d566b4f6a6f305a445a684e4445334f44526d4e44597a4f4463344e4751304e6a4d344e7a67314f4464684e4455334f5455344e3245314d544d304e546733595451354e7a6b305a6a5a684e6d597a4e4456684e5463314d546468
   </test>
   */
  Product.getMasterProductList = async function(productName, brandName, page) {
    /* eslint-disable camelcase */
    productName = productName || '';
    brandName = brandName || '';
    page = page || 1;
    const sort = {};
    const skip = (page - 1) * 10;
    const limit = 10;
    const find = {
      find_master: {},
      find_option: {},
      find_standard: {},
      find_renewal: {},
    };
    if (productName) find.find_master._nm = productName;
    if (brandName) find.find_master.nm$brand_basic = brandName;

    return await app.models.PimsApi.getMasterProductList(JSON.stringify(find), skip, JSON.stringify(sort), limit);
    /* eslint-enable camelcase */
  };

  Product.remoteMethod('getMasterProductList', {
    description: 'PIMS 마스터 상품 리스트',
    accepts: [
      { arg: 'productName', type: 'string', http: { source: 'query' }, description: '상품명의 키워드' },
      { arg: 'brandName', type: 'string', http: { source: 'query' }, description: '브랜드의 키워드' },
      { arg: 'page', type: 'number', http: { source: 'query' }, description: '페이지번호' },
    ],
    returns: { root: true, type: 'object' },
    http: { path: '/master-product-list', verb: 'get' },
  });

  /**
   * ViewProductList2(ViewProductAdmin2) 상품 리스트
   * acl: Admin, Buyer
   * @param filter
   * @param options
   */
  Product.list = async function(filter, options) {
    const token = ummaUtil.token.getAccessToken(options);
    filter = ummaUtil.filter.validate.limit(filter);

    // 관리자가 아닐 경우
    if (!token.isAdmin) {
      // 승인된 상품 필터 조건 추가
      filter = ummaUtil.filter.where.add(filter, {
        status: app.umma.commonCode.PRODUCT_STATUS.APPROVAL,
        display: 1,
      });

      // 관리자가 아닐 경우 노출금지 property
      filter = ummaUtil.filter.fields.add(filter, {
        retailPriceKRW: false,
      });

      // 비회원시 노출금지 property
      if (!token.roleId) {
        filter = ummaUtil.filter.fields.add(filter, {
          retailPrice: false,
          manufactured: false,
          supplyPrice: false,
        });
      }

      return await app.models.ViewProductList2.find(filter);
    }

    return await app.models.ViewProductAdmin2.find(filter);
  };

  Product.remoteMethod('list', {
    description: 'ViewProductList2(ViewProductAdmin2) 상품 리스트',
    notes: '관리자일 경우 응답결과에 ViewProductAdmin2 모델 객체를 반환한다.',
    accepts: ummaUtil.remoteMethod.accepts.filterAndOptions,
    returns: { root: true, type: ['ViewProductList2'] },
    http: { path: '/list', verb: 'get' },
  });

  /**
   * ViewProductList2(ViewProductAdmin2) 상품 카운트
   * acl: Admin, Buyer
   * @param where
   * @param options
   */
  Product.listCount = async function(where, options) {
    const token = ummaUtil.token.getAccessToken(options);

    // 관리자가 아닐 경우
    if (!token.isAdmin) {
      // 승인된 상품 필터 조건 추가
      where = ummaUtil.where.add(where, {
        status: app.umma.commonCode.PRODUCT_STATUS.APPROVAL,
        display: 1,
      });

      const cnt = await app.models.ViewProductList2.count(where);
      return { count: cnt };
    }

    const cnt = await app.models.ViewProductAdmin2.count(where);
    return { count: cnt };
  };

  Product.remoteMethod('listCount', {
    description: 'ViewProductList2(ViewProductAdmin2) 상품 카운트',
    notes: '관리자일 경우 ViewProductAdmin2 모델에서 검색한다.',
    accepts: ummaUtil.remoteMethod.accepts.whereAndOptions,
    returns: { root: true, type: { count: Number } },
    http: { path: '/listCount', verb: 'get' },
  });

  /**
   * 승인 대기 상품 리스트
   * acl: Admin
   * @param filter
   * @param options
   */
  Product.listWait = async function(filter, options) {
    const token = ummaUtil.token.getAccessToken(options);
    if (!token.isAdmin) throw new ummaError.forbidden();

    filter = ummaUtil.filter.validate.limit(filter);

    // 승인 대기 상품 필터 조건 추가
    filter = ummaUtil.filter.where.add(filter, {
      status: app.umma.commonCode.PRODUCT_STATUS.WAITING,
    });

    return await app.models.ViewProductAdmin2.find(filter);
  };

  Product.remoteMethod('listWait', {
    description: '승인 대기 상품 리스트',
    notes: '승인 대기중인 상품만 조회되므로 where 절에 status 는 사용할 수 없다.',
    accepts: ummaUtil.remoteMethod.accepts.filterAndOptions,
    returns: { root: true, type: ['ViewProductAdmin2'] },
    http: { path: '/listWait', verb: 'get' },
  });

  /**
   * 베스트셀러 카운트
   * acl: Buyer
   * @param filter
   * @param options
   */
  Product.countBestSeller = async function(where, options) {
    // const token = ummaUtil.token.getAccessToken(options);

    // 승인된 상품 검색 조건 추가
    where = ummaUtil.where.add(where, {
      status: app.umma.commonCode.PRODUCT_STATUS.APPROVAL,
      bestSeller: 1,
      display: 1,
    });

    const cnt = await Product.count(where);
    return { count: cnt };
  };

  Product.remoteMethod('countBestSeller', {
    description: '베스트셀러 카운트',
    accepts: ummaUtil.remoteMethod.accepts.whereAndOptions,
    returns: { root: true, type: { count: Number } },
    http: { path: '/countBestSeller', verb: 'get' },
  });

  /**
   * 로그인한 유저의 좋아요가 포함 + 베스트셀러
   * acl: Admin, Buyer
   * @param filter
   * @param options
   */
  Product.listBestSeller = async function(filter, options) {
    const token = ummaUtil.token.getAccessToken(options);
    // 베스트상품 조건 추가
    filter = ummaUtil.filter.where.add(filter, {
      status: app.umma.commonCode.PRODUCT_STATUS.APPROVAL,
      display: 1,
      bestSeller: 1,
    });
    // 베스트상품 정렬
    filter = ummaUtil.filter.order.add(filter, ['sort ASC']);

    // 관리자용
    if (token.isAdmin) {
      return await app.models.ViewProductList2.find(filter);
    }

    // 바이어용
    return await Product.listWithFavorite(filter, options);
  };

  Product.remoteMethod('listBestSeller', {
    description: '로그인한 유저의 좋아요가 포함 + 베스트셀러',
    accepts: ummaUtil.remoteMethod.accepts.filterAndOptions,
    returns: { root: true, type: ['ViewProductList2'] },
    http: { path: '/listBestSeller', verb: 'get' },
  });

  /**
   * 로그인한 유저의 좋아요가 포함된 뷰 상품 리스트
   * acl: Buyer
   * @param filter
   * @param options
   */
  Product.listWithFavorite = async function(filter, options) {
    const token = ummaUtil.token.getAccessToken(options);
    filter = ummaUtil.filter.validate.limit(filter);

    // 승인된 상품 필터 조건 추가
    filter = ummaUtil.filter.where.add(filter, {
      status: app.umma.commonCode.PRODUCT_STATUS.APPROVAL,
      display: 1,
    });

    // 관리자가 아닐 경우 노출금지 property
    filter = ummaUtil.filter.fields.add(filter, {
      retailPriceKRW: false,
    });

    // 비회원일 경우 노출금지 property
    if (!token.roleId) {
      filter = ummaUtil.filter.fields.add(filter, {
        retailPrice: false,
        manufactured: false,
        supplyPrice: false,
      });
    }

    // 바이어일 경우 유저 좋아요 데이터 추가
    if (token.isBuyer) {
      filter.include = [
        {
          relation: 'productFavorite',
          scope: {
            fields: ['id', 'prId'],
            where: { roleId: token.roleId, userId: token.userId, status: 1 },
          },
        },
      ];
    }

    const products = await app.models.ViewProductList2.find(filter);

    // TODO: 클라이언트 수정 배포 후 구버전 클라이언트가 더이상 사용하지 않을때 삭제
    // 20190522: 구버전 호환 코드: isUserFavorite 속성 지원
    const newProducts = products.map(product => {
      product = product.toJSON(); // include 데이터가 들어있으면 toJSON()으로 json 객체로 변환해서 사용해야한다.
      product.isUserFavorite = product.productFavorite ? 1 : 0;
      return product;
    });

    return newProducts;
  };

  Product.remoteMethod('listWithFavorite', {
    description: '로그인한 유저의 좋아요가 포함된 뷰 상품 리스트',
    notes: '응답결과에 isUserFavorite 추가',
    accepts: ummaUtil.remoteMethod.accepts.filterAndOptions,
    returns: { root: true, type: ['ViewProductList2'] },
    http: { path: '/listWithFavorite', verb: 'get' },
  });

  /**
   * ViewProductDetailOption 상품 리스트
   * acl: Admin
   * @param filter
   * @param options
   */
  Product.listWithOption = async function(filter, options) {
    const token = ummaUtil.token.getAccessToken(options);
    filter = ummaUtil.filter.validate.limit(filter);

    // 관리자가 아닐 경우
    if (!token.isAdmin) {
      // 승인된 상품 필터 조건 추가
      filter = ummaUtil.filter.where.add(filter, {
        status: app.umma.commonCode.PRODUCT_STATUS.APPROVAL,
        display: 1,
        poStatus: 1,
        poDisplay: 1,
      });

      // 관리자가 아닐 경우 노출금지 property
      filter = ummaUtil.filter.fields.add(filter, {
        retailPriceKRW: false,
        deleted: false,
        poStatusUpdated: false,
        poAdminRoleId: false,
        poAdminUserId: false,
        poDeleted: false,
      });

      // 비회원시 노출금지 property
      if (!token.roleId) {
        filter = ummaUtil.filter.fields.add(filter, {
          retailPrice: false,
          manufactured: false,
          supplyPrice: false,
        });
      }
    }

    return await app.models.ViewProductDetailOption.find(filter);
  };

  Product.remoteMethod('listWithOption', {
    description: 'ViewProductDetailOption 상품 리스트',
    accepts: ummaUtil.remoteMethod.accepts.filterAndOptions,
    returns: { root: true, type: ['ViewProductDetailOption'] },
    http: { path: '/listWithOption', verb: 'get' },
  });

  /**
   * ViewProductDetailOption 상품 카운트
   * acl: Admin
   * @param where
   * @param options
   */
  Product.listWithOptionCount = async function(where, options) {
    const token = ummaUtil.token.getAccessToken(options);

    // 관리자가 아닐 경우
    if (!token.isAdmin) {
      // 승인된 상품 필터 조건 추가
      where = ummaUtil.where.add(where, {
        status: app.umma.commonCode.PRODUCT_STATUS.APPROVAL,
        display: 1,
        poStatus: 1,
        poDisplay: 1,
      });
    }

    const cnt = await app.models.ViewProductDetailOption.count(where);
    return { count: cnt };
  };

  Product.remoteMethod('listWithOptionCount', {
    description: 'ViewProductDetailOption 상품 카운트',
    accepts: ummaUtil.remoteMethod.accepts.whereAndOptions,
    returns: { root: true, type: { count: Number } },
    http: { path: '/listWithOptionCount', verb: 'get' },
  });

  /**
   * 등록된 상품 반려
   * acl: Admin
   * @param id
   * @param param
   * @param options
   */
  Product.refuseById = async function(id, param, options) {
    param.ids = [id];
    const d = await Product.refuseByIds(param, options);
    return d[0] || {};
  };

  Product.remoteMethod('refuseById', {
    description: '등록된 상품 반려',
    accepts: ummaUtil.remoteMethod.accepts.idAndParamObjectAndOptions,
    returns: { root: true, type: 'ViewProductAdmin2' },
    http: { path: '/refuseById/:id', verb: 'post' },
  });

  /**
   * 등록된 상품 반려
   * acl: Admin
   * @param param
   * @param options
   */
  Product.refuseByIds = async function(param, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    const ids = param.ids;
    const comments = param.comments;
    const status = app.umma.commonCode.PRODUCT_STATUS.REFUSED;
    const where = { id: { inq: ids }, status: { neq: status } };
    const date = new Date();

    await Product.updateAll(where, {
      status: status,
      statusUpdated: date,
      comments: comments || '',
    });

    where.status = status;
    where.statusUpdated = ummaUtil.date.convertMysqlDateTime(date);
    return await app.models.ViewProductAdmin2.find({ where: where });
  };

  Product.remoteMethod('refuseByIds', {
    description: '등록된 상품 반려',
    note: 'Object {"ids":array, "comments":string}',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: ['ViewProductAdmin2'] },
    http: { path: '/refuseByIds', verb: 'post' },
  });

  // 상품 반려 메일 발송
  Product.afterRemote('refuseByIds', async function(ctx, data) {
    if (!Array.isArray(data)) data = [data];
    // 상품 반려 메일 발송
    const p = data.map(function(d) {
      return ummaMail.product.refuse.sendMail(app, d);
    });
    await Promise.all(p);
  });

  /**
   * 메인 베스트셀러 상품 수정
   * acl: Admin
   * @param param
   * @param options
   */
  Product.updateBestsellerByIds = async function(param, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    try {
      await app.dataSources.ummaDs.transaction(async model => {
        const { Product } = model;

        const date = new Date();

        const ids = [];
        const p = [];
        param.forEach(function(o) {
          if (!o.id) return;
          ids.push(o.id);
          p.push(
            Product.updateAll(
              { id: o.id },
              {
                bestSeller: 1,
                display: 1,
                sort: o.sort || 0,
                updated: date,
              }
            )
          );
        });

        if (ids.length) {
          // 이전 베스트셀러 상품 초기화
          await Product.updateAll(
            { id: { nin: ids }, bestSeller: 1 },
            {
              bestSeller: 0,
              sort: 0,
              updated: date,
            }
          );
        }

        // 베스트셀러 상품 업데이트
        await Promise.all(p);

        return await app.models.ViewProductAdmin2.find({ where: { id: { inq: ids } } });
      });
    } catch (err) {
      throw err;
    }
  };

  Product.remoteMethod('updateBestsellerByIds', {
    description: '메인 베스트셀러 상품 수정',
    notes: 'Array [ {"id":상품아이디, "sort":정렬번호} ]',
    accepts: ummaUtil.remoteMethod.accepts.paramArrayAndOptions,
    returns: { root: true, type: ['ViewProductAdmin2'] },
    http: { path: '/updateBestsellerByIds', verb: 'post' },
  });

  /**
   * 상품 디스플레이 상태 수정
   * acl: Admin
   * @param param
   * @param options
   */
  Product.updateDisplayByIds = async function(param, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    try {
      await app.dataSources.ummaDs.transaction(async model => {
        const { Product } = model;
        const ids = param.ids;
        const display = param.display;
        const where = { id: { inq: ids }, display: { neq: display } };
        const date = new Date();

        await Product.updateAll(where, {
          display: display,
          updated: date,
        });

        where.display = display;
        where.updated = ummaUtil.date.convertMysqlDateTime(date);
        return await app.models.ViewProductAdmin2.find({ where: where });
      });
    } catch (err) {
      throw err;
    }
  };

  Product.remoteMethod('updateDisplayByIds', {
    description: '상품 디스플레이 상태 수정',
    notes: 'Object {"ids":array, "display":boolean}',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: ['ViewProductAdmin2'] },
    http: { path: '/updateDisplayByIds', verb: 'post' },
  });

  /**
   * 상품 정보 수정
   * acl: Admin
   * @param param
   * @param options
   */
  Product.updateInfo = async function(param, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    const id = param.id;
    let prdInfo = param.prdInfo;

    // 환율
    const getLatestUpdate = await app.models.CurrencyRate.findOne({
      where: { adminRoleId: ummaUtil.role.roleIdByName.AdminGradeOperation },
      fields: { currencyRate: true },
      order: 'created DESC',
    });
    const theRate = getLatestUpdate && getLatestUpdate.currencyRate;
    if (!theRate) throw new ummaError.customMessage('환율부터 등록해주세요.');
    if (!prdInfo.retailPriceKRW) throw new ummaError.invalidParam('retailPriceKRW');

    // 파라미터내 문자열 트림
    prdInfo = ummaUtil.parameter.trim(prdInfo, [
      'name',
      'sku',
      'barcode',
      'asin',
      'refUrl',
      'videoUrl',
      'comments',
      'contents',
      'ingredient',
      'manufactured',
      'distributor',
      'producerArea',
    ]);
    // 파라미터내 JSON 문자열 JSON 객체로 변환
    prdInfo = ummaUtil.parameter.toJson(prdInfo, ['images', 'pricingTable', 'msds', 'certificate', 'suppliedChannel', 'validCountry', 'invalidCountry']);

    if (prdInfo.contents === '<p><br></p>') prdInfo.contents = null;
    prdInfo.retailPrice = ummaUtil.number.formatMoney(prdInfo.retailPriceKRW / theRate);
    prdInfo.retailPriceKRW = prdInfo.retailPriceKRW || 0;
    prdInfo.supplyRate = prdInfo.supplyRate || 0;
    prdInfo.salePrice = prdInfo.salePrice || 0;
    prdInfo.stock = prdInfo.stock || 0;
    prdInfo.updated = new Date();
    prdInfo.moq = prdInfo.moq || 1;

    try {
      // 데이터베이스 트랜잭션
      // https://loopback.io/doc/en/lb3/Using-database-transactions.html#higher-level-transaction-api
      await app.dataSources.ummaDs.transaction(async models => {
        const { Product, ProductOption } = models;

        // 상품 정보 수정
        await Product.updateAll({ id: id }, prdInfo);

        // 상품 옵션에 상품명 업데이트
        await ProductOption.updateAll({ prId: id }, { prName: prdInfo.name });
      });

      return await app.models.ViewProductAdmin2.findById(id);
    } catch (err) {
      logger.error(err);
      throw err;
    }
  };

  Product.remoteMethod('updateInfo', {
    description: '상품 정보 수정',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: 'ViewProductAdmin2' },
    http: { path: '/updateInfo', verb: 'post' },
  });

  /**
   * 등록된 상품 대기 상태로 변경
   * acl: Admin
   * @param id
   * @param options
   */
  Product.waitingById = async function(id, options) {
    return await Product.waitingByIds([id], options);
  };

  Product.remoteMethod('waitingById', {
    description: '등록된 상품 대기 상태로 변경',
    accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
    returns: { root: true, type: { count: Number } },
    http: { path: '/waitingById/:id', verb: 'post' },
  });

  /**
   * 등록된 상품 대기 상태로 변경
   * acl: Admin
   * @param ids
   * @param options
   */
  Product.waitingByIds = async function(ids, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    const status = app.umma.commonCode.PRODUCT_STATUS.WAITING;
    const where = { id: { inq: ids }, status: { neq: status } };
    const date = new Date();

    return await Product.updateAll(where, {
      status: status,
      statusUpdated: date,
    });
  };

  Product.remoteMethod('waitingByIds', {
    description: '등록된 상품 대기 상태로 변경',
    accepts: ummaUtil.remoteMethod.accepts.idsArrayAndOptions,
    returns: { root: true, type: { count: Number } },
    http: { path: '/waitingByIds', verb: 'post' },
  });

  /**
   * 다중 공급률 수정
   * @param
   * @options
   */
  Product.updateRateByIds = async function(param, options) {
    const token = ummaUtil.token.getAccessToken(options);
    const ids = param.ids;
    const where = { id: { inq: ids } };
    const findProducts = await Product.find({ where: where, fields: { id: true, supplyRate: true } });
    if (findProducts.length === 0) return { count: 0 };
    const rate = param.supplyRate;
    const date = new Date();
    try {
      if (rate < 0) throw new ummaError.customMessage('Needs to be larger than 0.');
      if (rate > 100) throw new ummaError.customMessage('Needs to be smaller than 100.');
      await Product.updateAll(where, {
        updated: date,
        supplyRate: rate,
        adminRoleId: token.roleId,
        adminUserId: token.userId,
      });
    } catch (err) {
      logger.error(err);
      throw new ummaError.customMessage('Failed to update the supply rate. Please contact the system administrator.');
    }
    return true;
  };
  Product.remoteMethod('updateRateByIds', {
    description: '다중 공급률 수정',
    notes: 'param { ids: [], supplyRate: 공급률}',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: Boolean },
    http: { path: '/updateRateByIds', verb: 'post' },
  });

  /**
   * 다중으로 moq 수정
   * @param param
   * @param options
   */
  Product.updateMoqByIds = async function(param, options) {
    const token = ummaUtil.token.getAccessToken(options);
    const ids = param.ids;
    const where = { id: { inq: ids } };
    const moq = param.moq;
    try {
      if (!moq) throw new ummaError.customMessage('Please type in a MOQ value.');
      if (moq < 0) throw new ummaError.customMessage('MOQ must be higher than 0.');
      await Product.updateAll(where, {
        moq: moq,
        updated: new Date(),
        adminRoleId: token.roleId,
        adminUserId: token.userId,
      });
    } catch (err) {
      logger.error(err);
      throw new ummaError.customMessage('Failed to update MOQs. Please contact the system administrator.');
    }
    return true;
  };
  Product.remoteMethod('updateMoqByIds', {
    description: '다중 공급률 수정',
    notes: 'param { ids: [], moq: moq}',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: Boolean },
    http: { path: '/updateMoqByIds', verb: 'post' },
  });

  Product.countZeroSR = async function() {
    // 공급가 0이면서 노출 중인 상품들
    const where = { supplyRate: 0.0, display: 1 };
    const findProduct = await Product.find({ where: where, fields: { id: true, brId: true, display: true, status: true, supplyRate: true } });
    // 공급가 0이면서 노출 중인 상품들 아이디
    const getPrIds = findProduct.map(({ id }) => id);
    // 총 공급가 0이며 노출 중인 상품 갯수
    const countTotalSRWithDisplay = await Product.count(where);
    // 총 공급가 0인 상품들 갯수
    const countTotalSRNoDisplay = await Product.count({ supplyRate: 0 });
    // 브랜드 아이디 (공급가가 없는 상품들에 브랜드 아이디)
    const brIds = findProduct.map(({ brId }) => brId);

    // TODO: 이재현 - 불필요한 코드가 들어있음.
    let brIdss = brIds.filter((item, index) => brIds.indexOf(item) === index);
    brIdss = brIds.reduce((unique, item) => (unique.includes(item) ? unique : [...unique, item]), []);
    await brIdss;

    const productOption = app.models.ProductOption;
    const optionOnDisplay = await productOption.count({ status: 1 });
    const countAllOptions = await productOption.count();
    // const optionsNotShownAndPrId = await productOption.find({ where: { status: 0 }, fields: { prId: true, id: true, name: true } });
    const options = optionOnDisplay + ' / ' + countAllOptions;
    const showOptionsIDsNotOnDisplay = await productOption.find({ where: { status: 0 }, fields: { id: true } }).map(({ id }) => id);
    // sku 없는 상품 아이디
    const noSku = { and: [{ or: [{ sku: null }, { sku: '' }] }] };
    const ProductWithNoSKU = await Product.find({ where: noSku, fields: { id: true } });
    const countProductNoSKU = await Product.count(noSku);
    // sku 없는 옵션
    const OptionWithNoSKU = await productOption.find({ where: noSku, fields: { id: true } });
    const countOptionNoSKU = await productOption.count(noSku);

    const stats = {
      SupplyRate: {
        'Product ids with no supply rate that are on display': getPrIds,
        'Total number of Products with no supply rate that are on display': countTotalSRWithDisplay,
        'Total number of Products with no supply rate': countTotalSRNoDisplay,
        Brands: {
          'Brands that have products with no supply rate': brIdss,
        },
      },
      Options: {
        'Options on display over total # of options': options,
        'Option IDs not on display': showOptionsIDsNotOnDisplay,
      },
      SKU: {
        'Products with no SKUs': ProductWithNoSKU,
        '# of Products with no SKUs': countProductNoSKU,
        'Options with no SKUs': OptionWithNoSKU,
        '# of options with no SKUs': countOptionNoSKU,
      },
    };
    return stats;
  };
  Product.remoteMethod('countZeroSR', {
    description: '다중 공급률 수정',
    accepts: ummaUtil.remoteMethod.accepts.whereAndOptions,
    returns: { root: true, type: { count: Number } },
    http: { path: '/countZeroSR', verb: 'post' },
  });

  /**
   * 상품 엑셀 다운로드
   * @param res
   * @param param
   * @param options
   */
  Product.downloadExcel = async function(res, filter, options) {
    // const token = ummaUtil.token.getAccessToken(options);

    filter = filter || {};
    filter.include = ['productOption'];
    const getProducts = await app.models.ViewProductAdmin2.find(filter);

    // excel logic
    const wBook = ummaExcel.createWorkBook();
    await wBook.xlsx.readFile(ummaExcel.getTemplatePath('product-excel.xlsx'));
    const wSheet = wBook.getWorksheet('UMMA_PRODUCTS');
    if (!wSheet) throw new ummaError.customMessage('Cannot find "Umma Products" sheet.');

    const p = [];
    getProducts.forEach(function(product) {
      product = product.toJSON(); // include 데이터가 들어있으면 toJSON()으로 json 객체로 변환해서 사용해야한다.
      if (product.productOption.length > 0) {
        product.productOption.forEach(function(option) {
          const columns = [];
          columns[1] = product.id;
          columns[2] = product.catCd;
          columns[3] = product.catCd2;
          columns[4] = product.catCd3;
          columns[5] = product.brId;
          columns[6] = product.brName;
          columns[7] = product.name;
          columns[8] = option.name;
          columns[9] = product.optionUsed;
          columns[10] = product.refUrl;
          columns[11] = product.retailPrice; // MSRP USD
          columns[12] = product.retailPriceKRW; // MSRP Korean Won
          columns[13] = product.supplyRate;
          columns[14] = product.moq;
          columns[15] = option.sku;
          columns[16] = option.barcode;
          columns[17] = product.capacity;
          columns[18] = product.capacityType;
          columns[19] = product.ingredient;
          columns[20] = product.manufactured;
          columns[21] = product.distributor;
          columns[22] = product.producerCtId;
          columns[23] = option.status;
          columns[24] = option.display === 1 ? 'ON (옵션)' : 'OFF (옵션)';
          columns[25] = ummaUtil.date.formatDate(option.created);
          p.push(columns);
        });
      } else {
        const columns = [];
        columns[1] = product.id;
        columns[2] = product.catCd;
        columns[3] = product.catCd2;
        columns[4] = product.catCd3;
        columns[5] = product.brId;
        columns[6] = product.brName;
        columns[7] = product.name;
        columns[8] = '';
        columns[9] = product.optionUsed;
        columns[10] = product.refUrl;
        columns[11] = product.retailPrice; // MSRP USD
        columns[12] = product.retailPriceKRW; // MSRP Korean Won
        columns[13] = product.supplyRate;
        columns[14] = product.moq;
        columns[15] = product.sku;
        columns[16] = product.barcode;
        columns[17] = product.capacity;
        columns[18] = product.capacityType;
        columns[19] = product.ingredient;
        columns[20] = product.manufactured;
        columns[21] = product.distributor;
        columns[22] = product.producerCtId;
        columns[23] = product.status;
        columns[24] = product.display === 1 ? 'ON' : 'OFF';
        columns[25] = ummaUtil.date.formatDate(product.created);
        p.push(columns);
      }
    });

    // 셀 서식 > 표시 형식 > 사용자 지정
    wSheet.getColumn(11).numFmt = ummaExcel.priceFormatUSDWithSymbol;
    wSheet.getColumn(12).numFmt = ummaExcel.priceFormatKRWWithSymbol;
    wSheet.getColumn(14).numFmt = ummaExcel.numberFormat;

    // WORD WRAP for excel sheet
    wSheet.getColumn(7).alignment = { wrapText: true };
    wSheet.getColumn(8).alignment = { wrapText: true };
    wSheet.getColumn(10).alignment = { wrapText: true };
    wSheet.getColumn(19).alignment = { wrapText: true };

    wSheet.addRows(p);
    await ummaExcel.send(res, wBook, 'umma-product-sheet');
  };
  Product.remoteMethod('downloadExcel', {
    description: '물류팀 배송정보 엑셀 다운로드',
    accepts: [ummaUtil.remoteMethod.accepts.res, ummaUtil.remoteMethod.accepts.filter, ummaUtil.remoteMethod.accepts.options],
    returns: { arg: 'body', type: 'file', root: true },
    http: { path: '/downloadExcel', verb: 'get' },
  });

  /**
   * 상품 이미지 순서 변경
   * @param param
   * @param options
   */
  Product.changeImageOrder = async function(param, options) {
    const token = ummaUtil.token.getAccessToken(options);
    await Product.updateAll({ id: param.id }, { images: param.images, adminRoleId: token.roleId, adminUserId: token.userId, updated: new Date() });
    return await Product.findById(param.id);
  };

  Product.remoteMethod('changeImageOrder', {
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { type: 'Product', root: true },
    http: { path: '/changeImageOrder', verb: 'post' },
  });
};
