'use strict';

const fs = require('fs');
const path = require('path');

// 로딩시 파일 참조 에러가 발생하지 않도록 module 파일을 만들어준다.
const fileList = ['./commonCode.js', './commonCodeClient.js', './commonSite.js'];

fileList.forEach(file => {
  const filePath = path.resolve(__dirname, file);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "'use strict';\nmodule.exports = {};\n");
    // console.log(`${filePath} file created.`);
  }
});

module.exports = {};
