'use strict';

const fs = require('fs');
const path = require('path');
const loopback = require('loopback');
const ummaUtil = require('./umma-util');
const ummaError = require('./umma-error');
let recipients = [
  'joseph@b2link.co.kr',
  'operations-manager@umma.io',
  'logistics-manager@umma.io',
  'finance-manager@umma.io',
  'sourcing-manager@umma.io',
  'umma@umma.io',
  'sales-manager@umma.io',
];
let operators = ['joseph@b2link.co.kr', 'operations-manager@umma.io', 'umma@umma.io', 'sales-manager@umma.io'];
const testers = ['joseph@b2link.co.kr', 'jaehyun+umma.v1@b2link.co.kr'];

const NODE_ENV = process.env.NODE_ENV;

if (NODE_ENV === 'development' || NODE_ENV === 'staging') {
  recipients = testers;
  operators = testers;
}

// 메일관련설정
const ummaMail = {};

// 공통
ummaMail.mailBot = {};
ummaMail.mailBot.email = 'UMMA.io <umma@umma.io>';
ummaMail.mailBot.operationEmail = ['operations-manager@umma.io'];
ummaMail.mailBot.devTeamEmail = ['joseph@b2link.co.kr', 'jaehyun+umma.v1@b2link.co.kr'];
ummaMail.mailBot.mobile = '+82 1899-0534';
ummaMail.mailBot.avatar = 'https://d3ea9molln0us0.cloudfront.net/img/static/mail/umma_avatar.png'; // production public cloudfront url
ummaMail.mailBot.noAvatar = 'https://d3ea9molln0us0.cloudfront.net/img/static/mail/no_avatar.png'; // production public cloudfront url
ummaMail.mailBot.currency = '$';

// 개발 환경에서 operationEmail 변경
if (NODE_ENV === 'development' || NODE_ENV === 'staging') ummaMail.mailBot.operationEmail = ummaMail.mailBot.devTeamEmail;

// 메일템플릿 경로
ummaMail.mailTemplatePath = path.join(process.cwd(), 'server', 'resource', 'mail-template');

// 메일 html 가져오기
ummaMail.getHtmlByTemplate = function(templateName, mailMessage) {
  const renderer = loopback.template(path.join(ummaMail.mailTemplatePath, templateName));
  return renderer(mailMessage);
};

// 메일 보내기
ummaMail.sendMail = async function(app, mailTo, mailFrom, subject, html, attachments = []) {
  try {
    await app.models.Email.send({
      to: mailTo,
      from: mailFrom,
      // cc: ummaMail.mailBot.operationEmail,
      // bcc: ummaMail.mailBot.devTeamEmail,
      subject: subject,
      // text: ummaMail.removeTags(html),
      html: html,
      attachments: attachments,
    });
  } catch (err) {
    throw err;
  }
};

// tag 제거
ummaMail.removeTags = function(str) {
  return str.replace(/(<([^>]+)>)/gi, '');
};

// 회원가입 인증메일
ummaMail.verify = {};
ummaMail.verify.template = path.join(ummaMail.mailTemplatePath, 'member-email-verify.ejs');
ummaMail.verify.subject = 'Your have successfully registered to UMMA!';

// 상품승인 이메일
ummaMail.product = {};
ummaMail.product.approval = {};
ummaMail.product.approval.sendMail = async function(app, data) {
  const mailMessage = {
    email: ummaMail.mailBot.email,
    mobile: ummaMail.mailBot.mobile,
    writerName: data.registerFirstName + ' ' + data.registerLastName,
    brandName: data.brName,
    productName: data.name,
    pricingInfo: ummaMail.mailBot.currency + ummaUtil.number.stringFormatMoney(data.retailPrice),
    prdImg: data.images && data.images[0],
  };

  const mailTo = Array.from(new Set([data.registerEmail, ...ummaMail.mailBot.operationEmail])); // 등록자 및 오퍼레이터에게 발송
  const mailFrom = ummaMail.mailBot.email;
  const subject = 'Your product has been approved!';
  const html = ummaMail.getHtmlByTemplate('product-approval.ejs', mailMessage);
  await ummaMail.sendMail(app, mailTo, mailFrom, subject, html);
};

