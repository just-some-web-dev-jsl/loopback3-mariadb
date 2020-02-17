'use strict';

const ummaUtil = require('../../lib/umma-util');
const ummaError = require('../../lib/umma-error');
const { disableAllMethods } = require('../../lib/loopback-helpers');

let app = {
  umma: require('../../reference'), // 개발 참조용 레퍼런스 파일
};

module.exports = function(Country) {
  const Model = Country;
  /**
   * Disable Remote Method
   */
  disableAllMethods(Model, ['count', 'find', 'findOne', 'findById', 'deleteById']);

  Model.on('attached', function(a) {
    app = a;

    // override method
    Model.destroyById = Model.deleteById;

    /**
     * 국가정보 삭제
     * @param id
     * @param options
     */
    Model.deleteById = async function(id, options) {
      return await Model.deleteByIds([id], options);
    };
    Model.remoteMethod('deleteById', {
      description: '국가정보 삭제',
      accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
      returns: { root: true, type: { count: Number } },
      http: { path: '/:id', verb: 'delete' },
    });

    /**
     * 국가정보 다중 삭제
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
      description: '국가정보 다중 삭제',
      accepts: ummaUtil.remoteMethod.accepts.idsArrayAndOptions,
      returns: { root: true, type: { count: Number } },
      http: { path: '/deleteByIds', verb: 'post' },
    });
  });
  Model.on('dataSourceAttached', function() {});

  /**
   * 국가 코드 데이터
   */
  Country.getCodes = async function() {
    const country = await Country.find({
      fields: { id: true, name: true, dial: true },
      where: { status: app.umma.commonCode.DATA_STATUS.USE },
      order: ['name ASC'],
    });
    return country;
  };

  Country.remoteMethod('getCodes', {
    description: '국가 코드 데이터',
    accepts: [],
    returns: { root: true, type: 'object' },
    http: { path: '/getCodes', verb: 'get' },
  });

  /**
   * 국가명 객체 가져오기
   */
  Country.getJsonNames = async function() {
    const findCountry = await Country.find({ fields: { id: true, name: true }, order: 'id ASC' });
    const countryNames = {};
    findCountry.map(function(country) {
      countryNames[country.id] = country.name;
    });
    return countryNames;
  };
};
