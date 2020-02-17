'use strict';

if (!process.env.AWS_SSM_UMMA_ACCESS_KEY_ID) throw new Error('process.env.AWS_SSM_UMMA_ACCESS_KEY_ID not found.');
if (!process.env.AWS_SSM_UMMA_SECRET_ACCESS_KEY) throw new Error('process.env.AWS_SSM_UMMA_SECRET_ACCESS_KEY not found.');

/**
 * AWS SSM 파라미터 스토어에서 env 환경변수들을 로딩한다.
 */

const awsParamStore = require('aws-param-store');

const awsCloudWatchOptions = {
  accessKeyId: process.env.AWS_SSM_UMMA_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SSM_UMMA_SECRET_ACCESS_KEY,
  region: process.env.AWS_SSM_UMMA_REGION || 'ap-northeast-2',
};

function parseParameters(params, useEnv = false) {
  const output = {};
  params.forEach(param => {
    const k = param.Name.indexOf('/') > -1 ? param.Name.split('/').pop() : param.Name;
    const v = param.Value.trim().replace(/\n/g, '');
    output[k] = v;
    // set process.env
    if (useEnv) process.env[k] = v;
  });
  // console.log(output);
  return output;
}

module.exports = {
  getEnv(path) {
    const results = awsParamStore.getParametersByPathSync(path, awsCloudWatchOptions);
    return parseParameters(results);
  },
  loadEnv(path) {
    const results = awsParamStore.getParametersByPathSync(path, awsCloudWatchOptions);
    return parseParameters(results, true);
  },
};