// 상품반려 이메일
ummaMail.product.refuse = {};
ummaMail.product.refuse.sendMail = async function(app, data) {
  const mailMessage = {
    email: ummaMail.mailBot.email,
    mobile: ummaMail.mailBot.mobile,
    writerName: data.registerFirstName + ' ' + data.registerLastName,
    comments: data.comments,
    brandName: data.brName,
    productName: data.name,
    pricingInfo: ummaMail.mailBot.currency + ummaUtil.number.stringFormatMoney(data.retailPrice),
    prdImg: data.images && data.images[0],
  };

  const mailTo = Array.from(new Set([data.registerEmail, ...ummaMail.mailBot.operationEmail])); // 등록자 및 오퍼레이터에게 발송
  const mailFrom = ummaMail.mailBot.email;
  const subject = 'We are sorry, but we could not approve your product for display at this time.';
  const html = ummaMail.getHtmlByTemplate('product-refuse.ejs', mailMessage);
  await ummaMail.sendMail(app, mailTo, mailFrom, subject, html);
};

// 데빗 추가 후
ummaMail.debitHistory = {};
ummaMail.debitHistory.add = {};
ummaMail.debitHistory.add.sendMail = async function(app, data) {
  const url = app.get('buyerUrl') + '/debit/list';
  const credit = ummaUtil.number.stringFormatMoney(data.credit);
  const creditBalance = ummaUtil.number.stringFormatMoney(data.creditBalance);

  const mailMessage = {
    userName: data.userName,
    email: data.userEmail,
    eventDetail: data.eventDetail,
    credit: credit,
    creditBalance: creditBalance,
    remark: data.remark || 'None',
    url: url,
    comments: data.comments,
    created: ummaUtil.date.formatDate(),
  };

  let userEmail = data.userEmail;
  if (NODE_ENV === 'development' || NODE_ENV === 'staging') {
    userEmail = testers;
  }

  const mailTo = userEmail;
  const mailFrom = ummaMail.mailBot.email;
  const subject = 'You received ' + credit + ' in credits.';
  const html = ummaMail.getHtmlByTemplate('debit-added-to-user.ejs', mailMessage);
  await ummaMail.sendMail(app, mailTo, mailFrom, subject, html);
};

// 인쿼리 등록
ummaMail.inquiry = {};
ummaMail.inquiry.regist = {};
ummaMail.inquiry.regist.sendMail = async function(app, userInfo, productInfo, data) {
  const adminInquiryUrl = app.get('adminUrl') + 'inquiry/detail/' + data.id;
  const oAttachments = data.attachments.map(function(o) {
    return { filename: o.originName, path: o.Location };
  });
  const mobile = userInfo.mobile ? ummaUtil.string.convertPhoneNumber(userInfo.mobile) : '';

  const mailMessage = {
    email: userInfo.email || '',
    mobile: mobile,
    writerName: userInfo.firstName + ' ' + userInfo.lastName,
    subject: data.subject,
    registDate: ummaUtil.date.formatDate(),
    avatarUrl: userInfo.avatar || ummaMail.mailBot.noAvatar,
    contents: ummaUtil.string.nl2br(data.contents),
    url: adminInquiryUrl,
    productInfo: {
      // 상품 인쿼리일 경우에만 productInfo 가 들어있다.
      brandName: (productInfo && productInfo.brName) || '',
      productName: (productInfo && productInfo.name) || '',
      pricingInfo: productInfo && productInfo.retailPrice ? ummaMail.mailBot.currency + ummaUtil.number.stringFormatMoney(productInfo.retailPrice) : '',
      prdImg: productInfo && productInfo.images ? productInfo.images[0] : '',
    },
  };

  const mailTo = operators;
  const mailFrom = ummaMail.mailBot.email;
  const subject = `You have registered a new inquiry: ${data.subject}`;
  const html = ummaMail.getHtmlByTemplate('inquiry-regist.ejs', mailMessage);
  await ummaMail.sendMail(app, mailTo, mailFrom, subject, html, oAttachments);
};

// System 문의 발송 시 개발자 팀에게 이메일 발송
ummaMail.inquiry.system = {};
ummaMail.inquiry.system.sendMail = async function(app, userInfo, data) {
  const adminInquiryUrl = app.get('adminUrl') + 'inquiry/detail/' + data.id;
  const mailMessage = {
    email: userInfo.email || '',
    writerName: userInfo.firstName + ' ' + userInfo.lastName,
    subject: data.subject,
    created: ummaUtil.date.formatDate(),
    content: ummaUtil.string.nl2br(data.contents),
    userIP: data.userIp,
    userAgent: data.userAgent,
    url: adminInquiryUrl,
  };

  const mailTo = ummaMail.mailBot.devTeamEmail;
  const mailFrom = ummaMail.mailBot.email;
  const subject = 'UMMA SYSTEM INQUIRY: ' + data.subject;
  const html = ummaMail.getHtmlByTemplate('inquiry-system.ejs', mailMessage);
  await ummaMail.sendMail(app, mailTo, mailFrom, subject, html);
};

