'use strict';

module.exports = function(Model, options) {
  // Model is the model class
  // options is an object containing the config properties from model definition
  Model.defineProperty('created', {
    type: Date,
    required: false,
    mysql: {
      columnName: 'created',
      dataType: 'timestamp',
      default: 'CURRENT_TIMESTAMP',
      nullable: 'Y',
    },
  });
  Model.defineProperty('updated', {
    type: Date,
    required: false,
    mysql: {
      columnName: 'updated',
      dataType: 'timestamp',
      default: null,
      nullable: 'Y',
    },
  });
  Model.defineProperty('deleted', {
    type: Date,
    required: false,
    mysql: {
      columnName: 'deleted',
      dataType: 'timestamp',
      default: null,
      nullable: 'Y',
    },
  });
};
