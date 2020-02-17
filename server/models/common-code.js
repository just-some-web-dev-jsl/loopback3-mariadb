'use strict';

const ummaUtil = require('../../lib/umma-util');
const ummaMail = require('../../lib/umma-mail');
const ummaError = require('../../lib/umma-error');
const devUtil = require('../../lib/dev-util');
const { disableAllMethods } = require('../../lib/loopback-helpers');

let app = {
  umma: require('../../reference'), // 개발 참조용 레퍼런스 파일
};

module.exports = function(CommonCode) {
  const Model = CommonCode;
  /**
   * Disable Remote Method
   */
  disableAllMethods(Model, ['count', 'find', 'findOne', 'findById']);

  Model.on('attached', function(a) {
    app = a;
  });
  Model.on('dataSourceAttached', function() {});

  /**
   * 공통 코드 정보 가져오기
   * load into memory
   * @param options
   */
  CommonCode.load = async function(options) {
    try {
      const d = await CommonCode.find({
        order: ['depth ASC', 'parentId ASC'],
      });

      // make to JSON Object
      // commonCodeClient 에는 status: 1 인 것만 넣는다.
      const t1 = {};
      const t2 = {};
      const c1 = {};
      const c2 = {};
      const commonCodeClient2 = {}; // ver.20190715
      const commonCodeClient = {}; // TODO: getCodes 배포 후 제거
      const commonCode = {};
      let io, p1code, p2code, p1name, p2name;

      // -------------------- 공통 코드 수동 추가 -------------------- //
      // TODO: 공통코드 테이블에서 지원하지않는 number 타입 value 값을 유지하기위해 임시로 수동 추가함
      let manualId = 10000;
      let manualParentId = manualId;

      function addCommonCode(manualObejct, code, name, comments, isNumber = false) {
        // add 1 depth
        manualParentId = ++manualId;
        d.push({ id: manualParentId, parentId: 0, depth: 1, code: code, name: name, comments: comments, status: 1 });

        // add 2 depth
        Object.keys(manualObejct).forEach(k => {
          const comments = manualObejct[k];
          const name = comments.toUpperCase().replace(/\s/gi, '_');
          if (isNumber) k = Number(k);
          d.push({ id: ++manualId, parentId: manualParentId, depth: 2, code: k, name: name, comments: comments, status: 1 });
        });
      }

      // ADMIN_ROLE
      addCommonCode(ummaUtil.role.userTypeByRoleId, 'ADMIN_ROLE', 'ADMIN_ROLE', '관리자 롤', true);

      // COMPLETE_STATUS
      const COMPLETE_STATUS = {
        0: 'PAYMENT WAITING',
        1: 'PAYMENT COMPLETE',
        2: 'LOADING ITEMS',
        3: 'ON DELIVERY',
        4: 'ARRIVED',
        5: 'ORDER COMPLETE',
        6: 'ORDER CANCELED',
      };
      addCommonCode(COMPLETE_STATUS, 'COMPLETE_STATUS', 'COMPLETE_STATUS', '주문 진행 상태값', true);

      // const PRODUCT_OPTION_STATUS = { '-1': '삭제', '0': '대기', '1': '승인', '2': '반려' };
      const PRODUCT_OPTION_STATUS = { '0': '미사용', '1': '사용' };
      addCommonCode(PRODUCT_OPTION_STATUS, 'PRODUCT_OPTION_STATUS', 'PRODUCT_OPTION_STATUS', '상품 옵션 상태값');

      const DP = { 1: '노출', 0: '미노출' };
      addCommonCode(DP, 'DP', 'DP', '디스플레이 상태값', true);

      const YN = { Y: '예', N: '아니오' };
      addCommonCode(YN, 'YN', 'YN', 'YN 상태값');

      const TFYN = { 1: '예', 0: '아니오' };
      addCommonCode(TFYN, 'TFYN', 'TFYN', 'TFYN 상태값', true);

      const RT = { 1: '반품 신청', 10: '환불 신청' };
      addCommonCode(RT, 'RT', 'RT', 'RT 상태값', true);

      const URT = { 2: '반품 확인중', 3: '반품 완료', 20: '환불 확인중', 30: '환불 완료' };
      addCommonCode(URT, 'URT', 'URT', 'URT 상태값', true);

      const PS = { '1': '승인', '0': '미확인', '-1': '반려' };
      addCommonCode(PS, 'PS', 'PS', '상품 승인 상태값');

      const OS = { 0: '견적대기', 1: '결제완료', 2: '상품 준비중', 3: '배송중', 4: '배송완료', 5: '주문완료', 6: '주문취소' };
      addCommonCode(OS, 'OS', 'OS', '운영 상태값', true);
      // -------------------- 공통 코드 수동 추가 -------------------- //

      // 데이터 구조화
      for (let i = 0; i < d.length; ++i) {
        io = d[i];
        if (io.depth === 1) {
          if (io.status == 1) {
            if (io.code === 'USER_TYPE') {
              commonCodeClient[io.code] = {};
              // commonCodeClient2
              commonCodeClient2[io.code] = {};
            } else {
              commonCodeClient[io.code] = [];
              // commonCodeClient2
              commonCodeClient2[io.code] = [];
            }
          }

          t1[io.id] = io.code;
          commonCode[io.name] = {};
          c1[io.id] = io.name;
        } else if (io.depth === 2) {
          p1code = t1[io.parentId];
          p1name = c1[io.parentId];

          if (p1code === 'USER_TYPE') {
            if (io.status == 1) {
              commonCodeClient[p1code][io.code] = [];
              // commonCodeClient2
              commonCodeClient2[p1code][io.code] = [];
            }
            t1[io.id] = io.code;
            t2[io.id] = p1code;

            c1[io.id] = io.name;
            c2[io.id] = p1name;
            commonCode[p1name][io.name] = {};
          } else {
            if (io.status == 1) {
              commonCodeClient[p1code].push({
                code: io.code,
                comments: io.comments,
              });
              // commonCodeClient2
              commonCodeClient2[p1code].push({
                value: io.code,
                label: io.comments,
              });
            }

            commonCode[p1name][io.name] = io.code;
          }
        } else if (io.depth === 3) {
          p1code = t2[io.parentId];
          p2code = t1[io.parentId];

          if (io.status == 1) {
            commonCodeClient[p1code][p2code].push({
              code: io.code,
              comments: io.comments,
            });
            // commonCodeClient2
            commonCodeClient2[p1code][p2code].push({
              value: io.code,
              label: io.comments,
            });
          }

          p1name = c2[io.parentId];
          p2name = c1[io.parentId];
          commonCode[p1name][p2name][io.name] = io.code;
        } else {
          throw new ummaError.customMessage(`Not supported commonCode depth: ${io.depth}`);
        }
      }

      // commonCode for server
      app.umma.commonCode = commonCode;
      // console.log('CommonCode load complete', commonCode);

      // commonCode for client
      app.umma.commonCodeClient = commonCodeClient;
      // console.log('CommonCodeClient load complete', commonCodeClient);

      // commonCodeClient2
      app.umma.commonCodeClient2 = commonCodeClient2;
      // console.log('CommonCodeClient load complete', commonCodeClient2);

      // 개발 참조용 레퍼런스 파일 생성
      if (options && options.boot) {
        devUtil.reference.createFile('commonCode', commonCode);
        devUtil.reference.createFile('commonCodeClient', commonCodeClient);
        devUtil.reference.createFile('commonCodeClient2', commonCodeClient2);
      }

      return {
        commonCode: commonCode,
        commonCodeClient: commonCodeClient,
        // commonCodeClient2
        commonCodeClient2: commonCodeClient2,
      };
    } catch (err) {
      throw err;
    }
  };

  /**
   * 공통 코드 데이터
   * JSONP 사용시에는 파라메터 callback을 추가해준다.
   * app.get('jsonp callback name') => callback
   * /get-code-use-client?callback={callbackFunctionName}
   * @param res
   * @param callback
   */
  CommonCode.getCommonCode = async function(res, callback) {
    res.jsonp(app.umma.commonCode);
  };

  CommonCode.remoteMethod('getCommonCode', {
    description: '공통 코드 데이터',
    accepts: [ummaUtil.remoteMethod.accepts.res, ummaUtil.remoteMethod.accepts.callback],
    returns: { root: true, type: 'object' },
    http: { path: '/getCommonCode', verb: 'get' },
  });

  /**
   * 클라이언트용 공통 코드 데이터
   * TODO: getCodes 배포 후 제거
   * JSONP 사용시에는 파라메터 callback을 추가해준다.
   * app.get('jsonp callback name') => callback
   * /get-code-use-client?callback={callbackFunctionName}
   * @param res
   * @param callback
   */
  CommonCode.getCommonCodeClient = async function(res, callback) {
    const data = {
      'common-codes': app.umma.commonCodeClient,
      'common-code-json': app.umma.commonCode,
      brands: await app.models.Brand.getCodes(),
      categories: await app.models.Category.load(),
      courier: await app.models.ShippingCompany.getCodes(),
    };
    res.jsonp(data);
  };

  CommonCode.remoteMethod('getCommonCodeClient', {
    description: '클라이언트용 공통 코드 데이터',
    accepts: [ummaUtil.remoteMethod.accepts.res, ummaUtil.remoteMethod.accepts.callback],
    returns: { root: true, type: 'object' },
    http: { path: '/getCodeUseClient', verb: 'get' },
  });

  /**
   * 클라이언트용 공통 코드 데이터 ver.20190715
   */
  CommonCode.getCodes = async function() {
    return {
      'common-codes': app.umma.commonCodeClient2,
      'common-code-json': app.umma.commonCode,
      s3UploadSizeLimit: ummaUtil.storage.s3UploadSizeLimit,
    };
  };

  CommonCode.remoteMethod('getCodes', {
    description: '클라이언트용 공통 코드 데이터 ver.20190715',
    accepts: [],
    returns: { root: true, type: 'object' },
    http: { path: '/getCodes', verb: 'get' },
  });

  /**
   * 부모 common code 보여주기
   * @param where
   * @param options
   */
  CommonCode.listFirstDepth = async function(where, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    where = { depth: 1 };
    const findParents = await CommonCode.find({ where: where });
    if (findParents.length === 0) throw new ummaError.customMessage('Could not find codes!');
    return findParents;
  };
  CommonCode.remoteMethod('listFirstDepth', {
    description: '부모 common code 보여주기',
    accepts: ummaUtil.remoteMethod.accepts.filterAndOptions,
    returns: { root: true, type: 'CommonCode' },
    http: { path: '/listFirstDepth', verb: 'get' },
  });

  /**
   * 부모 common code 보여주기
   * @param where
   * @param options
   */
  CommonCode.listSecondDepth = async function(where, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    where = { depth: 2 };
    const findParents = await CommonCode.find({ where: where });
    if (findParents.length === 0) throw new ummaError.customMessage('Could not find codes!');
    return findParents;
  };
  CommonCode.remoteMethod('listSecondDepth', {
    description: '부모 common code 보여주기',
    accepts: ummaUtil.remoteMethod.accepts.filterAndOptions,
    returns: { root: true, type: 'CommonCode' },
    http: { path: '/listSecondDepth', verb: 'get' },
  });

  /**
   * search by name
   * @param
   */
  CommonCode.getByName = async function(param) {
    const name = new RegExp(param.name);
    const results = await CommonCode.find({ where: { name: name } });
    return results;
  };
  CommonCode.remoteMethod('getByName', {
    description: 'search by name',
    accepts: ummaUtil.remoteMethod.accepts.paramObject,
    returns: { root: true, type: 'CommonCode' },
    http: { path: '/getByName', verb: 'post' },
  });

  /**
   * 1depth 카운트
   * @param where
   * @param options
   */
  CommonCode.countFirstDepth = async function(where, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    where = { depth: 1, status: 1 };
    return await CommonCode.count(where);
  };
  CommonCode.remoteMethod('countFirstDepth', {
    description: '1depth 카운트',
    accepts: ummaUtil.remoteMethod.accepts.whereAndOptions,
    returns: { root: true, type: Number },
    http: { path: '/countFirstDepth', verb: 'get' },
  });

  /**
   * get children codes
   * @param param
   * @param options
   */
  CommonCode.getChildren = async function(param, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    const parentId = param.parentId;
    const where = { parentId: parentId };
    return await CommonCode.find({ where: where });
  };
  CommonCode.remoteMethod('getChildren', {
    description: 'get children codes',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: 'CommonCode' },
    http: { path: '/getChildren', verb: 'post' },
  });

  /**
   * update common code
   * @param param
   * @param options
   */
  CommonCode.updateInfo = async function(param, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    const id = param.id;
    const name = param.name.toUpperCase();
    const underscoreName = name.replace(/\s/gi, '_');
    const code = param.code.toUpperCase();
    const underscoreCode = code.replace(/\s/gi, '_');
    const date = new Date();
    const status = param.status;
    const findCC = await CommonCode.find({ where: { id: id } });
    if (!findCC) throw new ummaError.customMessage('Cannot find Common Code.');
    return await CommonCode.updateAll(
      { id: id },
      {
        code: underscoreCode,
        name: underscoreName,
        comments: param.comments,
        updated: date,
        status: status,
      }
    );
  };
  CommonCode.remoteMethod('updateInfo', {
    description: 'update common code',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: Number },
    http: { path: '/updateInfo', verb: 'post' },
  });

  /**
   * update status by ids
   * @param param
   * @param options
   */
  CommonCode.updateStatusByIds = async function(param, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    const ids = param.ids;
    const date = new Date();
    const status = param.status;
    const where = { id: { inq: ids }, status: { neq: status } };
    const find = { id: { inq: ids } };
    return await CommonCode.updateAll(where, {
      status: status,
      updated: date,
    });
  };
  CommonCode.remoteMethod('updateStatusByIds', {
    description: 'update status by ids',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: Number },
    http: { path: '/updateStatusByIds', verb: 'post' },
  });

  /**
   * get code for Admin dev tool
   */
  CommonCode.getCodeForAdmin = async function() {
    try {
      const d = await CommonCode.find({});

      const commonCode = [];
      let ct;
      let c = {};

      for (let i = 0; i < d.length; i++) {
        ct = d[i];
        let status = ct.status;
        if (ct.status === 0) {
          status = 'NOT IN USE';
        } else {
          status = 'IN USE';
        }
        c = {
          label: `${ct.name} (${ct.comments}) STATUS: ${status}`,
          id: ct.id,
          data: ct.name,
          code: ct.code,
          expandedIcon: 'pi pi-folder',
          collapsedIcon: 'pi pi-folder-open',
          // parentCode: ct.parentCd,
          name: ct.name,
          depth: ct.depth,
          comments: ct.comments,
          status: ct.status,
          // sort: ct.sort,
          children: [],
        };

        // TODO: 무한 카테고리를 지원하도록 재귀호출 구조로 간결하게 리팩토링 하면 좋을듯.
        if (ct.depth === 1) {
          commonCode.push(c);
        } else if (ct.depth === 2) {
          const p = commonCode.find(function(a) {
            return a.id == ct.parentId;
          });
          if (p && p.children) {
            p.children.push(c);
          }
        } else if (ct.depth === 3) {
          commonCode.some(function(a) {
            const p = a.children.find(function(b) {
              return b.id == ct.parentId;
            });
            if (p && p.children) {
              p.children.push(c);
              return true;
            }
          });
        }
      }
      return commonCode;
    } catch (err) {
      throw err;
    }
  };
  CommonCode.remoteMethod('getCodeForAdmin', {
    description: '관리자 개발도구용 공통코드 데이터',
    accepts: ummaUtil.remoteMethod.accepts.whereAndOptions,
    returns: { root: true, type: 'CommonCode' },
    http: { path: '/getCodeForAdmin', verb: 'get' },
  });

  /**
   * create common code
   * @param param
   * @param options
   */
  CommonCode.createCommonCode = async function(param, options) {
    const token = ummaUtil.token.getAccessToken(options);
    const depth = param.depth;
    let parentId = param.parentId;

    const name = param.name.toUpperCase();
    const underscoreName = name.replace(/\s/gi, '_');
    const code = param.code.toUpperCase();
    const underscoreCode = code.replace(/\s/gi, '_');
    if (depth === 1) {
      parentId = 0;
    } else {
      parentId = param.id;
    }
    if (parentId === 330) {
      await app.models.CommonSite.create({
        type: underscoreName,
        name: underscoreName,
        parentId: 0,
        adminRoleId: token.roleId,
        adminUserId: token.userId,
        depth: 1,
        contents: param.comments,
      });
    }
    await CommonCode.create({
      name: underscoreName,
      code: underscoreCode,
      comments: param.comments,
      status: param.status,
      parentId: parentId,
      depth: param.depth,
    });
    return true;
  };
  CommonCode.remoteMethod('createCommonCode', {
    description: '공통코드 추가',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: Boolean },
    http: { path: '/createCommonCode', verb: 'post' },
  });

  /**
   * destroy common code
   * @id
   * @options
   */
  CommonCode.destroyCode = async function(id, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    await CommonCode.destroyAll({ id: id });
    await CommonCode.destroyAll({ parentId: id });
    return true;
  };
  CommonCode.remoteMethod('destroyCode', {
    description: '공통코드 삭제',
    accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
    returns: { root: true, type: Boolean },
    http: { path: '/destroyCode/:id', verb: 'get' },
  });
};
