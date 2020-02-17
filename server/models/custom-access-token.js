/* eslint-disable camelcase */
'use strict';

let app = {
  umma: require('../../reference'), // 개발 참조용 레퍼런스 파일
};

module.exports = function(CustomAccessToken) {
  const Model = CustomAccessToken;
  Model.on('attached', function(a) {
    app = a;
  });
  /**
   * Intercept token creation and substitute id with our user type
   */
  // CustomAccessToken.observe('before save', async function(ctx, next) {
  //   const user = await app.models[ctx.instance.principal_type].findById(ctx.instance.user_id, { fields: { userType: true } });
  //   ctx.instance.user_type = user.userType;
  //   return next();
  // });
};
