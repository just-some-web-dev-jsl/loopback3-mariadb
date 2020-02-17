'use strict';

const os = require('os');
const fs = require('fs');
const ummaError = require('./umma-error');
const ummaUtil = {
  date: require('./umma-util-common').date,
};

const NODE_ENV = process.env.NODE_ENV;

const Util = {};

/**
 * S3
 */
Util.storage = {};

// aws s3
Util.storage.aws = {};
Util.storage.aws.s3 = {};
Util.storage.aws.s3.options = {
  accessKeyId: process.env.AWS_S3_KEY_ID,
  secretAccessKey: process.env.AWS_S3_KEY,
  region: process.env.AWS_S3_REGION,
};

Util.storage.mimeType = {};
Util.storage.mimeType.image = 'image';
Util.storage.mimeType.document = 'document';

Util.storage.bucketType = {};
Util.storage.bucketType.private = 'private';
Util.storage.bucketType.public = 'public';

// set bucket type
Util.storage.bucket = {};

// private
Util.storage.bucket.private = {};
Util.storage.bucket.private.config = {
  production: {
    bucketName: 'production.private-storage.umma',
    cloudFrontUrl: 'https://d1as1snpn1orzt.cloudfront.net',
  },
  staging: {
    bucketName: 'staging.private-storage.umma',
    cloudFrontUrl: 'https://d106x2zu2v77gm.cloudfront.net',
  },
  development: {
    bucketName: 'umma',
    cloudFrontUrl: 'https://d1hcalhnc1bx72.cloudfront.net',
  },
};
Util.storage.bucket.private.bucketName = Util.storage.bucket.private.config[NODE_ENV].bucketName;
Util.storage.bucket.private.cloudFrontUrl = Util.storage.bucket.private.config[NODE_ENV].cloudFrontUrl;

// public
Util.storage.bucket.public = {};
Util.storage.bucket.public.config = {
  production: {
    bucketName: 'production.storage.umma',
    cloudFrontUrl: 'https://d3ea9molln0us0.cloudfront.net',
  },
  staging: {
    bucketName: 'staging.storage.umma',
    cloudFrontUrl: 'https://d30lxtpyczr71y.cloudfront.net',
  },
  development: {
    bucketName: 'umma.io',
    cloudFrontUrl: 'https://d1e45kpk2pzrnh.cloudfront.net',
  },
};
Util.storage.bucket.public.bucketName = Util.storage.bucket.public.config[NODE_ENV].bucketName;
Util.storage.bucket.public.cloudFrontUrl = Util.storage.bucket.public.config[NODE_ENV].cloudFrontUrl;

// function
Util.storage.bucket.isPrivateBucket = function(bucketName) {
  return Util.storage.bucket.private.bucketName === bucketName;
};
Util.storage.bucket.isPublicBucket = function(bucketName) {
  return Util.storage.bucket.public.bucketName === bucketName;
};

// TODO: inquiryAttachments 는 private 이므로 이메일 발송시 메일 내용에 사용할 이미지 서비스를 개발해야함.

// s3 버켓별 업로드를 허용하는 파일 마임타입 정의
Util.storage.uploadMimeType = {
  image: [
    'image/gif',
    'image/png',
    'image/PNG',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    // heic 파일 업로드시 formidable 에서 application/octet-stream 타입으로 읽는다.
    // 'image/heif',
    // 'image/heic',
    // 'image/heif-sequence',
    // 'image/heic-sequence',
  ],
  document: [
    'application/octet-stream',
    'application/zip',
    'application/x-rar-compressed',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/pdf',
    'text/csv',
    'text/plain',
  ],
};
Util.storage.uploadMimeType.document = Util.storage.uploadMimeType.document.concat(Util.storage.uploadMimeType.image);

