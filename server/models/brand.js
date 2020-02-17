'use strict';

const ummaUtil = require('../../lib/umma-util');
const logger = require('../../lib/logger')(module);
const ummaError = require('../../lib/umma-error');
const devUtil = require('../../lib/dev-util');
const { disableAllMethods } = require('../../lib/loopback-helpers');

let app = {
  umma: require('../../reference'), // 개발 참조용 레퍼런스 파일
};

module.exports = function(Brand) {
  const Model = Brand;
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
     * 브랜드 삭제
     * acl: Admin
     * @param id
     * @param options
     */
    Model.deleteById = async function(id, options) {
      return await Model.deleteByIds([id], options);
    };
    Model.remoteMethod('deleteById', {
      description: '브랜드 삭제',
      accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
      returns: { root: true, type: { count: Number } },
      http: { path: '/:id', verb: 'delete' },
    });

    /**
     * 브랜드 다중 삭제
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
      description: '브랜드 다중 삭제',
      accepts: ummaUtil.remoteMethod.accepts.idsArrayAndOptions,
      returns: { root: true, type: { count: Number } },
      http: { path: '/deleteByIds', verb: 'post' },
    });
  });
  Model.on('dataSourceAttached', function() {});

  /**
   * 브랜드 코드 데이터
   */
  Brand.getCodes = async function() {
    const data = await Brand.find({
      fields: { id: true, name: true, logo: true },
      where: { status: app.umma.commonCode.DATA_STATUS.USE },
      order: ['name ASC', 'sort ASC'],
    });
    return data;
  };

  Brand.remoteMethod('getCodes', {
    description: '브랜드 데이터',
    accepts: [],
    returns: { root: true, type: ['Brand'] },
    http: { path: '/getCodes', verb: 'get' },
  });

  /**
   * 브랜드 정보 등록
   * @param param
   * @param options
   */
  Brand.createBrand = async function(param, options) {
    const token = ummaUtil.token.getAccessToken(options);
    // 파라미터내 문자열 트림
    param = ummaUtil.parameter.trim(param, ['name', 'comments', 'website', 'logo', 'detailBannerUrl', 'detailMedia', 'detailHtml']);
    param.roleId = token.roleId;
    param.userId = token.userId;
    param.detailMedia = param.detailMedia
      ? `<iframe width="560" height="315" src="https://www.youtube.com/embed/${
          param.detailMedia.split('v=')[1]
        }" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`
      : null;
    param.created = new Date();

    return await Brand.create(param);
  };

  Brand.remoteMethod('createBrand', {
    description: '브랜드 정보 등록',
    accepts: ummaUtil.remoteMethod.accepts.paramModelAndOptions('Brand'),
    returns: { root: true, type: 'Brand' },
    http: { path: '/createBrand', verb: 'post' },
  });

  /**
   * 브랜드 리스트
   * @param filter
   */
  Brand.list = async function(filter) {
    filter = ummaUtil.filter.where.add(filter, { status: app.umma.commonCode.DATA_STATUS.USE });
    filter = ummaUtil.filter.order.add(filter, ['name ASC', 'sort ASC']);
    return await Brand.find(filter);
  };
  Brand.remoteMethod('list', {
    description: '브랜드 리스트',
    accepts: ummaUtil.remoteMethod.accepts.filter,
    returns: { root: true, type: ['Brand'] },
    http: { path: '/list', verb: 'get' },
  });

  /**
   * 파트너 브랜드 리스트
   * @param filter
   */
  Brand.getBrandForIntroduce = async function(filter) {
    filter = ummaUtil.filter.where.add(filter, { status: app.umma.commonCode.DATA_STATUS.USE });
    filter = ummaUtil.filter.where.add(filter, { isPartnerBrand: 1 });
    return await Brand.find(filter);
  };
  Brand.remoteMethod('getBrandForIntroduce', {
    description: '파트너 브랜드 리스트',
    accepts: ummaUtil.remoteMethod.accepts.filter,
    returns: { root: true, type: ['Brand'] },
    http: { path: '/getBrandForIntroduce', verb: 'get' },
  });

  /**
   * PIMS의 브랜드마스터를 조회한다.
   * acl: Admin
   * @param {String} brandName
   * @param {String} page
   <test>
   http://222.239.10.123:44320/brand/brand_basic/getSearchList?&db_nm=brand&col_nm=brand_basic&limit=5&skip=0&find={}&sort={}&sid=6457356b5a575a70626d566b4f6a6f305a445a684e4445334f44526d4e44597a4f4463344e4751304e6a4d344e7a6b314f4464684e6a67324e6a526b4e5451324f4459324e4755314e4451314d7a59305a6a5a684e6a67325954526c4d7a49314f544e6b&mid=hykim@b2link.co.kr&d_ex=Tue,%2002%20Oct%202018%2002:05:31%20GMT&SCODE=SYS0100&nCached=1538435574065
   </test>
   */
  Brand.getMasterBrandList = async function(brandName, page) {
    brandName = brandName || '';
    page = page || 1;
    const sort = {};
    const skip = (page - 1) * 10;
    const limit = 10;
    const find = {};
    if (brandName) find._nm = brandName;

    return await app.models.PimsApi.getMasterBrandList(JSON.stringify(find), skip, JSON.stringify(sort), limit);
  };

  Brand.remoteMethod('getMasterBrandList', {
    description: 'PIMS 마스터 브랜드 리스트',
    accepts: [
      { arg: 'brandName', type: 'string', http: { source: 'query' }, description: '브랜드 키워드' },
      { arg: 'page', type: 'number', http: { source: 'query' }, description: '페이지번호' },
    ],
    returns: { root: true, type: 'object' },
    http: { path: '/master-brand-list', verb: 'get' },
  });

  /**
   * 브랜드 정보 수정
   * acl: Admin
   * @param param
   * @param options
   */
  Brand.updateInfo = async function(param, options) {
    const token = ummaUtil.token.getAccessToken(options);

    const id = param.id;
    const where = { id: id };
    // 파라미터내 문자열 트림
    param.data = ummaUtil.parameter.trim(param.data, ['name', 'comments', 'website', 'logo', 'detailBannerUrl', 'detailMedia', 'detailHtml']);
    const data = param.data;
    data.detailMedia = data.detailMedia
      ? `<iframe width="560" height="315" src="https://www.youtube.com/embed/${
          data.detailMedia.split('v=')[1]
        }" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`
      : null;
    param.roleId = token.roleId;
    param.userId = token.userId;
    param.updated = new Date();

    return await Brand.updateAll(where, data);
  };

  Brand.remoteMethod('updateInfo', {
    description: '브랜드 정보 수정',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: { count: Number } },
    http: { path: '/updateInfo', verb: 'post' },
  });

  /**
   * 브랜드 상태값 수정
   * @param param
   * @param options
   */
  Brand.updateStatusByIds = async function(param, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    const ids = param.ids;
    const status = param.status;

    if (!Array.isArray(ids)) throw new ummaError.invalidParam('ids');
    // if (Object.values(app.umma.commonCode.DATA_STATUS).indexOf(status) < 0) {
    //   throw new ummaError.invalidParam('status code');
    // }
    const where = { id: { inq: ids }, status: { neq: status } };
    // 브랜드 상태여부에 따라 상품들의 display 1 -> 0
    if (status === 'N')
      await app.models.Product.updateAll(
        { brId: { inq: ids } },
        {
          display: 0,
          updated: new Date(),
        }
      );
    if (status === 'Y')
      await app.models.Product.updateAll(
        { brId: { inq: ids } },
        {
          display: 1,
          updated: new Date(),
        }
      );
    return await Brand.updateAll(where, {
      status: status,
      statusUpdated: new Date(),
    });
  };

  Brand.remoteMethod('updateStatusByIds', {
    description: '브랜드 상태값 수정',
    notes: 'param {"ids": Array, "status": String}',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: { count: Number } },
    http: { path: '/updateStatusByIds', verb: 'post' },
  });

  /**
   * 파트너 브랜드 사용여부 수정
   * @param param
   * @param options
   */
  Brand.updatePartnersByIds = async function(param, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    const ids = param.ids;
    const isPartnerBrand = param.isPartnerBrand;

    if (!Array.isArray(ids)) throw new ummaError.invalidParam('ids');

    const where = { id: { inq: ids }, isPartnerBrand: { neq: isPartnerBrand } };

    return await Brand.updateAll(where, {
      isPartnerBrand: isPartnerBrand,
      updated: new Date(),
    });
  };

  Brand.remoteMethod('updatePartnersByIds', {
    description: '파트너 브랜드 사용여부 수정',
    notes: 'param {"ids": Array, "isPartnerBrand": Number}',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: { count: Number } },
    http: { path: '/updatePartnersByIds', verb: 'post' },
  });

  /**
   * 상품들 공급률 업데이트
   * @param
   * @options
   */
  Brand.updateRateByBrand = async function(param, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    const date = new Date();
    const id = param.id;
    const rate = param.supplyRate;
    const where = { brId: id };
    try {
      if (rate < 0) throw new ummaError.customMessage('Needs to be larger than 0.');
      if (rate > 100) throw new ummaError.customMessage('Needs to be smaller than 100.');
      await app.models.Product.updateAll(where, {
        updated: date,
        supplyRate: rate,
      });
    } catch (err) {
      logger.error(err);
      throw err;
    }
    return true;
  };
  Brand.remoteMethod('updateRateByBrand', {
    description: '상품들 공급률 업데이트',
    notes: 'param {"id": brId, "supplyRate": 공급률}',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: Boolean },
    http: { path: '/updateRateByBrand', verb: 'post' },
  });

  /**
   * get brand details with an 'include' scope
   * @param id
   * @param options
   */
  Brand.detail = async function(id, options) {
    // const token = ummaUtil.token.getAccessToken(options);
    const brand = await Brand.findById(id);
    if (!brand) throw new ummaError.customMessage('There are no brands associated with that ID.');
    return brand;
  };

  Brand.remoteMethod('detail', {
    description: '브랜드 상세',
    accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
    returns: { root: true, type: 'Brand' },
    http: { path: '/detail/:id', verb: 'get' },
  });

  /**
   * @param options
   */
  Brand.brandPieChart = async function(options) {
    const token = ummaUtil.token.getAccessToken(options);
    const labels = [];
    const ids = [];
    const data = [];
    const hexColors = [];
    let r = [];
    try {
      await app.dataSources.ummaDs.transaction(async models => {
        const { Brand, OrderProduct } = models;
        const getBrands = await Brand.find({ where: { status: 'Y' } });
        getBrands.forEach(brand => {
          labels.push(brand.name);
          ids.push(brand.id);
          hexColors.push('#' + ((Math.random() * 0xffffff) << 0).toString(16));
        });
        ids.forEach(order => {
          data.push(OrderProduct.count({ brId: order }));
        });
        r = await Promise.all(data);
      });
    } catch (err) {
      throw err;
    }
    const aDataSet = {
      labels: labels,
      datasets: [
        {
          data: r,
          backgroundColor: hexColors,
          hoverBackgroundColor: hexColors,
        },
      ],
    };
    return aDataSet;
  };
  Brand.remoteMethod('brandPieChart', {
    returns: { root: true, type: 'Array' },
    http: { path: '/brandPieChart', verb: 'get' },
  });
};
