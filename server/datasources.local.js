'use strict';

/* eslint-disable camelcase */
module.exports = {
  ummaDs: {
    name: 'ummaDs',
    connector: 'mysql',
    hostname: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB,
    collation: 'utf8_unicode_ci',
    supportBigNumbers: true,
    connectionLimit: 200,
    connectTimeout: 10000,
    debug: false,
  },
  mongoDs: {
    name: 'mongoDs',
    connector: 'mongodb',
    url: process.env.MONGO_URI,
    host: process.env.MONGO_HOST,
    port: process.env.MONGO_PORT,
    user: process.env.MONGO_USER,
    password: process.env.MONGO_PASSWORD,
    database: process.env.MONGO_DB,
    authSource: process.env.MONGO_AUTH_SOURCE,
    useNewUrlParser: true,
    lazyConnect: true,
    autoReconnect: true,
    reconnectTries: 100,
    reconnectInterval: 1000,
  },
  emailDs: {
    name: 'emailDs',
    connector: 'mail',
    transports: [
      {
        type: process.env.MAIL_TYPE,
        host: process.env.MAIL_HOST,
        secure: process.env.MAIL_SECURE,
        port: process.env.MAIL_PORT,
        tls: {
          rejectUnauthorized: false,
        },
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASSWORD,
        },
      },
    ],
  },
  storage: {
    name: 'storage',
    connector: 'loopback-component-storage',
    provider: 'amazon',
    keyId: process.env.AWS_S3_KEY_ID,
    key: process.env.AWS_S3_KEY,
  },
  pimsApi: {
    name: 'pimsApi',
    connector: 'rest',
    baseUrl: 'http://222.239.10.122:44320',
    headers: {},
    crud: false,
    debug: false,
    operations: [
      {
        functions: {
          getMasterBrandList: ['find', 'skip', 'sort', 'limit'],
        },
        template: {
          method: 'GET',
          url: '/brand/brand_basic/getSearchList',
          query: {
            db_nm: 'brand',
            col_nm: 'brand_basic',
            find: '{find=%7B%7D:string}',
            skip: '{skip=0:integer}',
            sort: '{sort=%7B%7D:string}',
            limit: '{limit=10:integer}',
            sid:
              '6457356b5a575a70626d566b4f6a6f305a445a684e4445334f44526d4e44597a4f4463344e4751304e6a4d344e7a67314f4464684e4455334f5455344e3245314d544d304e546733595451354e7a6b305a6a5a684e6d597a4e4456684e5463314d546468',
          },
          options: {},
          responsePath: '',
        },
      },
      {
        functions: {
          getMasterProductList: ['find', 'skip', 'sort', 'limit'],
        },
        template: {
          method: 'GET',
          url: '/product/product_all_info/getSearchList',
          query: {
            find: '{find=%7Bfind_master%3A%7B%7D%2Cfind_option%3A%7B%7D%2Cfind_standard%3A%7B%7D%2Cfind_renewal%3A%7B%7D%7D:string}',
            skip: '{skip=0:integer}',
            sort: '{sort=%7B%7D:string}',
            limit: '{limit=10:integer}',
            sid:
              '6457356b5a575a70626d566b4f6a6f305a445a684e4445334f44526d4e44597a4f4463344e4751304e6a4d344e7a67314f4464684e4455334f5455344e3245314d544d304e546733595451354e7a6b305a6a5a684e6d597a4e4456684e5463314d546468',
          },
          options: {},
          responsePath: '',
        },
      },
    ],
  },
  channelOpenApi: {
    name: 'channelOpenApi',
    connector: 'rest',
    baseUrl: 'https://api.channel.io/open',
    headers: {
      'x-access-key': process.env.CHANNELIO_API_ACCESS_KEY,
      'x-access-secret': process.env.CHANNELIO_API_ACCESS_SECRET,
    },
    crud: false,
    debug: false,
    operations: [
      {
        functions: {
          recentMessages: ['sortField', 'sortOrder', 'limit'],
        },
        template: {
          // https://api.channel.io/docs/open#!/User32Chat/index_0
          method: 'GET',
          url: '/user_chats',
          query: {
            // 'states': '{states:array}', // User chat state filter
            sortField: '{sortField=openedAt:string}', // [createdAt,openedAt,updatedAt]
            sortOrder: '{sortOrder=DESC:string}', // [ASC,DESC,DEFAULT]
            // 'since': '{since:datetime}', // Epoch time in microseconds of the first user chat to be retrieved
            limit: '{limit=100:integer}', // [1-100]
          },
          options: {},
          responsePath: '',
        },
      },
    ],
  },
  jandiWebhook: {
    name: 'jandiWebhook',
    connector: 'rest',
    baseUrl: 'https://wh.jandi.com/connect-api/webhook/11320800',
    headers: {
      Accept: 'application/vnd.tosslab.jandi-v2+json',
      'Content-Type': 'application/json',
    },
    crud: false,
    debug: false,
    operations: [
      {
        functions: {
          sendMessage: ['body', 'color', 'infos'],
        },
        template: {
          method: 'POST',
          url: '/35c3f97f0325e84a3c9e17138fb6c24a',
          form: {
            body: '{body}',
            connectColor: '{color}',
            connectInfo: '{infos}',
          },
        },
      },
    ],
  },
};
