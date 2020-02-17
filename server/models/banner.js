'use strict';

const ummaUtil = require('../../lib/umma-util');
const ummaError = require('../../lib/umma-error');
const { disableAllMethods } = require('../../lib/loopback-helpers');

let app = {
  umma: require('../../reference'), // 개발 참조용 레퍼런스 파일
};

module.exports = function(Banner) {
  const Model = Banner;
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
     * 배너 삭제
     * acl: Admin
     * @param id
     * @param options
     */
    Model.deleteById = async function(id, options) {
      return await Model.deleteByIds([id], options);
    };
    Model.remoteMethod('deleteById', {
      description: '배너 삭제',
      accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
      returns: { root: true, type: { count: Number } },
      http: { path: '/:id', verb: 'delete' },
    });

    /**
     * 배너 다중 삭제
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
      description: '배너 다중 삭제',
      accepts: ummaUtil.remoteMethod.accepts.idsArrayAndOptions,
      returns: { root: true, type: { count: Number } },
      http: { path: '/deleteByIds', verb: 'post' },
    });
  });
  Model.on('dataSourceAttached', function() {});

  /**
   * 배너 정보 등록
   * @param param
   * @param options
   */
  Banner.add = async function(param, options) {
    const token = ummaUtil.token.getAccessToken(options);
    // 파라미터내 문자열 트림
    param = ummaUtil.parameter.trim(param, ['bannerType', 'title', 'imageUrl', 'imageMobileUrl', 'linkUrl']);
    param.adminRoleId = token.roleId;
    param.adminUserId = token.userId;
    param.sort = param.sort || 0;
    param.display = param.display || 0;
    param.created = new Date();

    return await Banner.create(param);
  };
  Banner.remoteMethod('add', {
    description: '배너 정보 등록',
    accepts: ummaUtil.remoteMethod.accepts.paramModelAndOptions('Banner'),
    returns: { root: true, type: 'Banner' },
    http: { path: '/add', verb: 'post' },
  });

  /**
   * 배너 정보 수정
   * acl: Admin
   * @param id
   * @param param
   * @param options
   */
  Banner.updateInfo = async function(id, param, options) {
    const token = ummaUtil.token.getAccessToken(options);

    const where = { id: id };
    // 파라미터내 문자열 트림
    param = ummaUtil.parameter.trim(param, ['bannerType', 'title', 'imageUrl', 'imageMobileUrl', 'linkUrl']);

    param.adminRoleId = token.roleId;
    param.adminUserId = token.userId;
    param.sort = param.sort || 0;
    param.display = param.display || 0;
    param.updated = new Date();

    return await Banner.updateAll(where, param);
  };
  Banner.remoteMethod('updateInfo', {
    description: '배너 정보 수정',
    accepts: ummaUtil.remoteMethod.accepts.idAndParamObjectAndOptions,
    returns: { root: true, type: { count: Number } },
    http: { path: '/updateInfo/:id', verb: 'post' },
  });

  /**
   * 배너 리스트
   * @param filter
   */
  Banner.list = async function(filter, options) {
    const token = ummaUtil.token.getAccessToken(options);

    // 관리자일 경우
    if (token.isAdmin) {
      filter = ummaUtil.filter.validate.limit(filter);
    }
    // 관리자가 아닐 경우
    else {
      filter = ummaUtil.filter.where.add(filter, { display: 1 });
    }

    filter = ummaUtil.filter.order.add(filter, ['sort ASC', 'id ASC']);
    const total = await Banner.count(filter.where);
    const list = await Banner.find(filter);
    return { total: total, limit: filter.limit, skip: filter.skip, list: list };
  };
  Banner.remoteMethod('list', {
    description: '배너 리스트',
    accepts: ummaUtil.remoteMethod.accepts.filterAndOptions,
    returns: { root: true, type: { total: Number, limit: Number, skip: Number, list: ['Banner'] } },
    http: { path: '/list', verb: 'get' },
  });

  /**
   * 배너 노출여부 수정
   * @param param
   * @param options
   */
  Banner.updateDisplayByIds = async function(param, options) {
    const token = ummaUtil.token.getAccessToken(options);
    const ids = param.ids;
    const display = param.display;

    if (!Array.isArray(ids)) throw new ummaError.invalidParam('ids');

    const where = { id: { inq: ids }, display: { neq: display } };
    return await Banner.updateAll(where, {
      adminRoleId: token.roleId,
      adminUserId: token.userId,
      display: display,
      updated: new Date(),
    });
  };
  Banner.remoteMethod('updateDisplayByIds', {
    description: '배너 노출여부 수정',
    notes: 'param {"ids": Array, "display": Number}',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: { count: Number } },
    http: { path: '/updateDisplayByIds', verb: 'post' },
  });

  /**
   * update sort for each banner
   * @param param
   * @param options
   */
  Banner.updateSort = async function(param, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    // 다중 sort 업데아트
    const p = param.map(u => {
      return Banner.updateAll(
        { id: u.id },
        {
          // adminRoleId: token.roleId,
          // adminUserId: token.userId,
          sort: u.sort,
          updated: new Date(),
        }
      );
    });

    await Promise.all(p);
    return true;
  };
  Banner.remoteMethod('updateSort', {
    description: 'update sort for each banner',
    notes: 'param {"ids": Array, "sortIds": Array}',
    accepts: ummaUtil.remoteMethod.accepts.paramArrayAndOptions,
    returns: { root: true, type: Boolean },
    http: { path: '/updateSort', verb: 'post' },
  });
};