// s3 bucket info
Util.storage.uploadInfo = {
  banner: {
    path: 'img/banner/',
    maxSizeLimit: 1 * 1024 * 1024,
    mimeType: Util.storage.mimeType.image,
    resized: false,
    squared: false,
    cropped: false,
    bucketType: Util.storage.bucketType.public,
  },
  CompanyLogo: {
    path: 'img/CompanyLogo/',
    maxSizeLimit: 30 * 1024 * 1024,
    mimeType: Util.storage.mimeType.image,
    imageSizeArray: [[200, null]], // 원본,W200 리사이즈 저장
    resized: true,
    squared: false,
    cropped: false,
    bucketType: Util.storage.bucketType.public,
  },
  avatar: {
    path: 'img/avatar/',
    maxSizeLimit: 10 * 1024 * 1024,
    mimeType: Util.storage.mimeType.image,
    imageSizeArray: [[200, 200]], // 원본,200 리사이즈 저장
    resized: true,
    squared: true,
    cropped: true,
    bucketType: Util.storage.bucketType.public,
  },
  productImg: {
    path: 'img/productImg/',
    maxSizeLimit: 50 * 1024 * 1024,
    mimeType: Util.storage.mimeType.image,
    imageSizeArray: [[500, 500], [200, 200], [1000, 1000]], // 원본,500,200 리사이즈 저장
    resized: true,
    squared: true,
    cropped: false,
    bucketType: Util.storage.bucketType.public,
  },
  brandLogo: {
    path: 'img/brandLogo/',
    maxSizeLimit: 30 * 1024 * 1024,
    mimeType: Util.storage.mimeType.image,
    imageSizeArray: [[200, null]], // 원본,W200 리사이즈 저장
    resized: true,
    squared: false,
    cropped: false,
    bucketType: Util.storage.bucketType.public,
  },
  brandBanner: {
    path: 'img/brandBanner/',
    maxSizeLimit: 1 * 1024 * 1024,
    mimeType: Util.storage.mimeType.image,
    resized: false,
    squared: false,
    cropped: false,
    bucketType: Util.storage.bucketType.public,
  },
  editorAttachments: {
    path: 'editorAttachments/',
    maxSizeLimit: 10 * 1024 * 1024,
    mimeType: Util.storage.mimeType.document,
    bucketType: Util.storage.bucketType.public,
  },
  inquiryAttachments: {
    path: 'inquiryAttachments/',
    maxSizeLimit: 10 * 1024 * 1024,
    mimeType: Util.storage.mimeType.document,
    bucketType: Util.storage.bucketType.private,
  },
  msds: {
    path: 'msds/',
    maxSizeLimit: 10 * 1024 * 1024,
    mimeType: Util.storage.mimeType.document,
    bucketType: Util.storage.bucketType.private,
  },
  buyerCompany: {
    path: 'buyerCompany/',
    maxSizeLimit: 10 * 1024 * 1024,
    mimeType: Util.storage.mimeType.document,
    bucketType: Util.storage.bucketType.private,
  },
};

// commonCode.s3UploadSizeLimit
Util.storage.s3UploadSizeLimit = {};
Object.keys(Util.storage.uploadInfo).forEach(k => {
  Util.storage.s3UploadSizeLimit[k] = Util.storage.uploadInfo[k].maxSizeLimit;
});

/**
 * s3 파일 업로드
 * @param {Object} s3
 * @param {Object} param
 * @return {Promise<*>}
 <param>
 {
	data : "",
	resize : "",
	s3info : "",
	uploadFileName : "",
	originName : "",
	mimeType : ""
 }
 </param>
 */
Util.storage.upload = async function(s3, param) {
  try {
    const uploadInfo = Util.storage.uploadInfo[param.s3info];

    if (!uploadInfo) {
      throw new ummaError.customMessage('uploadInfo not found.');
    }

    if (!param.uploadFileName) {
      throw new ummaError.customMessage('uploadFileName not found.');
    }

    const bucket = Util.storage.bucket[uploadInfo.bucketType];

    if (!bucket) {
      throw new ummaError.customMessage('bucket not found.');
    }

    if (!uploadInfo.path) uploadInfo.path = '';
    let uploadFileName = param.uploadFileName;

    // 개발자 환경에서 파일명 접두어 추가
    if (NODE_ENV === 'development') uploadFileName = [NODE_ENV, os.hostname().toLowerCase(), uploadFileName].join('_');

    // 최종 업로드 파일 경로 및 파일명
    const fileKey = uploadInfo.path + ummaUtil.date.stringFormatDate() + '/' + uploadFileName;

    // 파일 읽기
    param.data = fs.readFileSync(param.outputFilePath);

    // s3 params
    const s3params = {
      Bucket: bucket.bucketName,
      Key: fileKey,
      ContentType: param.mimeType,
      Body: param.data,
    };

    // OWNER 확인용 사용자정의 메타데이터 추가
    // 대문자 키값을 사용할 수 없으므로 role_id, user_id 로 설정
    // 키와 값 모두 string 타입만 사용 가능
    // S3에 업로드하면 아래와 같은 형식으로 보관
    // x-amz-meta-role_id, x-amz-meta-user_id
    if (param.roleId && param.userId) {
      /* eslint-disable camelcase */
      s3params.Metadata = {
        role_id: param.roleId.toString(),
        user_id: param.userId.toString(),
      };
      /* eslint-enable camelcase */
    }

    // 업로드
    const data = await s3.upload(s3params).promise();

    if (data && data.key) {
      data.cloudFrontUrl = bucket.cloudFrontUrl + '/' + data.key;
      data.originName = param.originName;
    }

    return data;
  } catch (err) {
    // return Promise.reject(err);
    throw err;
  }
};

module.exports = Util;
