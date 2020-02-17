'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const tmpDir = os.tmpdir();

// sharp.queue.on('change', function(queueLength) {
//   console.log('sharp queue contains ' + queueLength + ' task(s)');
// });

/**
 * 정사각형 이미지 만들기
 * @param {*} image
 * @param {*} metadata
 * @returns
 */
const createSquareImageBuffer = async (image, metadata) => {
  const isSquare = metadata.width === metadata.height; // 정사각형 이미지
  const isPortrait = metadata.width < metadata.height; // 세로가 긴 직사각형 이미지

  // 정사각형 이미지일 경우 원본 버퍼 리턴
  if (isSquare) return image.toBuffer();

  // 정사각형 이미지가 아닌 경우 오버레이 이미지를 만든다.
  const canvasSize = {};
  canvasSize.width = isPortrait ? metadata.height : metadata.width;
  canvasSize.height = canvasSize.width;
  // console.log('metadata', { width: metadata.width, height: metadata.height, format: metadata.format });
  // console.log('canvasSize', canvasSize);

  const gap = {
    width: Number.parseInt((canvasSize.width - metadata.width) / 2, 10),
    height: Number.parseInt((canvasSize.height - metadata.height) / 2, 10),
  };

  let top, bottom, left, right;

  if (isPortrait) {
    top = gap.width;
    bottom = gap.width;
    left = gap.height;
    right = gap.height;
  } else {
    top = gap.height;
    bottom = gap.height;
    left = gap.width;
    right = gap.width;
  }

  // 가로 좌우 여백 사이즈 픽셀 계산
  const w = canvasSize.width - (gap.width * 2 + metadata.width);
  if (w !== 0) left += w;

  // 세로 상하 여백 사이즈 픽셀 계산
  const h = canvasSize.height - (gap.height * 2 + metadata.height);
  if (h !== 0) top += h;

  // console.log('extend', { top, bottom, left, right });

  // extend image
  return image
    .extend({
      top,
      bottom,
      left,
      right,
      background: {
        r: 255,
        g: 255,
        b: 255,
      },
    })
    .toBuffer();
};

/**
 * 리사이즈
 * @param options
 */
const resize = async options => {
  // console.log(options);
  // 결과 리턴값
  const result = {
    success: false,
    error: null,
    input: {
      path: null,
      width: null,
      height: null,
    },
    output: {
      files: [], // {path: null, name: null, format: null, width: null, height: null, size: null}
    },
  };

  try {
    const inputFilePath = options.inputFilePath;
    const outputFileName = options.outputFileName;
    let outputFormat = options.outputFormat && options.outputFormat.toLowerCase();
    let outputSize = options.outputSize ? options.outputSize : [null, null]; // array [width, height] or array in array [[width, height]]
    const cropped = options.cropped ? 1 : 0;
    const squared = options.squared ? 1 : 0;

    // 단일 배열로 넘어온 경우 이중 배열로 변경
    if (!Array.isArray(outputSize[0])) {
      outputSize = [outputSize];
    }

    // validate array values
    let invalid = 0;
    let invalidArray = 0;
    outputSize.forEach(oSize => {
      if (!Array.isArray(oSize)) {
        invalidArray += 1;
        return;
      }
      const w = oSize[0] || 0;
      const h = oSize[1] || 0;
      if (!Number.isInteger(w)) invalid += 1;
      if (!Number.isInteger(h)) invalid += 1;
    });

    if (invalidArray > 0) {
      throw new Error('output size is not array.');
    }

    if (invalid > 0) {
      throw new Error('output size is not number.');
    }

    // 리턴값을 원본 URL로 주기 때문에 반드시 원본 사이즈 배열이 맨 앞에 있어야 한다.
    const originSizeArray = [[null, null]];
    outputSize = originSizeArray.concat(outputSize);

    // 파일 포맷 설정
    if (outputFormat === 'jpeg') outputFormat = 'jpg';
    // sharp.toFormat() not supported gif. change output format.
    else if (outputFormat === 'gif') outputFormat = 'png';

    // 파일 확장자
    const extname = '.' + outputFormat; // path.extname(outputFileName);

    const image = await sharp(inputFilePath).rotate(); // rotate 를 사용해야 가로,세로 이미지가 판별된다.
    const metadata = await image.metadata();
    result.input.path = inputFilePath;
    result.input.width = metadata.width;
    result.input.height = metadata.height;

    // 이미지 버퍼
    const imageBuf = squared ? await createSquareImageBuffer(image, metadata) : await image.toBuffer(); // 정사각 이미지 버퍼 or 원본 이미지 버퍼

    // Promise array
    const p = [];

    // 리사이즈 배열수만큼 이미지를 생성한다.
    outputSize.forEach(oSize => {
      const options = {};
      options.width = oSize[0] || null;
      options.height = oSize[1] || null;

      let resizePrefix = null; // 리사이즈 파일명 prefix

      // 리사이즈가 필요한 경우 옵션 설정
      if (options.width != null || options.height != null) {
        // add crop option
        if (cropped) options.fit = sharp.fit.cover;

        // 리사이즈 파일명 설정
        // if (options.width && options.height) resizePrefix = `${options.width}x${options.height}`;
        if (options.width && options.height) resizePrefix = `${options.width}`;
        else if (options.width) resizePrefix = `${options.width}`;
        else if (options.height) resizePrefix = `h${options.height}`;
      }

      // 최종 파일명 설정
      const lastFileName = resizePrefix ? `${path.basename(outputFileName, extname)}_${resizePrefix}${extname}` : outputFileName;
      const lastFilePath = path.join(tmpDir, lastFileName);

      // 리사이즈 작업 추가
      p.push(
        new Promise((resolve, reject) => {
          const r = {
            name: lastFileName,
            path: lastFilePath,
            format: outputFormat,
            width: options.width,
            height: options.height,
            size: null,
            error: null,
          };
          // resize image
          sharp(imageBuf)
            .rotate()
            .resize(options)
            .toFormat(outputFormat)
            .toBuffer()
            .then(data => {
              // 파일 저장
              fs.writeFile(lastFilePath, data, err => {
                r.size = data.length;
                r.error = err;
                resolve(r);
              });
            })
            .catch(err => {
              r.error = err;
              resolve(r);
            });
        })
      );
    });

    result.output.files = await Promise.all(p);
    result.success = true;
    return result;
  } catch (err) {
    // return Promise.reject(err);
    throw err;
  }
};

module.exports = {
  resize: resize,
};
