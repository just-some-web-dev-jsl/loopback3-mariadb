'use strict';

const Util = {};

/**
 * Role
 */
Util.role = {};

// must be sync custom_role table
Util.role.roleIdByName = {
  Admin: 1, // 모델명과 동일
  Buyer: 2, // 모델명과 동일
  Seller: 3, // 모델명과 동일
  AdminGradeSuper: 11, // SA
  AdminGradeNormal: 12, // NA
  AdminGradeOperation: 13, // OA
  AdminGradeLogistics: 14, // LA
  AdminGradeVendor: 15, // VA
  AdminGradeFinance: 16, // FA
};
Util.role.roleNamesById = {};
// ex) Util.role.roleNamesById['11'] = 'AdminGradeSuper';
Object.keys(Util.role.roleIdByName).map(function(k) {
  Util.role.roleNamesById[String(Util.role.roleIdByName[k])] = k;
});

Util.role.roleTypeByRoleName = {
  AdminGradeSuper: 'SA', // Super Administrator
  AdminGradeNormal: 'NA', // Normal Admin
  AdminGradeOperation: 'OA', // Operations Admin
  AdminGradeLogistics: 'LA', // Logistics Admin
  AdminGradeVendor: 'VA', // Vendor Admin
  AdminGradeFinance: 'FA', // Finance Admin
};

Util.role.userTypeToRoleId = {
  SA: 11,
  NA: 12,
  OA: 13,
  LA: 14,
  VA: 15,
  FA: 16,
};
Util.role.userTypeByRoleId = {};
// ex) Util.role.userTypeByRoleId['11'] = 'SA';
Object.keys(Util.role.userTypeToRoleId).map(function(k) {
  Util.role.userTypeByRoleId[Number(Util.role.userTypeToRoleId[k])] = k;
});

Util.role.setIsUserType = function(param) {
  param.isBuyer = false;
  param.isSeller = false;
  param.isAdmin = false;
  param.isSuperAdmin = false;
  param.isNormalAdmin = false;
  param.isOperationAdmin = false;
  param.isLogisticAdmin = false;
  param.isFinanceAdmin = false;
  param.isVendorAdmin = false;
  // 관리자
  switch (param.roleId) {
    // 구매자
    case Util.role.roleIdByName.Buyer:
      param.isBuyer = true;
      break;
    // 판매자
    case Util.role.roleIdByName.Seller:
      param.isSeller = true;
      break;
    // 관리자
    case Util.role.roleIdByName.Admin:
      // 사용 안하는 권한
      break;
    case Util.role.roleIdByName.AdminGradeSuper:
      param.isAdmin = true;
      param.isSuperAdmin = true;
      break;
    case Util.role.roleIdByName.AdminGradeNormal:
      param.isAdmin = true;
      param.isNormalAdmin = true;
      break;
    case Util.role.roleIdByName.AdminGradeOperation:
      param.isAdmin = true;
      param.isOperationAdmin = true;
      break;
    case Util.role.roleIdByName.AdminGradeLogistics:
      param.isAdmin = true;
      param.isLogisticAdmin = true;
      break;
    case Util.role.roleIdByName.AdminGradeFinance:
      param.isAdmin = true;
      param.isFinanceAdmin = true;
      break;
    case Util.role.roleIdByName.AdminGradeVendor:
      param.isAdmin = true;
      param.isVendorAdmin = true;
      break;
    default:
      break;
  }

  return param;
};

/**
 * Util.token.
 */
Util.token = {};
// 토큰을 읽어 필요한 변수들을 설정한다.
Util.token.getAccessToken = function(options) {
  let token = {
    userType: null,
    roleId: null,
    userId: null,
    roleName: null,
    isBuyer: null,
    isSeller: null,
    isAdmin: null,
    isSuperAdmin: null,
    isNormalAdmin: null,
    isOperationAdmin: null,
    isLogisticAdmin: null,
    isFinanceAdmin: null,
    isVendorAdmin: null,
    isOwner: function() {
      return false;
    },
  };

  const accessToken = options && options.accessToken;
  // const authorizedRoles = options && options.authorizedRoles;

  if (accessToken) {
    token.userType = accessToken.userType;
    token.roleName = accessToken.principalType;
    if (token.roleName.indexOf(Util.role.roleNamesById[1]) > -1) {
      // Admin
      token.roleId = Util.role.userTypeToRoleId[token.userType];
    } else {
      // Buyer, Seller
      token.roleId = Util.role.roleIdByName[token.roleName];
    }
    token.userId = accessToken.userId;
    // 유저 타입 체크값 설정
    token = Util.role.setIsUserType(token);
    // 자신 소유의 데이터인지 권한을 확인한다.
    token.isOwner = function(properties) {
      return properties.roleId === this.roleId && properties.userId === this.userId;
    };
  }

  return token;
};

module.exports = Util;
