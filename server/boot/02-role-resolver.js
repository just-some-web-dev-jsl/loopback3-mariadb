'use strict';

let app = {
  umma: require('../../reference'), // 개발 참조용 레퍼런스 파일
};

module.exports = function(a) {
  app = a;
  const CustomRole = app.models.CustomRole;
  const Admin = app.models.Admin;
  const Buyer = app.models.Buyer;
  const Seller = app.models.Seller;

  /**
   * reject
   */
  function reject(cb) {
    process.nextTick(function() {
      cb(null, false);
    });
  }

  /**
   * 관리자 회원 확인
   */
  function authAdmin(userId, userType, cb) {
    // do not allow anonymous users
    if (!userId) {
      // console.log('registerResolver: Do not allow anonymous users');
      return reject(cb);
    }
    const where = {
      id: userId,
      status: app.umma.commonCode.USER_STATUS.APPROVAL,
    };
    if (userType) {
      where.userType = userType;
    }
    Admin.count(where, function(err, count) {
      if (err) {
        console.log(err);
        return cb(null, false);
      }
      // console.log('registerResolver: $admin member');
      cb(null, count > 0); // true = is a admin member
    });
  }

  /**
   * 바이어 회원 확인
   */
  function authBuyer(userId, userType, cb) {
    // do not allow anonymous users
    if (!userId) {
      // console.log('registerResolver: Do not allow anonymous users');
      return reject(cb);
    }
    const where = {
      id: userId,
      status: app.umma.commonCode.USER_STATUS.APPROVAL,
    };
    if (userType) {
      where.userType = userType;
    }
    Buyer.count(where, function(err, count) {
      if (err) {
        console.log(err);
        return cb(null, false);
      }
      // console.log('registerResolver: $buyer member');
      cb(null, count > 0); // true = is a buyer member
    });
  }

  /**
   * 셀러 회원 확인
   */
  function authSeller(userId, userType, cb) {
    // do not allow anonymous users
    if (!userId) {
      // console.log('registerResolver: Do not allow anonymous users');
      return reject(cb);
    }
    const where = {
      id: userId,
      status: app.umma.commonCode.USER_STATUS.APPROVAL,
    };
    if (userType) {
      where.userType = userType;
    }
    Seller.count(where, function(err, count) {
      if (err) {
        console.log(err);
        return cb(null, false);
      }
      // console.log('registerResolver: $seller member');
      cb(null, count > 0); // true = is a seller member
    });
  }

  // admin group
  CustomRole.registerResolver('$admin', function(role, context, cb) {
    // 특정 모델만 처리할때
    // if (context.modelName !== 'ShippingCompany') {
    //   console.log('registerResolver: modelName is not ShippingCompany');
    //   return reject();
    // }

    // 특정 메소드만 처리할때
    // if (context.method !== 'count') {
    //   console.log('registerResolver: method is not count');
    //   return reject();
    // }

    authAdmin(context.accessToken.userId, null, cb);
  });

  // admin super
  CustomRole.registerResolver('$adminGradeSuper', function(role, context, cb) {
    authAdmin(context.accessToken.userId, app.umma.commonCode.USER_TYPE.ADMIN.SUPER_ADMIN, cb);
  });

  // admin normal
  CustomRole.registerResolver('$adminGradeNormal', function(role, context, cb) {
    authAdmin(context.accessToken.userId, app.umma.commonCode.USER_TYPE.ADMIN.NORMAL_ADMIN, cb);
  });

  // admin operation
  CustomRole.registerResolver('$adminGradeOperation', function(role, context, cb) {
    authAdmin(context.accessToken.userId, app.umma.commonCode.USER_TYPE.ADMIN.OPERATION_ADMIN, cb);
  });

  // admin logistics
  CustomRole.registerResolver('$adminGradeLogistics', function(role, context, cb) {
    authAdmin(context.accessToken.userId, app.umma.commonCode.USER_TYPE.ADMIN.LOGISTICS_ADMIN, cb);
  });

  // admin vendor
  CustomRole.registerResolver('$adminGradeVendor', function(role, context, cb) {
    authAdmin(context.accessToken.userId, app.umma.commonCode.USER_TYPE.ADMIN.VENDOR_ADMIN, cb);
  });

  // admin finance
  CustomRole.registerResolver('$adminGradeFinance', function(role, context, cb) {
    authAdmin(context.accessToken.userId, app.umma.commonCode.USER_TYPE.ADMIN.FINANCE_ADMIN, cb);
  });

  // buyer
  CustomRole.registerResolver('$buyer', function(role, context, cb) {
    authBuyer(context.accessToken.userId, null, cb);
  });

  // seller
  CustomRole.registerResolver('$seller', function(role, context, cb) {
    authSeller(context.accessToken.userId, null, cb);
  });
};
