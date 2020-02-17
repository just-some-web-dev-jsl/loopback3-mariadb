'use strict';

const ummaUtil = require('../../lib/umma-util');
const ummaError = require('../../lib/umma-error');
const devUtil = require('../../lib/dev-util');
const { disableAllMethods } = require('../../lib/loopback-helpers');

let app = {
  umma: require('../../reference'), // 개발 참조용 레퍼런스 파일
};

module.exports = function(Category) {
  const Model = Category;
  /**
   * Disable Remote Method
   * 기존 룹백 메서드 비활성화
   */
  disableAllMethods(Model, ['count', 'find', 'findOne', 'findById', 'deleteById']);

  Model.on('attached', function(a) {
    app = a;

    // override method
    Model.destroyById = Model.deleteById;

    /**
     * 카테고리 삭제
     * acl: Admin
     * @param id
     * @param options
     */
    Model.deleteById = async function(id, options) {
      return await Model.deleteByIds([id], options);
    };
    Model.remoteMethod('deleteById', {
      description: '카테고리 삭제',
      accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
      returns: { root: true, type: { count: Number } },
      http: { path: '/:id', verb: 'delete' },
    });

    /**
     * 카테고리 다중 삭제
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
      description: '카테고리 다중 삭제',
      accepts: ummaUtil.remoteMethod.accepts.idsArrayAndOptions,
      returns: { root: true, type: { count: Number } },
      http: { path: '/deleteByIds', verb: 'post' },
    });
  });
  Model.on('dataSourceAttached', function() {});

  /**
   * 카테고리 정보 가져오기
   * TODO: getCodes 배포 후 제거
   * @param options
   */
  Category.loadForAdmin = async function(where, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    where = { or: [{ status: app.umma.commonCode.DATA_STATUS.USE }, { status: 'N' }] };

    try {
      const d = await Category.find({
        where: where,
        order: ['code ASC', 'sort ASC'],
      });

      const category = [];
      let ct;
      let c = {};

      for (let i = 0; i < d.length; i++) {
        ct = d[i];
        c = {
          code: ct.code,
          name: ct.name,
          // parentCode: ct.parentCd,
          // sort: ct.sort,
          children: [],
        };

        // TODO: 무한 카테고리를 지원하도록 재귀호출 구조로 간결하게 리팩토링 하면 좋을듯.
        if (ct.depth === 1) {
          category.push(c);
        } else if (ct.depth === 2) {
          const p = category.find(function(a) {
            return a.code == ct.parentCd;
          });
          if (p && p.children) {
            p.children.push(c);
          }
        } else if (ct.depth === 3) {
          category.some(function(a) {
            const p = a.children.find(function(b) {
              return b.code == ct.parentCd;
            });
            if (p && p.children) {
              p.children.push(c);
              return true;
            }
          });
        }
      }

      return category;
    } catch (err) {
      throw err;
    }
  };

  Category.remoteMethod('loadForAdmin', {
    accepts: ummaUtil.remoteMethod.accepts.whereAndOptions,
    returns: { root: true, type: ['Category'] },
    http: { path: '/loadForAdmin', verb: 'get' },
  });

  /**
   * 카테고리 코드 데이터
   * TODO: getCodes 배포 후 제거
   */
  Category.load = async function() {
    const data = await Category.find({
      where: { status: app.umma.commonCode.DATA_STATUS.USE },
      order: ['code ASC', 'sort ASC'],
    });

    const category = [];
    let ct;
    let c = {};

    for (let i = 0; i < data.length; i++) {
      ct = data[i];
      c = {
        code: ct.code,
        name: ct.name,
        // parentCode: ct.parentCd,
        // sort: ct.sort,
        children: [],
      };

      // TODO: 무한 카테고리를 지원하도록 재귀호출 구조로 간결하게 리팩토링 하면 좋을듯.
      if (ct.depth === 1) {
        category.push(c);
      } else if (ct.depth === 2) {
        const p = category.find(function(a) {
          return a.code == ct.parentCd;
        });
        if (p && p.children) {
          p.children.push(c);
        }
      } else if (ct.depth === 3) {
        category.some(function(a) {
          const p = a.children.find(function(b) {
            return b.code == ct.parentCd;
          });
          if (p && p.children) {
            p.children.push(c);
            return true;
          }
        });
      }
    }

    return category;
  };
  Category.remoteMethod('load', {
    description: '카테고리 코드 데이터',
    returns: { root: true, type: ['Category'] },
    http: { path: '/load', verb: 'get' },
  });

  /**
   * 카테고리 코드 데이터 ver.20190715
   */
  Category.getCodes = async function() {
    const data = await Category.find({
      where: { status: app.umma.commonCode.DATA_STATUS.USE },
      order: ['code ASC', 'sort ASC'],
    });

    const category = [];
    let ct;
    let c = {};

    for (let i = 0; i < data.length; i++) {
      ct = data[i];
      c = {
        value: ct.code,
        label: ct.name,
        // parentCode: ct.parentCd,
        // sort: ct.sort,
        children: [],
      };

      // TODO: 무한 카테고리를 지원하도록 재귀호출 구조로 간결하게 리팩토링 하면 좋을듯.
      if (ct.depth === 1) {
        category.push(c);
      } else if (ct.depth === 2) {
        const p = category.find(function(a) {
          return a.value == ct.parentCd;
        });
        if (p && p.children) {
          p.children.push(c);
        }
      } else if (ct.depth === 3) {
        category.some(function(a) {
          const p = a.children.find(function(b) {
            return b.value == ct.parentCd;
          });
          if (p && p.children) {
            p.children.push(c);
            return true;
          }
        });
      }
    }

    return category;
  };
  Category.remoteMethod('getCodes', {
    description: '카테고리 코드 데이터',
    accepts: [],
    returns: { root: true, type: ['Category'] },
    http: { path: '/getCodes', verb: 'get' },
  });

  /**
   * 카테고리 코드 데이터 ver.20190715
   */
  Category.getCodesForAdmin = async function() {
    const data = await Category.find({
      where: { or: [{ status: app.umma.commonCode.DATA_STATUS.USE }, { status: 'N' }] },
      order: ['code ASC', 'sort ASC'],
    });

    const category = [];
    let ct;
    let c = {};

    for (let i = 0; i < data.length; i++) {
      ct = data[i];
      c = {
        value: ct.code,
        label: ct.name,
        // parentCode: ct.parentCd,
        // sort: ct.sort,
        children: [],
      };

      // TODO: 무한 카테고리를 지원하도록 재귀호출 구조로 간결하게 리팩토링 하면 좋을듯.
      if (ct.depth === 1) {
        category.push(c);
      } else if (ct.depth === 2) {
        const p = category.find(function(a) {
          return a.value == ct.parentCd;
        });
        if (p && p.children) {
          p.children.push(c);
        }
      } else if (ct.depth === 3) {
        category.some(function(a) {
          const p = a.children.find(function(b) {
            return b.value == ct.parentCd;
          });
          if (p && p.children) {
            p.children.push(c);
            return true;
          }
        });
      }
    }

    return category;
  };
  Category.remoteMethod('getCodesForAdmin', {
    description: '카테고리 코드 데이터',
    accepts: [],
    returns: { root: true, type: ['Category'] },
    http: { path: '/getCodesForAdmin', verb: 'get' },
  });

  /**
   * 카테고리 정보 등록
   * acl: Admin
   * @param param
   * @param options
   */
  Category.createCategory = async function(param, options) {
    const token = ummaUtil.token.getAccessToken(options);
    // 파라미터내 문자열 트림
    param = ummaUtil.parameter.trim(param, ['name', 'comments']);
    param.adminRoleId = token.roleId;
    param.adminUserId = token.userId;
    param.parentCd = param.parentCd || null;

    const d = await Category.find({
      where: { parentCd: param.parentCd },
      order: 'code DESC',
      limit: 1,
    });

    let nextCode = 1;
    const depthCodeSize = 3;

    if (d.length > 0) {
      const code = d[0].code;
      if (!code && code.length < depthCodeSize) throw new ummaError.catLengthError();

      param.depth = d[0].depth;
      nextCode = parseInt(code.substring((param.depth - 1) * depthCodeSize)) + 1;
    }
    if (param.parentCd !== null) {
      param.code = param.parentCd + nextCode.toString().padStart(depthCodeSize, '0');
    } else {
      const latestParentCode = await Category.findOne({ where: { depth: 1 }, order: 'code DESC' });
      const intCode = parseInt(latestParentCode.code) + 1;
      param.code = intCode.toString().padStart(depthCodeSize, '0');
    }

    return await Category.create(param);
  };

  Category.remoteMethod('createCategory', {
    description: '카테고리 정보 등록',
    accepts: ummaUtil.remoteMethod.accepts.paramModelAndOptions('Category'),
    returns: { root: true, type: 'Category' },
    http: { path: '/createCategory', verb: 'post' },
  });

  /**
   * 카테고리 삭제
   * acl: Admin
   * @param code
   * @param options
   */
  Category.deleteByCode = async function(code, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    if (code.length !== 3 && code.length !== 6 && code.length !== 9) throw new ummaError.invalidParam('category code');

    let where = {
      or: [{ catCd: { like: `${code}%` } }, { catCd2: { like: `${code}%` } }, { catCd3: { like: `${code}%` } }],
    };

    const cnt = await app.models.Product.count(where);
    if (cnt > 0) throw new ummaError.customMessage(`Can not delete this category. code: ${code}, productCount: ${cnt}`);

    where = { code: { regexp: '/^' + code + '/' } };

    return await Category.updateAll(where, {
      status: app.umma.commonCode.DATA_STATUS.DELETED,
      deleted: new Date(),
    });
  };

  Category.remoteMethod('deleteByCode', {
    description: '카테고리 삭제',
    accepts: [{ arg: 'code', type: 'string', required: true, description: '카테고리 코드' }, ummaUtil.remoteMethod.accepts.options],
    returns: { root: true, type: { count: Number } },
    http: { path: '/deleteByCode/:code', verb: 'delete' },
  });

  /**
   * 카테고리 정보 수정
   * acl: Admin
   * @param param
   * @param options
   */
  Category.updateInfo = async function(param, options) {
    const token = ummaUtil.token.getAccessToken(options);
    const where = { code: param.code };
    const status = param.status;
    // 사용여부가 N일경우
    // if(status === 'N') {

    // }
    param.adminRoleId = token.roleId;
    param.adminUserId = token.userId;
    param.updated = new Date();

    return await Category.updateAll(where, param);
  };

  Category.remoteMethod('updateInfo', {
    description: '카테고리 정보 수정',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: { count: Number } },
    http: { path: '/updateInfo', verb: 'post' },
  });

  // get code
  /**
   * @code
   * @options
   */
  Category.getCode = async function(code, options) {
    const selectedCategory = await Category.findOne({ where: { code: code.code } });
    const whereProducts = { and: { or: {} } };

    if (!selectedCategory) throw new ummaError.customMessage('No category!');

    return selectedCategory;
  };
  Category.remoteMethod('getCode', {
    description: 'get code',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: 'Category' },
    http: { path: '/getCode', verb: 'post' },
  });
  /**
   * 5월 8일 이후 사용할 수 있는 기능
   * 카테고리 별로 supply rate 수정
   * @param
   * @options
   */
  Category.updateSupplyRateByCat = async function(param, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    // acls 추가 해야함
    // param = {code: 000000001 , supplyRate: Number}
    const code = param.code;
    const date = new Date();
    const findCode = await Category.find({ where: { code: code } });
    if (!findCode) throw new ummaError.customMessage('There are no categories with code ' + code);
    const rate = { supplyRate: param.supplyRate, updated: date };
    if (rate < 0) throw new ummaError.customMessage('Needs to be larger than 0.');
    if (rate > 100) throw new ummaError.customMessage('Needs to be smaller than 100.');
    const where = { or: [{ catCd: code }, { catCd2: code }, { catCd3: code }] };
    return await app.models.Product.updateAll({ where: where }, rate);
  };
  Category.remoteMethod('updateSupplyRateByCat', {
    description: '카테고리 별로 supply rate 수정',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: { count: Number } },
    http: { path: '/updateSupplyRateByCat', verb: 'post' },
  });

  // category sales chart
  // prototype
  /**
   * @param where
   * @param options
   */
  Category.radarPieData = async function(options) {
    const token = ummaUtil.token.getAccessToken(options);
    const labels = [];
    const codes = [];
    const data = [];
    let r = [];
    try {
      await app.dataSources.ummaDs.transaction(async models => {
        const { Category, OrderProduct } = models;
        const getCategoryFirstDepths = await Category.find({ where: { depth: 1 } });
        getCategoryFirstDepths.forEach(label => {
          labels.push(label.name);
          codes.push(label.code);
        });
        codes.forEach(code => {
          data.push(OrderProduct.count({ catCd1depth: code }));
        });
        r = await Promise.all(data);
      });
    } catch (err) {
      throw err;
    }
    const aDataSet = {
      label: 'Category Sales',
      backgroundColor: 'rgba(179,181,198,0.2)',
      borderColor: 'rgba(179,181,198,1)',
      pointBackgroundColor: 'rgba(179,181,198,1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(179,181,198,1)',
      data: r,
    };
    const response = { labels: labels, datasets: [aDataSet] };

    return response;
  };
  Category.remoteMethod('radarPieData', {
    returns: { root: true, type: 'Array' },
    http: { path: '/radarPieData', verb: 'get' },
  });
};
