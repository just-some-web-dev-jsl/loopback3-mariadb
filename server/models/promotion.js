'use strict';

const ummaUtil = require('../../lib/umma-util');
const ummaError = require('../../lib/umma-error');
const { disableAllMethods } = require('../../lib/loopback-helpers');

let app = {
  umma: require('../../reference'), // 개발 참조용 레퍼런스 파일
};

module.exports = function(Promotion) {
  const Model = Promotion;
  /**
   * Disable Remote Method
   * 기존 룹백 메서드 비활성화
   */
  disableAllMethods(Model, ['count', 'find', 'findOne', 'findById', 'deleteById']);

  Model.on('attached', function(a) {
    app = a;

    // override method
    Model.destroyById = Model.deleteById;

    /**
     * 프로모션 삭제
     * acl: Admin
     * @param id
     * @param options
     */
    Model.deleteById = async function(id, options) {
      return await Model.deleteByIds([id], options);
    };
    Model.remoteMethod('deleteById', {
      description: '프로모션 삭제',
      accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
      returns: { root: true, type: { count: Number } },
      http: { path: '/:id', verb: 'delete' },
    });

    /**
     * 프로모션 다중 삭제
     * acl: Admin
     * @param ids
     * @param options
     */
    Model.deleteByIds = async function(ids, options) {
      // const token = ummaUtil.token.getAccessToken(options);
      const where = { id: { inq: ids } };
      return await Model.destroyAll(where);
    };
    Model.remoteMethod('deleteByIds', {
      description: '프로모션 다중 삭제',
      accepts: ummaUtil.remoteMethod.accepts.idsArrayAndOptions,
      returns: { root: true, type: { count: Number } },
      http: { path: '/deleteByIds', verb: 'post' },
    });
  });
  Model.on('dataSourceAttached', function() {});

  /**
   * 프로모션 등록
   * acl: Admin
   * @param param
   * @param options
   */
  Promotion.add = async function(param, options) {
    const token = ummaUtil.token.getAccessToken(options);
    // 파라미터내 문자열 트림
    param = ummaUtil.parameter.trim(param, ['title', 'comments', 'eventDetail']);
    param.adminRoleId = token.roleId;
    param.adminUserId = token.userId;

    return await Promotion.create(param);
  };

  Promotion.remoteMethod('add', {
    description: '프로모션 정보 등록',
    accepts: ummaUtil.remoteMethod.accepts.paramModelAndOptions('Promotion'),
    returns: { root: true, type: 'Promotion' },
    http: { path: '/add', verb: 'post' },
  });

  /**
   * 프로모션 수정
   * acl: Admin
   * @param param
   * @param options
   */
  Promotion.updateInfo = async function(id, param, options) {
    const token = ummaUtil.token.getAccessToken(options);
    const where = { id: id };

    param.adminRoleId = token.roleId;
    param.adminUserId = token.userId;
    param.updated = new Date();

    return await Promotion.updateAll(where, param);
  };

  Promotion.remoteMethod('updateInfo', {
    description: '프로모션 정보 수정',
    accepts: ummaUtil.remoteMethod.accepts.idAndParamObjectAndOptions,
    returns: { root: true, type: { count: Number } },
    http: { path: '/updateInfo/:id', verb: 'post' },
  });

  /**
   * 프로모션 상태값 수정
   * @param param
   * @param options
   */
  Promotion.updateStatusByIds = async function(param, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    const ids = param.ids;
    const status = param.status;

    if (!Array.isArray(ids)) throw new ummaError.invalidParam('ids');

    const where = { id: { inq: ids }, status: { neq: status } };

    return await Promotion.updateAll(where, {
      status: status,
      updated: new Date(),
    });
  };

  Promotion.remoteMethod('updateStatusByIds', {
    description: '프로모션 상태값 수정',
    notes: 'param {"ids": Array, "status": Number}',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: { count: Number } },
    http: { path: '/updateStatusByIds', verb: 'post' },
  });

  /**
   * 프로모션 리스트
   * @param param
   * @param options
   */
  Promotion.list = async function(filter, options) {
    const token = ummaUtil.token.getAccessToken(options);
    filter = ummaUtil.filter.validate.limit(filter);
    if (!token.isAdmin) {
      filter = ummaUtil.filter.where.add(filter, { status: 1 });
    }

    const count = await Promotion.count(filter.where);
    const list = await Promotion.find(filter);

    return { count: count, skip: filter.skip, limit: filter.limit, list: list };
  };

  Promotion.remoteMethod('list', {
    description: '프로모션 리스트',
    accepts: ummaUtil.remoteMethod.accepts.filterAndOptions,
    returns: { root: true, type: { count: Number, skip: Number, limit: Number, list: ['Promotion'] } },
    http: { path: '/list', verb: 'get' },
  });

  /**
   * 프로모션 상세 정보
   * @param id
   * @param options
   */
  Promotion.detail = async function(id, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    return await Promotion.findById(id);
  };

  Promotion.remoteMethod('detail', {
    description: '프로모션 상세 정보',
    accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
    returns: { root: true, type: 'Promotion' },
    http: { path: '/detail/:id', verb: 'get' },
  });
};
