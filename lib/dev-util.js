'use strict';

const fs = require('fs');
const path = require('path');
const promisify = require('util').promisify;
const config = require('../common/config');

const unlink = promisify(fs.unlink);

const devUtil = {};

// 레퍼런스 파일
devUtil.reference = {};
// 레퍼런스 파일 디렉토리 경로
devUtil.reference.dirPath = path.resolve(__dirname, '../reference');

/**
 * 개발 참조용 레퍼런스 json 파일 생성
 * @param filename
 * @param contents
 */
const createJsonFile = function(filename, contents) {
  if (!config.development) return;
  const filePath = path.join(devUtil.reference.dirPath, filename + '.json');
  const fileContents = typeof contents === 'object' ? JSON.stringify(contents, null, 2) : contents;
  fs.writeFileSync(filePath, fileContents, { encoding: 'utf8' });
};

/**
 * 개발 참조용 레퍼런스 javascript 파일 생성
 * @param filename
 * @param contents
 */
const createJavascriptFile = function(filename, contents) {
  if (!config.development) return;
  const filePath = path.join(devUtil.reference.dirPath, filename + '.js');
  const fileContents = typeof contents === 'object' ? `'use strict';\nmodule.exports = ${JSON.stringify(contents, null, 2)};\n` : contents;
  fs.writeFileSync(filePath, fileContents, { encoding: 'utf8' });
};

/**
 * 개발 참조용 레퍼런스 파일 생성
 * @param filename
 * @param contents
 */
devUtil.reference.createFile = function(filename, contents) {
  if (!config.development) return;
  createJsonFile(filename, contents);
  createJavascriptFile(filename, contents);
};

/**
 * 개발 참조용 레퍼런스 파일 모두 삭제
 */
devUtil.reference.truncate = async function() {
  if (!config.development) return;
  const files = fs.readdirSync(devUtil.reference.dirPath, { encoding: 'utf8', withFileTypes: false });
  const p = files.map(function(filename) {
    if (filename.indexOf('.js') > -1) return Promise.resolve();
    const filePath = path.join(devUtil.reference.dirPath, filename);
    return unlink(filePath);
  });
  await Promise.all(p);
};

module.exports = devUtil;
