'use strict';

const logger = require('../../lib/logger')(module);
const ummaUtil = require('../../lib/umma-util');
const ummaError = require('../../lib/umma-error');

let app = {
  umma: require('../../reference'), // 개발 참조용 레퍼런스 파일
};

module.exports = function(ChannelOpenApi) {
  const Model = ChannelOpenApi;

  Model.on('attached', function(a) {
    app = a;
  });
  Model.on('dataSourceAttached', function() {});

  /**
   * analyzeChat
   * @param {Object} data
   * @returns {Array}
   */
  ChannelOpenApi.analyzeChat = function(data) {
    const arr = [];

    // validate
    if (!data.hasOwnProperty('userChats')) throw new Error('userChats not found.');
    if (!data.hasOwnProperty('veils')) throw new Error('veils not found.');
    if (!data.hasOwnProperty('users')) throw new Error('users not found.');

    const userInfos = {
      Veil: data.veils,
      User: data.users,
    };

    let _o, info, _mo, personType, personId;

    // 채널톡 메시지 읽기
    data.userChats.some(function(userChat) {
      personType = userChat['personType'];
      personId = userChat['personId'];

      if (personId === undefined || personType === undefined) return userChat;

      info = userInfos[personType].find(function(o) {
        return o.id === personId;
      });

      if (!info) {
        info = {};
        info.avatarUrl = '';
        info.country = '';
        info.city = '';
        info.name = '';
      }

      // 리턴 객체 설정
      _o = {};
      _o.status = userChat['state']; // 상태
      _o.avatarUrl = info.avatarUrl; // 아바타URL
      _o.country = info.country; // 국가
      _o.city = info.city; // 지역
      _o.name = info.name; // 이름
      _o.created = userChat.createdAt; // 생성일시:timestamp

      if (info.hasOwnProperty('profile')) {
        _o.companyName = info.profile.companyName; // 회사
        _o.email = info.profile.email; // 이메일
        _o.mobileNumber = info.profile.mobileNumber; // 연락처
      } else {
        _o.companyName = ' - '; // 회사
        _o.email = ' - '; // 이메일
        _o.mobileNumber = ' - '; // 연락처
      }

      _o.message = {}; // 메세지 객체

      // 메세지 찾기
      _mo = data.messages.find(function(o) {
        return o.personId === personId;
      });
      if (!_mo) _mo = {};

      if (_mo.hasOwnProperty('file')) {
        _o.messageType = 'file'; // 메세지 타입: 파일
        _o.message.url = _mo.file.url; // 파일URL
        _o.message.filename = _mo.file.filename; // 파일명
        if (_mo.file.hasOwnProperty('previewThumb')) {
          _o.message.previewThumb = _mo.file.previewThumb; // 미리보기
        }
      } else {
        _o.messageType = 'text'; // 메세지 타입: 텍스트
        _o.message.text = _mo.message; // 메세지 내용
      }

      arr.push(_o);
    });

    return arr;
  };

  /**
   * 최근 채널톡 메세지 가져오기
   * channel.io 토큰이 만료되었거나 인증 실패시 401 에러 발생함.
   * 종종 채널톡 서버에서 502 Bad Gateway 발생함.
   * @param {Object} options
   * @returns {Array}
   */
  ChannelOpenApi.getRecentMessages = async function(options) {
    try {
      const param = { sortField: 'openedAt', sortOrder: 'DESC', limit: (options && options.limit) || 100 };
      const result = await ChannelOpenApi.recentMessages(param);
      const messages = ChannelOpenApi.analyzeChat(result);
      return messages;
    } catch (err) {
      logger.error(err);
      return [];
    }
  };
};
