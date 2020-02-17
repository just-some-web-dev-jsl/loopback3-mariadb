'use strict';

const logger = require('../../lib/logger')(module);
const ummaUtil = require('../../lib/umma-util');
const ummaError = require('../../lib/umma-error');
const ummaMail = require('../../lib/umma-mail');
const { disableAllMethods } = require('../../lib/loopback-helpers');

let app = {
  umma: require('../../reference'), // 개발 참조용 레퍼런스 파일
};

module.exports = function(ShipmentService) {
  const Model = ShipmentService;
  /**
   * Disable Remote Method
   */
  disableAllMethods(Model, ['count', 'find', 'findOne', 'findById', 'deleteById']);

  Model.on('attached', function(a) {
    app = a;

    // override method
    Model.destroyById = Model.deleteById;

    /**
     * 배송 서비스 삭제
     * acl: Admin
     * @param id
     * @param options
     */
    Model.deleteById = async function(id, options) {
      return await Model.deleteByIds([id], options);
    };
    Model.remoteMethod('deleteById', {
      description: '배송 서비스 삭제',
      accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
      returns: { root: true, type: { count: Number } },
      http: { path: '/:id', verb: 'delete' },
    });

    /**
     * 배송 서비스 다중 삭제
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
      description: '배송 서비스 다중 삭제',
      accepts: ummaUtil.remoteMethod.accepts.idsArrayAndOptions,
      returns: { root: true, type: { count: Number } },
      http: { path: '/deleteByIds', verb: 'post' },
    });
  });
  Model.on('dataSourceAttached', function() {});

  /**
   * 배송 서비스 상태 변경
   * acl: Admin
   * @param id
   * @param options
   */
  ShipmentService.approvalById = async function(id, options) {
    return await ShipmentService.approvalByIds([id], options);
  };

  ShipmentService.remoteMethod('approvalById', {
    description: '배송 서비스 상태 변경',
    accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
    returns: { root: true, type: { count: Number } },
    http: { path: '/approvalById/:id', verb: 'post' },
  });

  /**
   * 다중 배송 서비스 상태 변경
   * @param ids
   * @param options
   */
  ShipmentService.approvalByIds = async function(ids, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    const status = 1;
    const where = { id: { inq: ids }, status: { neq: status } };

    return await ShipmentService.updateAll(where, {
      status: status,
      updated: new Date(),
    });
  };

  ShipmentService.remoteMethod('approvalByIds', {
    description: '다중 배송 서비스 상태 변경',
    accepts: ummaUtil.remoteMethod.accepts.idsArrayAndOptions,
    returns: { root: true, type: { count: Number } },
    http: { path: '/approvalByIds', verb: 'post' },
  });

  /**
   * 배송 서비스 생성/등록
   * @param params
   * @param options
   */
  ShipmentService.createShipment = async function(param, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    param.status = 1;
    param.created = new Date();

    return await ShipmentService.create(param);
  };

  ShipmentService.remoteMethod('createShipment', {
    description: '배송 서비스 생성',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: 'ShipmentService' },
    http: { path: '/createShipment', verb: 'post' },
  });

  /**
   * 배송 서비스 수정
   * @param param
   * @param options
   */
  ShipmentService.updateShipment = async function(param, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    const id = param.id;
    const ship = param.ship;

    const where = { id: id };

    return await ShipmentService.updateAll(where, {
      serviceName: ship.serviceName,
      cost: ship.cost,
      groupOption: ship.groupOption,
      deliveryEstimate: ship.deliveryEstimate,
      updated: new Date(),
    });
  };
  ShipmentService.remoteMethod('updateShipment', {
    description: '배송 서비스 수정',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: { count: Number } },
    http: { path: '/updateShipment', verb: 'post' },
  });

  /**
   * 배송 서비스 리스트
   * @param filter
   * @param options
   */
  ShipmentService.list = async function(filter, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    filter = ummaUtil.filter.where.add(filter, { status: 1 });
    filter.order = 'sort ASC';

    return await ShipmentService.find(filter);
  };

  ShipmentService.remoteMethod('list', {
    description: '배송 서비스 리스트',
    accepts: ummaUtil.remoteMethod.accepts.options,
    returns: { root: true, type: ['ShipmentService'] },
    http: { path: '/list', verb: 'get' },
  });
};
