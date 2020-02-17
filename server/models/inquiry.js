'use strict';

const logger = require('../../lib/logger')(module);
const ummaUtil = require('../../lib/umma-util');
const ummaError = require('../../lib/umma-error');
const ummaMail = require('../../lib/umma-mail');
const { disableAllMethods } = require('../../lib/loopback-helpers');

let app = {
  umma: require('../../reference'), // 개발 참조용 레퍼런스 파일
};

module.exports = function(Inquiry) {
  const Model = Inquiry;
  /**
   * Disable Remote Method
   */
  disableAllMethods(Model, ['count', 'find', 'findOne', 'findById', 'deleteById']);

  Model.on('attached', function(a) {
    app = a;

    // override method
    Model.destroyById = Model.deleteById;

    /**
     * 인쿼리 삭제
     * acl: Admin, Buyer
     * @param id
     * @param options
     */
    Model.deleteById = async function(id, options) {
      return await Model.deleteByIds([id], options);
    };
    Model.remoteMethod('deleteById', {
      description: '인쿼리 삭제',
      accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
      returns: { root: true, type: { count: Number } },
      http: { path: '/:id', verb: 'delete' },
    });

    /**
     * 인쿼리 다중 삭제
     * @param ids
     * @param options
     */
    Model.deleteByIds = async function(ids, options) {
      const token = ummaUtil.token.getAccessToken(options);
      const inquiryDelete = 1;
      let where = { id: { inq: ids }, inquiryDelete: { neq: inquiryDelete } };

      // 관리자가 아닌 경우 OWNER 조건 추가
      where = ummaUtil.where.addOwnerByToken(token, where);

      return await Model.updateAll(where, {
        inquiryDelete: inquiryDelete,
        deleted: new Date(),
      });
    };

    Model.remoteMethod('deleteByIds', {
      description: '인쿼리 다중 삭제',
      accepts: ummaUtil.remoteMethod.accepts.idsArrayAndOptions,
      returns: { root: true, type: { count: Number } },
      http: { path: '/deleteByIds', verb: 'post' },
    });
  });
  Model.on('dataSourceAttached', function() {});

  /**
   * 인쿼리 닫기
   * acl: Admin, Buyer
   * @param id
   * @param options
   */
  Inquiry.close = async function(id, options) {
    const token = ummaUtil.token.getAccessToken(options);
    const status = 1;
    let where = { id: id, status: { neq: status } };

    // 관리자가 아닌 경우 OWNER 조건 추가
    where = ummaUtil.where.addOwnerByTokenWithoutAdmin(token, where);

    return await Inquiry.updateAll(where, {
      status: status,
      deleted: new Date(),
    });
  };

  Inquiry.remoteMethod('close', {
    description: '인쿼리 닫기',
    accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
    returns: { root: true, type: { count: Number } },
    http: { path: '/close/:id', verb: 'post' },
  });

  /**
   * 인쿼리 등록
   * acl: Buyer
   * @param req
   * @param param
   * @param options
   */
  Inquiry.createInquiry = async function(req, param, options) {
    const token = ummaUtil.token.getAccessToken(options);

    if (Object.values(app.umma.commonCode.INQUIRY_TYPE).indexOf(param.inquiryType) < 0) {
      throw new ummaError.invalidParam('inquiryType');
    }

    // 파라미터내 JSON 문자열 JSON 객체로 변환
    param = ummaUtil.parameter.toJson(param, ['attachments']);

    // user-ip & user-agent
    param.userIp = req.ip;
    param.userAgent = ummaUtil.string.getUserAgent(req);

    param.roleId = token.roleId;
    param.userId = token.userId;
    param.status = 0;
    param.inquiryDelete = 0;

    return await Inquiry.create(param);
  };

  /**
   * 인쿼리 등록 메일 발송
   */
  Inquiry.afterRemote('createInquiry', async function(ctx, data) {
    try {
      if (data.userId) {
        // 바이어 정보를 가져온다.
        const userInfo = await app.models.Buyer.findById(data.userId);
        if (!userInfo) throw new Error('userInfo not found.');

        // 상품 인쿼리일 경우 상품 상세정보를 가져온다.
        let productInfo;
        if (data.prId && data.inquiryType === app.umma.commonCode.INQUIRY_TYPE.INQUIRY_PRODUCT) {
          productInfo = await app.models.ViewProductDetail2.findById(data.prId);
          if (!productInfo) throw new Error('productInfo not found.');
        }

        // 메일 발송
        await ummaMail.inquiry.regist.sendMail(app, userInfo, productInfo, data);
      }
    } catch (err) {
      logger.error(err, data);
    }
    if (data.inquiryType === app.umma.commonCode.INQUIRY_TYPE.INQUIRY_SYSTEM) {
      const userInfo = await app.models.Buyer.findById(data.userId);
      if (!userInfo) throw new Error('userInfo not found.');
      await ummaMail.inquiry.system.sendMail(app, userInfo, data);
    }
  });

  Inquiry.remoteMethod('createInquiry', {
    description: '인쿼리 등록',
    accepts: [ummaUtil.remoteMethod.accepts.req, ummaUtil.remoteMethod.accepts.paramObject, ummaUtil.remoteMethod.accepts.options],
    returns: { root: true, type: 'Inquiry' },
    http: { path: '/createInquiry', verb: 'post' },
  });

  /**
   * 인쿼리 상세 디테일 라우트
   * acl: Admin, Buyer
   * @param id
   * @param options
   */
  Inquiry.detail = async function(id, options) {
    const token = ummaUtil.token.getAccessToken(options);

    const r = await app.models.ViewInquiry.findById(id);

    if (!r) throw new ummaError.customMessage('Inquiry not found.');

    // 관리자가 아니고 자신의 인쿼리가 아닌 경우 접근 불가
    if (!token.isAdmin) {
      if (r.inquiryRoleId !== token.roleId || r.inquiryUserId !== token.userId) {
        throw new ummaError.forbidden();
      }
    }

    // 삭제 처리된 인쿼리
    if (r.inquiryDeleteStatus === 1) {
      throw new ummaError.deletedInquiry();
    }

    return r;
  };

  Inquiry.remoteMethod('detail', {
    description: '인쿼리 리스트',
    accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
    returns: { root: true, type: 'ViewInquiry' },
    http: { path: '/detail/:id', verb: 'get' },
  });

  /**
   * 인쿼리 읽음표시
   * acl: Admin, Buyer
   * @param id
   * @param options
   */
  Inquiry.isRead = async function(id, options) {
    const token = ummaUtil.token.getAccessToken(options);
    let where = { id: id };

    // 관리자가 아닌 경우 OWNER 조건 추가
    where = ummaUtil.where.addOwnerByTokenWithoutAdmin(token, where);

    return await Inquiry.updateAll(where, { isRead: 1 });
  };

  Inquiry.remoteMethod('isRead', {
    description: '인쿼리 읽음표시',
    accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
    returns: { root: true, type: { count: Number } },
    http: { path: '/isRead/:id', verb: 'post' },
  });

  /**
   * 로그인한 회원 자신의 인쿼리 카운트
   * acl: Buyer
   * @param where
   * @param options
   */
  Inquiry.myCount = async function(where, options) {
    const token = ummaUtil.token.getAccessToken(options);

    where = ummaUtil.where.add(where, {
      inquiryRoleId: token.roleId,
      inquiryUserId: token.userId,
      inquiryDeleteStatus: 0,
    });

    const cnt = await app.models.ViewInquiry.count(where);
    return { count: cnt };
  };

  Inquiry.remoteMethod('myCount', {
    description: '로그인한 회원 자신의 인쿼리 카운트',
    accepts: ummaUtil.remoteMethod.accepts.whereAndOptions,
    returns: { root: true, type: { count: Number } },
    http: { path: '/myCount', verb: 'get' },
  });

  /**
   * 로그인한 회원 자신의 인쿼리 리스트 조회
   * acl: Buyer
   * @param filter
   * @param options
   */
  Inquiry.myList = async function(filter, options) {
    const token = ummaUtil.token.getAccessToken(options);

    filter = ummaUtil.filter.validate.limit(filter);
    filter = ummaUtil.filter.where.add(filter, {
      inquiryRoleId: token.roleId,
      inquiryUserId: token.userId,
      inquiryDeleteStatus: 0,
    });

    return await app.models.ViewInquiry.find(filter);
  };

  Inquiry.remoteMethod('myList', {
    description: '로그인한 회원 자신의 인쿼리 리스트 조회',
    accepts: ummaUtil.remoteMethod.accepts.filterAndOptions,
    returns: { root: true, type: 'ViewInquiry' },
    http: { path: '/myList', verb: 'get' },
  });

  /**
   * 관리자를 위한 라우트. 인쿼리 리스트 전체 다 보기
   * acl: Admin
   * @param filter
   * @param options
   */
  Inquiry.list = async function(filter, options) {
    const token = ummaUtil.token.getAccessToken(options);
    filter = ummaUtil.filter.validate.limit(filter);
    filter = ummaUtil.filter.where.add(filter, {
      // inquiryStatus: 0,
      inquiryDeleteStatus: 0,
    });

    return await app.models.ViewInquiry.find(filter);
  };

  Inquiry.remoteMethod('list', {
    description: '인쿼리 전체 리스트',
    accepts: ummaUtil.remoteMethod.accepts.filterAndOptions,
    returns: { root: true, type: 'ViewInquiry' },
    http: { path: '/list', verb: 'get' },
  });

  /**
   * 인쿼리 전체 카운트
   * acl: Admin
   * @param where
   * @param options
   */
  Inquiry.listCount = async function(where, options) {
    const token = ummaUtil.token.getAccessToken(options);
    where = ummaUtil.where.add(where, {
      // inquiryStatus: 0,
      inquiryDeleteStatus: 0,
    });

    const cnt = await app.models.ViewInquiry.count(where);
    return { count: cnt };
  };

  Inquiry.remoteMethod('listCount', {
    description: '인쿼리 전체 카운트',
    accepts: ummaUtil.remoteMethod.accepts.whereAndOptions,
    returns: { root: true, type: { count: Number } },
    http: { path: '/listCount', verb: 'get' },
  });

  /**
   * 인쿼리 다시 열기
   * acl: Admin, Buyer
   * @param id
   * @param options
   */
  Inquiry.reopen = async function(id, options) {
    const token = ummaUtil.token.getAccessToken(options);
    const status = 0;
    let where = { id: id, status: { neq: status } };

    // 관리자가 아닌 경우 OWNER 조건 추가
    where = ummaUtil.where.addOwnerByTokenWithoutAdmin(token, where);

    return await Inquiry.updateAll(where, {
      status: status,
      updated: new Date(),
    });
  };

  Inquiry.remoteMethod('reopen', {
    description: '인쿼리 다시 열기',
    accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
    returns: { root: true, type: { count: Number } },
    http: { path: '/reopen/:id', verb: 'post' },
  });
};