// 인쿼리 답변 등록
ummaMail.inquiry.reply = {};
ummaMail.inquiry.reply.sendMail = async function(app, userInfo, inquiryUserInfo, data) {
  const inquiryUrl = app.get('buyerUrl') + 'inquiry/detail/' + data.inquiryId;
  const oAttachments = data.attachments.map(function(o) {
    return { filename: o.originName, path: o.Location };
  });
  const mobile = userInfo.mobile ? ummaUtil.string.convertPhoneNumber(userInfo.mobile) : '';

  const mailMessage = {
    email: userInfo.email || '',
    mobile: mobile,
    writerName: userInfo.firstName + ' ' + userInfo.lastName,
    subject: data.subject,
    created: ummaUtil.date.formatDate(),
    avatarUrl: userInfo.avatar || ummaMail.mailBot.noAvatar,
    contents: ummaUtil.string.nl2br(data.contents),
    url: inquiryUrl,
    productInfo: {
      // 상품 인쿼리일 경우에만 productInfo 가 들어있다.
      brandName: null,
      productName: null,
      pricingInfo: null,
      prdImg: null,
    },
  };
  let email = inquiryUserInfo.email;
  // 자신이 등록한 인쿼리에 답변을 등록하면 관리자에게 메일 발송
  if (inquiryUserInfo.id === userInfo.id && inquiryUserInfo.roleId === userInfo.roleId) {
    email = operators;
  }

  const mailTo = email;
  const mailFrom = ummaMail.mailBot.email;
  const subject = 'Your inquiry received a new reply!';
  const html = ummaMail.getHtmlByTemplate('inquiry-reply.ejs', mailMessage);
  await ummaMail.sendMail(app, mailTo, mailFrom, subject, html, oAttachments);
};

// 문의 답장시, 관리자들에게 통보
ummaMail.inquiry.adminNotifyInquiryReply = {};
ummaMail.inquiry.adminNotifyInquiryReply.sendMail = async function(app, inquiryInfo, data) {
  const inquiryUrl = app.get('adminUrl') + 'inquiry/detail/' + data.inquiryId;
  const email = inquiryInfo.registerEmail;
  const originalSubject = inquiryInfo.inquirySubject;
  const originalContent = inquiryInfo.inquiryContents;
  const reply = data.contents;
  const mailMessage = {
    email: email,
    subject: originalSubject,
    question: originalContent,
    reply: reply,
    url: inquiryUrl,
    created: ummaUtil.date.formatDate(),
  };

  const mailTo = recipients;
  const mailFrom = ummaMail.mailBot.email;
  const subject = 'Operator께서 ' + email + '님의 문의에 답장했습니다.';
  const html = ummaMail.getHtmlByTemplate('admin-notify-inquiry-reply.ejs', mailMessage);
  await ummaMail.sendMail(app, mailTo, mailFrom, subject, html);
};

// 바이어 회원 메일 설정
ummaMail.buyer = {};

// 바이어 회원 가입 승인 메일
ummaMail.buyer.approval = {};
ummaMail.buyer.approval.sendMail = async function(app, data) {
  const loginUrl = app.get('buyerUrl') + 'auth/login';
  let userEmail = data.email;

  const mailMessage = {
    senderEmail: ummaMail.mailBot.email,
    mobile: ummaMail.mailBot.mobile,
    email: userEmail,
    url: loginUrl,
  };

  if (NODE_ENV === 'development' || NODE_ENV === 'staging') {
    userEmail = testers;
  }

  const mailTo = userEmail;
  const mailFrom = ummaMail.mailBot.email;
  const subject = 'Sign-up approved!';
  const html = ummaMail.getHtmlByTemplate('member-success.ejs', mailMessage);
  await ummaMail.sendMail(app, mailTo, mailFrom, subject, html);
};

// 바이어 회원 가입 거절 메일
ummaMail.buyer.refuse = {};
ummaMail.buyer.refuse.sendMail = async function(app, data) {
  const mailMessage = {
    senderEmail: ummaMail.mailBot.email,
    mobile: ummaMail.mailBot.mobile,
    email: data.email,
    comments: data.comments,
  };

  const mailTo = data.email;
  const mailFrom = ummaMail.mailBot.email;
  const subject = 'Sign-up rejected!';
  const html = ummaMail.getHtmlByTemplate('member-reject.ejs', mailMessage);
  await ummaMail.sendMail(app, mailTo, mailFrom, subject, html);
};

