'use strict';

const logger = require('../../lib/logger')(module);
const ummaUtil = require('../../lib/umma-util');
const ummaError = require('../../lib/umma-error');
const ummaMail = require('../../lib/umma-mail');
const { disableAllMethods } = require('../../lib/loopback-helpers');

let app = {
  umma: require('../../reference'), // 개발 참조용 레퍼런스 파일
};

module.exports = function(ProductOption) {
  const Model = ProductOption;
  /**
   * Disable Remote Method
   */
  disableAllMethods(Model, ['count', 'find', 'findOne', 'findById', 'deleteById']);

  // TODO: 등록자 아이다, 수정자 아이디, 삭제자 아이디 등을 토큰에서 읽어 처리해야한다.

  Model.on('attached', function(a) {
    app = a;

    // override method
    Model.destroyById = Model.deleteById;

    /**
     * 상품 옵션 삭제
     * acl: Admin
     * @param id
     * @param options
     */
    Model.deleteById = async function(id, options) {
      return await Model.deleteByIds([id], options);
    };
    Model.remoteMethod('deleteById', {
      description: '상품 옵션 삭제',
      accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
      returns: { root: true, type: { count: Number } },
      http: { path: '/:id', verb: 'delete' },
    });

    /**
     * 상품 옵션 다중 삭제
     * acl: Admin
     * @param ids
     * @param options
     */
    Model.deleteByIds = async function(ids, options) {
      // const token = ummaUtil.token.getAccessToken(options);
      const status = 0;
      const where = { id: { inq: ids }, status: { neq: status } };

      return await Model.updateAll(where, {
        status: status,
        deleted: new Date(),
      });
    };

    Model.remoteMethod('deleteByIds', {
      description: '상품 옵션 다중 삭제',
      accepts: ummaUtil.remoteMethod.accepts.idsArrayAndOptions,
      returns: { root: true, type: { count: Number } },
      http: { path: '/deleteByIds', verb: 'post' },
    });
  });
  Model.on('dataSourceAttached', function() {});

  /**
   * 등록된 상품 옵션 승인
   * acl: Admin
   * @param id
   * @param options
   */
  ProductOption.approvalById = async function(id, options) {
    return await ProductOption.approvalByIds([id], options);
  };

  ProductOption.remoteMethod('approvalById', {
    description: '등록된 상품 옵션 승인',
    accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
    returns: { root: true, type: { count: Number } },
    http: { path: '/approvalById/:id', verb: 'post' },
  });

  /**
   * 등록된 상품 옵션 승인
   * acl: Admin
   * @param ids
   * @param options
   */
  ProductOption.approvalByIds = async function(ids, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    const status = 1;
    const where = { id: { inq: ids }, status: { neq: status } };
    const date = new Date();

    return await ProductOption.updateAll(where, {
      status: status,
      statusUpdated: date,
      approved: date,
    });
  };

  ProductOption.remoteMethod('approvalByIds', {
    description: '등록된 상품 옵션 승인',
    accepts: ummaUtil.remoteMethod.accepts.idsArrayAndOptions,
    returns: { root: true, type: { count: Number } },
    http: { path: '/approvalByIds', verb: 'post' },
  });

  /**
   * 상품 옵션 정보 등록
   * acl: Admin
   * @param param
   * @param options
   */
  ProductOption.createOption = async function(param, options) {
    const token = ummaUtil.token.getAccessToken(options);
    if (!param.prId) throw new ummaError.invalidParam('prId');
    // 파라미터내 문자열 트림
    param.options = ummaUtil.parameter.trim(param.options, ['name', 'sku', 'barcode']);
    const incomingOptions = param.options;
    const productId = param.prId;
    const productName = param.prName;

    const createOptions = incomingOptions.map(o => {
      return {
        name: o.name,
        sku: o.sku,
        prName: productName,
        prId: productId,
        barcode: o.barcode,
        adminRoleId: token.roleId,
        adminUserId: token.userId,
        display: 1,
        status: o.status,
        bestSeller: 0,
        created: new Date(),
      };
    });
    await app.models.Product.updateAll(
      { id: productId },
      {
        // todo: option type 도 추가
        optionUsed: 1,
      }
    );
    return await ProductOption.create(createOptions);
  };

  ProductOption.remoteMethod('createOption', {
    description: '관리자용 상품 옵션 정보 등록',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: 'ProductOption' },
    http: { path: '/createOption', verb: 'post' },
  });

  /**
   * 상품 옵션 상세 정보
   * acl: Admin, Buyer
   * @param id
   * @param options
   */
  ProductOption.detail = async function(id, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    return await ProductOption.findById(id);
  };

  ProductOption.remoteMethod('detail', {
    description: '상품 옵션 상세 정보',
    accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
    returns: { root: true, type: 'ProductOption' },
    http: { path: '/detail/:id', verb: 'get' },
  });

  /**
   * 상품 옵션 리스트
   * acl: Admin, Buyer
   * @param filter
   * @param options
   */
  ProductOption.list = async function(filter, options) {
    const token = ummaUtil.token.getAccessToken(options);

    filter = ummaUtil.filter.validate.limit(filter);
    filter = ummaUtil.filter.include.add(filter, {
      relation: 'product',
      scope: {
        fields: ['id', 'name'],
      },
    });
    // 관리자가 아닐 경우 승인된 상품 옵션 필터 조건 추가
    if (!token.isAdmin) {
      filter = ummaUtil.filter.where.add(filter, { status: 1, display: 1 });
    }

    // filter.order = ['sort ASC', 'name ASC'];

    return await ProductOption.find(filter);
  };

  ProductOption.remoteMethod('list', {
    description: '상품 옵션 리스트',
    notes: '관리자가 아닐 경우 승인된 상품 옵션 필터 조건을 추가한 결과를 반환한다.',
    accepts: ummaUtil.remoteMethod.accepts.filterAndOptions,
    returns: { root: true, type: ['ProductOption'] },
    http: { path: '/list', verb: 'get' },
  });

  /**
   * ViewProductList2(ViewProductAdmin2) 상품 카운트
   * acl: Admin, Buyer
   * @param where
   * @param options
   */
  ProductOption.listCount = async function(where, options) {
    const token = ummaUtil.token.getAccessToken(options);

    // 관리자가 아닐 경우
    if (!token.isAdmin) {
      // 승인된 상품 필터 조건 추가
      where = ummaUtil.where.add(where, { status: 1, display: 1 });
    }

    const cnt = await app.models.ProductOption.count(where);
    return { count: cnt };
  };

  ProductOption.remoteMethod('listCount', {
    description: 'ViewProductList2(ViewProductAdmin2) 상품 카운트',
    notes: '관리자일 경우 ProductOption 모델에서 검색한다.',
    accepts: ummaUtil.remoteMethod.accepts.whereAndOptions,
    returns: { root: true, type: { count: Number } },
    http: { path: '/listCount', verb: 'get' },
  });

  /**
   * 등록된 상품 옵션 반려
   * acl: Admin
   * @param id
   * @param param
   * @param options
   */
  // ProductOption.refuseById = async function(id, param, options) {
  //   param.ids = [id];
  //   return await ProductOption.refuseByIds(param, options);
  // };

  // ProductOption.remoteMethod('refuseById', {
  //   description: '등록된 상품 옵션 반려',
  //   accepts: ummaUtil.remoteMethod.accepts.idAndParamObjectAndOptions,
  //   returns: { root: true, type: { count: Number } },
  //   http: { path: '/refuseById/:id', verb: 'post' },
  // });

  /**
   * 등록된 상품 옵션 반려
   * acl: Admin
   * @param param
   * @param options
   */
  // ProductOption.refuseByIds = async function(param, options) {
  //   // const token = ummaUtil.token.getAccessToken(options);
  //   const ids = param.ids;
  //   const comments = param.comments;
  //   const status = 2; // app.umma.commonCode.PRODUCT_STATUS.REFUSED;
  //   const where = { id: { inq: ids }, status: { neq: status } };

  //   return await ProductOption.updateAll(where, {
  //     status: status,
  //     statusUpdated: new Date(),
  //     comments: comments || '',
  //   });
  // };

  // ProductOption.remoteMethod('refuseByIds', {
  //   description: '등록된 상품 옵션 반려',
  //   note: 'Object {"ids":array, "comments":string}',
  //   accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
  //   returns: { root: true, type: { count: Number } },
  //   http: { path: '/refuseByIds', verb: 'post' },
  // });

  /**
   * 상품 옵션 디스플레이 상태 수정
   * acl: Admin
   * @param param
   * @param options
   */
  ProductOption.updateDisplayByIds = async function(param, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    const ids = param.ids;
    const display = param.display;
    // console.log(param);
    const where = { id: { inq: ids }, display: { neq: display } };

    return await ProductOption.updateAll(where, {
      display: display,
      updated: new Date(),
    });
  };

  ProductOption.remoteMethod('updateDisplayByIds', {
    description: '상품 옵션 디스플레이 상태 수정',
    notes: 'Object {"ids":array, "display":boolean}',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: { count: Number } },
    http: { path: '/updateDisplayByIds', verb: 'post' },
  });

  /**
   * 상품 옵션 상태 수정
   * acl: Admin
   * @param param
   * @param options
   */
  ProductOption.updateStatusByIds = async function(param, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    const ids = param.ids;
    const status = param.status;
    const where = { id: { inq: ids }, status: { neq: status } };

    return await ProductOption.updateAll(where, {
      status: status,
      updated: new Date(),
    });
  };

  ProductOption.remoteMethod('updateStatusByIds', {
    description: '상품 옵션 상태 수정',
    notes: 'Object {"ids":array, "display":boolean}',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: { count: Number } },
    http: { path: '/updateStatusByIds', verb: 'post' },
  });

  /**
   * 상품 옵션 정보 수정
   * acl: Admin
   * @param param
   * @param options
   */
  ProductOption.updateOption = async function(param, options) {
    const token = ummaUtil.token.getAccessToken(options);
    // 파라미터내 문자열 트림
    param = ummaUtil.parameter.trim(param, ['name', 'sku', 'barcode']);
    const id = param.id;
    param.adminRoleId = token.roleId;
    param.adminUserId = token.userId;
    param.updated = new Date();
    return await ProductOption.updateAll({ id: id }, param);
  };

  ProductOption.remoteMethod('updateOption', {
    description: '상품 옵션 정보 수정',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: { count: Number } },
    http: { path: '/updateOption', verb: 'post' },
  });

  /**
   * change product options sort
   * @param param
   * @param options
   */
  ProductOption.updateProductOptionSort = async function(param, options) {
    const token = ummaUtil.token.getAccessToken(options);

    const updateSort = param.map(update => {
      return ProductOption.updateAll(
        {
          id: update.id,
        },
        {
          sort: update.sort,
          adminRoleId: token.roleId,
          adminUserId: token.userId,
          updated: new Date(),
        }
      );
    });
    await Promise.all(updateSort);
    return true;
  };

  ProductOption.remoteMethod('updateProductOptionSort', {
    description: '상품 옵션 정보 수정',
    accepts: ummaUtil.remoteMethod.accepts.paramArrayAndOptions,
    returns: { root: true, type: [ProductOption] },
    http: { path: '/updateProductOptionSort', verb: 'post' },
  });
  /**
   * 등록된 상품 옵션 대기 상태로 변경
   * acl: Admin
   * @param id
   * @param options
   */
  // ProductOption.waitingById = async function(id, options) {
  //   return await ProductOption.waitingByIds([id], options);
  // };

  // ProductOption.remoteMethod('waitingById', {
  //   description: '등록된 상품 옵션 대기 상태로 변경',
  //   accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
  //   returns: { root: true, type: { count: Number } },
  //   http: { path: '/waitingById/:id', verb: 'post' },
  // });

  /**
   * 등록된 상품 옵션 대기 상태로 변경
   * acl: Admin
   * @param ids
   * @param options
   */
  // ProductOption.waitingByIds = async function(ids, options) {
  //   // const token = ummaUtil.token.getAccessToken(options);
  //   const status = 0;
  //   const where = { id: { inq: ids }, status: { neq: status } };
  //   const date = new Date();

  //   return await ProductOption.updateAll(where, {
  //     status: status,
  //     statusUpdated: date,
  //     approved: date,
  //   });
  // };

  // ProductOption.remoteMethod('waitingByIds', {
  //   description: '등록된 상품 옵션 대기 상태로 변경',
  //   accepts: ummaUtil.remoteMethod.accepts.idsArrayAndOptions,
  //   returns: { root: true, type: { count: Number } },
  //   http: { path: '/waitingByIds', verb: 'post' },
  // });
};
