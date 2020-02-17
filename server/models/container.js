'use strict';

const formidable = require('formidable');
const { S3 } = require('aws-sdk');
const logger = require('../../lib/logger')(module);
const ummaUtil = require('../../lib/umma-util');
const ummaError = require('../../lib/umma-error');

let app = {
  umma: require('../../reference'), // 개발 참조용 레퍼런스 파일
};

const s3 = new S3(ummaUtil.storage.aws.s3.options);

/**
 * validateS3Upload
 * @param uploadInfo
 * @param fields
 * @param files
 * @param checkImage
 * @return {*}
 */
function validateS3Upload(uploadInfo, fields, files, checkImage = false) {
  const result = {
    valid: false,
    error: null,
  };

  // s3Info 체크
  if (!uploadInfo) {
    result.error = new ummaError.customMessage(`upload failed - check s3info. s3info: ${fields.s3info}`);
    return result;
  } else if (!uploadInfo.maxSizeLimit || !uploadInfo.mimeType) {
    result.error = new ummaError.customMessage(`upload failed - check s3info. s3info: ${fields.s3info}`);
    return result;
  }

  // 업로드 파일 체크
  else if (!files.data) {
    result.error = new ummaError.customMessage('upload failed - check files.');
    return result;
  }

  // 파일 사이즈 체크
  else if (uploadInfo.maxSizeLimit < files.data.size) {
    result.error = new ummaError.fileSizeInvalid(`upload failed - check file size. maxSizeLimit: ${uploadInfo.maxSizeLimit} < size: ${files.data.size}`);
    return result;
  }

  // 파일 타입 체크
  else if (ummaUtil.storage.uploadMimeType[uploadInfo.mimeType].indexOf(files.data.type) < 0) {
    result.error = new ummaError.mimeTypeInvalid(`upload failed - check file type. fileType: ${files.data.type}`);
    return result;
  }

  // 이미지 파일 여부 체크
  else if (checkImage && files.data.type.indexOf('image') < 0) {
    result.error = new ummaError.customMessage(`upload failed - check image file. fileType: ${files.data.type}`);
  }

  result.valid = !result.error;
  return result;
}

