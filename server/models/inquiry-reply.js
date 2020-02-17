'use strict';

const logger = require('../../lib/logger')(module);
const ummaUtil = require('../../lib/umma-util');
const ummaError = require('../../lib/umma-error');
const ummaMail = require('../../lib/umma-mail');
const { disableAllMethods } = require('../../lib/loopback-helpers');

let app = {
  umma: require('../../reference'), // 개발 참조용 레퍼런스 파일
};

module.exports = function(InquiryReply) {
  const Model = InquiryReply;
  /**
   * Disable Remote Method
   * 기존 룹벡 메서드 비활성화
   */
  disableAllMethods(Model, ['count', 'find', 'findOne', 'findById', 'deleteById']);

  Model.on('attached', function(a) {
    app = a;

    // override method
    Model.destroyById = Model.deleteById;

    /**
     * 인쿼리 답변 삭제
     * acl: Owner, Admin
     * @param id
     * @param options
     */
    Model.deleteById = async function(id, options) {
      const token = ummaUtil.token.getAccessToken(options);
      // 인쿼리가 closed 일 때 삭제가 안됨
      const findInquiryId = await InquiryReply.findOne({ where: { id: id } });
      if (token.userId !== findInquiryId.userId) throw new ummaError.customMessage('This is not your message.');
      const theId = findInquiryId.inquiryId;
      const isItClosed = await app.models.Inquiry.findOne({ where: { id: theId } });
      if (isItClosed.status === 1) throw new ummaError.customMessage('This thread is closed');
      return await InquiryReply.updateAll(
        { id: id },
        {
          replyDelete: 1,
          deleted: new Date(),
        }
      );
    };
    Model.remoteMethod('deleteById', {
      description: '인쿼리 답변 삭제',
      accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
      returns: { root: true, type: { count: Number } },
      http: { path: '/:id', verb: 'delete' },
    });

    /**
     * 인쿼리 답변 다중 삭제
     * acl: Owner, Admin
     * @param ids
     * @param options
     */
    Model.deleteByIds = async function(ids, options) {
      const token = ummaUtil.token.getAccessToken(options);
      const replyDelete = 1;
      let where = { id: { inq: ids }, replyDelete: { neq: replyDelete } };

      // 관리자가 아닌 경우 OWNER 조건 추가
      where = ummaUtil.where.addOwnerByTokenWithoutAdmin(token, where);

      return await Model.updateAll(where, {
        replyDelete: replyDelete,
        deleted: new Date(),
      });
    };
    Model.remoteMethod('deleteByIds', {
      description: '인쿼리 답변 다중 삭제',
      accepts: ummaUtil.remoteMethod.accepts.idsArrayAndOptions,
      returns: { root: true, type: { count: Number } },
      http: { path: '/deleteByIds', verb: 'post' },
    });
  });
  Model.on('dataSourceAttached', function() {});

  /**
   * 인쿼리 답변 등록
   * acl: Buyer
   * @param req
   * @param param
   * @param options
   */
  InquiryReply.createReply = async function(req, param, options) {
    const token = ummaUtil.token.getAccessToken(options);

    if (!param.inquiryId) throw new ummaError.invalidParam('inquiryId');

    // 파라미터내 JSON 문자열 JSON 객체로 변환
    param = ummaUtil.parameter.toJson(param, ['attachments']);

    // user-ip & user-agent
    param.userIp = req.ip;
    param.userAgent = ummaUtil.string.getUserAgent(req);

    param.roleId = token.roleId;
    param.userId = token.userId;
    param.isRead = 0;
    param.replyDelete = 0;

    return await InquiryReply.create(param);
  };
  /**
   * 인쿼리 답변 등록 메일 발송
   */
  InquiryReply.afterRemote('createReply', async function(ctx, data) {
    if (data.roleId === 13 || data.roleId === 11) {
      const inquiryInfo = await app.models.ViewInquiry.findById(data.inquiryId, {
        fields: { registerEmail: true, registerFirstName: true, registerLastName: true, inquirySubject: true, inquiryContents: true, inquiryId: true },
      });
      await ummaMail.inquiry.adminNotifyInquiryReply.sendMail(app, inquiryInfo, data);
    }
    try {
      if (data.userId && data.roleId && data.inquiryId) {
        // 유저 정보를 가져온다.
        let roleName = ummaUtil.role.roleNamesById[data.roleId];
        // 유저 타입 체크값 설정
        data = ummaUtil.role.setIsUserType(data);
        if (data.isAdmin) roleName = 'Admin'; // 관리자 등급 이슈로 모델명 치환
        const inquiryReplyUser = await app.models[roleName].findById(data.userId);
        if (!inquiryReplyUser) throw new Error('inquiryReplyUser not found.');

        // 보낼 대상의 유저 정보를 찾기위해 인쿼리 등록자 정보를 가져온다.
        let inquiry = await app.models.Inquiry.findById(data.inquiryId);
        if (!inquiry) throw new Error('inquiry not found.');

        // 보낼 대상의 유저 정보를 가져온다.
        let inquiryUserRoleName = ummaUtil.role.roleNamesById[inquiry.roleId];
        // 유저 타입 체크값 설정
        inquiry = ummaUtil.role.setIsUserType(inquiry);
        if (inquiry.isAdmin) inquiryUserRoleName = 'Admin'; // 관리자 등급 이슈로 모델명 치환
        const inquiryUser = await app.models[inquiryUserRoleName].findById(inquiry.userId);
        if (!inquiryUser) throw new Error('inquiryUser not found.');

        // 메일 발송
        await ummaMail.inquiry.reply.sendMail(app, inquiryReplyUser, inquiryUser, data);
      }
    } catch (err) {
      logger.error(err, data);
    }
  });

  InquiryReply.remoteMethod('createReply', {
    description: '인쿼리 답변 등록',
    accepts: [ummaUtil.remoteMethod.accepts.req, ummaUtil.remoteMethod.accepts.paramObject, ummaUtil.remoteMethod.accepts.options],
    returns: { root: true, type: 'InquiryReply' },
    http: { path: '/createReply', verb: 'post' },
  });

  /**
   * 인쿼리 답변 가져오기
   * @param id
   * @param options
   */
  InquiryReply.getReplies = async function(id, options) {
    const token = ummaUtil.token.getAccessToken(options);
    const where = { inquiryId: id, replyDelete: 0 };

    // 관리자가 아닌 경우
    if (!token.isAdmin) {
      // 자신의 인쿼리 인지 권한 체크
      const inquiryInfo = await app.models.Inquiry.findById(id);
      if (!inquiryInfo) throw new ummaError.customMessage('Inquiry not found.');
      // 자신의 인쿼리가 아니면 에러
      if (!token.isOwner(inquiryInfo)) throw new ummaError.forbidden();
    }

    return await InquiryReply.find({ where: where });
  };

  InquiryReply.remoteMethod('getReplies', {
    description: '인쿼리 답변 가져오기',
    accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
    returns: { root: true, type: ['InquiryReply'] },
    http: { path: '/getReplies/:id', verb: 'get' },
  });
};
