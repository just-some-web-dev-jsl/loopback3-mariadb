'use strict';

const path = require('path');
const uuidv4 = require('uuid/v4');

const Util = {};

/**
 * Date
 */
Util.date = {};

/**
 * 날짜 형식 반환
 * @param {Date} date
 * @param {String} separator
 * @return {String}
 */
Util.date.stringFormatDate = function(date = new Date(), separator = '') {
  const year = date.getUTCFullYear();
  const month = `0${date.getUTCMonth() + 1}`.slice(-2);
  const day = `0${date.getUTCDate()}`.slice(-2);
  return [year, month, day].join(separator);
};

/**
 * 년월 형식 반환
 * @param {Date} date
 * @param {String} separator
 * @return {String}
 */
Util.date.stringFormatMonth = function(date = new Date(), separator = '') {
  const year = date.getUTCFullYear();
  const month = `0${date.getUTCMonth() + 1}`.slice(-2);
  return [year, month].join(separator);
};

/**
 * 년 형식 반환
 * @param {Date} date
 * @param {String} separator
 * @return {String}
 */
Util.date.stringFormatYear = function(date = new Date()) {
  const year = date.getUTCFullYear();
  return year.toString();
};

/**
 * 시간 형식 반환
 * @param {Date} date
 * @param {String} separator
 * @return {String}
 */
Util.date.stringFormatTime = function(date = new Date(), separator = '') {
  const hours = `0${date.getUTCHours()}`.slice(-2);
  const minutes = `0${date.getUTCMinutes()}`.slice(-2);
  const seconds = `0${date.getUTCSeconds()}`.slice(-2);
  return [hours, minutes, seconds].join(separator);
};

/**
 * 날짜 및 시간 형식 반환
 * @param {Date} date
 * @param {String} dateSepar
 * @param {String} separator
 * @param {String} timeSepar
 * @return {String}
 */
Util.date.stringFormatDateTime = function(date = new Date(), dateSepar = '', separator = '', timeSepar = '', timezone = false) {
  let s = Util.date.stringFormatDate(date, dateSepar);
  s += separator;
  s += Util.date.stringFormatTime(date, timeSepar);
  if (timezone) {
    // TODO: 추후에 momentjs 도입 고려.
    // GMT 또는 GMT+9
    s += ' ' + new Date().toLocaleTimeString('en-US', { timeZoneName: 'short' }).split(' ')[2];
  }
  return s;
};

/**
 * MySQL 날짜 및 시간 형식 반환
 * @param {Date} date
 * @return {Date}
 */
Util.date.convertMysqlDateTime = function(date = new Date()) {
  return new Date(Util.date.stringFormatDateTime(date, '-', 'T', ':') + '.000Z');
};

/**
 * 년월일형식의 날짜를 반환한다.
 * @param {Date} date
 * @param {String} dateSepar
 * @return {String}
 <result>
 2019-01-01
 </result>
 */
Util.date.formatDate = function(date = new Date(), dateSepar = '-') {
  return Util.date.stringFormatDate(date, dateSepar);
};

/**
 * String
 */
Util.string = {};

/**
 * 문자열 트림
 * @param {String} str
 * @return {String}
 */
Util.string.trim = function(str) {
  return str && typeof str === 'string' ? str.trim() : str;
};

/**
 * uuid 생성
 * @return {String}
 */
Util.string.makeUuid = function() {
  return uuidv4();
};

Util.string.randomString = function(len) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const random = Array.apply(null, Array(len))
    .map(function() {
      return charset.charAt(Math.floor(Math.random() * charset.length));
    })
    .join('');
  return random;
};

/**
 * 가견적키 생성
 * 20190312ABCDE100001
 * 8 + 5 + 6 = 19
 * @param {String} proformaKey
 * @return {String}
 */
Util.string.getNewProformaKey = function(proformaKey) {
  let newKey;
  try {
    if (proformaKey && proformaKey.length !== 19) throw new Error('Invalid proformaKey');
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const random = Array.apply(null, Array(5))
      .map(function() {
        return charset.charAt(Math.floor(Math.random() * charset.length));
      })
      .join('');
    const prefix = '1'; // 가견적서
    const seq = proformaKey ? Number.parseInt(proformaKey.substring(13)) : 0;
    newKey = `${Util.date.stringFormatDate()}${random}${prefix}${`000000000${seq + 1}`.slice(-5)}`;
  } catch (err) {
    throw err;
  }
  return newKey;
};

/**
 * 주문키 생성
 * 20190312ABCDE200001
 * 8 + 5 + 6 = 19
 * @param {String} orderKey
 * @return {String}
 */
Util.string.getNewOrderKey = function(orderKey) {
  let newKey;
  try {
    if (orderKey && orderKey.length !== 19) throw new Error('Invalid orderKey');
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const random = Array.apply(null, Array(5))
      .map(function() {
        return charset.charAt(Math.floor(Math.random() * charset.length));
      })
      .join('');
    const prefix = '2'; // 주문서
    const seq = orderKey ? Number.parseInt(orderKey.substring(13)) : 0;
    newKey = `${Util.date.stringFormatDate()}${random}${prefix}${`000000000${seq + 1}`.slice(-5)}`;
  } catch (err) {
    throw err;
  }
  return newKey;
};

/**
 * 이메일주소의 일부를 *로 가린다.
 * @return {String}
 */
Util.string.maskEmailAddress = function(email) {
  const i = email.indexOf('@');
  if (i < 1) return null;
  else if (i < 4) return `${email.slice(0, i - 1)}*@***${email.slice(i + 4)}`;
  else return `${email.slice(0, i - 3)}***@***${email.slice(i + 4)}`;
};