// 바이어 회원 비밀번호 초기화 요청 메일
ummaMail.buyer.resetPassword = {};
ummaMail.buyer.resetPassword.sendMail = async function(app, data) {
  const changePasswordUrl = app.get('buyerUrl') + 'auth/change-pw?access_token=' + data.accessToken.id;

  const mailMessage = {
    senderEmail: ummaMail.mailBot.email,
    mobile: ummaMail.mailBot.mobile,
    email: data.email,
    url: changePasswordUrl,
  };

  const mailTo = data.email;
  const mailFrom = ummaMail.mailBot.email;
  const subject = 'Password reset request!';
  const html = ummaMail.getHtmlByTemplate('password-reset.ejs', mailMessage);
  await ummaMail.sendMail(app, mailTo, mailFrom, subject, html);
};

// 바이어 회원 비밀번호 초기화 요청 메일
ummaMail.buyer.passwordChange = {};
ummaMail.buyer.passwordChange.sendMail = async function(app, data) {
  const id = data.req.accessToken.userId;
  const findBuyer = await app.models.Buyer.findOne({ where: { id: id } });
  const mailMessage = {
    senderEmail: ummaMail.mailBot.email,
    mobile: ummaMail.mailBot.mobile,
    email: findBuyer.email,
    created: ummaUtil.date.formatDate(),
  };

  const mailTo = findBuyer.email;
  const mailFrom = ummaMail.mailBot.email;
  const subject = 'You have changed your password';
  const html = ummaMail.getHtmlByTemplate('password-change.ejs', mailMessage);
  await ummaMail.sendMail(app, mailTo, mailFrom, subject, html);
};

// 관리자 회원 메일 설정
ummaMail.admin = {};

// 새로운 가입자 등록시 관리자에게 이메일 발송
ummaMail.admin.notifyAdminNewUser = {};
ummaMail.admin.notifyAdminNewUser.sendMail = async function(app, data) {
  const adminLoginUrl = app.get('adminUrl') + 'member/buyer/list';

  const mailMessage = {
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    created: ummaUtil.date.formatDate(),
    url: adminLoginUrl,
  };

  const mailTo = operators;
  const mailFrom = ummaMail.mailBot.email;
  const subject = 'UMMA Notification: New user waiting approval ' + data.email;
  const html = ummaMail.getHtmlByTemplate('admin-notify-new-sign-up.ejs', mailMessage);
  await ummaMail.sendMail(app, mailTo, mailFrom, subject, html);
};

// 관리자 회원 승인 메일
ummaMail.admin.approval = {};
ummaMail.admin.approval.sendMail = async function(app, data) {
  const adminLoginUrl = app.get('adminUrl') + 'auth/login';

  const mailMessage = {
    senderEmail: ummaMail.mailBot.email,
    mobile: ummaMail.mailBot.mobile,
    email: data.email,
    url: adminLoginUrl,
  };

  const mailTo = data.email;
  const mailFrom = ummaMail.mailBot.email;
  const subject = 'Sign-up approved!';
  const html = ummaMail.getHtmlByTemplate('member-success.ejs', mailMessage);
  await ummaMail.sendMail(app, mailTo, mailFrom, subject, html);
};

// 관리자 회원 승인 거절 메일
ummaMail.admin.refuse = {};
ummaMail.admin.refuse.sendMail = async function(app, data) {
  const mailMessage = {
    senderEmail: ummaMail.mailBot.email,
    mobile: ummaMail.mailBot.mobile,
    email: data.email,
    comments: data.comments,
  };

  const mailTo = data.email;
  const mailFrom = ummaMail.mailBot.email;
  const subject = 'Sign-up rejected!';
  const html = ummaMail.getHtmlByTemplate('member-reject.ejs', mailMessage);
  await ummaMail.sendMail(app, mailTo, mailFrom, subject, html);
};

// 관리자 회원 비밀번호 초기화 요청 메일
ummaMail.admin.resetPassword = {};
ummaMail.admin.resetPassword.sendMail = async function(app, data) {
  const adminChangePasswordUrl = app.get('adminUrl') + 'auth/change-pw?access_token=' + data.accessToken.id;

  const mailMessage = {
    senderEmail: ummaMail.mailBot.email,
    mobile: ummaMail.mailBot.mobile,
    email: data.email,
    url: adminChangePasswordUrl,
  };

  const mailTo = data.email;
  const mailFrom = ummaMail.mailBot.email;
  const subject = 'Password reset request!';
  const html = ummaMail.getHtmlByTemplate('password-reset.ejs', mailMessage);
  await ummaMail.sendMail(app, mailTo, mailFrom, subject, html);
};

