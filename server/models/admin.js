/* eslint-disable camelcase */
'use strict';

const logger = require('../../lib/logger')(module);
const ummaUtil = require('../../lib/umma-util');
const ummaError = require('../../lib/umma-error');
const ummaMail = require('../../lib/umma-mail');

const { disableAllMethods, executeSql } = require('../../lib/loopback-helpers');

// currency api
// day formats
const aDay = 1000 * 60 * 60 * 24;
const aWeek = 7 * 1000 * 60 * 60 * 24;
const today = new Date();

let app = {
  umma: require('../../reference'), // 개발 참조용 레퍼런스 파일
};

module.exports = function(Admin) {
  const Model = Admin;
  /**
   * Disable Remote Method
   * 기존 룹백 메서드 비활성화
   */
  disableAllMethods(Model, [
    'logout',
    'confirm',
    'prototype.verify',
    'changePassword',
    'count',
    'find',
    'findOne',
    'findById',
    'deleteById',
    'prototype.__get__accessTokens',
    'prototype.__findById__accessTokens',
    'prototype.__get__company',
  ]);

  Model.on('attached', function(a) {
    app = a;

    // 샘플: 사용자 정의 모델 생성
    // const ds = app.datasources.db;
    // ds.createModel('ParamLogin2', { id: false, email: String, password: String }, { idInjection: false });

    // override method
    // 기존 존재하는 메서드를 override 한다 (deleteById)
    Model.destroyById = Model.deleteById;

    /**
     * 관리자 회원 삭제
     * @param id
     * @param options
     */
    Model.deleteById = async function(id, options) {
      return await Model.deleteByIds([id]);
    };
    Model.remoteMethod('deleteById', {
      description: '관리자 회원 삭제',
      accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
      returns: { root: true, type: { count: Number } },
      http: { path: '/:id', verb: 'delete' },
    });

    /**
     * 관리자 회원 삭제
     * @param ids
     * @param options
     */
    Model.deleteByIds = async function(ids, options) {
      const token = ummaUtil.token.getAccessToken(options);

      // 로그인한 자신의 아이디는 삭제 불가 처리
      if (ids.indexOf(token.userId) > -1) throw new ummaError.customMessage('자신의 계정은 삭제할 수 없습니다.');

      const status = app.umma.commonCode.USER_STATUS.DELETED;
      // 이미 삭제된 회원을 중복 업데이트 하지 않도록 status neq 조건을 추가
      const where = { id: { inq: ids }, status: { neq: status } };

      return await Model.updateAll(where, {
        status: status,
        deleted: new Date(),
      });
    };

    Model.remoteMethod('deleteByIds', {
      description: '관리자 회원 삭제',
      accepts: ummaUtil.remoteMethod.accepts.idsArrayAndOptions,
      returns: { root: true, type: { count: Number } },
      http: { path: '/deleteByIds', verb: 'post' },
    });
  });
  Model.on('dataSourceAttached', function() {});

  /**
   * 대시보드의 요약 집계 데이터
   * acl: Admin
   */
  Admin.dashboard = async function() {
    const p = [];

    // get days opened
    const openDate = new Date('5/08/2019');
    const daysDiff = Math.abs(today.getTime() - openDate.getTime());
    const daysOpened = Math.ceil(daysDiff / aDay);

    // // get proforma
    // const getProformas = app.models.Proforma.count({
    //   created: {
    //     gt: today - aWeek,
    //     lt: today,
    //   },
    // });
    // // get orders
    // const getOrders = app.models.Order.count({
    //   created: {
    //     gt: today - aWeek,
    //     lt: today,
    //   },
    //   status: { neq: 6 },
    // });

    // TODO: DB 부하 최소화를 위해 추후 배치 또는 캐시 서비스로 변경 필요.
    // 등록대기중 상품
    p.push(app.models.Product.count({ status: app.umma.commonCode.PRODUCT_STATUS.WAITING }));
    // 등록대기중 관리자
    p.push(app.models.Admin.count({ status: app.umma.commonCode.USER_STATUS.WAITING, emailVerified: 1 }));
    // 등록대기중 바이어
    p.push(app.models.Buyer.count({ status: app.umma.commonCode.USER_STATUS.WAITING, emailVerified: 1 }));
    // 인쿼리 카운트
    p.push(app.models.Inquiry.count({ status: 0, inquiryDelete: 0 }));
    // days opened
    p.push(daysOpened);
    // number of proformas and orders within the month . conversion rate
    // p.push(getProformas);
    // number of orders
    // p.push(getOrders);
    const d = await Promise.all(p);

    const r = {};
    r.waitProductCount = d[0]; // 등록대기중 상품
    r.waitAdminUsertCount = d[1]; // 등록대기중 관리자
    r.waitBuyerUsertCount = d[2]; // 등록대기중 바이어
    r.waitInquiryCount = d[3]; // 인쿼리 카운트
    // 나중에 적용
    r.daysOpened = d[4];
    // r.getProformas = d[5];
    // r.getOrders = d[6];

    return r;
  };

  Admin.remoteMethod('dashboard', {
    description: '대시보드의 요약 집계 데이터',
    returns: { root: true, type: 'object' },
    http: { path: '/dashboard', verb: 'get' },
  });

  /**
   * 대시보드 최근 인쿼리
   * acl: Admin
   */
  Admin.dashboardInquiry = async function() {
    const r = {};
    // 최근 인쿼리
    r.waitInquiryList = await app.models.Inquiry.find({
      include: ['user'],
      where: { status: 0, inquiryDelete: 0 },
      limit: 10,
      order: 'created DESC',
    });
    return r;
  };

  Admin.remoteMethod('dashboardInquiry', {
    description: '대시보드 최근 인쿼리',
    returns: { root: true, type: 'object' },
    http: { path: '/dashboardInquiry', verb: 'get' },
  });

  /**
   * 대시보드 채널톡 메세지
   * acl: Admin
   */
  Admin.dashboardChat = async function() {
    const r = {};
    // 최근 채널톡 메세지
    r.waitChatList = await app.models.ChannelOpenApi.getRecentMessages({ limit: 100 });
    // 최근 채널톡 메세지 카운트
    r.waitChatCount = r.waitChatList ? r.waitChatList.length : 0;
    return r;
  };

  Admin.remoteMethod('dashboardChat', {
    description: '대시보드 채널톡 메세지',
    returns: { root: true, type: 'object' },
    http: { path: '/dashboardChat', verb: 'get' },
  });

  /**
   * 관리자 회원 가입 승인
   * @param id
   * @param options
   */
  Admin.approvalById = async function(id, options) {
    const d = await Admin.approvalByIds([id], options);
    return d[0] || {};
  };

  Admin.remoteMethod('approvalById', {
    description: '관리자 회원 가입 승인',
    accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
    returns: { root: true, type: 'Admin' },
    http: { path: '/approvalById/:id', verb: 'post' },
  });

  /**
   * 관리자 회원 가입 승인
   * @param ids
   * @param options
   */
  Admin.approvalByIds = async function(ids, options) {
    // const token = ummaUtil.token.getAccessToken(options);

    const status = app.umma.commonCode.USER_STATUS.APPROVAL;
    const date = new Date();
    // 이미 승인된 회원을 중복 업데이트 하지 않도록 status neq 조건을 추가
    const where = { id: { inq: ids }, status: { neq: status } };

    await Admin.updateAll(where, {
      status: status,
      statusUpdated: date,
      approved: date,
    });

    // 승인 메일 중복 발송을 막기 위해 방금 업데이트 된 회원들만 조회하도록 한다.
    where.status = status;
    where.approved = date;
    return await Admin.find({ where: where });
  };

  Admin.remoteMethod('approvalByIds', {
    description: '관리자 회원 가입 승인',
    accepts: ummaUtil.remoteMethod.accepts.idsArrayAndOptions,
    returns: { root: true, type: ['Admin'] },
    http: { path: '/approvalByIds', verb: 'post' },
  });

  // 관리자 회원 가입 승인 메일 발송
  Admin.afterRemote('approvalByIds', async function(ctx, data) {
    if (!Array.isArray(data)) data = [data];
    const p = data.map(function(d) {
      return ummaMail.admin.approval.sendMail(app, d);
    });
    await Promise.all(p);
  });

  /**
   * 회원 비밀번호 변경
   * acl: Admin
   * @param param
   * @param options
   */
  Admin.changeUserPassword = async function(param, options) {
    const token = ummaUtil.token.getAccessToken(options);

    const id = Number.parseInt(param.id);
    const roleId = Number.parseInt(param.roleId);
    const password = ummaUtil.string.trim(param.password);

    if (!id) throw new ummaError.invalidParam('id');
    if (!roleId) throw new ummaError.invalidParam('roleId');
    if (!password) throw new ummaError.invalidParam('password');

    if (token.roleId === roleId && token.userId === id) throw new ummaError.customMessage('Cannot change your own password');

    // 비밀번호 정책 체크
    if (!ummaUtil.validate.password(password)) throw new ummaError.invalidParam('Does not comply with password security policy');

    const roleName = ummaUtil.role.roleNamesById[roleId];
    if (!roleName) throw new ummaError.customMessage(`Role name not found. roleId: ${roleId}`);

    let user = await Admin.findById(id);
    if (param.roleId === 2) {
      user = await app.models.Buyer.findById(id);
    }
    if (!user) throw new ummaError.customMessage(`${roleName} user not found. id: ${id}`);

    // 비밀번호 변경
    // 루프백 내장 함수에서 해당 유저의 토큰을 모두 삭제시킨다.
    await user.updateAttributes({ password: password, passwordUpdated: new Date() });

    return true;
  };

  Admin.remoteMethod('changeUserPassword', {
    description: '회원 비밀번호 변경',
    accepts: ummaUtil.remoteMethod.accepts.paramModelAndOptions('ParamChangeUserPassword'),
    returns: { root: true, type: Boolean },
    http: { path: '/changeUserPassword', verb: 'post' },
  });

  /**
   * 관리자 회원 등록
   * @param req
   * @param param
   * @param options
   */
  Admin.createUser = async function(req, param, options) {
    param.status = app.umma.commonCode.USER_STATUS.WAITING;
    param.passwordUpdated = new Date();
    return await Admin.createUserCommon(req, param, options);
  };

  Admin.remoteMethod('createUser', {
    description: '관리자 회원 등록',
    accepts: [ummaUtil.remoteMethod.accepts.req, ummaUtil.remoteMethod.accepts.paramObject, ummaUtil.remoteMethod.accepts.options],
    returns: { root: true, type: Boolean },
    http: { path: '/createUser', verb: 'post' },
  });

  /**
   * 관리자 회원 등록 - 관리자가 생성시키는 방식
   * @param req
   * @param param
   * @param options
   */
  Admin.createUserByAdmin = async function(req, param, options) {
    const token = ummaUtil.token.getAccessToken(options);

    // 이메일 인증 확인 설정
    param.emailVerified = 1;
    // 등록한 관리자 아이디 설정
    param.adminRoleId = token.roleId;
    param.adminUserId = token.userId;
    param.passwordUpdated = new Date();

    return await Admin.createUserCommon(req, param, options);
  };

  Admin.remoteMethod('createUserByAdmin', {
    description: '관리자용 관리자 회원 등록',
    accepts: [ummaUtil.remoteMethod.accepts.req, ummaUtil.remoteMethod.accepts.paramObject, ummaUtil.remoteMethod.accepts.options],
    returns: { root: true, type: Boolean },
    http: { path: '/createUserByAdmin', verb: 'post' },
  });

  /**
   * 관리자 회원 등록 공통 함수
   * @param req
   * @param param
   * @param options
   */
  Admin.createUserCommon = async function(req, param, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    // 파라미터내 문자열 트림
    param = ummaUtil.parameter.trim(param, ['firstName', 'lastName', 'email', 'nickName', 'position', 'comments']);

    // 이메일 주소 체크
    if (!ummaUtil.validate.email(param.email)) throw new ummaError.invalidParam('email');
    // 비밀번호 정책 체크
    if (!ummaUtil.validate.password(param.password)) throw new ummaError.invalidParam('Does not comply with password security policy');

    // 이메일 중복 확인
    const cnt = await Admin.count({ email: param.email });
    // 이미 등록된 이메일 주소일 경우
    if (cnt) throw new ummaError.accountEmailExists();

    // user-ip & user-agent
    param.userIp = req.ip;
    param.userAgent = ummaUtil.string.getUserAgent(req);

    // 데이터베이스 트랜잭션
    try {
      await app.dataSources.ummaDs.transaction(async models => {
        const { Admin, CustomRoleMapping } = models;

        // 관리자 권한 설정: roleId
        param.roleId = param.roleId || ummaUtil.role.roleIdByName.AdminGradeNormal;
        param.userType = param.userType || ummaUtil.role.userTypeToRoleId[param.roleId];

        // 회사아이디 비투링크로 설정
        param.companyId = 1;

        // 관리자 회원 등록
        const user = await Admin.create(param);

        // add role mapping
        const roleId = param.roleId;
        const roleName = ummaUtil.role.roleNamesById[roleId];

        // 관리자 회원들은 모델명과 동일한 Admin 으로 설정해야한다.
        const roleMappingRoleName = ummaUtil.role.roleNamesById[1];

        const roleMapping = await CustomRoleMapping.create({
          principalType: roleMappingRoleName,
          principalId: user.id,
          roleId: roleId,
        });

        logger.debug(`${roleName} user assigned.`, roleMapping);

        // 이메일 인증 확인 설정 체크
        if (param.emailVerified === 1) return;

        // 이메일 인증 메일 발송
        const mailOptions = {
          type: 'email',
          to: user.email,
          from: ummaMail.mailBot.email,
          subject: ummaMail.verify.subject,
          template: ummaMail.verify.template,
          verifyHref: app.get('restApiUrl') + Admin.http.path + Admin.sharedClass.findMethodByName('confirm').http.path + '?uid=' + user.id,
          user: user,
        };

        const response = await user.verify(mailOptions);
      });
    } catch (err) {
      logger.error(err);
      throw err;
    }

    return true;
  };

  /**
   * user 빌트인 모델 hook: confirm - 인증메일확인페이지
   * acl: $everyone
   */
  Admin.afterRemote('confirm', async function(ctx, userInstance) {
    const url = app.get('adminUrl');
    ctx.res.render('verified-admin', { url: url, loginUrl: url + 'auth/login' });
  });

  /**
   * 관리자 회원 이메일 찾기
   * acl: $everyone
   * @param param
   */
  Admin.forgotEmail = async function(param) {
    // 파라미터내 문자열 트림
    param = ummaUtil.parameter.trim(param, ['firstName', 'lastName', 'mobile']);

    const d = await Admin.findOne({
      where: {
        firstName: param.firstName,
        lastName: param.lastName,
        mobile: param.mobile,
      },
      fields: { email: true },
    });

    if (!d) throw new ummaError.accountEmailNotFound();

    return ummaUtil.string.maskEmailAddress(d.email);
  };

  Admin.remoteMethod('forgotEmail', {
    description: '관리자 회원 이메일 찾기',
    accepts: ummaUtil.remoteMethod.accepts.paramModel('ParamForgotEmail'),
    returns: { root: true, type: String },
    http: { path: '/forgotEmail', verb: 'post' },
  });

  /**
   * 관리자 회원 정보 조회
   * acl: Admin
   * @param id
   * @param options
   */
  Admin.info = async function(id, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    return await app.models.ViewAdminUser.findById(id);
  };

  Admin.remoteMethod('info', {
    description: '관리자 회원 정보 조회',
    accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
    returns: { root: true, type: 'ViewAdminUser' },
    http: { path: '/info/:id', verb: 'get' },
  });

  /**
   * 자신의 회원 정보 조회
   * acl: Admin
   * @param options
   */
  Admin.myInfo = async function(options) {
    const token = ummaUtil.token.getAccessToken(options);

    const filter = {};

    // 슈퍼관리자 또는 운영관리자가 아닐 경우
    if (!token.isSuperAdmin && !token.isOperationAdmin) {
      filter.fields = { adminUserId: false }; // 숨길 필드 설정
    }

    return await app.models.ViewAdminUser.findById(token.userId, filter);
  };

  Admin.remoteMethod('myInfo', {
    description: '자신의 회원 정보 조회',
    accepts: ummaUtil.remoteMethod.accepts.options,
    returns: { root: true, type: 'ViewAdminUser' },
    http: { path: '/myInfo', verb: 'get' },
  });

  /**
   * 자신의 비밀번호 변경
   * @param param
   * @param options
   */
  Admin.changeMyPassword = async function(param, options) {
    const token = ummaUtil.token.getAccessToken(options);
    if (!token.userId) return false;
    console.log(param);
    console.log(token.userId);

    await Admin.changePassword(token.userId, param.oldPassword, param.newPassword);
    await Admin.updateAll({ id: token.userId }, { passwordUpdated: new Date() });
    return true;
  };
  Admin.remoteMethod('changeMyPassword', {
    description: '관리자 회원 본인의 비밀번호 변경',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: Boolean },
    http: { path: '/changeMyPassword', verb: 'post' },
  });

  /**
   * 관리자 회원 리스트
   * acl: Admin
   * @param filter
   * @param options
   */
  Admin.list = async function(filter, options) {
    const token = ummaUtil.token.getAccessToken(options);
    filter = ummaUtil.filter.validate.limit(filter);
    if (token.roleId !== ummaUtil.role.roleIdByName.AdminGradeSuper) {
      filter = ummaUtil.filter.where.add(filter, { userType: { neq: ummaUtil.role.roleTypeByRoleName.AdminGradeSuper } }); // 'SA'
    }
    return await app.models.ViewAdminUser.find(filter);
  };

  Admin.remoteMethod('list', {
    description: '관리자 회원 리스트',
    accepts: ummaUtil.remoteMethod.accepts.filterAndOptions,
    returns: { root: true, type: ['ViewAdminUser'] },
    http: { path: '/list', verb: 'get' },
  });

  /**
   * 관리자 회원 리스트 카운트
   * acl: Admin
   * @param where
   * @param options
   */
  Admin.listCount = async function(where, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    const cnt = await app.models.ViewAdminUser.count(where);
    return { count: cnt };
  };

  Admin.remoteMethod('listCount', {
    description: '관리자 회원 리스트 카운트',
    accepts: ummaUtil.remoteMethod.accepts.whereAndOptions,
    returns: { root: true, type: { count: Number } },
    http: { path: '/listCount', verb: 'get' },
  });

  /**
   * 관리자 회원 로그인
   * acl: $everyone
   * @param param
   */
  Admin.loginIncludeUserInfo = async function(param) {
    let token = await Admin.login(param, 'user');
    token = token.toJSON(); // include 데이터가 들어있으면 toJSON()으로 json 객체로 변환해서 사용해야한다.

    // 관리자 등급을 찾아서 토큰 정보를 업데이트 한다.
    // Admin 모델로 login() 함수를 호출했으므로 모든 관리자가 Admin 권한으로 설정되므로, 해당 관리자의 등급을 찾아 토큰의 권한 정보를 업데이트 해주어야 한다.
    const findAdmin = await Admin.findById(token.user_id, { fields: { userType: true } });
    token.userType = findAdmin.userType;
    const updateResult = await app.models.CustomAccessToken.updateAll({ id: token.id }, { userType: token.userType });
    if (!updateResult || !updateResult.count) {
      // 업데이트가 안되었을 경우 해당 토큰을 삭제한다.
      await Admin.logout(token.id);
      throw new ummaError.customMessage('Admin.loginIncludeUserInfo: token userType update failed.');
    }

    // 토큰 만료 시간을 구한다.
    const customAccessToken = await app.models.CustomAccessToken.findById(token.id);
    token.expireDate = new Date(customAccessToken.created);
    token.expireDate.setSeconds(token.expireDate.getSeconds() + customAccessToken.ttl);

    const r = {};
    r.id = token.id;
    r.ttl = token.ttl;
    r.expireDate = token.expireDate;
    r.principalType = token.principal_type;
    r.userType = token.userType;
    r.userId = token.user_id;
    r.user = token.user;

    if (!r.user) {
      const err = new ummaError.customMessage('Admin.loginIncludeUserInfo: user not found.');
      logger.error(err, { userId: r.userId, principalType: r.principalType });
      throw err;
    }

    if (!r.user.companyId) {
      const err = new ummaError.customMessage('Admin.loginIncludeUserInfo: companyId not found.');
      logger.error(err, { userId: r.userId, principalType: r.principalType });
      throw err;
    }

    r.user.company = await app.models.AdminCompany.findById(r.user.companyId);

    if (!r.user.company) {
      const err = new ummaError.customMessage('Admin.loginIncludeUserInfo: company info not found.');
      logger.error(err, { userId: r.userId, principalType: r.principalType, companyId: r.user.companyId });
      throw err;
    }
    // check if user has updated password in the last 30 days
    const aDay = 1000 * 60 * 60 * 24;
    const lastUpdated = r.user.passwordUpdated || r.user.created;
    const today = new Date();
    const daysDiff = Math.abs(today.getTime() - lastUpdated.getTime());
    const daysOpened = Math.ceil(daysDiff / aDay);
    const updateMessage = { updatePasswordMessage: 1, updatedSince: daysOpened };
    if (daysOpened > 30) {
      r.user = Object.assign(r.user, updateMessage);
    }
    r.user.notification = await app.models.AdminNotification.findOne({ order: 'created DESC', where: { status: 1, endDate: { gt: new Date() } } });
    // console.log(r.user.notification);
    return r;
  };

  // 회원 승인 여부 체크
  Admin.beforeRemote('loginIncludeUserInfo', async function(ctx, unused) {
    const email = ctx.req.body.email;
    if (!email) throw new ummaError.invalidParam('email');

    const d = await Admin.findOne({ where: { email: email }, fields: { status: true } });
    const userStatus = d && d.status;

    // 승인된 회원만 로그인 처리
    if (userStatus !== app.umma.commonCode.USER_STATUS.APPROVAL) {
      throw new ummaError.loginFailedByStatus(app, userStatus);
    }
  });

  Admin.afterRemote('loginIncludeUserInfo', async function(ctx, data) {
    const userId = data && data.userId;
    // 유저 정보가 없을 경우 리턴
    if (!userId) return;

    // 로그인 카운트, 최종 로그인 시간 업데이트
    // 루프백 컨넥터에 mysql $inc(increment) extended operator 가 지원되지 않아 다이렉트 쿼리로 구현
    try {
      await executeSql(app.datasources.ummaDs, `UPDATE admin SET login_count = login_count + 1, last_login = NOW() WHERE id = '${userId}'`);
    } catch (err) {
      logger.error(err);
    }
  });

  Admin.remoteMethod('loginIncludeUserInfo', {
    description: '관리자 회원 로그인',
    accepts: ummaUtil.remoteMethod.accepts.paramModel('ParamLogin'),
    returns: { root: true, type: Object },
    http: { path: '/loginIncludeUserInfo', verb: 'post' },
  });

  /**
   * 관리자 회원 비밀번호 초기화 요청
   * acl: $everyone
   * @param param
   */
  Admin.passwordResetRequest = async function(param) {
    const email = ummaUtil.string.trim(param.email);
    if (!email) throw new ummaError.invalidParam('email');

    // 회원 상태값 확인
    const where = { email: email };
    const d = await Admin.findOne({ where: where, fields: { status: true } });
    const userStatus = d && d.status;
    if (!userStatus) throw new ummaError.accountEmailNotExists();

    // 탈퇴한 회원 에러 처리
    if (userStatus === app.umma.commonCode.USER_STATUS.OUT) throw new ummaError.accountWithdrawn();
    // 승인된 회원이 아닌 경우 에러 처리
    else if (userStatus !== app.umma.commonCode.USER_STATUS.APPROVAL) throw new ummaError.passwordResetError();

    await Admin.resetPassword(where);

    return true;
  };

  Admin.remoteMethod('passwordResetRequest', {
    description: '관리자 회원 비밀번호 초기화 요청',
    notes: 'param {"email": String}',
    accepts: ummaUtil.remoteMethod.accepts.paramObject,
    returns: { root: true, type: Boolean },
    http: { path: '/passwordResetRequest', verb: 'post' },
  });

  /**
   * user 빌트인 모델 events: resetPasswordRequest
   */
  Admin.on('resetPasswordRequest', async function(data) {
    // 비밀번호 초기화 요청 메일 발송
    await ummaMail.admin.resetPassword.sendMail(app, data);
  });

  /**
   * 관리자 회원 가입 거절
   * @param id
   * @param param
   * @param options
   */
  Admin.refuseById = async function(id, param, options) {
    param.ids = [id];
    const d = Admin.refuseByIds(param, options);
    return d[0] || {};
  };

  Admin.remoteMethod('refuseById', {
    description: '관리자 회원 가입 거절',
    notes: 'param {"comments": String}',
    accepts: ummaUtil.remoteMethod.accepts.idAndParamObjectAndOptions,
    returns: { root: true, type: 'Admin' },
    http: { path: '/refuseById/:id', verb: 'post' },
  });

  /**
   * 관리자 회원 가입 거절
   * @param param
   * @param options
   */
  Admin.refuseByIds = async function(param, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    const ids = param.ids;
    const comments = ummaUtil.string.trim(param.comments);

    if (!Array.isArray(ids)) throw new ummaError.invalidParam('ids');

    const status = app.umma.commonCode.USER_STATUS.REFUSED;
    const date = new Date();
    // 이미 거절된 회원을 중복 업데이트 하지 않도록 status neq 조건을 추가
    const where = { id: { inq: ids }, status: { neq: status } };

    await Admin.updateAll(where, {
      status: status,
      statusUpdated: date,
      comments: comments,
    });

    // 거절 메일 중복 발송을 막기 위해 방금 업데이트 된 회원들만 조회하도록 한다.
    where.status = status;
    where.statusUpdated = ummaUtil.date.convertMysqlDateTime(date);
    return await Admin.find({ where: where });
  };

  Admin.remoteMethod('refuseByIds', {
    description: '관리자 회원 가입 거절',
    notes: 'param {"ids": Array, "comments": String}',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: ['Admin'] },
    http: { path: '/refuseByIds', verb: 'post' },
  });

  // 관리자 회원 가입 거절 메일 발송
  Admin.afterRemote('refuseByIds', async function(ctx, data) {
    if (!Array.isArray(data)) data = [data];
    const p = data.forEach(function(d) {
      return ummaMail.admin.refuse.sendMail(app, d);
    });
    await Promise.all(p);
  });

  /**
   * 관리자 회원 정보 수정
   * @param id
   * @param param
   * @param options
   */
  Admin.updateInfo = async function(param, options) {
    const token = ummaUtil.token.getAccessToken(options);
    // 파라미터내 문자열 트림
    param = ummaUtil.parameter.trim(param, ['firstName', 'lastName', 'email', 'nickName', 'position', 'comments']);
    const id = param.id;
    // 슈퍼관리자 또는 운영관리자가 아니면 본인의 정보만 수정 가능
    if (!token.isSuperAdmin && !token.isOperationAdmin) {
      if (id !== token.userId) throw new ummaError.forbidden();
    }

    // 자신의 정보 변경시 관리자 등급 변경은 제거한다.
    if (id === token.userId && param.userType) {
      param.userType = null;
      delete param.userType;
    }

    // 관리자 등급 변경
    if (param.userType) {
      const findAdmin = Admin.findOne({ id: id }, { fields: { roleId: true, userType: true } });
      if (param.userType !== findAdmin.userType) {
        await Admin.changeRoleById(id, param, options);
      }
    }

    if (token.roleId !== ummaUtil.role.roleIdByName.AdminGradeSuper && param.userType === ummaUtil.role.roleTypeByRoleName.AdminGradeSuper)
      throw new ummaError.customMessage('슈퍼관리자 등급으로 변경할 수 없습니다. ');

    // 관리자 정보 업데이트
    param.updated = new Date();
    return await Admin.updateAll({ id: id }, param);
  };

  Admin.remoteMethod('updateInfo', {
    description: '관리자 회원 정보 수정',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: { count: Number } },
    http: { path: '/updateInfo', verb: 'post' },
  });

  /**
   * 관리자 회원 상태값 변경
   * @param id
   * @param param
   * @param options
   */
  Admin.updateStatusById = async function(id, param, options) {
    param.ids = [id];
    return await Admin.updateStatusByIds(param, options);
  };

  Admin.remoteMethod('updateStatusById', {
    description: '관리자 회원 상태값 변경',
    notes: 'param {"status": String}',
    accepts: ummaUtil.remoteMethod.accepts.idAndParamObjectAndOptions,
    returns: { root: true, type: { count: Number } },
    http: { path: '/updateStatusById/:id', verb: 'post' },
  });

  /**
   * 관리자 회원 상태값 변경
   * @param param
   * @param options
   */
  Admin.updateStatusByIds = async function(param, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    const ids = param.ids;
    const status = param.status;

    if (Object.values(app.umma.commonCode.USER_STATUS).indexOf(status) < 0) {
      throw new ummaError.invalidParam('status code');
    }

    const date = new Date();
    // 중복 업데이트 하지 않도록 status neq 조건을 추가
    const where = { id: { inq: ids }, status: { neq: status } };
    const data = {
      status: status,
      statusUpdated: date,
    };

    // 승인일 경우 승인일시 데이터 추가
    if (status === app.umma.commonCode.USER_STATUS.APPROVAL) {
      data.approved = date;
    }

    return await Admin.updateAll(where, data);
  };

  Admin.remoteMethod('updateStatusByIds', {
    description: '관리자 회원 상태값 변경',
    notes: 'param {"ids": Array, "status": String}',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: { count: Number } },
    http: { path: '/updateStatusByIds', verb: 'post' },
  });

  /**
   * 관리자 회원 등급 변경
   * @param id
   * @param param
   * @param options
   */
  Admin.changeRoleById = async function(id, param, options) {
    param.ids = [id];
    return await Admin.changeRoleByIds(param, options);
  };

  Admin.remoteMethod('changeRoleById', {
    description: '관리자 회원 등급 변경',
    notes: 'param {"roleId": Number}',
    accepts: ummaUtil.remoteMethod.accepts.idAndParamObjectAndOptions,
    returns: { root: true, type: { count: Number } },
    http: { path: '/changeRoleById/:id', verb: 'post' },
  });

  /**
   * 관리자 회원 등급 변경
   * @param param
   * @param options
   */
  Admin.changeRoleByIds = async function(param, options) {
    const token = ummaUtil.token.getAccessToken(options);

    if (!param.userType) throw new ummaError.invalidParam('userType');
    if (!Array.isArray(param.ids)) throw new ummaError.invalidParam('ids');
    if (param.ids.indexOf(token.userId) > -1) throw new ummaError.customMessage('자신의 등급은 변경할 수 없습니다.');
    if (token.roleId !== ummaUtil.role.roleIdByName.AdminGradeSuper && param.userType === ummaUtil.role.roleTypeByRoleName.AdminGradeSuper)
      throw new ummaError.customMessage('슈퍼관리자 등급으로 변경할 수 없습니다. ');
    const ids = param.ids;
    const userType = param.userType;
    const roleId = ummaUtil.role.userTypeToRoleId[userType];

    // 관리자 정보 업데이트
    const where = { id: { inq: ids } };
    return await Admin.updateAll(where, { roleId: roleId, userType: userType, updated: new Date() });
  };

  Admin.remoteMethod('changeRoleByIds', {
    description: '관리자 회원 등급 변경',
    notes: 'param {"ids": Array, "roleId": Number}',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: { count: Number } },
    http: { path: '/changeRoleByIds', verb: 'post' },
  });

  /**
   * send notification emails to administrators
   * @param param
   * @param options
   */
  Admin.emailAdmin = async function(param, options) {
    const token = ummaUtil.token.getAccessToken(options);

    if (token.roleId !== ummaUtil.role.roleIdByName.AdminGradeSuper) throw new ummaError.customMessage('Only super administrators can use this feature.');

    const findAdminEmails = await Admin.find({ where: { status: 'A', userType: { neq: ummaUtil.role.roleTypeByRoleName.AdminGradeSuper } } }).map(
      ({ email }) => email
    );

    const data = {
      sendTo: findAdminEmails,
      title: param.title,
      emailType: param.emailType,
      body: param.body,
      created: new Date(),
    };
    return data;
  };
  Admin.remoteMethod('emailAdmin', {
    description: 'send notification emails to administrators',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: { sendTo: [String], title: String, emailType: String, body: String, created: Date } },
    http: { path: '/emailAdmin', verb: 'post' },
  });
  Admin.afterRemote('emailAdmin', async function(ctx, data) {
    await ummaMail.emailAdmin.sendMail(app, data);
  });
};