/**
 * 문자열이 String 이면 JSON 객체로 반환한다.
 */
Util.string.toJson = function(str) {
  try {
    if (!str) return str;
    else if (typeof str === 'string') return JSON.parse(str);
    else if (typeof str === 'object') return JSON.parse(JSON.stringify(str));
    return str;
  } catch (err) {
    throw err;
  }
};

/**
 * request 객체에서 ip 주소를 가져온다.
 */
// Util.string.getUserIp = function(req) {
//   // nginx, haproxy 등 proxy 서버 설정에 맞게 사용해야한다.
//   // const forwardedIp = req.headers['x-forwarded-for'];
//   // const ip = forwardedIp ? forwardedIp.split(',')[0] : req.ip;

//   // server.js 파일에 app.set('trust proxy', true); 설정하면 express 에서 자동으로 찾아준다.
//   return (req && req.ip) || null;
// };

/**
 * request 객체에서 user-agent 정보를 가져온다.
 */
Util.string.getUserAgent = function(req) {
  return (req && req.headers && req.headers['user-agent']) || null;
};

/**
 * 파일 경로에서 파일 확장자를 읽는다.
 * @param filePath
 * @return {string}
 */
Util.string.getExtension = function(filePath) {
  return path.extname(filePath);
};

/**
 * 신규 업로드 파일명을 반환한다.
 * @param filePath
 * @return {string}
 */
Util.string.getUploadFileName = function(filePath) {
  return Util.string.makeUuid() + Util.string.getExtension(filePath);
};

/**
 * 폰넘버 문자열 치환
 * @param phone
 * @return {string}
 */
Util.string.convertPhoneNumber = function(phone) {
  return phone ? '+' + phone.replace(/\*/g, '') : '';
};

/**
 * This function is same as PHP's nl2br() with default parameters.
 * @param {string} str Input text
 * @param {boolean} replaceMode Use replace instead of insert
 * @param {boolean} isXhtml Use XHTML
 * @return {string} Filtered text
 */
Util.string.nl2br = function(str, replaceMode, isXhtml) {
  const breakTag = isXhtml ? '<br />' : '<br>';
  const replaceStr = replaceMode ? '$1' + breakTag : '$1' + breakTag + '$2';
  return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, replaceStr);
};

/**
 * This function inverses text from PHP's nl2br() with default parameters.
 * @param {string} str Input text
 * @param {boolean} replaceMode Use replace instead of insert
 * @return {string} Filtered text
 */
Util.string.br2nl = function(str, replaceMode) {
  const replaceStr = replaceMode ? '\n' : '';
  // Includes <br>, <BR>, <br />, </br>
  return str.replace(/<\s*\/?br\s*[\/]?>/gi, replaceStr);
};

/**
 * Number
 */
Util.number = {};

/**
 * 숫자(소수점 지원)에 콤마를 추가한 포맷으로 반환한다.
 * @param num
 * @return {string}
 */
Util.number.stringFormatNumber = function(num) {
  const parts = num.toString().split('.');
  return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (parts[1] ? '.' + parts[1] : '');
};

/**
 * 금액을 문자 포맷으로 반환한다.
 * @param price
 * @return {string}
 */
Util.number.stringFormatMoney = function(price) {
  price = Util.number.formatMoney(price);
  return Util.number.stringFormatNumber(price);
};

/**
 * 금액을 소수점 두자리 포맷으로 반환한다.
 * @param price
 * @return {number}
 */
Util.number.formatMoney = function(price) {
  try {
    if (price === undefined || price === null) throw new Error('Price is empty');
    if (isNaN(price)) throw new Error('Price is NaN');

    const d = 100; // 소수점 두자리 사용
    // price = Math.ceil(price * d) / d; // 올림
    // price = Math.floor(price * d) / d; // 버림 (절사)
    price = Math.round(price * d) / d; // 반올림
  } catch (err) {
    throw err;
  }
  return price;
};

/**
 * Validate
 */
Util.validate = {};

/**
 * 이메일 주소 문자열 유효성 검사
 * @param email
 */
Util.validate.email = function(email) {
  if (!email) return false;
  const regex = /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return regex.test(email);
};

/**
 * 비밀번호 문자열 유효성 검사
 * @param password
 */

Util.validate.password = function(password) {
  if (!password) return false;
  return password.match(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[$@$!%*#?&+_()^%=;?`~-])[A-Za-z\d$@$!%*#?&+_()^%=;?`~-]{6,}$/);
};

/**
 * 가격 숫자열 유효성 검사
 * 정수,음수 소수점 모두 허용
 * @param price
 */
Util.validate.price = function(price) {
  if (price === undefined || price === null) return false;
  // const regex = /^[0-9]+(\.[0-9]{0,2})?$/; // 소수점 두자리까지만 허용
  const regex = /^[0-9]+(\.[0-9]+)?$/;
  return regex.test(price);
};

/**
 * 가견적키 유효성 검사
 * 20190312ABCDE100001
 * 8 + 5 + 6 = 19
 * @param key
 */
Util.validate.proformaKey = function(key) {
  if (!key) return false;
  const regex = /^[0-9]{8}[A-Z]{5}[0-9]{6}$/;
  return regex.test(key);
};

/**
 * 주문키 유효성 검사
 * 20190312ABCDE200001
 * 8 + 5 + 6 = 19
 * @param key
 */
Util.validate.orderKey = function(key) {
  if (!key) return false;
  const regex = /^[0-9]{8}[A-Z]{5}[0-9]{6}$/;
  return regex.test(key);
};

module.exports = Util;