// 가견적서 승인 시
ummaMail.proforma = {};
ummaMail.proforma.confirm = {};
ummaMail.proforma.confirm.sendMail = async function(app, data) {
  const proformaUrl = app.get('buyerUrl') + 'invoice/proforma/detail/' + data.id;
  const subtotalPrice = ummaUtil.number.stringFormatMoney(data.subtotalPrice);
  const totalQuantity = ummaUtil.number.stringFormatNumber(data.totalQuantity);
  const shippingPhone = ummaUtil.string.convertPhoneNumber(data.shippingPhone);

  const mailMessage = {
    senderEmail: ummaMail.mailBot.email,
    mobile: ummaMail.mailBot.mobile,
    email: data.user.email,
    proformaNumber: data.proformaNumber,
    proformaKey: data.proformaKey,
    subtotalPrice: subtotalPrice,
    prType: data.prType,
    totalQuantity: totalQuantity,
    recName: data.recipientName,
    incoterms: data.incoterms,
    ctId: data.shippingCtId,
    csId: data.shippingCsId,
    phone: shippingPhone,
    city: data.shippingCity,
    address1: data.shippingAddress1,
    address2: data.shippingAddress2,
    zipCode: data.shippingZipcode,
    url: proformaUrl,
    created: ummaUtil.date.formatDate(),
  };

  const mailTo = data.user.email;
  const mailFrom = ummaMail.mailBot.email;
  const subject = 'Your quote, ' + data.proformaNumber + ', has been approved and is ready for purchase';
  const html = ummaMail.getHtmlByTemplate('proforma-confirm.ejs', mailMessage);
  await ummaMail.sendMail(app, mailTo, mailFrom, subject, html);
};

// 가견적서 요청 시
ummaMail.proforma.request = {};
ummaMail.proforma.request.sendMail = async function(app, data) {
  const proformaUrl = app.get('buyerUrl') + 'invoice/proforma/detail/' + data.id;
  const subtotalPrice = ummaUtil.number.stringFormatMoney(data.subtotalPrice);
  const totalQuantity = ummaUtil.number.stringFormatNumber(data.totalQuantity);
  const shippingPhone = ummaUtil.string.convertPhoneNumber(data.shippingPhone);

  const mailMessage = {
    senderEmail: ummaMail.mailBot.email,
    mobile: ummaMail.mailBot.mobile,
    email: data.user.email,
    proformaNumber: data.proformaNumber,
    proformaKey: data.proformaKey,
    subtotalPrice: subtotalPrice,
    prType: data.prType,
    totalQuantity: totalQuantity,
    recName: data.recipientName,
    incoterms: data.incoterms,
    ctId: data.shippingCtId,
    csId: data.shippingCsId,
    phone: shippingPhone,
    city: data.shippingCity,
    address1: data.shippingAddress1,
    address2: data.shippingAddress2,
    zipCode: data.shippingZipcode,
    url: proformaUrl,
    created: ummaUtil.date.formatDate(),
  };

  const mailTo = data.user.email;
  const mailFrom = ummaMail.mailBot.email;
  const subject = 'Your quote,' + ' ' + data.proformaNumber + ', ' + 'is under review';
  const html = ummaMail.getHtmlByTemplate('proforma-request.ejs', mailMessage);
  await ummaMail.sendMail(app, mailTo, mailFrom, subject, html);
};

// 가견적서 참조 생성 시
ummaMail.proforma.reRequest = {};
ummaMail.proforma.reRequest.sendMail = async function(app, data) {
  const proformaUrl = app.get('buyerUrl') + 'invoice/proforma/detail/' + data.id;
  const subtotalPrice = ummaUtil.number.stringFormatMoney(data.subtotalPrice);
  const totalQuantity = ummaUtil.number.stringFormatNumber(data.totalQuantity);
  const shippingPhone = ummaUtil.string.convertPhoneNumber(data.shippingPhone);

  const mailMessage = {
    senderEmail: ummaMail.mailBot.email,
    mobile: ummaMail.mailBot.mobile,
    email: data.user.email,
    proformaNumber: data.proformaNumber,
    refProformaNumber: data.refProformaNumber,
    proformaKey: data.proformaKey,
    subtotalPrice: subtotalPrice,
    prType: data.prType,
    totalQuantity: totalQuantity,
    recName: data.recipientName,
    incoterms: data.incoterms,
    ctId: data.shippingCtId,
    csId: data.shippingCsId,
    phone: shippingPhone,
    city: data.shippingCity,
    address1: data.shippingAddress1,
    address2: data.shippingAddress2,
    zipCode: data.shippingZipcode,
    url: proformaUrl,
    created: ummaUtil.date.formatDate(),
  };

  let mailTo = data.user.email;
  if (NODE_ENV === 'development') {
    mailTo = testers;
  }
  const mailFrom = ummaMail.mailBot.email;
  const subject = 'We have reviewed and edited quote request,' + ' ' + data.refProformaNumber;
  const html = ummaMail.getHtmlByTemplate('proforma-re-request.ejs', mailMessage);
  await ummaMail.sendMail(app, mailTo, mailFrom, subject, html);
};

