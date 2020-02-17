'use strict';

const Util = {};

/**
 * pagination
 */
Util.pagination = {};
Util.pagination.limit = 20;
Util.pagination.maxLimit = 100;

/**
 * 토큰에서 소유자 확인용 유저 정보 가져오기
 * @param {*} token
 * @returns
 */
function getOwnerFromToken(token) {
  return {
    roleId: token.roleId,
    userId: token.userId,
  };
}

/**
 * filter
 */
Util.filter = {};
Util.filter.description = 'Filter defining fields, where, include, order, offset, and limit - must be a JSON-encoded string ({"something":"value"})';
// filter validate
Util.filter.validate = {};
// limit 제한 체크
Util.filter.validate.limit = function(filter) {
  if (!filter) filter = {};
  if (!filter.limit) filter.limit = Util.pagination.limit;
  if (filter.limit > Util.pagination.maxLimit) filter.limit = Util.pagination.maxLimit;
  return filter;
};
// filter fields
Util.filter.fields = {};
Util.filter.fields.add = function(filter, fields) {
  if (!filter) filter = {};
  if (!filter.fields) filter.fields = {};
  Object.keys(fields).forEach(function(k) {
    filter.fields[k] = fields[k];
  });
  return filter;
};
// filter where
Util.filter.where = {};
// filter 조건 추가
// Notes: where 절을 사용하지 않는 함수에는 사용하지 않는다.
Util.filter.where.add = function(filter, fields) {
  if (!filter) filter = {};
  filter.where = Util.where.add(filter.where, fields);
  return filter;
};
// 관리자를 제외한 회원의 OWNER 필터를 추가한다.
Util.filter.where.addOwnerByTokenWithoutAdmin = function(token, filter) {
  if (!token) return filter;
  if (token.isAdmin) return filter;
  return Util.filter.where.add(filter, getOwnerFromToken(token));
};
// 관리자를 포함한 회원의 OWNER 필터를 추가한다.
Util.filter.where.addOwnerByToken = function(token, filter) {
  if (!token) return filter;
  return Util.filter.where.add(filter, getOwnerFromToken(token));
};
// filter order
Util.filter.order = {};
Util.filter.order.add = function(filter, fields) {
  if (!filter) filter = {};
  if (!filter.order) filter.order = [];
  if (!Array.isArray(fields)) fields = [fields];
  filter.order = filter.order.concat(fields);
  return filter;
};
// filter include
Util.filter.include = {};
Util.filter.include.add = function(filter, relation) {
  if (!filter) filter = {};
  if (!filter.include) filter.include = [];
  if (!Array.isArray(relation)) relation = [relation];
  filter.include = filter.include.concat(relation);
  return filter;
};

/**
 * where
 */
Util.where = {};
Util.where.description = 'Criteria to match model instances';
// where 조건 추가
// Notes: filter 를 사용하는 함수에는 사용하지 않는다.
Util.where.add = function(where, fields) {
  if (!where) where = {};
  if (where.and) {
    for (const k in fields) {
      const field = {};
      field[k] = fields[k];
      where.and.push(field);
    }
  } else {
    for (const k in fields) {
      where[k] = fields[k];
    }
  }
  return where;
};
// 관리자를 제외한 회원의 OWNER 조건절을 추가한다.
Util.where.addOwnerByTokenWithoutAdmin = function(token, where) {
  if (!token) return where;
  if (token.isAdmin) return where;
  return Util.where.add(where, getOwnerFromToken(token));
};
// 관리자를 포함한 회원의 OWNER 조건절을 추가한다.
Util.where.addOwnerByToken = function(token, where) {
  if (!token) return where;
  return Util.where.add(where, getOwnerFromToken(token));
};

module.exports = Util;
