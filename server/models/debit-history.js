'use strict';

const logger = require('../../lib/logger')(module);
const ummaUtil = require('../../lib/umma-util');
const ummaError = require('../../lib/umma-error');
const ummaMail = require('../../lib/umma-mail');
const { disableAllMethods } = require('../../lib/loopback-helpers');

let app = {
  umma: require('../../reference'), // 개발 참조용 레퍼런스 파일
};

module.exports = function(DebitHistory) {
  const Model = DebitHistory;
  /**
   * Disable Remote Method
   */
  disableAllMethods(Model, ['count', 'find', 'findById']);

  // TODO: 등록자 아이다, 수정자 아이디, 삭제자 아이디 등을 토큰에서 읽어 처리해야한다.

  Model.on('attached', function(a) {
    app = a;
  });
  Model.on('dataSourceAttached', function() {});

  /**
   * 데빗 추가하기
   * @param param
   * @param options
   */
  DebitHistory.createCredit = async function(param, options) {
    const token = ummaUtil.token.getAccessToken(options);

    if (!param.roleId) throw new ummaError.invalidParam('roleId');
    if (!param.userId) throw new ummaError.invalidParam('userId');

    const findBuyer = await app.models.Buyer.findById(param.userId, {
      fields: { id: true, roleId: true, companyId: true, email: true, firstName: true, lastName: true },
    });
    if (!findBuyer) throw new ummaError.invalidParam(`Buyer not found. userId: ${param.userId}`);

    // 파라미터내 문자열 트림
    param = ummaUtil.parameter.trim(param, ['eventDetail', 'remark', 'comments']);
    param.operatorRoleId = token.roleId;
    param.operatorUserId = token.userId;
    param.userEmail = findBuyer.email;
    param.companyId = findBuyer.companyId;
    param.userName = findBuyer.firstName + ' ' + findBuyer.lastName;
    param.status = 1;
    param.created = new Date();

    // 유저가 데빗이 있으면 기존 밸런스에 새로운 데빗을 추가
    const creditBalance = await DebitHistory.getCreditBalance(param.roleId, param.userId);
    param.creditBalance = creditBalance + Number(param.credit);

    return await DebitHistory.create(param);
  };
  DebitHistory.afterRemote('createCredit', async function(ctx, data) {
    // 메일 발송
    if (data.credit > 0) {
      await ummaMail.debitHistory.add.sendMail(app, data);
    }
  });
  DebitHistory.remoteMethod('createCredit', {
    description: '데빗 추가하기',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: 'DebitHistory' },
    http: { path: '/createCredit', verb: 'post' },
  });

  /**
   * 데빗 기록 조회
   * @param where
   * @param options
   */
  DebitHistory.list = async function(filter, options) {
    const token = ummaUtil.token.getAccessToken(options);

    filter = ummaUtil.filter.where.addOwnerByTokenWithoutAdmin(token, filter);
    filter = ummaUtil.filter.where.add(filter, { status: 1 });

    return await DebitHistory.find(filter);
  };
  DebitHistory.remoteMethod('list', {
    description: '데빗 기록 조회',
    accepts: ummaUtil.remoteMethod.accepts.filterAndOptions,
    returns: { root: true, type: ['DebitHistory'] },
    http: { path: '/list', verb: 'get' },
  });

  /**
   * 데빗 카운트
   * @param where
   * @param options
   */
  DebitHistory.countCredit = async function(where, options) {
    const token = ummaUtil.token.getAccessToken(options);

    where = ummaUtil.where.addOwnerByTokenWithoutAdmin(token, where);
    where = ummaUtil.where.add(where, { status: 1 });

    return await DebitHistory.count(where);
  };
  DebitHistory.remoteMethod('countCredit', {
    description: '크레딧 카운트',
    accepts: ummaUtil.remoteMethod.accepts.whereAndOptions,
    returns: { root: true, type: { count: Number } },
    http: { path: '/countCredit', verb: 'get' },
  });

  // /**
  //  * 관리자용 데빗 카운트
  //  * @param roleId
  //  * @param userId
  //  * @param where
  //  * @param options
  //  */
  // DebitHistory.countDebitForAdmin = async function(roleId, userId, where, options) {
  //   // const token = ummaUtil.token.getAccessToken(options);

  //   where = ummaUtil.where.add(where, { roleId: roleId, userId: userId, status: 1 });

  //   return await DebitHistory.count(where);
  // };
  // DebitHistory.remoteMethod('countDebitForAdmin', {
  //   description: '관리자용 데빗 카운트',
  //   accepts: [
  //     ummaUtil.remoteMethod.accepts.roleId,
  //     ummaUtil.remoteMethod.accepts.userId,
  //     ummaUtil.remoteMethod.accepts.where,
  //     ummaUtil.remoteMethod.accepts.options,
  //   ],
  //   returns: { root: true, type: { count: Number } },
  //   http: { path: '/countDebit/:roleId/:userId', verb: 'get' },
  // });

  /**
   * 현재 데빗 조회 함수
   * @param roleId
   * @param userId
   */
  DebitHistory.getCurrentCredit = async function(roleId, userId) {
    const findDebit = await DebitHistory.findOne({
      where: { roleId: roleId, userId: userId, status: 1 },
      order: 'created DESC',
    });
    return findDebit;
  };

  /**
   * 현재 잔액 조회 함수
   * @param roleId
   * @param userId
   */
  DebitHistory.getCreditBalance = async function(roleId, userId) {
    const findDebit = await DebitHistory.findOne({
      where: { roleId: roleId, userId: userId, status: 1 },
      order: 'created DESC',
      fields: { creditBalance: true },
    });
    return (findDebit && findDebit.creditBalance) || 0;
  };

  /**
   * 로그인한 유저의 현재 잔액 조회
   * acl: Buyer
   * @param options
   */
  DebitHistory.checkBalance = async function(options) {
    const token = ummaUtil.token.getAccessToken(options);
    return await DebitHistory.getCreditBalance(token.roleId, token.userId);
  };
  DebitHistory.remoteMethod('checkBalance', {
    description: '현재 잔액 조회',
    accepts: ummaUtil.remoteMethod.accepts.options,
    returns: { root: true, type: Number },
    http: { path: '/checkBalance', verb: 'get' },
  });

  /**
   * 관리자용 현재 잔액 조회
   * acl: Admin
   * @param roleId
   * @param userId
   * @param options
   */
  DebitHistory.checkBalanceForAdmin = async function(roleId, userId, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    return await DebitHistory.getCreditBalance(roleId, userId);
  };
  DebitHistory.remoteMethod('checkBalanceForAdmin', {
    description: '관리자용 현재 잔액 조회',
    accepts: [ummaUtil.remoteMethod.accepts.roleId, ummaUtil.remoteMethod.accepts.userId, ummaUtil.remoteMethod.accepts.options],
    returns: { root: true, type: Number },
    http: { path: '/checkBalanceForAdmin/:roleId/:userId', verb: 'get' },
  });

  /**
   * 잔액 삭제하기
   * @param roleId
   * @param userId
   */
  DebitHistory.deleteRemaining = async function(roleId, userId, options) {
    const token = ummaUtil.token.getAccessToken(options);

    // 2019 필뷰티 박람회 프로모션
    const promotionId = 1;
    const promotion = await app.models.Promotion.findById(promotionId);
    if (!promotion) throw new ummaError.customMessage(`프로모션을 찾을 수 없습니다. 프로모션 아이디: ${promotionId}`);

    // 해당 프로모션 적립금을 받은 회원인지 확인
    const receivedDebit = await DebitHistory.count({ roleId: roleId, userId: userId, promotionId: promotion.id, credit: { gt: 0 } });
    if (!receivedDebit) throw new ummaError.customMessage('이 회원은 프로모션 적립금을 받은 내역이 없습니다.');

    // 이미 잔액을 삭제한 회원을 다시 삭제할 경우 처리 필요.
    const deletedDebit = await DebitHistory.count({ roleId: roleId, userId: userId, promotionId: promotion.id, credit: { lt: 0 } });
    if (deletedDebit > 0) throw new ummaError.customMessage('이미 프로모션 적립금을 삭제한 회원입니다.');

    const findRemainder = await DebitHistory.getCreditBalance(roleId, userId);
    if (!findRemainder || findRemainder <= 0) throw new ummaError.customMessage('이 회원은 현재 적립금 잔액이 없습니다.');

    const findBuyer = await app.models.Buyer.findById(userId, {
      fields: { id: true, roleId: true, firstName: true, lastName: true, companyId: true, email: true },
    });

    const remainder = findRemainder < promotion.credit ? findRemainder : promotion.credit;
    const creditBalance = findRemainder - remainder;

    const subtractDebit = {
      operatorRoleId: token.roleId,
      operatorUserId: token.userId,
      roleId: roleId,
      userId: userId,
      userEmail: findBuyer.email,
      userName: findBuyer.firstName + ' ' + findBuyer.lastName,
      companyId: findBuyer.companyId,
      promotionId: promotion.id,
      eventDetail: '2019 Summer Promotion: $' + ummaUtil.number.formatMoney(remainder) + ' has expired.',
      credit: remainder * -1,
      creditBalance: creditBalance,
      status: 1,
      created: new Date(),
    };
    await DebitHistory.create(subtractDebit);

    return true;
  };
  DebitHistory.remoteMethod('deleteRemaining', {
    description: '관리자용 회원 잔액 삭제',
    accepts: [ummaUtil.remoteMethod.accepts.roleId, ummaUtil.remoteMethod.accepts.userId, ummaUtil.remoteMethod.accepts.options],
    returns: { root: true, type: Boolean },
    http: { path: '/deleteRemaining/:roleId/:userId', verb: 'post' },
  });
};
