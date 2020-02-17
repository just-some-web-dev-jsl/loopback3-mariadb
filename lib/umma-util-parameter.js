'use strict';

const ummaError = require('./umma-error');
const ummaUtil = {
  string: require('./umma-util-common').string,
};

const Util = {};

/**
 * Util.parameter
 */
Util.parameter = {};

/**
 * 파라미터내 문자열 트림
 * @param {Object} param
 * @param {String or Array} entityNames
 * @return {Object}
 */
Util.parameter.trim = function(param, entityNames) {
  if (param && entityNames) {
    if (!Array.isArray(entityNames)) entityNames = [entityNames];
    entityNames.forEach(function(entityName) {
      if (param[entityName]) {
        param[entityName] = ummaUtil.string.trim(param[entityName]);
      }
    });
  }
  return param;
};

/**
 * 파라미터내 JSON 문자열 JSON 객체로 변환
 * convert string to json & validate array type for json column
 * @param {Object} param
 * @param {String or Array} jsonEntityNames
 * @return {Object}
 */
Util.parameter.toJson = function(param, jsonEntityNames) {
  if (param && jsonEntityNames) {
    if (!Array.isArray(jsonEntityNames)) jsonEntityNames = [jsonEntityNames];
    jsonEntityNames.forEach(function(jsonEntityName) {
      if (param[jsonEntityName]) {
        param[jsonEntityName] = ummaUtil.string.toJson(param[jsonEntityName]);
        if (!Array.isArray(param[jsonEntityName])) throw new ummaError.invalidParam(jsonEntityName);
      }
    });
  }
  return param;
};

module.exports = Util;
