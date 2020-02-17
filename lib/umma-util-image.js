'use strict';

const sharp = require('sharp');
const imageResizer = require('./image-resizer');
const ummaUtil = {
  storage: require('./umma-util-storage').storage,
};

const Util = {};

/**
 * image
 */
Util.image = {};

/**
 * 이미지의 메타정보를 읽는다.
 * @param paths
 */
Util.image.metadata = async function(paths) {
  try {
    // metadata
    const metadata = await sharp(paths)
      .rotate()
      .metadata();

    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
    };
  } catch (err) {
    // return Promise.reject(err);
    throw err;
  }
};

/**
 * 이미지 리사이저
 * @param options
 * @return {Promise<*>}
 */
Util.image.resize = async function(options) {
  try {
    // TODO: mime-types 모듈 사용 고려.
    const outputFormat = options.mimeType.indexOf('image/') > -1 ? options.mimeType.split('/')[1] : options.mimeType;

    const result = await imageResizer.resize({
      inputFilePath: options.inputFilePath,
      outputFileName: options.outputFileName,
      outputFormat: outputFormat,
      outputSize: options.outputSize,
      cropped: options.cropped,
      squared: options.squared,
    });

    if (!result.success) {
      // TODO: 이미 처리된 파일들 롤백 기능 필요.
      throw (new Error('Image resize processing failed.').status = 500);
    }

    return result;
  } catch (err) {
    // return Promise.reject(err);
    throw err;
  }
};

/**
 * 이미지 업로드 (리사이즈 설정 가능)
 * @param s3
 * @param param
 * @return {Promise<*>}
 */
Util.image.upload = async function(s3, param) {
  try {
    let result;
    if (param.resized) {
      result = await Util.image.resize({
        inputFilePath: param.filePath,
        outputFileName: param.uploadFileName,
        mimeType: param.mimeType,
        outputSize: param.imageSizeArray,
        cropped: param.cropped,
        squared: param.squared,
      });
    } else {
      result = {
        output: {
          files: [{ path: param.filePath, name: param.uploadFileName }],
        },
      };
    }

    const p = result.output.files.map(function(result) {
      param.outputFilePath = result.path;
      param.uploadFileName = result.name;

      return ummaUtil.storage.upload(s3, param);
    });

    return await Promise.all(p);
  } catch (err) {
    // return Promise.reject(err);
    throw err;
  }
};

module.exports = Util;
