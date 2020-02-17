'use strict';

const logger = require('../../lib/logger')(module);
const ummaUtil = require('../../lib/umma-util');
const ummaError = require('../../lib/umma-error');
const { disableAllMethods } = require('../../lib/loopback-helpers');

let app = {
  umma: require('../../reference'), // 개발 참조용 레퍼런스 파일
};
module.exports = function(BuyerShipping) {
  const Model = BuyerShipping;
  /**
   * Disable Remote Method
   */
  disableAllMethods(Model, ['count', 'find', 'findOne', 'findById', 'deleteById']);

  Model.on('attached', function(a) {
    app = a;

    // override method
    Model.destroyById = Model.deleteById;

    /**
     * 바이어 회원 배송지 삭제
     * acl: Admin
     * @param id
     * @param options
     */
    Model.deleteById = async function(id, options) {
      return await Model.deleteByIds([id], options);
    };
    Model.remoteMethod('deleteById', {
      description: '바이어 회원 배송지 삭제',
      accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
      returns: { root: true, type: { count: Number } },
      http: { path: '/:id', verb: 'delete' },
    });

    /**
     * 바이어 회원 배송지 다중 삭제
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
        default: 0,
        deleted: new Date(),
      });
    };

    Model.remoteMethod('deleteByIds', {
      description: '바이어 회원 배송지 다중 삭제',
      accepts: ummaUtil.remoteMethod.accepts.idsArrayAndOptions,
      returns: { root: true, type: { count: Number } },
      http: { path: '/deleteByIds', verb: 'post' },
    });
  });
  Model.on('dataSourceAttached', function() {});

  /**
   * 본인 주소 조회
   * @param filter
   * @param options
   */
  BuyerShipping.myList = async function(filter, options) {
    const token = ummaUtil.token.getAccessToken(options);

    filter = ummaUtil.filter.validate.limit(filter);
    filter = ummaUtil.filter.where.addOwnerByToken(token, filter);
    filter = ummaUtil.filter.where.add(filter, { status: 1 });

    return await app.models.BuyerShipping.find(filter);
  };
  BuyerShipping.remoteMethod('myList', {
    description: '본인 주소 조회',
    accepts: ummaUtil.remoteMethod.accepts.filterAndOptions,
    returns: { root: true, type: 'BuyerShipping' },
    http: { path: '/myList', verb: 'get' },
  });

  /**
   * 바이어 회원 배송지 생성
   * @param param
   * @param options
   */

  BuyerShipping.createAddress = async function(param, options) {
    const token = ummaUtil.token.getAccessToken(options);
    // 파라미터내 문자열 트림
    param = ummaUtil.parameter.trim(param, ['recipientName', 'phone', 'city', 'address1', 'address2', 'zipcode', 'name', 'commnents']);
    param.roleId = token.roleId;
    param.userId = token.userId;
    param.status = 1;
    param.created = new Date();
    if (param.name.length > 20) {
      throw new ummaError.customMessage('Your nickname for your address must be less than 20 characters');
    }

    return await BuyerShipping.create(param);
  };

  BuyerShipping.remoteMethod('createAddress', {
    description: '바이어 회원 배송지 생성',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: 'BuyerShipping' },
    http: { path: '/createAddress', verb: 'post' },
  });

  /**
   * 바이어 회원 배송지 default 정하기
   * @param id
   * @param options
   */
  // 정책 미정으로 인해 임시 사용 중단
  // BuyerShipping.default = async function(id, options) {
  //   const token = ummaUtil.token.getAccessToken(options);
  //   let where = { id: id };

  //   where = ummaUtil.where.addOwnerByTokenWithoutAdmin(token, where);

  //   return await BuyerShipping.updateAll(where, {
  //     defaultAddress: 1,
  //     updated: new Date(),
  //   });
  // };
  // Model.remoteMethod('default', {
  //   description: '바이어 회원 배송지 기본값 정하기',
  //   accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
  //   returns: { root: true, type: { count: Number } },
  //   http: { path: '/default/:id', verb: 'post' },
  // });
};