// 가견적서 취소 시
ummaMail.proforma.requestCancel = {};
ummaMail.proforma.requestCancel.sendMail = async function(app, data) {};

// 가견적서 요청 관리지들에게 통보
ummaMail.proforma.notifyAdmin = {};
ummaMail.proforma.notifyAdmin.sendMail = async function(app, data) {
  const adminProformaUrl = app.get('adminUrl') + 'sale/order/shipping/detail/' + data.id;
  const subtotalPrice = ummaUtil.number.stringFormatMoney(data.subtotalPrice);
  const totalQuantity = ummaUtil.number.stringFormatNumber(data.totalQuantity);
  const shippingPhone = ummaUtil.string.convertPhoneNumber(data.shippingPhone);

  let mailSubject = data.proformaKey + ' ' + '예상 배송비 입력 완료';
  let header = data.proformaKey + ' ' + '예상 배송비 입력 완료';
  if (!data.shippingPrice) {
    mailSubject = data.user.email + '께서 ' + data.proformaKey + ' ' + '요청했습니다.';
    header = data.user.email + '님이 ' + '가견적서 요청을 했습니다';
  }

  const mailMessage = {
    senderEmail: ummaMail.mailBot.email,
    mobile: ummaMail.mailBot.mobile,
    email: data.user.email,
    header: header,
    proformaNumber: data.proformaNumber,
    proformaKey: data.proformaKey,
    subtotalPrice: subtotalPrice,
    prType: data.prType,
    totalQuantity: totalQuantity,
    recName: data.recipientName,
    incoterms: data.incoterms,
    ctId: data.shippingCtId,
    csId: data.shippingCsId,
    phone: shippingPhone,
    city: data.shippingCity,
    address1: data.shippingAddress1,
    address2: data.shippingAddress2,
    zipCode: data.shippingZipcode,
    url: adminProformaUrl,
    created: ummaUtil.date.formatDate(),
  };

  // 관리자 이메일로 들어갈 예정
  const mailTo = recipients;
  const mailFrom = ummaMail.mailBot.email;
  const subject = mailSubject;
  const html = ummaMail.getHtmlByTemplate('proforma-request-for-admin.ejs', mailMessage);
  await ummaMail.sendMail(app, mailTo, mailFrom, subject, html);
};

// 주문/결제 시
ummaMail.order = {};
ummaMail.order.request = {};
ummaMail.order.request.sendMail = async function(app, data) {
  const orderUrl = app.get('buyerUrl') + 'order/detail/' + data.id;
  const checkoutPrice = ummaUtil.number.stringFormatMoney(data.checkoutPrice);
  const totalQuantity = ummaUtil.number.stringFormatNumber(data.totalQuantity);
  const shippingPhone = ummaUtil.string.convertPhoneNumber(data.shippingPhone);

  const mailMessage = {
    email: data.user.email,
    senderEmail: ummaMail.mailBot.email,
    mobile: ummaMail.mailBot.mobile,
    checkoutPrice: checkoutPrice,
    orderNumber: data.orderNumber,
    orderKey: data.orderKey,
    url: orderUrl,
    prType: data.prType,
    totalQuantity: totalQuantity,
    recName: data.recipientName,
    incoterms: data.incoterms,
    ctId: data.shippingCtId,
    csId: data.shippingCsId,
    phone: shippingPhone,
    city: data.shippingCity,
    address1: data.shippingAddress1,
    address2: data.shippingAddress2,
    zipCode: data.shippingZipcode,
    created: ummaUtil.date.formatDate(),
  };

  const mailTo = data.user.email;
  const mailFrom = ummaMail.mailBot.email;
  const subject = 'You have successfully purchased your order!' + ' ' + data.orderNumber;
  const html = ummaMail.getHtmlByTemplate('order-request.ejs', mailMessage);
  await ummaMail.sendMail(app, mailTo, mailFrom, subject, html);
};

// 관리자에게 notificaion
ummaMail.order.notifyAdmin = {};
ummaMail.order.notifyAdmin.sendMail = async function(app, data) {
  const orderUrl = app.get('adminUrl') + 'sale/order/order-management/detail/' + data.id;

  const mailMessage = {
    email: data.user.email,
    orderNumber: data.orderNumber,
    orderKey: data.orderKey,
    incoterms: data.incoterms,
    url: orderUrl,
  };

  const mailTo = operators;
  const mailFrom = ummaMail.mailBot.email;
  const subject = '주문 등록 안내드립니다' + ' 주문번호: ' + data.orderNumber;
  const html = ummaMail.getHtmlByTemplate('order-notify-admin.ejs', mailMessage);
  await ummaMail.sendMail(app, mailTo, mailFrom, subject, html);
};