module.exports = function(Container) {
  const Model = Container;
  /**
   * Disable Remote Method
   * NOTES: disableAllMethods 는 User 모델과 PersistedModel 만 사용가능
   */
  Model.disableRemoteMethodByName('getContainers');
  Model.disableRemoteMethodByName('getContainer');
  Model.disableRemoteMethodByName('createContainer');
  Model.disableRemoteMethodByName('destroyContainer');
  Model.disableRemoteMethodByName('getFiles');
  Model.disableRemoteMethodByName('getFile');
  Model.disableRemoteMethodByName('removeFile');
  Model.disableRemoteMethodByName('upload');
  Model.disableRemoteMethodByName('download');
  Model.disableRemoteMethodByName('uploadStream');
  Model.disableRemoteMethodByName('downloadStream');

  Model.on('attached', function(a) {
    app = a;
  });

  /**
   * 파일 업로드
   * - formidable 사용
   * - multipart/form 전송
   * @param req
   * @param options
   <return>
   {
		"ETag": "\"1897f4a946d501827d5ff85c01f5bb1e\"",
		"Location": "https://s3.ap-northeast-2.amazonaws.com/umma.io/img/avatar/20181016/1539687455034.png",
    "key": "img/avatar/20181016/1539687455034.png",
    "Key": "img/avatar/20181016/1539687455034.png",
		"Bucket": "umma.io",
		"cloudFrontUrl": "https://umma.io/img/avatar/20181016/1539687455034.png"
	 }
   </return>
   */
  Container.fileUpload = async function(req, options) {
    const token = ummaUtil.token.getAccessToken(options);
    const form = new formidable.IncomingForm();
    // form.encoding = 'utf-8';
    // form.uploadDir = os.tmpdir();
    // form.keepExtensions = false;
    // form.hash = false;
    // form.multiples = false;
    // form.maxFieldsSize = 20 * 1024 * 1024; // 20mb
    // form.maxFileSize = 200 * 1024 * 1024; // 200mb
    // form.maxFields = 1000;

    return new Promise(function(resolve, reject) {
      form.parse(req, function(err, fields, files) {
        if (err) return reject(new ummaError.customMessage(err.message));

        const uploadInfo = ummaUtil.storage.uploadInfo[fields.s3info];

        // validate
        const validateResult = validateS3Upload(uploadInfo, fields, files, false);
        if (validateResult.error) {
          return reject(validateResult.error);
        }

        const param = {};
        param.s3info = fields.s3info;
        param.uploadFileName = ummaUtil.string.getUploadFileName(files.data.name);
        param.originName = files.data.name;
        param.filePath = files.data.path;
        param.mimeType = files.data.type;
        param.size = files.data.size;

        // OWNER 확인용 회원 롤,아이디 설정
        if (token.roleId && token.userId) {
          param.roleId = token.roleId;
          param.userId = token.userId;
        }

        // 이미지 버켓 타입과 이미지 파일인 경우
        if (uploadInfo.mimeType === 'image' && param.mimeType.indexOf('image') > -1) {
          // 이미지 파일인 경우
          param.resized = uploadInfo.resized;
          if (param.resized) {
            param.imageSizeArray = uploadInfo.imageSizeArray;
            if (!param.imageSizeArray) {
              return reject(new ummaError.customMessage(`uploadInfo imageSizeArray not found. s3info: ${fields.s3info}`));
            }
            param.squared = uploadInfo.squared;
            param.cropped = uploadInfo.cropped;
          }

          // const metadata = await ummaUtil.image.metadata(files.data.path);
          // param.width = metadata.width;
          // param.height = metadata.height;
          // param.format = metadata.format;

          // 이미지 업로드
          ummaUtil.image
            .upload(s3, param)
            .then(function(d) {
              logger.debug('image upload', d);
              resolve(d[0]);
            })
            .catch(function(err) {
              reject(err);
            });
        } else {
          // 이미지 버켓 타입이 아닌 경우 또는 이미지 파일이 아닌 경우
          param.outputFilePath = param.filePath;

          // 파일 업로드
          ummaUtil.storage
            .upload(s3, param)
            .then(function(d) {
              logger.debug('storage upload', d);
              resolve(d);
            })
            .catch(function(err) {
              reject(err);
            });
        }
      });
    });
  };

  // Notes: data, s3info 파라메터에 required: true 를 사용할 수 없다. req 데이터를 읽는 방식으로 개발되었기 때문.
  Container.remoteMethod('fileUpload', {
    description: 'Upload a file',
    accepts: [
      ummaUtil.remoteMethod.accepts.req,
      ummaUtil.remoteMethod.accepts.options,
      { arg: 'data', type: 'file', http: { source: 'form' } }, // for explorer
      { arg: 's3info', type: 'string', http: { source: 'form' } }, // for explorer
    ],
    returns: { root: true, type: 'object' },
    http: { path: '/fileUpload', verb: 'post' },
  });

  /**
   * Public 파일 다운로드
   <param>
   {"container": "umma.io", "filePath": "img/brandLogo/20181010/1539146174772.png", "fileName": "brandLogo.png"}
   </param>
   <test>
   http://localhost:4000/api/v1/containers/public-file-download/%7B%22container%22%3A%20%22umma.io%22%2C%20%22filePath%22%3A%20%22img%2FbrandLogo%2F20181010%2F1539146174772.png%22%2C%20%22fileName%22%3A%20%22brandLogo.png%22%7D?access_token=
   </test>
   * @param param
   * @param options
   * @param req
   * @param res
   * @param cb
   */
  Container.publicFileDownload = function(param, options, req, res, cb) {
    if (!param.fileName) return cb(new ummaError.invalidParam('fileName'));
    if (!param.container) return cb(new ummaError.invalidParam('container'));
    if (!param.filePath) return cb(new ummaError.invalidParam('filePath'));

    // 퍼블릭 bucket(container) 인지 확인
    if (!ummaUtil.storage.bucket.isPublicBucket(param.container)) {
      return cb(new ummaError.customMessage('container is not public.'));
    }

    const s3params = {
      Bucket: param.container,
      Key: param.filePath,
    };

    // 파일 존재여부 및 메타데이터 확인
    s3.headObject(s3params)
      .promise()
      .then(function(data) {
        if (!data) return cb(new ummaError.downloadNotFound());

        res.set('Access-Control-Expose-Headers', 'Content-Disposition');
        res.attachment(param.fileName);
        s3.getObject(s3params)
          .createReadStream()
          .pipe(res);
      })
      .catch(function(err) {
        if (err) return cb(err);
      });
  };

  Container.remoteMethod('publicFileDownload', {
    description: 'Public 파일 다운로드',
    notes:
      '{"container": "umma.io", "filePath": "img/brandLogo/20181010/1539146174772.png", "fileName": "brandLogo.png"}' +
      '<br>Try it out! 실행 후 하단 Request URL을 복사해서 브라우저 주소창에 직접 입력해서 파일 다운로드를 테스트 한다.',
    accepts: [
      { arg: 'data', type: 'object', required: true, description: '{"container":"", "filePath":"", "fileName":""}' },
      ummaUtil.remoteMethod.accepts.options,
      ummaUtil.remoteMethod.accepts.req,
      ummaUtil.remoteMethod.accepts.res,
    ],
    returns: { arg: 'body', type: 'file', root: true },
    http: { path: '/publicFileDownload/:data', verb: 'get' },
  });

  /**
   * Private 파일 다운로드
   <param>
   {"container": "umma", "filePath": "buyerCompany/20181104/1780d69b-ef52-4f27-9d0a-9f24991ebc59.jpg", "fileName": "abc.jpg"}
   </param>
   <test>
   http://localhost:4000/api/v1/containers/private-file-download/%7B%22container%22%3A%20%22umma%22%2C%20%22filePath%22%3A%20%22buyerCompany%2F20181104%2F1780d69b-ef52-4f27-9d0a-9f24991ebc59.jpg%22%2C%20%22fileName%22%3A%20%22abc.jpg%22%7D?access_token=
   </test>
   * @param param
   * @param options
   * @param req
   * @param res
   * @param cb
   */
  Container.privateFileDownload = function(param, options, req, res, cb) {
    const token = ummaUtil.token.getAccessToken(options);
    if (!param.fileName) return cb(new ummaError.invalidParam('fileName'));
    if (!param.container) return cb(new ummaError.invalidParam('container'));
    if (!param.filePath) return cb(new ummaError.invalidParam('filePath'));

    // 프라이빗 bucket(container) 인지 확인
    if (!token.isAdmin && !ummaUtil.storage.bucket.isPrivateBucket(param.container)) {
      return cb(new ummaError.customMessage('container is not private.'));
    }

    const s3params = {
      Bucket: param.container,
      Key: param.filePath,
    };

    // 파일 존재여부 및 메타데이터 확인
    s3.headObject(s3params)
      .promise()
      .then(function(data) {
        if (!data) return cb(new ummaError.downloadNotFound());
        // console.log(data.Metadata);
        // private 파일이므로 유저 해당 파일에 접근 권한이 있는지 체크
        // 관리자가 아니면 OWNER 권한 확인

        // TODO: data.Metadata 문제 해걀하다

        // if (!token.isAdmin) {
        //   let isAuth = false;
        //   // OWNER 확인
        //   if (token.userId && data.Metadata) {
        //     if (data.Metadata.role_id === token.roleId.toString() && data.Metadata.user_id === token.userId.toString()) {
        //       isAuth = true;
        //     }
        //   }

        //   // 권한이 없을 경우 에러
        //   if (!isAuth) {
        //     return cb(new ummaError.forbidden());
        //   }
        // }

        res.set('Access-Control-Expose-Headers', 'Content-Disposition');
        res.attachment(param.fileName);
        s3.getObject(s3params)
          .createReadStream()
          .pipe(res);
      })
      .catch(function(err) {
        if (err) return cb(err);
      });
  };

  Container.remoteMethod('privateFileDownload', {
    description: 'Private 파일 다운로드',
    notes:
      '{"container": "umma", "filePath": "buyerCompany/20181104/1780d69b-ef52-4f27-9d0a-9f24991ebc59.jpg", "fileName": "abc.jpg"}' +
      '<br>Try it out! 실행 후 하단 Request URL을 복사해서 브라우저 주소창에 직접 입력해서 파일 다운로드를 테스트 한다.',
    accepts: [
      { arg: 'data', type: 'object', required: true, description: '{"container":"", "filePath":"", "fileName":""}' },
      ummaUtil.remoteMethod.accepts.options,
      ummaUtil.remoteMethod.accepts.req,
      ummaUtil.remoteMethod.accepts.res,
    ],
    returns: { arg: 'body', type: 'file', root: true },
    http: { path: '/privateFileDownload/:data', verb: 'get' },
  });
};
