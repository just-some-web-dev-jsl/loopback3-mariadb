'use strict';

module.exports = function(app) {
  const APIConnector = app.datasources.channelOpenApi.connector;
  return APIConnector.observe('after execute', function(ctx, next) {
    // 에러 처리
    let err, ref, ref1;
    if (/^[5]/.test((ref = ctx.res) != null ? ((ref1 = ref.body) != null ? ref1.code : void 0) : void 0)) {
      err = new Error('Error from the ChannelOpenApi');
      err.status = 403;
      err.message = ctx.res.body.message;
      return ctx.end(err, ctx, ctx.res.body);
    } else {
      // console.log(ctx.res.body);
      return next();
    }
  });
};
