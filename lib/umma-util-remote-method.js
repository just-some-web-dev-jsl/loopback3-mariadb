'use strict';

const ummaUtil = {
  filter: require('./umma-util-filter-where').filter,
  where: require('./umma-util-filter-where').where,
};

const Util = {};

/**
 * Util.remoteMethod
 */
Util.remoteMethod = {};

/**
 * Util.remoteMethod.accepts
 */
Util.remoteMethod.accepts = {};

// loopback 내장 속성
Util.remoteMethod.accepts.req = { arg: 'req', type: 'object', http: { source: 'req' } };
Util.remoteMethod.accepts.res = { arg: 'res', type: 'object', http: { source: 'res' } };
Util.remoteMethod.accepts.filter = { arg: 'filter', type: 'object', description: ummaUtil.filter.description };
Util.remoteMethod.accepts.where = { arg: 'where', type: 'object', description: ummaUtil.where.description };
Util.remoteMethod.accepts.options = { arg: 'options', type: 'object', http: 'optionsFromRequest' };

// 공용 속성 추가
Util.remoteMethod.accepts.callback = { arg: 'callback', type: 'string', http: { source: 'query' }, description: 'callback function name' }; // for explorer

// umma 서비스용 추가 속성
Util.remoteMethod.accepts.id = { arg: 'id', type: 'number', required: true, http: { source: 'path' }, description: '아이디' };
Util.remoteMethod.accepts.idsArray = { arg: 'ids', type: 'array', required: true, http: { source: 'body' }, description: 'Array Parameters' };
Util.remoteMethod.accepts.paramArray = { arg: 'param', type: 'array', required: true, http: { source: 'body' }, description: 'Array Parameters' };
Util.remoteMethod.accepts.paramObject = { arg: 'param', type: 'object', required: true, http: { source: 'body' }, description: 'JSON Parameters' };

Util.remoteMethod.accepts.roleId = { arg: 'roleId', type: 'number', required: true, http: { source: 'path' }, description: '회원 롤 아이디' };
Util.remoteMethod.accepts.userId = { arg: 'userId', type: 'number', required: true, http: { source: 'path' }, description: '회원 아이디' };

Util.remoteMethod.accepts.pgOrderId = { arg: 'pgOrderId', type: 'string', required: true, http: { source: 'path' }, description: 'PG 결제 아이디' };
Util.remoteMethod.accepts.proformaKey = { arg: 'proformaKey', type: 'string', required: true, http: { source: 'path' }, description: '가견적키' };
Util.remoteMethod.accepts.orderKey = { arg: 'orderKey', type: 'string', required: true, http: { source: 'path' }, description: '주문키' };

Util.remoteMethod.accepts.paramModel = function(modelName) {
  return { arg: 'param', type: modelName, required: true, http: { source: 'body' }, description: modelName + ' JSON Parameters' };
};

// 자주 사용하는 속성 배열로 그룹핑
Util.remoteMethod.accepts.filterAndOptions = [Util.remoteMethod.accepts.filter, Util.remoteMethod.accepts.options];
Util.remoteMethod.accepts.whereAndOptions = [Util.remoteMethod.accepts.where, Util.remoteMethod.accepts.options];
Util.remoteMethod.accepts.idAndOptions = [Util.remoteMethod.accepts.id, Util.remoteMethod.accepts.options];
Util.remoteMethod.accepts.idsArrayAndOptions = [Util.remoteMethod.accepts.idsArray, Util.remoteMethod.accepts.options];
Util.remoteMethod.accepts.paramArrayAndOptions = [Util.remoteMethod.accepts.paramArray, Util.remoteMethod.accepts.options];
Util.remoteMethod.accepts.paramObjectAndOptions = [Util.remoteMethod.accepts.paramObject, Util.remoteMethod.accepts.options];
Util.remoteMethod.accepts.paramModelAndOptions = function(modelName) {
  return [Util.remoteMethod.accepts.paramModel(modelName), Util.remoteMethod.accepts.options];
};
Util.remoteMethod.accepts.idAndParamObjectAndOptions = [Util.remoteMethod.accepts.id, Util.remoteMethod.accepts.paramObject, Util.remoteMethod.accepts.options];

module.exports = Util;
