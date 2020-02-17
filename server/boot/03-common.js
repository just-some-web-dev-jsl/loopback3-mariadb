'use strict';

const devUtil = require('../../lib/dev-util');

module.exports = async function(app) {
  app.umma = {};

  // Load database common data into memory
  // Notes: database 데이터 변경시 반드시 다시 로딩해야만 동기화 된다.
  await devUtil.reference.truncate();
  await app.models.CommonCode.load({ boot: 1 });
  // await app.models.CommonSite.load({ boot: 1 });
  // await app.models.ShippingCompany.load({ boot: 1 });

  // Graceful start for pm2
  // Notes: ecosystem.config.js 파일의 wait_ready: true 옵션일때만 작동한다.
  // Notes: process.send 함수는 pm2 등 child_process 로 실행시에만 사용가능하다.
  if (typeof process.send == 'function') process.send('ready');
};
