'use strict';

/**
 * 레퍼런스 참조 파일은 자동으로 추가하지 않으므로, 수동으로 추가/삭제 해주어야 한다.
 * .gitignore .prettierignore .eslintignore 파일 등 ignore 설정도 확인해준다.
 */

module.exports = {
  commonCode: require('./commonCode'),
  commonCodeClient: require('./commonCodeClient'),
  commonSite: require('./commonSite'),
};
