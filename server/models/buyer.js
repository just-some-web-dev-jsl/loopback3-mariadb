'use strict';

const logger = require('../../lib/logger')(module);
const ummaUtil = require('../../lib/umma-util');
const ummaError = require('../../lib/umma-error');
const ummaMail = require('../../lib/umma-mail');
const { disableAllMethods, executeSql } = require('../../lib/loopback-helpers');

let app = {
  umma: require('../../reference'), // 개발 참조용 레퍼런스 파일
};

module.exports = function(Buyer) {
  const Model = Buyer;

  /**
   * Disable Remote Method
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
    'prototype.__get__shipping',
    'prototype.__findById__shipping',
  ]);

  // NOTES: 일반 회원은 토큰을 확인해서 자신의 정보 외에는 접근 불가하도록 설정 해야한다.

  Model.on('attached', function(a) {
    app = a;

    // override method
    Model.destroyById = Model.deleteById;

    /**
     * 바이어 회원 삭제
     * acl: Admin
     * @param id
     * @param options
     */
    Model.deleteById = async function(id, options) {
      return await Model.deleteByIds([id], options);
    };
    Model.remoteMethod('deleteById', {
      description: '바이어 회원 삭제',
      accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
      returns: { root: true, type: { count: Number } },
      http: { path: '/:id', verb: 'delete' },
    });

    /**
     * 바이어 회원 삭제
     * acl: Admin
     * @param ids
     * @param options
     */
    Model.deleteByIds = async function(ids, options) {
      // const token = ummaUtil.token.getAccessToken(options);
      const status = app.umma.commonCode.USER_STATUS.DELETED;
      const where = { id: { inq: ids }, status: { neq: status } };
      return await Buyer.updateAll(where, {
        status: status,
        deleted: new Date(),
      });
    };
    Model.remoteMethod('deleteByIds', {
      description: '바이어 회원 삭제',
      accepts: ummaUtil.remoteMethod.accepts.idsArrayAndOptions,
      returns: { root: true, type: { count: Number } },
      http: { path: '/deleteByIds', verb: 'post' },
    });
  });
  Model.on('dataSourceAttached', function() {});

  /**
   * 프로모션 적용
   * @param token
   * @param buyers
   */
  Buyer.promotions = async function(token, buyers) {
    // 데이터베이스 트랜잭션
    try {
      await app.dataSources.ummaDs.transaction(async models => {
        const { BuyerPromotion, DebitHistory } = models;

        const date = new Date();

        // 함수: 프로모션 적립금 지급
        async function addPromotionCredit(promotion, buyer) {
          // 이미 해당 프로모션 적립금을 받은 회원인지 확인
          const cnt = await DebitHistory.count({ roleId: buyer.roleId, userId: buyer.id, promotionId: promotion.id, credit: { gt: 0 } });
          // 이미 해당 프로모션 적립금을 받은 회원이면 스킵
          if (cnt > 0) {
            return null;
          }

          // 현재 적립금 잔액
          const creditBalance = await DebitHistory.getCreditBalance(buyer.roleId, buyer.id);

          // 적립금 지급
          const debitHistory = await DebitHistory.create({
            roleId: buyer.roleId,
            userId: buyer.id,
            userName: buyer.firstName + ' ' + buyer.lastName,
            userEmail: buyer.email,
            companyId: buyer.companyId,
            promotionId: promotion.id,
            credit: promotion.credit,
            creditBalance: creditBalance + promotion.credit,
            eventDetail: promotion.eventDetail,
            created: date,
            operatorRoleId: token.roleId,
            operatorUserId: token.userId,
          });

          // 프로모션 적용 여부 업데이트
          await BuyerPromotion.updateAll({ promotionId: promotion.id, userId: buyer.id }, { status: 1, statusUpdated: date });

          return debitHistory;
        }

        // 함수: 프로모션 적용
        async function applyPromotion(buyer) {
          const buyerPromotions = await BuyerPromotion.find({ where: { userId: buyer.id, status: 0 }, include: ['promotion'] });
          const p = [];
          buyerPromotions.forEach(buyerPromotion => {
            buyerPromotion = buyerPromotion.toJSON();
            const promotion = buyerPromotion.promotion;
            // 적립금 지급 프로모션일 경우
            if (promotion && promotion.credit) {
              // 적립금 만료일시가 미설정된 경우 지급 또는 설정된 경우 현재 시간과 비교해서 지급
              // if (!promotion.creditExpired || date < promotion.creditExpired) {
              //  p.push(addPromotionCredit(promotion, buyer));
              // }
              // 승인 시점이 프로모션 기간내일 경우에만 지급
              if (promotion.startDate <= date && promotion.endDate >= date) {
                p.push(addPromotionCredit(promotion, buyer));
              }
            }
            // TODO: 프로모션 종류가 다른 경우 여기에 추가한다.
          });
          return await Promise.all(p);
        }

        const p = buyers.map(buyer => {
          return applyPromotion(buyer);
        });
        const r = await Promise.all(p);
        // console.log(r);
      });
    } catch (err) {
      logger.error(err);
      throw err;
    }
  };

  /**
   * 프로모션 적용
   * @param token
   * @param buyers
   */
  // Buyer.promotion = async function(token, buyers) {
  //   // 데이터베이스 트랜잭션
  //   try {
  //     await app.dataSources.ummaDs.transaction(async models => {
  //       const { DebitHistory } = models;

  //       const date = new Date();

  //       // TODO: 이미 프로모션 적립금을 지급한 회원에게 중복 지급 막기 필요.

  //       // 2019 필뷰티 박람회 프로모션 적립금 지급
  //       const promotionCredit = 50.0;

  //       // 데빗 추가하기
  //       const debitHistory = [];
  //       buyers.forEach(buyer => {
  //         // 2019 필뷰티 박람회 프로모션 기간과 회원가입일시 비교
  //         if (buyer.created >= Date.parse('06/12/2019 00:00:00') && buyer.created < Date.parse('06/19/2019 00:00:00')) {
  //           debitHistory.push({
  //             roleId: buyer.roleId,
  //             userId: buyer.id,
  //             userName: buyer.firstName + ' ' + buyer.lastName,
  //             userEmail: buyer.email,
  //             companyId: buyer.companyId,
  //             promotionId: 0,
  //             credit: promotionCredit,
  //             creditBalance: promotionCredit,
  //             eventDetail: '2019 Summer Promotion: $' + ummaUtil.number.formatMoney(promotionCredit) + ' was added to your account (Expires July 2, 2019)',
  //             created: date,
  //             operatorRoleId: token.roleId,
  //             operatorUserId: token.userId,
  //           });
  //         }
  //       });
  //       await DebitHistory.create(debitHistory);
  //     });
  //   } catch (err) {
  //     logger.error(err);
  //     throw err;
  //   }
  // };

  /**
   * 바이어 회원 가입 승인
   * acl: Admin
   * @param id
   * @param options
   */
  Buyer.approvalById = async function(id, options) {
    const d = await Buyer.approvalByIds([id], options);
    return d[0] || {};
  };

  Buyer.remoteMethod('approvalById', {
    description: '바이어 회원 가입 승인',
    accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
    returns: { root: true, type: 'ViewBuyerUser' },
    http: { path: '/approvalById/:id', verb: 'post' },
  });

  /**
   * 바이어 회원 가입 승인
   * acl: Admin
   * @param ids
   * @param options
   */
  Buyer.approvalByIds = async function(ids, options) {
    const token = ummaUtil.token.getAccessToken(options);

    const status = app.umma.commonCode.USER_STATUS.APPROVAL;
    const date = new Date();
    // 이미 승인된 회원을 중복 업데이트 하지 않도록 status neq 조건을 추가
    const where = { id: { inq: ids }, status: { neq: status } };

    await Buyer.updateAll(where, {
      status: status,
      statusUpdated: date,
      approved: date,
    });

    // 승인 메일 중복 발송을 막기 위해 방금 업데이트 된 회원들만 조회하도록 한다.
    where.status = status;
    where.approved = ummaUtil.date.convertMysqlDateTime(date);
    const getBuyers = await app.models.ViewBuyerUser.find({ where: where });

    // 프로모션 적용
    await Buyer.promotions(token, getBuyers);

    return getBuyers;
  };

  Buyer.remoteMethod('approvalByIds', {
    description: '바이어 회원 가입 승인',
    accepts: ummaUtil.remoteMethod.accepts.idsArrayAndOptions,
    returns: { root: true, type: ['ViewBuyerUser'] },
    http: { path: '/approvalByIds', verb: 'post' },
  });

  // 회원가입 승인 메일 발송
  Buyer.afterRemote('approvalByIds', async function(ctx, data) {
    if (!Array.isArray(data)) data = [data];
    const p = data.map(function(d) {
      return ummaMail.buyer.approval.sendMail(app, d);
    });
    await Promise.all(p);
  });

  /**
   * 바이어 회원 등록
   * @param req
   * @param param
   * @param options
   */
  Buyer.createUser = async function(req, param, options) {
    return await Buyer.createUserCommon(req, param, options);
  };

  Buyer.remoteMethod('createUser', {
    description: '바이어 회원 등록',
    accepts: [ummaUtil.remoteMethod.accepts.req, ummaUtil.remoteMethod.accepts.paramObject, ummaUtil.remoteMethod.accepts.options],
    returns: { root: true, type: Boolean },
    http: { path: '/createUser', verb: 'post' },
  });

  /**
   * 관리자용 바이어 회원 등록
   * acl: Admin
   * @param req
   * @param param
   * @param options
   */
  Buyer.createUserByAdmin = async function(req, param, options) {
    const token = ummaUtil.token.getAccessToken(options);
    if (!param.buyer) throw new ummaError.invalidParam('buyer');

    // 이메일 인증 확인 설정
    param.buyer.emailVerified = 1;
    // 회원 상태코드 승인 확인 설정
    // param.buyer.status = app.umma.commonCode.USER_STATUS.APPROVAL;
    param.buyer.status = app.umma.commonCode.USER_STATUS.WAITING; // 프로모션을 적용하기위해 승인을 거치도록 한다.
    // 등록한 관리자 아이디 설정
    param.buyer.adminRoleId = token.roleId;
    param.buyer.adminUserId = token.userId;

    return await Buyer.createUserCommon(req, param, options);
  };

  Buyer.remoteMethod('createUserByAdmin', {
    description: '관리자용 바이어 회원 등록',
    accepts: [ummaUtil.remoteMethod.accepts.req, ummaUtil.remoteMethod.accepts.paramObject, ummaUtil.remoteMethod.accepts.options],
    returns: { root: true, type: Boolean },
    http: { path: '/createUserByAdmin', verb: 'post' },
  });

  /**
   * 바이어 회원 등록 공통 함수
   * @param req
   * @param param
   * @param options
   */
  Buyer.createUserCommon = async function(req, param, options) {
    // const token = ummaUtil.token.getAccessToken(options);

    // closed beta 초대 받은 회원
    // testing 시 모든 이메일 뒤에 's'하나 추가했음. 오프닝 시 's'제거힌다.
    // const invitedMembers = [
    //   'jie@letsfaceit.net.au',
    //   'sales@kbeautyaustralia.com.au',
    //   'shelcindia@gmail.com',
    //   'randy@wynora.com',
    //   'walter@wako.com.my',
    //   'deuxlai@gmail.com',
    //   'diane@kbeautycafe.com.ph',
    //   'jaehan.park@skincore.co.kr',
    //   'wenfeng@muscbox.com',
    //   'hellosk4u@gmail.com',
    //   'yihui@hush.sg',
    //   'rene_valerie@yahoo.com',
    //   'modu.korea2017@gmail.com',
    //   'agnesstephanieee@yahoo.com',
    //   'ippuniskincare@gmail.com',
    //   'cynthialow@yeoshinbeauty.my',
    //   'laysheen@marshear.com.my',
    //   'shopminhha79nt@gmail.com',
    //   'ggcos.vn@gmail.com',
    //   'myphamlelan@gmail.com',
    //   'imelda@lixibox.com',
    //   'thuhuongrosy51093@gmail.com',
    //   'molypol@list.ru',
    //   '225500@bk.ru',
    //   'shylakhtina@azumail.ru',
    //   'enkhtur.tramfi@gmail.com',
    //   'asylbek_zh@mail.ru',
    //   'dkasym@gmail.ru',
    //   'kirill.tupchy@gmail.com',
    //   'g.bespaeva@bsb.kz',
    //   'johnlee@sincoms.com',
    //   'leeyeahchen@gmail.com',
    //   // 이상준 개인 이메일
    //   'illumeweb@gmail.com',
    //   'joseph@b2link.co.kr',
    //   'meteordev0310@gmail.com',
    // ];
    // 초대받은 회원인지 아닌지 체크한다.
    // if (!invitedMembers.includes(param.buyer.email))
    //   throw new ummaError.customMessage(
    //     'We are currently only accepting limited numbers of members during our beta period. We apologize for the incoveneince.'
    //   );
    // param.buyer = ummaUtil.parameter.trim(param.buyer, ['firstName', 'lastName', 'email']);
    // param.company = ummaUtil.parameter.trim(param.company, ['name', 'ceoFirstName', 'ceoLastName', 'bizNumber', 'city', 'address1', 'address2', 'zipcode']);

    // 파라미터내 문자열 트림
    param.buyer = ummaUtil.parameter.trim(param.buyer, ['firstName', 'lastName', 'email', 'nickName', 'position', 'phone', 'mobile', 'comments']);
    param.company = ummaUtil.parameter.trim(param.company, [
      'name',
      'ceoFirstName',
      'ceoLastName',
      'bizNumber',
      'dunsNumber',
      'phone',
      'fax',
      'city',
      'address1',
      'address2',
      'zipcode',
      'website',
      'comments',
    ]);
    // 파라미터내 JSON 문자열 JSON 객체로 변환
    param.company = ummaUtil.parameter.toJson(param.company, ['attachments']);
    if (!param.buyer) throw new ummaError.invalidParam('buyer');
    if (!param.company) throw new ummaError.invalidParam('company');
    if (!param.buyer.email) throw new ummaError.invalidParam('buyer.email');
    const website = param.company.website || null;
    if (website && website.indexOf('http') !== 0) {
      throw new ummaError.customMessage(
        'Please include either a site protocol of "http://" or "https://" for your "Business URL" in order to authenticate your website. Thank you.'
      );
    }

    if (!param.buyer.password) throw new ummaError.invalidParam('buyer.password');

    // 이메일 주소 체크
    if (!ummaUtil.validate.email(param.buyer.email)) throw new ummaError.invalidParam('buyer.email');
    // 비밀번호 정책 체크
    if (!ummaUtil.validate.password(param.buyer.password)) throw new ummaError.invalidParam('Does not comply with password security policy');

    // 이메일 중복 확인
    const cnt = await Buyer.count({ email: param.buyer.email });
    // 이미 등록된 이메일 주소일 경우
    if (cnt) throw new ummaError.accountEmailExists();

    // user-ip & user-agent
    param.buyer.userIp = req.ip;
    param.buyer.userAgent = ummaUtil.string.getUserAgent(req);

    // 데이터베이스 트랜잭션
    try {
      await app.dataSources.ummaDs.transaction(async models => {
        const { Buyer, BuyerCompany, CustomRoleMapping, Promotion, BuyerPromotion } = models;

        // 바이어 roleId 설정
        param.buyer.roleId = ummaUtil.role.roleIdByName.Buyer;
        // usertype 동기화
        param.buyer.userType = param.company.bizClass;
        // 회사정보 등록
        const company = await BuyerCompany.create(param.company);

        // 회사아이디
        param.buyer.companyId = company.id;

        // 회원 등록
        const user = await Buyer.create(param.buyer);

        // add role mapping
        const roleId = param.buyer.roleId;
        const roleName = ummaUtil.role.roleNamesById[roleId];

        const roleMapping = await CustomRoleMapping.create({
          principalType: roleName,
          principalId: user.id,
          roleId: roleId,
        });

        logger.debug(`${roleName} user assigned.`, roleMapping);

        // 프로모션 적용 (회원 가입일시가 프로모션 기간내 인지 확인)
        const userCreated = ummaUtil.date.convertMysqlDateTime(user.created);
        const promotions = await Promotion.find({ where: { status: 1, startDate: { lte: userCreated }, endDate: { gte: userCreated } } });
        if (promotions && promotions.length) {
          const date = new Date();
          const p = [];
          promotions.forEach(promotion => {
            // 적립금 만료일시가 미설정된 경우 프로모션 적용 추가 또는 설정된 경우 현재 시간과 비교해서 프로모션 적용 추가
            if (!promotion.creditExpired || date < promotion.creditExpired) {
              p.push(
                BuyerPromotion.create({
                  promotionId: promotion.id,
                  userId: user.id,
                  status: 0,
                  created: date,
                })
              );
            }
          });
          const r = await Promise.all(p);
          if (r && r.length) logger.debug(`Buyer promotion applied.`, r);
        }

        // 이메일 인증 확인 설정 체크
        if (param.emailVerified === 1) return;

        // 이메일 인증 메일 발송
        const mailOptions = {
          type: 'email',
          to: user.email,
          from: ummaMail.mailBot.email,
          subject: ummaMail.verify.subject,
          template: ummaMail.verify.template,
          verifyHref: app.get('restApiUrl') + Buyer.http.path + Buyer.sharedClass.findMethodByName('confirm').http.path + '?uid=' + user.id,
          user: user,
        };

        const response = await user.verify(mailOptions);
      });
    } catch (err) {
      logger.error(err);
      throw err;
    }

    return param.buyer;
  };

  Buyer.afterRemote('createUser', async function(ctx, data) {
    await ummaMail.admin.notifyAdminNewUser.sendMail(app, data);
  });

  /**
   * user 빌트인 모델 hook: 인증메일확인페이지
   */
  Buyer.afterRemote('confirm', async function(ctx, userInstance) {
    const url = app.get('buyerUrl');
    ctx.res.render('verified-buyer', { url: url, loginUrl: url + 'auth/login' });
  });

  /**
   * 바이어 회원 이메일 찾기
   * acl: $everyone (모든 사람들이 접근할 수 있는 라우트)
   * @param param
   */
  Buyer.forgotEmail = async function(param) {
    // 파라미터내 문자열 트림
    param = ummaUtil.parameter.trim(param, ['firstName', 'lastName', 'mobile']);

    const d = await Buyer.findOne({
      where: {
        firstName: param.firstName,
        lastName: param.lastName,
        mobile: param.mobile,
      },
    });

    if (!d) throw new ummaError.accountEmailNotFound();

    return ummaUtil.string.maskEmailAddress(d.email);
  };

  Buyer.remoteMethod('forgotEmail', {
    description: '바이어 회원 이메일 찾기',
    accepts: ummaUtil.remoteMethod.accepts.paramModel('ParamForgotEmail'),
    returns: { root: true, type: String },
    http: { path: '/forgotEmail', verb: 'post' },
  });

  /**
   * 바이어 회원 정보 조회
   * acl: Admin
   * @param id
   * @param options
   */
  Buyer.info = async function(id, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    return await app.models.ViewBuyerUser.findById(id, { include: ['debit'] });
  };

  Buyer.remoteMethod('info', {
    description: '바이어 회원 정보 조회',
    accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
    returns: { root: true, type: 'ViewBuyerUser' },
    http: { path: '/info/:id', verb: 'get' },
  });

  /**
   * 자신의 회원 정보 조회
   * acl: Buyer
   * @param options
   */
  Buyer.myInfo = async function(options) {
    const token = ummaUtil.token.getAccessToken(options);
    return await app.models.ViewBuyerUser.findById(token.userId);
  };

  Buyer.remoteMethod('myInfo', {
    description: '자신의 회원 정보 조회',
    accepts: ummaUtil.remoteMethod.accepts.options,
    returns: { root: true, type: 'ViewBuyerUser' },
    http: { path: '/myInfo', verb: 'get' },
  });

  /**
   * 바이어 회원 리스트
   * acl: Admin
   * @param filter
   * @param options
   */
  Buyer.list = async function(filter, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    filter = ummaUtil.filter.validate.limit(filter);
    return await app.models.ViewBuyerUser.find(filter);
  };

  Buyer.remoteMethod('list', {
    description: '바이어 회원 리스트',
    accepts: ummaUtil.remoteMethod.accepts.filterAndOptions,
    returns: { root: true, type: ['ViewBuyerUser'] },
    http: { path: '/list', verb: 'get' },
  });

  /**
   * 바이어 회원 리스트 카운트
   * acl: Admin
   * @param where
   * @param options
   */
  Buyer.listCount = async function(where, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    const cnt = await app.models.ViewBuyerUser.count(where);
    return { count: cnt };
  };

  Buyer.remoteMethod('listCount', {
    description: '바이어 회원 리스트 카운트',
    accepts: ummaUtil.remoteMethod.accepts.whereAndOptions,
    returns: { root: true, type: { count: Number } },
    http: { path: '/listCount', verb: 'get' },
  });

  /**
   * 바이어 회원 로그인
   * acl: $everyone
   * @param param
   */
  Buyer.loginIncludeUserInfo = async function(param) {
    let token = await Buyer.login(param, 'user');
    token = token.toJSON(); // include 데이터가 들어있으면 toJSON()으로 json 객체로 변환해서 사용해야한다.

    // 토큰 만료 시간을 구한다.
    const customAccessToken = await app.models.CustomAccessToken.findById(token.id);
    token.expireDate = new Date(customAccessToken.created);
    token.expireDate.setSeconds(token.expireDate.getSeconds() + customAccessToken.ttl);

    const r = {};
    r.id = token.id;
    r.ttl = token.ttl;
    r.expireDate = token.expireDate;
    r.principalType = token.principal_type;
    r.userId = token.user_id;
    r.user = token.user;

    if (!r.user) {
      const err = new ummaError.customMessage('Buyer.loginIncludeUserInfo: user not found.');
      logger.error(err, { userId: r.userId, principalType: r.principalType });
      throw err;
    }

    if (!r.user.companyId) {
      const err = new ummaError.customMessage('Buyer.loginIncludeUserInfo: companyId not found.');
      logger.error(err, { userId: r.userId, principalType: r.principalType });
      throw err;
    }

    r.user.company = await app.models.BuyerCompany.findById(r.user.companyId);

    if (!r.user.company) {
      const err = new ummaError.customMessage('Buyer.loginIncludeUserInfo: company info not found.');
      logger.error(err, { userId: r.userId, principalType: r.principalType, companyId: r.user.companyId });
      throw err;
    }

    return r;
  };

  // 로그인 요청시 회원 승인 여부 체크
  Buyer.beforeRemote('loginIncludeUserInfo', async function(ctx, unused) {
    const email = ctx.req.body && ctx.req.body.email;
    if (!email) throw new ummaError.invalidParam('email');

    const d = await Buyer.findOne({ where: { email: email }, fields: { status: true } });
    const userStatus = d && d.status;

    // 승인된 회원만 로그인 처리
    if (userStatus !== app.umma.commonCode.USER_STATUS.APPROVAL) {
      throw new ummaError.loginFailedByStatus(app, userStatus);
    }
  });

  Buyer.afterRemote('loginIncludeUserInfo', async function(ctx, userInstance) {
    const user = userInstance && userInstance.user;
    // 로그인 정보가 없을 경우 리턴
    if (!user) return;

    // 로그인 카운트, 최종 로그인 시간 업데이트
    // 루프백 컨넥터에 mysql $inc(increment) extended operator 가 지원되지 않아 다이렉트 쿼리로 구현
    try {
      await executeSql(app.datasources.ummaDs, `UPDATE buyer SET login_count = login_count + 1 WHERE id = '${user.id}'`);
    } catch (err) {
      logger.error(err);
    }
  });

  Buyer.remoteMethod('loginIncludeUserInfo', {
    description: '바이어 회원 로그인',
    accepts: ummaUtil.remoteMethod.accepts.paramModel('ParamLogin'),
    returns: { root: true, type: Object },
    http: { path: '/loginIncludeUserInfo', verb: 'post' },
  });

  /**
   * 바이어 회원 비밀번호 초기화 요청
   * acl: $everyone
   * @param param
   */
  Buyer.passwordResetRequest = async function(param) {
    const email = ummaUtil.string.trim(param.email);
    if (!email) throw new ummaError.invalidParam('email');

    // 회원 상태값 확인
    const where = { email: email };
    const d = await Buyer.findOne({ where: where, fields: { status: true } });
    const userStatus = d && d.status;
    if (!userStatus) throw new ummaError.accountEmailNotExists();

    // 탈퇴한 회원 에러 처리
    if (userStatus === app.umma.commonCode.USER_STATUS.OUT) throw new ummaError.accountWithdrawn();
    // 승인된 회원이 아닌 경우 에러 처리
    else if (userStatus !== app.umma.commonCode.USER_STATUS.APPROVAL) throw new ummaError.passwordResetError();

    await Buyer.resetPassword(where);

    return true;
  };
  /**
   * user 빌트인 모델 events: resetPasswordRequest
   */
  Buyer.on('resetPasswordRequest', async function(data) {
    await ummaMail.buyer.resetPassword.sendMail(app, data);
  });

  Buyer.afterRemote('changePassword', async function(data) {
    await ummaMail.buyer.passwordChange.sendMail(app, data);
  });

  Buyer.remoteMethod('passwordResetRequest', {
    description: '바이어 회원 비밀번호 초기화 요청',
    notes: 'param {"email": String}',
    accepts: ummaUtil.remoteMethod.accepts.paramObject,
    returns: { root: true, type: Boolean },
    http: { path: '/passwordResetRequest', verb: 'post' },
  });

  /**
   * 바이어 회원 가입 거절
   * acl: Admin
   * @param id
   * @param param
   * @param options
   */
  Buyer.refuseById = async function(id, param, options) {
    param.ids = [id];
    const d = await Buyer.refuseByIds(param, options);
    return d[0] || {};
  };

  Buyer.remoteMethod('refuseById', {
    description: '바이어 회원 가입 거절',
    notes: 'param {"comments": String}',
    accepts: ummaUtil.remoteMethod.accepts.idAndParamObjectAndOptions,
    returns: { root: true, type: 'ViewBuyerUser' },
    http: { path: '/refuseById/:id', verb: 'post' },
  });

  /**
   * 바이어 회원 가입 거절
   * acl: Admin
   * @param param
   * @param options
   */
  Buyer.refuseByIds = async function(param, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    // 파라미터내 문자열 트림
    param = ummaUtil.parameter.trim(param, ['comments']);
    const ids = param.ids;
    const comments = param.comments;
    const status = app.umma.commonCode.USER_STATUS.REFUSED;
    const date = new Date();
    // 이미 거절된 회원을 중복 업데이트 하지 않도록 status neq 조건을 추가
    const where = { id: { inq: ids }, status: { neq: status } };

    await Buyer.updateAll(where, {
      status: status,
      statusUpdated: date,
      comments: comments,
    });

    // 거절 메일 중복 발송을 막기 위해 방금 업데이트 된 회원들만 조회하도록 한다.
    where.status = status;
    where.statusUpdated = ummaUtil.date.convertMysqlDateTime(date);
    return await app.models.ViewBuyerUser.find({ where: where });
  };

  Buyer.remoteMethod('refuseByIds', {
    description: '바이어 회원 가입 거절',
    notes: 'param {"ids": Array, "comments": String}',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: ['ViewBuyerUser'] },
    http: { path: '/refuseByIds', verb: 'post' },
  });

  // 회원가입 거절 메일 발송
  Buyer.afterRemote('refuseByIds', async function(ctx, data) {
    if (!Array.isArray(data)) data = [data];
    const p = data.map(function(d) {
      return ummaMail.buyer.refuse.sendMail(app, d);
    });
    await Promise.all(p);
  });

  /**
   * 바이어 회원 정보 수정
   * acl: Admin, Buyer
   * @param param
   * @param options
   */
  Buyer.updateInfo = async function(param, options) {
    const token = ummaUtil.token.getAccessToken(options);
    const buyer = param.buyer;
    const company = param.company;
    if (!buyer.id) throw new ummaError.invalidParam('id');
    if (company && company.website && company.website.indexOf('http') !== 0) {
      throw new ummaError.customMessage('Please include either an site protocol of "http://" or "https://" in order to authenticate your website. Thank you.');
    }
    if (token.isBuyer) {
      // 관리자가 아니면 회사정보를 받지 않는다.
      if (buyer.companyId) throw new ummaError.invalidParam('companyId');
      if (company) throw new ummaError.invalidParam('company');
      // 관리자가 아니고 자신의 정보가 아닌 경우 권한 에러
      if (token.userId !== buyer.id) throw new ummaError.forbidden();
    } else if (token.isAdmin) {
      // 회원회사정보수정
      if (buyer.companyId && company) {
        // 회사정보 수정 권한 확인
        if (!token.isSuperAdmin && !token.isOperationAdmin) throw new ummaError.forbidden();
        await app.models.BuyerCompany.updateAll({ id: buyer.companyId }, company);
      }
    }

    // 회원정보수정
    await Buyer.updateAll({ id: buyer.id }, buyer);

    return await Buyer.findById(buyer.id, { include: 'company' });
  };

  Buyer.remoteMethod('updateInfo', {
    description: '바이어 회원 정보 수정',
    notes: '바이어 param {"buyer": {}} / 관리자 param {"buyer": {}, "company": {}}',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: 'Buyer' },
    http: { path: '/updateInfo', verb: 'post' },
  });

  /**
   * 바이어 회원 상태값 수정
   * acl: Admin
   * @param id
   * @param param
   * @param options
   */
  Buyer.updateStatusById = async function(id, param, options) {
    param.ids = [id];
    const d = await Buyer.updateStatusByIds(param, options);
    return d[0] || {};
  };

  Buyer.remoteMethod('updateStatusById', {
    description: '바이어 회원 상태값 수정',
    notes: 'param {"status": String}',
    accepts: ummaUtil.remoteMethod.accepts.idAndParamObjectAndOptions,
    returns: { root: true, type: 'ViewBuyerUser' },
    http: { path: '/updateStatusById/:id', verb: 'post' },
  });

  /**
   * 바이어 회원 상태값 수정
   * acl: Admin
   * @param param
   * @param options
   */
  Buyer.updateStatusByIds = async function(param, options) {
    const token = ummaUtil.token.getAccessToken(options);
    const ids = param.ids;
    const status = param.status;

    const date = new Date();
    // 중복 업데이트 하지 않도록 status neq 조건을 추가
    const where = { id: { inq: ids }, status: { neq: status } };
    const info = {
      status: status,
      statusUpdated: date,
    };

    // 승인일 경우 승인일시 데이터 추가
    if (status === app.umma.commonCode.USER_STATUS.APPROVAL) {
      info.approved = date;
    }

    await Buyer.updateAll(where, info);

    // 중복 조회를 막기 위해 방금 업데이트 된 회원들만 조회하도록 한다.
    where.status = status;
    where.statusUpdated = ummaUtil.date.convertMysqlDateTime(date);
    const getBuyers = await app.models.ViewBuyerUser.find({ where: where });

    if (status === app.umma.commonCode.USER_STATUS.APPROVAL) {
      // 프로모션 적용
      await Buyer.promotions(token, getBuyers);
    }

    return getBuyers;
  };
  Buyer.remoteMethod('updateStatusByIds', {
    description: '바이어 회원 상태값 수정',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: ['ViewBuyerUser'] },
    http: { path: '/updateStatusByIds', verb: 'post' },
  });

  // 회원가입 승인 메일 발송
  Buyer.afterRemote('updateStatusByIds', async function(ctx, data) {
    if (!Array.isArray(data)) data = [data];
    if (data[0] && data[0].status === app.umma.commonCode.USER_STATUS.APPROVAL) {
      const p = data.map(function(d) {
        return ummaMail.buyer.approval.sendMail(app, d);
      });
      await Promise.all(p);
    }
  });

  /**
   * 바이어 회원 탈퇴 (현재 사용안함)
   * @param options
   */
  Buyer.withdrawal = async function(options) {
    let result = false;
    // 데이터베이스 트랜잭션
    try {
      await app.dataSources.ummaDs.transaction(async models => {
        const { Buyer, CustomAccessToken, CustomRoleMapping } = models;

        const token = ummaUtil.token.getAccessToken(options);
        const userId = token && token.userId;
        if (!userId) throw new ummaError.accessTokenNotFound();

        // 존재하는 회원인지 확인
        const d = await Buyer.findOne({ where: { id: userId }, fields: { status: true } });
        const userStatus = d && d.status;
        if (!userStatus) throw new ummaError.userNotFound();

        // 탈퇴 상태가 아닌 경우 탈퇴 처리
        if (userStatus && userStatus !== app.umma.commonCode.USER_STATUS.OUT) {
          // 해당 유저의 상태를 탈퇴로 변경
          await Buyer.updateAll(
            { id: userId },
            {
              status: app.umma.commonCode.USER_STATUS.OUT,
              statusUpdated: new Date(),
            }
          );

          // 해당 유저의 모든 토큰 삭제
          await CustomAccessToken.destroyAll({ userId: userId, principalType: { like: 'Buyer%' } });

          // 해당 유저의 CustomRoleMapping 삭제
          await CustomRoleMapping.destroyAll({ principalId: userId, principalType: { like: 'Buyer%' } });

          result = true;
        }
      });
    } catch (err) {
      logger.error(err);
      throw err;
    }

    return result;
  };

  Buyer.remoteMethod('withdrawal', {
    description: '바이어 회원 탈퇴',
    accepts: ummaUtil.remoteMethod.accepts.options,
    returns: { root: true, type: Boolean },
    http: { path: '/withdrawal', verb: 'post' },
  });
};
