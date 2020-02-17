'use strict';

/**
 * [ 주의사항 ]
 * 실행 후 생성된 모델 파일을 하나하나 열어서 세부적인 설정을 추가하거나 수정해주어야 한다.
 * ex) required: 필수 입력 컬럼
 * ex) hidden: 숨길 컬럼
 * ex) mysql.default: 컬럼 기본값
 *
 * 뷰 테이블로 생성시 데이터 타입이 원본 테이블과 동일하게 만들어지지 않을 수 있으므로 수동으로 수정해주는 것이 좋다.
 */

const promisify = require('util').promisify;
const fs = require('fs');
const path = require('path');
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);

// const app = require('../../server/server');
// const ds = app.dataSources.ummaDs;

/**
 * load to process.env
 */
const results = require('../../lib/aws-ssm-env').loadEnv(`/umma/${process.env.NODE_ENV}`);
if (!process.env.MYSQL_HOST) throw new Error('aws ssm env not loaded.');

const loopback = require('loopback');
const dsConfig = require('../../server/datasources.development');
const DATASOURCE_NAME = 'ummaDs';
const dbName = dsConfig[DATASOURCE_NAME]['database'];
const ds = new loopback.DataSource(dsConfig[DATASOURCE_NAME]);

const serverDirPath = path.resolve(__dirname, '../../server');
const modelsFilePath = path.join(serverDirPath, 'models');

let cnt = 0;
const newConfig = {};

/*
function capitalize(str) {
  if (!str) {
    return str;
  }
  return str.charAt(0).toUpperCase() + ((str.length > 1) ? str.slice(1).toLowerCase() : '');
}
function fromDBName(dbName, camelCase) {
  if (!dbName) {
    return dbName;
  }
  // return dbName;
  const parts = dbName.split(/-|_/);
  parts[0] = camelCase ? parts[0].toLowerCase() : capitalize(parts[0]);
  parts[0] = camelCase ? parts[0].toLowerCase() : capitalize(parts[0]);

  for (let i = 1; i < parts.length; i++) {
    parts[i] = capitalize(parts[i]);
  }
  return parts.join('');
}
*/

/**
 * createModel
 * @param {String} tableName
 * @param {Boolean} isPublic
 * @param {String} baseModelName
 */
