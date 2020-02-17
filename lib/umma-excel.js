'use strict';

// https://github.com/exceljs/exceljs
const ExcelJs = require('exceljs');
const path = require('path');
const ummaUtil = require('./umma-util');

// 엑셀관련설정
const ummaExcel = {};

// 엑셀 템플릿 경로
ummaExcel.excelTemplatePath = path.join(process.cwd(), 'server', 'resource', 'excel-template');

/**
 * 엑셀 템플릿 경로 가져오기
 * @param templateFileName
 * @return
 */
ummaExcel.getTemplatePath = function(templateFileName) {
  return path.join(ummaExcel.excelTemplatePath, templateFileName);
};

/**
 * 엑셀 셀 통화 형식
 */
ummaExcel.numberFormat = '_-* #,##0_-;-* #,##0_-;_-* "-"_-;_-@_-';
ummaExcel.priceFormatUSD = '_-* #,##0.00_-;-* #,##0.00_-;_-* "-"??_-;_-@_-';
ummaExcel.priceFormatUSDWithSymbol = '_-* $#,##0.00_-;-* #,##0.00_-;_-* "-"??_-;_-@_-';
ummaExcel.priceFormatKRW = '_-* #,##0_-;-* #,##0_-;_-* "-"_-;_-@_-';
ummaExcel.priceFormatKRWWithSymbol = '_-* ₩#,##0_-;-* #,##0_-;_-* "-"_-;_-@_-';

/**
 * 엑셀 워크북 생성
 * @return
 */
ummaExcel.createWorkBook = function() {
  return new ExcelJs.Workbook();
};

/**
 * 엑셀 파일 다운로드
 * @param res
 * @param workbook
 * @param fileName
 */
ummaExcel.send = async function(res, workbook, fileName) {
  // 엑셀 파일 다운로드
  res.set('Access-Control-Expose-Headers', 'Content-Disposition');
  res.attachment(`${fileName}_${ummaUtil.date.stringFormatDateTime()}.xlsx`);
  await workbook.xlsx.write(res);
  res.end();
};

module.exports = ummaExcel;
