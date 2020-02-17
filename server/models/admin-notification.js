'use strict';

const logger = require('../../lib/logger')(module);
const ummaUtil = require('../../lib/umma-util');
const ummaError = require('../../lib/umma-error');
const { disableAllMethods, executeSql } = require('../../lib/loopback-helpers');

let app = {
  umma: require('../../reference'), // 개발 참조용 레퍼런스 파일
};

module.exports = function(AdminNotification) {
  const Model = AdminNotification;
  /**
   * Disable Remote Method
   * 기존 룹백 메서드 비활성화
   */
  disableAllMethods(Model, ['count', 'find', 'findOne', 'findById', 'deleteById']);

  Model.on('attached', function(a) {
    app = a;

    // override method
    Model.destroyById = Model.deleteById;

    /**
     * 관리지 노티 삭제
     * acl: Admin
     * @param id
     * @param options
     */
    Model.deleteById = async function(id, options) {
      return await Model.deleteByIds([id], options);
    };
    Model.remoteMethod('deleteById', {
      description: '관리지 노티 삭제',
      accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
      returns: { root: true, type: { count: Number } },
      http: { path: '/:id', verb: 'delete' },
    });

    /**
     * 관리지 노티 다중 삭제
     * acl: Admin
     * @param ids
     * @param options
     */
    Model.deleteByIds = async function(ids, options) {
      // const token = ummaUtil.token.getAccessToken(options);
      const where = { id: { inq: ids } };
      return await Model.destroyAll(where);
    };
    Model.remoteMethod('deleteByIds', {
      description: '관리지 노티 다중 삭제',
      accepts: ummaUtil.remoteMethod.accepts.idsArrayAndOptions,
      returns: { root: true, type: { count: Number } },
      http: { path: '/deleteByIds', verb: 'post' },
    });
  });
  Model.on('dataSourceAttached', function() {});

  /**
   * 관리지 노티 정보 등록
   * @param param
   * @param options
   */
  AdminNotification.createNotification = async function(param, options) {
    const token = ummaUtil.token.getAccessToken(options);
    // console.log(param);
    param = ummaUtil.parameter.trim(param, ['title']);
    const getAdminEmail = await app.models.Admin.findById(token.userId);
    param.adminRoleId = token.roleId;
    param.adminUserId = token.userId;
    param.adminUserEmail = getAdminEmail.email;

    await AdminNotification.create(param);
  };

  AdminNotification.remoteMethod('createNotification', {
    description: '관리지 노티 정보 등록',
    notes: 'param',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: Boolean },
    http: { path: '/createNotification', verb: 'post' },
  });

  /**
   * 수정하고 승인하기
   * @param param
   * @param options
   */
  AdminNotification.updateInfo = async function(param, options) {
    const token = ummaUtil.token.getAccessToken(options);
    const status = param.status;
    param = ummaUtil.parameter.trim(param, ['title']);
    param.updated = new Date();
    await AdminNotification.updateAll(
      { id: param.id },
      {
        title: param.title,
        comments: param.comments,
        status: status,
      }
    );
    return true;
  };

  AdminNotification.remoteMethod('updateInfo', {
    description: '관리지 노티 정보 수정',
    notes: 'param',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: Boolean },
    http: { path: '/updateInfo', verb: 'post' },
  });

  /**
   * 노티 리스트 가져오기
   * @param param
   * @param options
   */
  AdminNotification.getNotifications = async function(param, options) {
    // const skip = 20;
    const limit = 20;
    return await AdminNotification.find({ where: param, order: 'created DESC' });
  };
  AdminNotification.remoteMethod('getNotifications', {
    description: '관리지 노티 정보 등록',
    notes: 'param',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: ['AdminNotification'] },
    http: { path: '/getNotifications', verb: 'post' },
  });

  /**
   * get details
   * @param id
   */
  AdminNotification.getDetails = async function(id) {
    await AdminNotification.findById(id);
  };
  AdminNotification.remoteMethod('getDetails', {
    description: '관리지 노티 상세',
    notes: 'id',
    accepts: ummaUtil.remoteMethod.accepts.id,
    returns: { root: true, type: 'AdminNotification' },
    http: { path: '/getDetails/:id', verb: 'get' },
  });

  /**
   * delete notification
   * @param id
   */
  AdminNotification.deleteNotification = async function(id) {
    await AdminNotification.destroyAll({ id: id });
    return true;
  };
  AdminNotification.remoteMethod('deleteNotification', {
    description: '관리지 노티 삭제',
    notes: 'id',
    accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
    returns: { root: true, type: Boolean },
    http: { path: '/deleteNotification/:id', verb: 'get' },
  });
};
