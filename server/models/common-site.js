'use strict';
const ummaUtil = require('../../lib/umma-util');
const ummaError = require('../../lib/umma-error');
const devUtil = require('../../lib/dev-util');
const { disableAllMethods } = require('../../lib/loopback-helpers');

let app = {
  umma: require('../../reference'), // 개발 참조용 레퍼런스 파일
};

module.exports = function(CommonSite) {
  const Model = CommonSite;
  /**
   * Disable Remote Method
   */
  disableAllMethods(Model, ['count', 'find', 'findOne', 'findById']);

  Model.on('attached', function(a) {
    app = a;
  });

  /**
   * 공통 사이트 정보 가져오기
   * load into memory
   * @param options
   */
  CommonSite.load = async function(options) {
    const d = await CommonSite.find({ fields: { name: true, contents: true } });

    // make to JSON Object
    const commonSite = {};
    let cs;
    for (let i = 0; i < d.length; i += 1) {
      cs = d[i];
      commonSite[cs.name] = cs.contents;
    }

    app.umma.commonSite = commonSite;
    // console.log('CommonSite load complete', commonSite);

    // 개발 참조용 레퍼런스 파일 생성
    if (options && options.boot) {
      devUtil.reference.createFile('commonSite', commonSite);
    }

    return commonSite;
  };

  /**
   * 서버에서 사용하는 공통 사이트 정보
   */
  CommonSite.getCommonSite = async function() {
    return app.umma.commonSite;
  };

  CommonSite.remoteMethod('getCommonSite', {
    description: '서버에서 사용하는 공통 사이트 정보',
    returns: { root: true, type: 'object' },
    http: { path: '/getCommonSite', verb: 'get' },
  });

  // 관리자 패널 도구 기능

  // emergency contact for incoterms

  CommonSite.getIncoContacts = async function() {
    const getContact = await CommonSite.findOne({ where: { type: 'EMERGENCY', depth: 2 } }, { order: 'created DESC' });
    const getWarehouse = await CommonSite.findOne({ where: { type: 'ADDRESS', depth: 2, name: 'WAREHOUSE' } }, { order: 'created DESC' });
    const data = {
      contact: getContact,
      warehouseAddress: getWarehouse,
    };
    return data;
  };

  CommonSite.remoteMethod('getIncoContacts', {
    description: 'emergency contact for incoterms',
    returns: { root: true, type: 'object' },
    http: { path: '/getIncoContacts', verb: 'get' },
  });

  // footer contact address info
  // todo: maybe filter based on site area
  CommonSite.footerInfo = async function() {
    const address = 'ADDRESS';
    const getInfo = await CommonSite.find({ where: { type: address, depth: 2 } }, { order: 'created DESC' });
    return getInfo;
  };
  CommonSite.remoteMethod('footerInfo', {
    description: 'footer contact address info',
    returns: { root: true, type: 'object' },
    http: { path: '/footerInfo', verb: 'get' },
  });

  // get common site information
  /**
   * @param options
   */
  CommonSite.getCommonSiteForAdmin = async function(options) {
    try {
      const d = await CommonSite.find({});

      const commonSite = [];
      let ct;
      let c = {};

      for (let i = 0; i < d.length; i++) {
        ct = d[i];

        c = {
          label: `${ct.name}: ${ct.contents}`,
          id: ct.id,
          data: ct.name,
          title: ct.title,
          expandedIcon: 'pi pi-folder',
          collapsedIcon: 'pi pi-folder-open',
          // parentCode: ct.parentCd,
          name: ct.name,
          depth: ct.depth,
          contents: ct.contents,
          type: ct.type,
          // sort: ct.sort,
          children: [],
        };

        // TODO: 무한 카테고리를 지원하도록 재귀호출 구조로 간결하게 리팩토링 하면 좋을듯.
        if (ct.depth === 1) {
          commonSite.push(c);
        } else if (ct.depth === 2) {
          const p = commonSite.find(function(a) {
            return a.id == ct.parentId;
          });
          if (p && p.children) {
            p.children.push(c);
          }
        } else if (ct.depth === 3) {
          commonSite.some(function(a) {
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
      return commonSite;
    } catch (err) {
      throw err;
    }
  };

  CommonSite.remoteMethod('getCommonSiteForAdmin', {
    description: 'get common site information',
    returns: { root: true, type: 'object' },
    http: { path: '/getCommonSiteForAdmin', verb: 'get' },
  });

  // create common site information
  /**
   * @param param
   * @param options
   */
  CommonSite.createCommonSite = async function(param, options) {
    const token = ummaUtil.token.getAccessToken(options);

    const name = param.name.toUpperCase();
    param.adminRoleId = token.roleId;
    param.adminUserId = token.userId;
    param.name = name;

    if (param.depth === 1) {
      param.parentId = 0;
      param.type = param.name;
    } else {
      // console.log(param);
      param.parentId = param.parentId;
    }

    await CommonSite.create(param);
  };
  CommonSite.remoteMethod('createCommonSite', {
    description: 'create common site information',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: 'CommonSite' },
    http: { path: '/createCommonSite', verb: 'post' },
  });

  /**
   * destroy common code
   * @id
   * @options
   */
  CommonSite.destroyCode = async function(id, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    await CommonSite.destroyAll({ id: id });
    await CommonSite.destroyAll({ parentId: id });
    return true;
  };
  CommonSite.remoteMethod('destroyCode', {
    description: '공통코드 삭제',
    accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
    returns: { root: true, type: Boolean },
    http: { path: '/destroyCode/:id', verb: 'get' },
  });

  /**
   * update status by ids
   * @param param
   * @param options
   */
  CommonSite.updateStatusByIds = async function(param, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    const ids = param.ids;
    const date = new Date();
    const name = param.name.toUpperCase();
    const underscoreName = name.replace(/\s/gi, '_');
    const status = param.status;

    const find = { id: { inq: ids } };

    return await CommonSite.updateAll(find, {
      name: underscoreName,
      status: status,
      placement: param.placement,
      updated: date,
    });
  };
  CommonSite.remoteMethod('updateStatusByIds', {
    description: 'update status by ids',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: Number },
    http: { path: '/updateStatusByIds', verb: 'post' },
  });

  CommonSite.updateInfo = async function(param, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    const id = param.id;
    const name = param.name.toUpperCase();
    const underscoreName = name.replace(/\s/gi, '_');

    const date = new Date();
    const status = param.status;
    const findCC = await CommonSite.find({ where: { id: id } });
    if (!findCC) throw new ummaError.customMessage('Cannot find item you are trying to update. Contact administrators please');
    return await CommonSite.updateAll(
      { id: id },
      {
        name: underscoreName,
        title: param.title,
        placement: param.placement,
        contents: param.contents,
        updated: date,
      }
    );
  };
  CommonSite.remoteMethod('updateInfo', {
    description: 'update common site information',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: Number },
    http: { path: '/updateInfo', verb: 'post' },
  });
};
