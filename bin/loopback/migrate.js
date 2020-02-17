'use strict';

/**
 * 루프백 빌트인 모델과 커스텀 모델의 데이터베이스 테이블을 만든다.
 */

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

// the basic loopback model tables
// const base = ['User', 'AccessToken', 'ACL', 'RoleMapping', 'Role'];
// const base = ['ACL', 'RoleMapping', 'Role'];
const base = [];

// custom models
// const models = ['CustomAcl', 'CustomRole', 'CustomAccessToken', 'Admin', 'Buyer', 'Seller'];
const models = [];

const lbTables = [].concat(base, models);

// Run through and create all of them
ds.automigrate(lbTables, function(err) {
  if (err) throw err;
  console.log('\nTables [' + lbTables + '] migrated in ' + ds.adapter.name + '\n');
  ds.disconnect();
  process.exit();
});
