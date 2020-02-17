'use strict';

const loopback = require('loopback');
const logger = require('./logger')(module);

module.exports = {
  /**
   * 루프백 리모트 메소드 비활성화
   * @param {LoopBackModel} model
   * @param {Array} methodsToExpose
   */
  disableAllMethods: function(model, methodsToExpose) {
    if (model && model.sharedClass) {
      methodsToExpose = methodsToExpose || [];

      const baseName = model.definition.settings.base;
      const modelName = model.sharedClass.name;
      const methods = model.sharedClass.methods();
      const relationMethods = [];
      const disabledMethods = [];

      // Add relation methods
      // 참조: https://loopback.io/doc/en/lb3/Accessing-related-models.html
      if (model.definition.settings.relations) {
        Object.keys(model.definition.settings.relations).forEach(function(relation) {
          relationMethods.push({ name: 'prototype.__findById__' + relation });
          relationMethods.push({ name: 'prototype.__destroyById__' + relation });
          relationMethods.push({ name: 'prototype.__updateById__' + relation });
          relationMethods.push({ name: 'prototype.__exists__' + relation });
          relationMethods.push({ name: 'prototype.__link__' + relation });
          relationMethods.push({ name: 'prototype.__get__' + relation });
          relationMethods.push({ name: 'prototype.__create__' + relation });
          relationMethods.push({ name: 'prototype.__update__' + relation });
          relationMethods.push({ name: 'prototype.__destroy__' + relation });
          relationMethods.push({ name: 'prototype.__unlink__' + relation });
          relationMethods.push({ name: 'prototype.__count__' + relation });
          relationMethods.push({ name: 'prototype.__delete__' + relation });
        });
      }

      if (baseName === 'User' || baseName === 'PersistedModel') {
        methods.push({ name: 'destroyAll' });
      }

      methods.concat(relationMethods).forEach(function(method) {
        let methodName = method.name;
        if (methodsToExpose.indexOf(methodName) < 0) {
          if (methodName === 'verify' || methodName === 'updateAttributes' || methodName === 'patchAttributes') {
            methodName = 'prototype.' + methodName;
          }

          model.disableRemoteMethodByName(methodName);
          disabledMethods.push(methodName);
        }
      });

      // logger.debug(`Disabled Remote methods for ${modelName} :\n`, disabledMethods);
    }
  },
  /**
   * 사용자 모델 생성
   * https://loopback.io/doc/en/lb3/LoopBack-types.html
   * https://loopback.io/doc/en/lb3/Customizing-models.html
   * @param {LoopBackApplication} app
   * @param {Object} modelDefinition
   */
  customDefineModel: function(app, modelDefinition) {
    // const ds = app.datasources.db; // 루프백 내장 메모리 데이터베이스를 사용한다.
    // ds.define(name, properties, options);

    if (modelDefinition.base) modelDefinition.base = 'Model';
    if (!modelDefinition.options) modelDefinition.options = {};
    if (!modelDefinition.hasOwnProperty('idInjection')) modelDefinition.idInjection = false;

    const model = loopback.createModel(modelDefinition);
    app.model(model, { dataSource: 'db' }); // 루프백 내장 메모리 데이터베이스를 사용한다.
  },
  /**
   * 데이터베이스 다이렉트 쿼리 실행
   * @param {DataSource} ds
   * @param {String} query
   * @param {Array} params
   */
  executeSql: async function(ds, query, params = []) {
    return await new Promise(function(resolve, reject) {
      ds.connector.execute(query, params, function(err, result) {
        if (err) return reject(err);
        return resolve(result);
      });
    });
  },
};