// 주문 승인
ummaMail.order.confirm = {};
ummaMail.order.confirm.sendMail = async function(app, data) {
  const orderUrl = app.get('buyerUrl') + 'order/detail/' + data.id;
  const checkoutPrice = ummaUtil.number.stringFormatMoney(data.checkoutPrice);
  const totalQuantity = ummaUtil.number.stringFormatNumber(data.totalQuantity);
  const shippingPhone = ummaUtil.string.convertPhoneNumber(data.shippingPhone);

  const mailMessage = {
    email: data.user.email,
    senderEmail: ummaMail.mailBot.email,
    mobile: ummaMail.mailBot.mobile,
    checkoutPrice: checkoutPrice,
    orderNumber: data.orderNumber,
    orderKey: data.orderKey,
    url: orderUrl,
    prType: data.prType,
    totalQuantity: totalQuantity,
    recName: data.recipientName,
    incoterms: data.incoterms,
    ctId: data.shippingCtId,
    csId: data.shippingCsId,
    phone: shippingPhone,
    city: data.shippingCity,
    address1: data.shippingAddress1,
    address2: data.shippingAddress2,
    zipCode: data.shippingZipcode,
    created: ummaUtil.date.formatDate(),
  };

  const mailTo = data.user.email;
  const mailFrom = ummaMail.mailBot.email;
  const subject = 'We have confirmed payment for order' + ' ' + data.orderNumber;
  const html = ummaMail.getHtmlByTemplate('order-confirm.ejs', mailMessage);
  await ummaMail.sendMail(app, mailTo, mailFrom, subject, html);
};

// 송장번호 입력 후 관리자에게 이메일 발송
ummaMail.order.trackingInfoNotify = {};
ummaMail.order.trackingInfoNotify.sendMail = async function(app, data) {
  const adminUrl = app.get('adminUrl') + 'sale/order/order-management/detail/' + data.id;

  const mailMessage = {
    orderNumber: data.orderNumber,
    orderKey: data.orderKey,
    trackingInfo: data.trackingNumber,
    trackingLink: data.trackingUrl,
    url: adminUrl,
    created: ummaUtil.date.formatDate(),
  };

  const mailTo = operators;
  const mailFrom = ummaMail.mailBot.email;
  const subject = '송장번호 입력 완료' + ' ' + data.orderKey;
  const html = ummaMail.getHtmlByTemplate('tracking-notify.ejs', mailMessage);
  await ummaMail.sendMail(app, mailTo, mailFrom, subject, html);
};

// 구입가 입력 후 관리자에게 이메일 발송
ummaMail.order.costPriceNotify = {};
ummaMail.order.costPriceNotify.sendMail = async function(app, data) {
  const adminUrl = app.get('adminUrl') + 'sale/order/order-management/detail/' + data.id;

  const mailMessage = {
    orderNumber: data.orderNumber,
    orderKey: data.orderKey,
    subtotalPrice: data.subtotalPrice,
    totalCostPrice: data.totalCostPrice,
    totalMarginPrice: data.totalMarginPrice,
    url: adminUrl,
    created: ummaUtil.date.formatDate(),
  };

  const mailTo = ['operations-manager@umma.io', 'sourcing-manager@umma.io', ...testers];
  const mailFrom = ummaMail.mailBot.email;
  const subject = '구입가 입력 완료' + ' ' + data.orderKey;
  const html = ummaMail.getHtmlByTemplate('cost-price-notify-admin.ejs', mailMessage);
  await ummaMail.sendMail(app, mailTo, mailFrom, subject, html);
};

// 입금정보 입력 후 관리자에게 이메일 발송
ummaMail.order.tTNotify = {};
ummaMail.order.tTNotify.sendMail = async function(app, data) {
  const adminUrl = app.get('adminUrl') + 'sale/order/order-management/detail/' + data.id;

  const mailMessage = {
    orderNumber: data.orderNumber,
    orderKey: data.orderKey,
    subtotalPrice: data.subtotalPrice,
    ttDepositor: data.ttDepositor,
    checkoutPrice: data.checkoutPrice,
    paymentConfirmPrice: data.paymentConfirmPrice,
    paymentConfirmDate: data.paymentConfirmDate ? ummaUtil.date.formatDate(data.paymentConfirmDate) : null,
    url: adminUrl,
    created: data.created ? ummaUtil.date.formatDate(data.created) : null,
  };

  const mailTo = ['operations-manager@umma.io', 'finance-manager@umma.io', ...testers];
  const mailFrom = ummaMail.mailBot.email;
  const subject = '입금정보 입력 완료' + ' ' + data.orderKey;
  const html = ummaMail.getHtmlByTemplate('tt-notify-admin.ejs', mailMessage);
  await ummaMail.sendMail(app, mailTo, mailFrom, subject, html);
};

