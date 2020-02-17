'use strict';

const logger = require('../../lib/logger')(module);
const ummaUtil = require('../../lib/umma-util');
const devUtil = require('../../lib/dev-util');
const ummaError = require('../../lib/umma-error');
const ummaMail = require('../../lib/umma-mail');
const { disableAllMethods } = require('../../lib/loopback-helpers');

let app = {
  umma: require('../../reference'), // 개발 참조용 레퍼런스 파일
};

module.exports = function(ShippingCompany) {
  const Model = ShippingCompany;
  /**
   * Disable Remote Method
   */
  disableAllMethods(Model, ['count', 'find', 'findOne', 'findById', 'deleteById']);

  Model.on('attached', function(a) {
    app = a;

    // override method
    Model.destroyById = Model.deleteById;

    /**
     * 배송사 삭제
     * acl: Admin
     * @param id
     * @param options
     */
    Model.deleteById = async function(id, options) {
      return await Model.deleteByIds([id], options);
    };
    Model.remoteMethod('deleteById', {
      description: '배송사 삭제',
      accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
      returns: { root: true, type: { count: Number } },
      http: { path: '/:id', verb: 'delete' },
    });

    /**
     * 배송사 다중 삭제
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
      description: '배송사 다중 삭제',
      accepts: ummaUtil.remoteMethod.accepts.idsArrayAndOptions,
      returns: { root: true, type: { count: Number } },
      http: { path: '/deleteByIds', verb: 'post' },
    });
  });
  Model.on('dataSourceAttached', function() {});

  /**
   * 배송사 코드 데이터
   */
  ShippingCompany.getCodes = async function() {
    const courier = await ShippingCompany.find({
      fields: { id: true, serviceName: true, companyCode: true },
      where: { status: 1 },
      order: 'serviceName ASC',
    });
    return courier;
  };

  ShippingCompany.remoteMethod('getCodes', {
    description: '배송사 코드 데이터',
    returns: { root: true, type: ['ShippingCompany'] },
    http: { path: '/getCodes', verb: 'get' },
  });

  /**
   * 배송사 사용여부 상태값 변경
   * acl: Admin
   * @param id
   * @param options
   */
  ShippingCompany.approvalById = async function(id, options) {
    return await ShippingCompany.approvalByIds([id], options);
  };

  ShippingCompany.remoteMethod('approvalById', {
    description: '배송사 사용여부 상태값 변경',
    accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
    returns: { root: true, type: { count: Number } },
    http: { path: '/approvalById/:id', verb: 'post' },
  });

  /**
   * 배송사 사용여부 상태값 다중 변경
   * @param ids
   * @param options
   */
  ShippingCompany.approvalByIds = async function(ids, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    const status = 1;
    const where = { id: { inq: ids }, status: { neq: status } };

    return await ShippingCompany.updateAll(where, {
      status: status,
      updated: new Date(),
    });
  };

  ShippingCompany.remoteMethod('approvalByIds', {
    description: '배송사 사용여부 상태값 다중 변경',
    accepts: ummaUtil.remoteMethod.accepts.idsArrayAndOptions,
    returns: { root: true, type: { count: Number } },
    http: { path: '/approvalByIds', verb: 'post' },
  });

  /**
   * 사용가능한 배송사 리스트
   * @param filter
   * @param options
   */
  ShippingCompany.list = async function(filter, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    filter = ummaUtil.filter.where.add(filter, { status: 1 });

    return await ShippingCompany.find(filter);
  };

  ShippingCompany.remoteMethod('list', {
    description: '사용가능한 배송사 리스트',
    accepts: ummaUtil.remoteMethod.accepts.filterAndOptions,
    returns: { root: true, type: ['ShippingCompany'] },
    http: { path: '/list', verb: 'get' },
  });
};
