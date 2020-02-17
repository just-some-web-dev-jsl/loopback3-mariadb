'use strict';

const path = require('path');
const imageResizer = require('../../lib/image-resizer');

const originImageFileName = 'test-image-resize';
const mimeType = 'jpg';
const originImageFilePath = path.resolve(__dirname, `${originImageFileName}.${mimeType}`);
const resizeFormat = 'png';

const options = {
  inputFilePath: originImageFilePath,
  outputFileName: `${originImageFileName}.${resizeFormat}`,
  mimeType: resizeFormat,
  outputSize: [[200, 200], [null, null]], // array [width, height] or array in array [[width, height]]
  cropped: 0,
  squared: 0,
};

(async () => {
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
    throw err;
  }
})()
  .then(result => {
    console.log('result', result);
    console.log('result.output.files', result.output.files);
  })
  .catch(err => {
    console.error(err);
  });
