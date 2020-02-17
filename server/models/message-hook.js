'use strict';

// const ummaUtil = require('../../lib/umma-util');
const ummaError = require('../../lib/umma-error');
// const ummaMail = require('../../lib/umma-mail');
const { disableAllMethods } = require('../../lib/loopback-helpers');

let app = {
  umma: require('../../reference'), // 개발 참조용 레퍼런스 파일
};

module.exports = function(MessageHook) {
  const Model = MessageHook;
  /**
   * Disable Remote Method
   */
  disableAllMethods(Model, ['count', 'find', 'findOne', 'findById']);

  Model.on('attached', function(a) {
    app = a;
  });
  Model.on('dataSourceAttached', function() {});

  /**
   * 채널톡 메세지를 훅으로 받아 몽고디비에 저장
   * @param token
   * @param data
   */
  MessageHook.msgToMongoDbInsert = async function(token, data) {
    // 토큰 비교를 통한 권한 체크
    // development 환경인 로컬에서는 webhook 수신이 불가능하므로 수기 등록용 토큰으로 사용.
    if (process.env.CHANNELIO_WEBHOOK_MESSAGES_TOKEN !== token) throw new ummaError.invalidParam('token');

    // 메세지내용 DB 저장
    return await MessageHook.create(data);
  };

  MessageHook.remoteMethod('msgToMongoDbInsert', {
    description: '채널톡 메세지를 훅으로 받아 몽고디비에 저장',
    accepts: [
      { arg: 'token', type: 'string', required: true, description: '토큰' },
      { arg: 'data', type: 'object', http: { source: 'body' }, description: 'JSON Parameters' },
    ],
    returns: { root: true, type: 'MessageHook' },
    http: { path: '/msgToMongoDbInsert', verb: 'post' },
  });

  /*
  MessageHook.msgToMongoDbAfterMail = function(ctx, cb) {
    const token = ctx.req.query.token;
    const data = ctx.req.body;
    // console.log( token );
    // console.log( data );
    // validation;
    if (process.env.CHANNELIO_WEBHOOK_MESSAGES_TOKEN !== token) return logger.error('error - invalid token.');
    if (data.entity.personType === 'Bot') return logger.debug('isBot!');
    if (data.entity.log) if (data.entity.log.action === 'join') return logger.debug('Admin Join Chat!');

    const mailTemplate = ummaMail.chatToMail.hook.mailTemplate;

    // message 영역;
    let baseSource = ummaMail.chatToMail.hook.baseSource;
    const dowloadBtn = ummaMail.chatToMail.hook.dowloadBtn;
    const fileAddHtml = ummaMail.chatToMail.hook.fileAddHtml;
    const imgAddHtml = ummaMail.chatToMail.hook.imgAddHtml;
    const fileIconPath = ummaMail.chatToMail.hook.fileIconPath;
    const viewLinkBase = app.get('buyerUrl') + '?userId=';

    // 메세지내용 DB 저장;
    global.REQUIRES.MongoClient.connect(process.env.MONGO_URI, function(err, db) {
      const db0 = db.db('chatMessage');
      const col0 = db0.collection('message');
      col0.insert(data, function(err, result) {
        if (err) {
          logger.error(err);
          db.close();
          ctx.res.send(err);
        } else {
          // Insert 결과;
          // logger.debug(result);
          db.close();

          const d = data;
          if (d.entity.personType !== 'Manager') {
            const viewLink = ummaMail.chatToMail.hook.viewLinkChatAdmin;

            let writerName, mobile, emali;
            if (d.entity.hasOwnProperty('log')) {
              if (d.entity.log.action === 'remove') return logger.debug(JSON.stringify(d.entity.log));
            } else {
              if (d.entity.state === 'open') {
                if (d.entity.personType === 'Veil') {
                  writerName = d.refers.veil.name;
                  mobile = d.refers.veil.country;
                  emali = d.refers.veil.city;
                }
                if (d.entity.personType === 'User') {
                  writerName = d.refers.user.name;
                  mobile = d.refers.user.country;
                  emali = d.refers.user.city;
                }
              } else {
                if (d.entity.personType === 'Veil') {
                  writerName = d.refers.veil.name;
                  mobile = d.refers.veil.profile.mobileNumber;
                  emali = d.refers.veil.profile.email;
                }
                if (d.entity.personType === 'User') {
                  writerName = d.refers.user.name;
                  mobile = d.refers.user.profile.mobileNumber;
                  emali = d.refers.user.profile.email;
                }
              }
            }

            let fileIcon, contents; let attachments = [];

            if (d.entity.hasOwnProperty('file')) {
              if (!d.entity.file.image) {
                if (ummaMail.chatToMail.mimeType.hasOwnProperty(d.entity.file.type)) fileIcon = ummaMail.chatToMail.mimeType[d.entity.file.type];
                else fileIcon = 'file.png';

                contents = fileAddHtml.replace('{{URL}}', d.entity.file.url).replace('{{fileName}}', d.entity.file.filename).replace('{{fileIcon}}', fileIconPath + fileIcon);
              } else {
                if (d.entity.file.hasOwnProperty('previewThumb')) contents = imgAddHtml.replace('{{src}}', d.entity.file.previewThumb.url);
                else contents = fileAddHtml.replace('{{URL}}', d.entity.file.url).replace('{{fileName}}', d.entity.file.filename);
              }
              baseSource = baseSource + dowloadBtn;
              baseSource = baseSource.replace('{{contents}}', contents).replace('{{downloadurl}}', d.entity.file.url);
            } else if (d.refers.hasOwnProperty('message')) {
              if (d.refers.message.hasOwnProperty('file')) {
                if (!d.refers.message.file.image) {
                  if (ummaMail.chatToMail.mimeType.hasOwnProperty(d.refers.message.file.type)) fileIcon = ummaMail.chatToMail.mimeType[d.refers.message.file.type];
                  else fileIcon = 'file.png';

                  contents = fileAddHtml.replace('{{URL}}', d.refers.message.file.url).replace('{{fileName}}', d.refers.message.file.filename).replace('{{fileIcon}}', fileIconPath + fileIcon);
                } else {
                  if (d.refers.message.file.hasOwnProperty('previewThumb')) contents = imgAddHtml.replace('{{src}}', d.refers.message.file.previewThumb.url);
                  else contents = fileAddHtml.replace('{{URL}}', d.refers.message.file.url).replace('{{fileName}}', d.refers.message.file.filename);
                }
                baseSource = baseSource + dowloadBtn;
                baseSource = baseSource.replace('{{contents}}', contents).replace('{{downloadurl}}', d.refers.message.file.url);
              }
            }

            if (!d.entity.hasOwnProperty('message')) {
              if (d.entity.hasOwnProperty('state')) baseSource = baseSource.replace('{{contents}}', d.refers.message.message);
              else baseSource = baseSource.replace('{{contents}}', d.entity.message);
            } else {
              baseSource = baseSource.replace('{{contents}}', d.entity.message);
            }

            const text = mailTemplate.replace('{{writerName}}', writerName)
              .replace('{{mobile}}', mobile)
              .replace('{{email}}', emali)
              .replace('{{registDate}}', global.UMMA.util.formatDateTime(d.entity.createdAt))
              .replace('{{avatarUrl}}', ummaMail.chatToMail.hook.iconPath)
              .replace('{{contents}}', baseSource)
              .replace('{{url}}', encodeURI(viewLink));

            // logger.debug(viewLink);

            const option = {
              to: ummaMail.chatToMail.hook.recieveEmail,
              from: ummaMail.mailBot.email,
              subject: ummaMail.chatToMail.hook.option.subject,
              text: ummaMail.removeTags(text),
              html: text,
              attachments: attachments,
            };

            app.models.Email.send(option, function(err, mail) {
              if (err) logger.error(err);
              if (mail) logger.debug(mail);
              ctx.res.send(mail);
            });
          } else {
            let viewLink, toEmail;
            if (d.refers.userChat.personType === 'Veil') {
              viewLink = viewLinkBase + d.refers.veil.id;
              toEmail = d.refers.veil.profile.email;
            }
            if (d.refers.userChat.personType === 'User') {
              viewLink = viewLinkBase + d.refers.user.id;
              toEmail = d.refers.user.profile.email;
            }

            let fileIcon, contents; let attachments = [];

            if (d.entity.hasOwnProperty('file')) {
              if (!d.entity.file.image) {
                if (ummaMail.chatToMail.mimeType.hasOwnProperty(d.entity.file.type)) fileIcon = ummaMail.chatToMail.mimeType[d.entity.file.type];
                else fileIcon = 'file.png';

                contents = fileAddHtml.replace('{{URL}}', d.entity.file.url).replace('{{fileName}}', d.entity.file.filename).replace('{{fileIcon}}', fileIconPath + fileIcon);
              } else {
                if (d.entity.file.hasOwnProperty('previewThumb')) contents = imgAddHtml.replace('{{src}}', d.entity.file.previewThumb.url);
                else contents = fileAddHtml.replace('{{URL}}', d.entity.file.url).replace('{{fileName}}', d.entity.file.filename);
              }
              baseSource = baseSource + dowloadBtn;
              baseSource = baseSource.replace('{{contents}}', contents).replace('{{downloadurl}}', d.entity.file.url);
            } else if (d.refers.hasOwnProperty('message')) {
              if (d.refers.message.hasOwnProperty('file')) {
                if (!d.refers.message.file.image) {
                  if (ummaMail.chatToMail.mimeType.hasOwnProperty(d.refers.message.file.type)) fileIcon = ummaMail.chatToMail.mimeType[d.refers.message.file.type];
                  else fileIcon = 'file.png';

                  contents = fileAddHtml.replace('{{URL}}', d.refers.message.file.url).replace('{{fileName}}', d.refers.message.file.filename).replace('{{fileIcon}}', fileIconPath + fileIcon);
                } else {
                  if (d.refers.message.file.hasOwnProperty('previewThumb')) contents = imgAddHtml.replace('{{src}}', d.refers.message.file.previewThumb.url);
                  else contents = fileAddHtml.replace('{{URL}}', d.refers.message.file.url).replace('{{fileName}}', d.refers.message.file.filename);
                }
                baseSource = baseSource + dowloadBtn;
                baseSource = baseSource.replace('{{contents}}', contents).replace('{{downloadurl}}', d.refers.message.file.url);
              }
            }

            if (!d.entity.hasOwnProperty('message')) {
              if (d.entity.hasOwnProperty('state')) baseSource = baseSource.replace('{{contents}}', d.refers.message.message);
              else baseSource = baseSource.replace('{{contents}}', d.entity.message);
            } else {
              contents = d.entity.message;
              baseSource = baseSource.replace('{{contents}}', contents);
            }

            const text = mailTemplate.replace('{{writerName}}', d.refers.manager.name)
              .replace('{{mobile}}', d.refers.manager.mobileNumber)
              .replace('{{email}}', d.refers.manager.email)
              .replace('{{registDate}}', d.entity.createdAt)
              .replace('{{avatarUrl}}', ummaMail.mailBot.avatar)
              .replace('{{contents}}', baseSource)
              .replace('{{url}}', encodeURI(viewLink));

            const option = {
              to: toEmail,
              from: ummaMail.mailBot.email,
              subject: ummaMail.chatToMail.hook.option.subject,
              text: ummaMail.removeTags(text),
              html: text,
              attachments: attachments,
            };

            app.models.Email.send(option, function(err, mail) {
              if (err) logger.error(err);
              if (mail) logger.debug(mail);
              ctx.res.send(mail);
            });
          }
        }
      });
    });
  };

  MessageHook.remoteMethod('msgToMongoDbAfterMail', {
    description: '채널톡 메세지를 훅으로 몽고디비에 저장후 메일로 전송하는 라우터',
    accepts: {arg: 'ctx', type: 'object', http: {source: 'context'}},
    returns: {root: true, type: 'object'},
    http: {path: '/msgToMongoDbAfterMail', verb: 'post'},
  });
  */
};
