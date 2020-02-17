'use strict';

// NOTES: 4xx ~ 5xx 에러코드만 사용. 600 이상의 코드는 루프백 응답결과에 Unknown error 로 표시된다.
// 참조) https://ko.wikipedia.org/wiki/HTTP_%EC%83%81%ED%83%9C_%EC%BD%94%EB%93%9C

const ummaError = {};

// 액세스토큰 없음
ummaError.accessTokenNotFound = function() {
  this.name = 'accessTokenNotFound';
  this.message = 'Access token not found.';
  this.status = 401;
};
ummaError.accessTokenNotFound.prototype = Error.prototype;

// 접근권한 없음
ummaError.forbidden = function() {
  this.name = 'forbidden';
  this.message = 'Forbidden.';
  this.status = 403;
};
ummaError.forbidden.prototype = Error.prototype;

// 회원등록시 이미 등록된 이메일 주소
ummaError.accountEmailExists = function() {
  this.name = 'accountEmailExists';
  this.message = 'This email has been registered. Please try logging in.';
  this.status = 406;
};
ummaError.accountEmailExists.prototype = Error.prototype;

// 탈퇴한 이메일 비밀번호 찾기 에러
ummaError.accountWithdrawn = function() {
  this.name = 'accountWithdrawn';
  this.message = 'Unable to reset your password - Your account has been withdrawn.';
  this.status = 422;
};
ummaError.accountWithdrawn.prototype = Error.prototype;

// 탈퇴 외 다른 이유로 비밀번호 찾기 시도 에러
ummaError.passwordResetError = function() {
  this.name = 'passwordResetError';
  this.message = 'Unable to reset your password. Please contact us at operations-manager@umma.io.';
  this.status = 422;
};
ummaError.passwordResetError.prototype = Error.prototype;

// 회원등록시 이미 등록된 이메일 주소
ummaError.accountEmailNotExists = function() {
  this.name = 'accountEmailNotExists';
  this.message = 'This email has not been registered. Please sign up for free with us today.';
  this.status = 401;
};
ummaError.accountEmailNotExists.prototype = Error.prototype;

// 등록된 이메일 주소를 찾을 수 없음
ummaError.accountEmailNotFound = function() {
  this.name = 'accountEmailNotFound';
  this.message = 'No emails matching your information. Please try again.';
  this.status = 400;
};
ummaError.accountEmailNotFound.prototype = Error.prototype;

// 로그인 실패
ummaError.loginFailedByStatus = function(app, userStatus) {
  this.name = 'loginFailedByCode';

  if (userStatus === app.umma.commonCode.USER_STATUS.WAITING) {
    this.message = 'Your email address is awaiting approval.';
    this.status = 401;
  } else if (userStatus === app.umma.commonCode.USER_STATUS.OUT) {
    this.message = 'Your account has been suspended. Please contact us at operation-manager@umma.io.';
    this.status = 401;
  } else if (userStatus === app.umma.commonCode.USER_STATUS.REFUSED) {
    this.message = 'Your registration has been denied. Please contact us at operation-manager@umma.io.';
    this.status = 401;
  } else if (userStatus === app.umma.commonCode.USER_STATUS.DELETED) {
    this.message = 'Your account has been deleted. Please sign up for a new account.';
    this.status = 401;
  } else {
    this.message = 'This email address has not been registered yet. Sign up with us today.';
    this.status = 401;
  }
};
ummaError.loginFailedByStatus.prototype = Error.prototype;

// user 존재하지 않을 때
ummaError.userNotFound = function(message) {
  this.name = 'userNotFound';
  this.message = 'User not found.';
  this.status = 400;
};
ummaError.userNotFound.prototype = Error.prototype;

// 이미 삭제 된 문의 참조 에러
ummaError.deletedInquiry = function(message) {
  this.name = 'deletedInquiry';
  this.message = 'This inquiry has been deleted.';
  this.status = 400;
};
ummaError.deletedInquiry.prototype = Error.prototype;

// placeholder error message
ummaError.customMessage = function(message) {
  this.name = 'customMessage';
  this.message = message;
  this.status = 400;
};
ummaError.customMessage.prototype = Error.prototype;

// 잘못된 파라메터
ummaError.invalidParam = function(paramName) {
  this.name = 'invalidParam';
  this.message = `Invalid ${paramName}.`;
  this.status = 400;
};
ummaError.invalidParam.prototype = Error.prototype;

// 마입타입 에러 메세지
ummaError.mimeTypeInvalid = function() {
  this.name = 'mimeTypeInvalid';
  this.message = 'Unsupported file type.';
  this.status = 415;
};
ummaError.mimeTypeInvalid.prototype = Error.prototype;

// 파일 사이즈 에러
ummaError.fileSizeInvalid = function() {
  this.name = 'fileSizeInvalid';
  this.message = 'File size is too large.';
  this.status = 413;
};
ummaError.fileSizeInvalid.prototype = Error.prototype;

// 다운로드 에러 Not found
ummaError.downloadNotFound = function() {
  this.name = 'downloadNotFound';
  this.message = 'Resource not found.';
  this.status = 400;
};
ummaError.downloadNotFound.prototype = Error.prototype;

// category 이미 존재 error
ummaError.catAlreadyExist = function() {
  this.name = 'catAlreadyExist';
  this.message = 'Category already exists.';
  this.status = 409;
};
ummaError.catAlreadyExist.prototype = Error.prototype;

// category length error
ummaError.catLengthError = function() {
  this.name = 'catLengthError';
  this.message = 'Invalid category length.';
  this.status = 422;
};
ummaError.catLengthError.prototype = Error.prototype;

ummaError.loginRedo = function() {
  this.name = 'loginRedo';
  this.message = 'Please login.';
  this.status = 401;
};
ummaError.customMessage.prototype = Error.prototype;

module.exports = ummaError;