const createModel = async function(tableName, isPublic = true, baseModelName = 'PersistedModel') {
  // It's important to pass the same "options" object to all calls
  // of dataSource.discoverSchemas(), it allows the method to cache
  // discovered related models
  const options = { relations: true };
  /*
  // properties name camelCase column name to camelCase
  options.nameMapper = function mapName(type, name) {
    if (type === 'table') {
      return fromDBName(name, true);
    } else if (type === 'model') {
      return fromDBName(name, true);
    } else if (type === 'fk') {
      return fromDBName(name + 'Rel', true);
    } else {
      return fromDBName(name, false);
    }
  };
  */

  // Discover models and relations
  const schemas = await ds.discoverSchemas(tableName, options);
  const tableSchema = schemas[dbName + '.' + tableName];
  const isViewTable = tableName.toLowerCase().indexOf('view_') === 0;

  const resultSchema = {};
  resultSchema['name'] = '';
  resultSchema['description'] = '';
  resultSchema['plural'] = '';
  resultSchema['base'] = baseModelName;
  resultSchema['scopes'] = {};
  resultSchema['indexes'] = {};
  resultSchema['options'] = {
    idInjection: false,
    validateUpsert: false,
    mysql: {
      schema: '',
      table: '',
    },
  };
  resultSchema['hidden'] = [];
  resultSchema['protected'] = [];
  resultSchema['http'] = { path: '' };
  resultSchema['mixins'] = {};
  resultSchema['properties'] = {};
  resultSchema['validations'] = [];
  resultSchema['relations'] = {};
  resultSchema['acls'] = [
    {
      accessType: '*',
      principalType: 'ROLE',
      principalId: '$everyone',
      permission: 'DENY',
    },
    {
      accessType: '*',
      principalType: 'ROLE',
      principalId: 'Admin',
      permission: 'ALLOW',
      property: '*',
    },
  ];
  resultSchema['methods'] = {};

  // key & value
  Object.keys(tableSchema).forEach(key => {
    // 모든 모델에 공통 적용
    if (key === 'options') {
      Object.keys(tableSchema[key]).some(o => {
        if (o === 'idInjection') {
          tableSchema[key]['validateUpsert'] = true;
          return true;
        }
      });
    }

    // User 베이스 모델
    if (baseModelName === 'User') {
      tableSchema['excludeBaseProperties'] = ['username']; // username 은 사용안하므로 제외 처리

      // properties
      if (key === 'properties') {
        const properties = tableSchema[key];
        // hidden 컬럼 추가
        if (properties.hasOwnProperty('password')) {
          tableSchema['hidden'].push('password');
        }
        if (properties.hasOwnProperty('deleted')) {
          tableSchema['hidden'].push('deleted');
        }
      }
    }

    // PersistedModel 베이스 모델
    else if (baseModelName === 'PersistedModel') {
      // properties
      if (key === 'properties') {
        const properties = tableSchema[key];
        // hidden 컬럼 추가
        if (properties.hasOwnProperty('deleted')) {
          tableSchema['hidden'].push('deleted');
        }

        // 뷰테이블인 경우 id 컬럼에 pk 속성인 id: 1 추가
        if (isViewTable) {
          // TODO: "id": 1 객체를 "type": "Number", 뒤에 표기되도록 넣으면 좋을듯
          if (properties.hasOwnProperty('id')) properties.id.id = 1;
        }

        // properties 객체 정리
        // TODO: ENUM 타입 지원 추가하면 좋을듯
        Object.keys(properties).forEach(o => {
          const property = properties[o];

          // 불필요한 데이터 타입 관련 객체 제거
          if (property.hasOwnProperty('mysql')) {
            if (property.type.toLowercase() === 'string') {
              delete property.precision;
              delete property.mysql.dataPrecision;
              delete property.scale;
              delete property.mysql.dataScale;
            } else if (property.type.toLowercase() === 'number') {
              delete property.length;
              delete property.mysql.dataLength;
            } else if (property.type.toLowercase() === 'date') {
              delete property.length;
              delete property.mysql.dataLength;
              delete property.precision;
              delete property.mysql.dataPrecision;
              delete property.scale;
              delete property.mysql.dataScale;
            }

            // JSON 컬럼인 경우 type 수정 (String to Object)
            // TODO: String 타입인 컬럼이 longtext 타입을 사용할 경우 추가 예외 처리 필요
            if (o === 'ingredient') return;
            if (property.mysql.dataType.toLowercase() === 'longtext') {
              property.type = 'Object';
              property.mysql.default = [];
            }
          }
        });
      }
    }

    resultSchema[key] = tableSchema[key];
  });

  // relations
  resultSchema['relations'] = resultSchema['options']['relations'];
  delete resultSchema['options']['relations'];

  if (baseModelName === 'User') {
    resultSchema['relations'] = {
      accessTokens: {
        type: 'hasMany',
        model: 'CustomAccessToken',
        polymorphic: {
          foreignKey: 'userId',
          discriminator: 'principalType',
        },
        options: {
          disableInclude: true,
        },
      },
    };
  } else if (baseModelName === 'AccessToken') {
    resultSchema['relations'] = {
      Admin: {
        type: 'belongsTo',
        idName: 'id',
        polymorphic: {
          idType: 'string',
          foreignKey: 'userId',
          discriminator: 'principalType',
        },
      },
      Buyer: {
        type: 'belongsTo',
        idName: 'id',
        polymorphic: {
          idType: 'string',
          foreignKey: 'userId',
          discriminator: 'principalType',
        },
      },
      Seller: {
        type: 'belongsTo',
        idName: 'id',
        polymorphic: {
          idType: 'string',
          foreignKey: 'userId',
          discriminator: 'principalType',
        },
      },
    };
  } else if (baseModelName === 'Role') {
    resultSchema['relations'] = {
      principals: {
        type: 'hasMany',
        model: 'CustomRoleMapping',
        foreignKey: 'roleId',
      },
    };
  } else if (baseModelName === 'RoleMapping') {
    resultSchema['relations'] = {
      role: {
        type: 'belongsTo',
        model: 'CustomRole',
        foreignKey: 'roleId',
      },
    };
  }

  const fileName = tableName.replace(/_/gi, '-');

  // writing model json
  const jsonFileName = fileName + '.json';
  const jsonFilePath = path.join(modelsFilePath, jsonFileName);
  if (fs.existsSync(jsonFilePath)) {
    console.log('Already file exists ' + jsonFilePath);
    return;
  }
  await writeFile(jsonFilePath, JSON.stringify(resultSchema, null, 2));
  console.log('file ' + jsonFileName + ' writed.');

  newConfig[tableSchema['name']] = { dataSource: DATASOURCE_NAME, public: isPublic };
  cnt++;

  // writing model js
  const jsFileName = fileName + '.js';
  const jsFilePath = path.join(modelsFilePath, jsFileName);
  if (fs.existsSync(jsFilePath)) {
    console.log('Already file exists ' + jsonFilePath);
    return;
  }
  await writeFile(jsFilePath, "'use strict';\n\n" + 'module.exports = function(' + tableSchema['name'] + ') {};\n');
  console.log('file ' + jsFileName + ' writed.');
};