// 송장번호 입력 후 관리자에게 이메일 발송
ummaMail.order.trackingInfoNotifyToBuyer = {};
ummaMail.order.trackingInfoNotifyToBuyer.sendMail = async function(app, data) {
  const buyerUrl = app.get('buyerUrl') + 'order/detail/' + data.id;
  const trackingInfos = data.shipping;
  const mailMessage = {
    email: data.user.email,
    senderEmail: ummaMail.mailBot.email,
    orderNumber: data.orderNumber,
    orderKey: data.orderKey,
    url: buyerUrl,
    tracking: trackingInfos,
    created: ummaUtil.date.formatDate(),
  };

  let mailTo = data.user.email;
  if (NODE_ENV === 'development' || NODE_ENV === 'staging') {
    mailTo = testers;
  }
  const mailFrom = ummaMail.mailBot.email;
  const subject = 'We updated the tracking info for order' + ' ' + data.orderKey;
  const html = ummaMail.getHtmlByTemplate('tracking-notify-buyer.ejs', mailMessage);
  await ummaMail.sendMail(app, mailTo, mailFrom, subject, html);
};

ummaMail.emailAdmin = {};
ummaMail.emailAdmin.sendMail = async function(app, data) {
  const mailMessage = {
    sendTo: data.sendTo,
    title: data.title,
    emailType: data.emailType,
    body: data.body,
    created: ummaUtil.date.formatDate(),
  };

  let mailTo = data.sendTo;
  if (NODE_ENV === 'development' || NODE_ENV === 'staging') {
    mailTo = testers;
  }
  const mailFrom = 'umma@umma.io';
  const subject = data.title;
  const html = ummaMail.getHtmlByTemplate('send-email-to-admin.ejs', mailMessage);
  await ummaMail.sendMail(app, mailTo, mailFrom, subject, html);
};

// ummaMail.chatToMail = {};

// MessageHook.msgToMongoDbAfterMail
// ummaMail.chatToMail.hook = {};
// ummaMail.chatToMail.hook.mailTemplate = getMailTemplate('message_to_user.html');
// ummaMail.chatToMail.hook.iconPath = '';
// ummaMail.chatToMail.hook.baseSource =
//   '<tr><td><span style="line-height:16px;word-break:break-all;word-wrap:break-word;font-size:14px">{{contents}}</span></td></tr><tr><td colspan="3" height="15"></td></tr>';
// ummaMail.chatToMail.hook.dowloadBtn =
//   '<tr><td><table width="100%" cellpadding="0" cellspacing="0" align="center" border="0" style="font-family:Helvetica,AppleSDGothicNeo-Regular,Malgun Gothic,맑은고딕,돋움,dotum,sans-serif;color:#000000"><tr><td align="center" height="37" style="border:1px solid #000000"><a href="{{downloadurl}}" style="display:block;word-break:break-all;word-wrap:break-word;font-weight:bold;color:#000000;text-decoration:none">Download File</a></td></tr></table></td></tr>';
// ummaMail.chatToMail.hook.fileAddHtml =
//   '<p>You received a file!</p><table width="100%" cellpadding="0" cellspacing="0" align="center" border="0" style="font-family:Helvetica,AppleSDGothicNeo-Regular,Malgun Gothic,맑은고딕,돋움,dotum,sans-serif;color:#000000"><tr><td width="60" height="60" align="center" valign="middle"><div style="max-width:30px;"><img src="{{fileIcon}}" style="display:inline-block;max-width:30px;"></div></td><td style="line-height:16px;word-break:break-all;word-wrap:break-word;font-size:14px"><a href="{{URL}}">{{fileName}}</a></td></tr></table>';
// ummaMail.chatToMail.hook.imgAddHtml = '<p>You received a new image!</p><img src="{{src}}" style="width:100%;">';
// ummaMail.chatToMail.hook.fileIconPath = 'https://d3ea9molln0us0.cloudfront.net/img/static/icon/'; // production public cloudfront url
// ummaMail.chatToMail.hook.viewLinkChatAdmin = 'https://desk.channel.io/#/signin';
// ummaMail.chatToMail.hook.option = {};
// ummaMail.chatToMail.hook.option.subject = "You've got a new live-chat message!";
// ummaMail.chatToMail.hook.recieveEmail = ummaMail.mailBot.operationEmail;

module.exports = ummaMail;
