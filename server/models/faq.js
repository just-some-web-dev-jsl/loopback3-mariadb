'use strict';

const ummaUtil = require('../../lib/umma-util');
const ummaError = require('../../lib/umma-error');
const { disableAllMethods } = require('../../lib/loopback-helpers');

let app = {
  umma: require('../../reference'), // 개발 참조용 레퍼런스 파일
};

module.exports = function(Faq) {
  const Model = Faq;
  /**
   * Disable Remote Method
   */
  disableAllMethods(Model, ['count', 'find', 'findOne', 'findById', 'deleteById']);

  // TODO: 등록자 아이다, 수정자 아이디, 삭제자 아이디 등을 토큰에서 읽어 처리해야한다.

  Faq.on('attached', function(a) {
    app = a;

    // override method
    Model.destroyById = Model.deleteById;

    /**
     * FAQ 삭제
     * acl: Admin
     * @param id
     * @param options
     */
    Model.deleteById = async function(id, options) {
      return await Model.deleteByIds([id], options);
    };
    Model.remoteMethod('deleteById', {
      description: 'FAQ 삭제',
      accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
      returns: { root: true, type: { count: Number } },
      http: { path: '/:id', verb: 'delete' },
    });

    /**
     * FAQ 다중 삭제
     * acl: Admin
     * @param ids
     * @param options
     */
    Model.deleteByIds = async function(ids, options) {
      // const token = ummaUtil.token.getAccessToken(options);
      const status = app.umma.commonCode.DATA_STATUS.DELETED;
      const where = { id: { inq: ids }, status: { neq: status } };
      return await Model.updateAll(where, {
        status: status,
        deleted: new Date(),
      });
    };
    Model.remoteMethod('deleteByIds', {
      description: 'FAQ 다중 삭제',
      accepts: ummaUtil.remoteMethod.accepts.idsArrayAndOptions,
      returns: { root: true, type: { count: Number } },
      http: { path: '/deleteByIds', verb: 'post' },
    });
  });
  Faq.on('dataSourceAttached', function() {});

  /**
   * FAQ 상태값 수정
   * acl: Admin
   * @param param
   * @param options
   */
  Faq.updateStatusByIds = async function(param, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    const ids = param.ids;
    const status = param.status;

    // if (Object.values(app.umma.commonCode.DATA_STATUS).indexOf(status) < 0) {
    //   throw new ummaError.invalidParam('status code');
    // }

    const where = { id: { inq: ids }, status: { neq: status } };

    return await Faq.updateAll(where, {
      status: status,
      updated: new Date(),
    });
  };

  Faq.remoteMethod('updateStatusByIds', {
    description: 'FAQ 상태값 수정',
    notes: 'param {"ids": Array, "status": String}',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: { count: Number } },
    http: { path: '/updateStatusByIds', verb: 'post' },
  });

  /**
   * FAQ 등록
   * acl: Admin
   * @param param
   * @param options
   */
  Faq.createFaq = async function(param, options) {
    const token = ummaUtil.token.getAccessToken(options);

    if (Object.values(app.umma.commonCode.FAQ_TYPE).indexOf(param.faqCategory) < 0) {
      throw new ummaError.invalidParam('faq type code');
    }

    // 등록자명 등록을 위한 관리자 회원 데이터 조회
    const admin = await app.models.Admin.findById(token.userId);
    if (!admin) throw new ummaError.forbidden();

    param.roleId = admin.roleId;
    param.userId = admin.userId;
    param.email = admin.email;
    param.firstName = admin.firstName;
    param.lastName = admin.lastName;
    // console.log(param);

    return await Faq.create(param);
  };

  Faq.remoteMethod('createFaq', {
    description: 'FAQ 등록',
    accepts: ummaUtil.remoteMethod.accepts.paramModelAndOptions('Faq'),
    returns: { root: true, type: 'Faq' },
    http: { path: '/createFaq', verb: 'post' },
  });

  /**
   * FAQ 정보 수정
   * acl: Admin
   * @param id
   * @param param
   * @param options
   */
  Faq.updateInfo = async function(id, param, options) {
    // const token = ummaUtil.token.getAccessToken(options);

    const where = { id: id };
    param.updated = new Date();

    return await Faq.updateAll(where, param);
  };

  Faq.remoteMethod('updateInfo', {
    description: 'FAQ 정보 수정',
    accepts: ummaUtil.remoteMethod.accepts.idAndParamObjectAndOptions,
    returns: { root: true, type: { count: Number } },
    http: { path: '/updateInfo/:id', verb: 'post' },
  });
};