/**
 * discover
 */
const discover = async function() {
  // Create model definition files
  if (!fs.existsSync(modelsFilePath)) await fs.mkdirSync(modelsFilePath);

  // 테이블을 읽어서 모델을 생성한다.
  // await createModel('custom_acl', false, 'ACL');
  // await createModel('custom_role', false, 'Role');
  // await createModel('custom_role_mapping', false, 'RoleMapping');
  // await createModel('custom_access_token', false, 'AccessToken');

  // await createModel('common_code');
  // await createModel('common_site');
  // await createModel('country');
  // await createModel('country_state');
  // await createModel('country_city');
  // await createModel('brand');
  // await createModel('category');
  // await createModel('admin', true, 'User');
  // await createModel('buyer', true, 'User');
  // await createModel('buyer_company');
  // await createModel('seller', true, 'User');
  // await createModel('seller_company');
  // await createModel('product');
  // await createModel('product_favorite');
  // await createModel('product_search_condition');
  // await createModel('product_view_count');
  // // await createModel('product_tag');
  // // await createModel('product_transaction_log');
  // await createModel('inquiry');
  // await createModel('inquiry_reply');
  // await createModel('faq');
  // await createModel('product_cart');
  // await createModel('product_option');

  // 뷰테이블을 읽어서 모델을 생성한다.
  // 뷰테이블에는 PK컬럼이 없으므로 Primary Key가 될만한 컬럼에 "id": 1 넣어주어야 findById 사용이 가능하다.
  // await createModel('view_product_list', false);
  // await createModel('view_product_detail', false);
  // await createModel('view_product_admin', false);
  // await createModel('view_product_favorite', false);
  // await createModel('view_category2', false);
  // await createModel('view_product_list2', false);
  // await createModel('view_product_detail2', false);
  // await createModel('view_product_admin2', false);

  if (cnt > 0) {
    const modelConfigPath = path.join(serverDirPath, 'model-config.json');
    const configJson = await readFile(modelConfigPath, 'utf-8');
    const config = JSON.parse(configJson);
    const resultConfig = {};
    Object.keys(config).forEach(key => {
      resultConfig[key] = config[key];
    });
    Object.keys(newConfig).forEach(key => {
      resultConfig[key] = newConfig[key];
    });

    // writing model config
    await writeFile(modelConfigPath, JSON.stringify(resultConfig, null, 2));
    console.log('file model-config.json writed.');
  }
};

discover().then(
  success => {
    console.log('Create Model Complete!');
    process.exit();
  },
  error => {
    console.error('UNHANDLED ERROR:\n', error);
    process.exit(1);
  }
);
