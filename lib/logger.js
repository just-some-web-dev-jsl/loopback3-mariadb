'use strict';

const path = require('path');

module.exports = function(submodule) {
  let submoduleName;
  if (submodule && submodule.filename) {
    // make submodule name: /root/dir/file.js => dir/file
    const filename = submodule.filename;
    submoduleName = path.basename(filename, path.extname(filename));
    submoduleName =
      path
        .dirname(filename)
        .split(path.sep)
        .pop() +
      '/' +
      submoduleName;
  }
  // child logger
  return require('../server/components/logger-winston')(submoduleName);
};
