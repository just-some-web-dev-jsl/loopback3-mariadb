'use strict';

const ummaUtil = require('../../lib/umma-util');
const ummaError = require('../../lib/umma-error');
const { disableAllMethods } = require('../../lib/loopback-helpers');

let app = {
  umma: require('../../reference'), // 개발 참조용 레퍼런스 파일
};

module.exports = function(ProductSearchCondition) {
  const Model = ProductSearchCondition;
  /**
   * Disable Remote Method
   */
  disableAllMethods(Model, ['count', 'find', 'findOne', 'findById', 'deleteById']);

  Model.on('attached', function(a) {
    app = a;

    // override method
    Model.destroyById = Model.deleteById;

    /**
     * 사용자 검색조건 삭제
     * @param id
     * @param options
     */
    Model.deleteById = async function(id, options) {
      return await Model.deleteByIds([id], options);
    };
    Model.remoteMethod('deleteById', {
      description: '사용자 검색조건 삭제',
      accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
      returns: { root: true, type: { count: Number } },
      http: { path: '/:id', verb: 'delete' },
    });

    /**
     * 사용자 검색조건 다중 삭제
     * @param ids
     * @param options
     */
    Model.deleteByIds = async function(ids, options) {
      const token = ummaUtil.token.getAccessToken(options);
      const status = app.umma.commonCode.DATA_STATUS.DELETED;
      let where = { id: { inq: ids }, status: { neq: status } };

      // 관리자가 아닌 경우 OWNER 조건 추가
      where = ummaUtil.where.addOwnerByTokenWithoutAdmin(token, where);

      return await Model.updateAll(where, {
        status: status,
        deleted: new Date(),
      });
    };
    Model.remoteMethod('deleteByIds', {
      description: '사용자 검색조건 다중 삭제',
      accepts: ummaUtil.remoteMethod.accepts.idsArrayAndOptions,
      returns: { root: true, type: { count: Number } },
      http: { path: '/deleteByIds', verb: 'post' },
    });
  });
  Model.on('dataSourceAttached', function() {});

  /**
   * 사용자 검색조건 조회
   * @param options
   */
  ProductSearchCondition.myCondition = async function(options) {
    const token = ummaUtil.token.getAccessToken(options);

    let filter = {};
    filter = ummaUtil.filter.where.addOwnerByToken(token, filter);

    return await ProductSearchCondition.findOne(filter);
  };

  ProductSearchCondition.remoteMethod('myCondition', {
    description: '사용자 검색조건 조회',
    accepts: ummaUtil.remoteMethod.accepts.options,
    returns: { root: true, type: 'ProductSearchCondition' },
    http: { path: '/myCondition', verb: 'get' },
  });

  /**
   * 사용자 검색조건 등록 및 수정
   * @param param
   * @param options
   */
  ProductSearchCondition.upsertCondition = async function(param, options) {
    const token = ummaUtil.token.getAccessToken(options);

    const where = ummaUtil.where.addOwnerByToken(token, {});

    const data = {
      roleId: token.roleId,
      userId: token.userId,
      filter: param.filter,
    };

    return await ProductSearchCondition.upsertWithWhere(where, data);
  };

  ProductSearchCondition.remoteMethod('upsertCondition', {
    description: '사용자 검색조건 등록 및 수정',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: 'ProductSearchCondition' },
    http: { path: '/upsertCondition', verb: 'post' },
  });
};
