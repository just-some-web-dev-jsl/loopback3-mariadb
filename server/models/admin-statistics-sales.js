/* eslint-disable camelcase */
'use strict';

const logger = require('../../lib/logger')(module);
const ummaUtil = require('../../lib/umma-util');
const ummaExcel = require('../../lib/umma-excel');
const ummaError = require('../../lib/umma-error');
const { executeSql } = require('../../lib/loopback-helpers');

let app = {
  umma: require('../../reference'), // 개발 참조용 레퍼런스 파일
};

const notes = `filter {"dateType": 1, "startDate": "2019/04/01", "endDate": "2019/04/30", "dateSeparator": "/" (Optional), "skip": 0 (Optional), "limit": 0 (Optional)}
  <br>filter {"dateType": 2, "startDate": "2019/03", "endDate": "2019/04", "dateSeparator": "/" (Optional), "skip": 0 (Optional), "limit": 0 (Optional)}
  <br>filter {"dateType": 3, "startDate": "2019", "endDate": "2019", "dateSeparator": "/" (Optional), "skip": 0 (Optional), "limit": 0 (Optional)}`;

module.exports = function(AdminStatisticsSales) {
  const Model = AdminStatisticsSales;

  Model.on('attached', function(a) {
    app = a;
  });

  /**
   * 통계용 JSON 데이터 생성
   * @param {*} jsonData
   * @returns
   */
  function getJsonData(jsonData) {
    // 데이터 생성
    const data = Object.keys(jsonData).map(function(key1) {
      const t = {};
      // 머니 포맷 적용
      Object.keys(jsonData[key1].data).forEach(function(key2) {
        // 합계와 기준날짜로 금액 셀 체크
        if (key2.toLowerCase().indexOf('total') > -1 || new RegExp(/[^0-9]/g).test(key2) === false) {
          jsonData[key1].data[key2] = ummaUtil.number.stringFormatMoney(jsonData[key1].data[key2]);
        }
      });
      t.data = jsonData[key1].data;
      t.expanded = jsonData[key1].expanded || false; // TreeTable 트리 노드 펼치기
      if (jsonData[key1].children) {
        t.children = getJsonData(jsonData[key1].children);
      }
      return t;
    });

    return data;
  }

  /**
   * 엑셀용 JSON 데이터 생성
   * @param {*} baseDates
   * @param {*} columns
   * @param {*} jsonData
   * @returns
   */
  function getExcelJsonData(baseDates, columns, jsonData) {
    let data = [];
    Object.keys(jsonData).forEach(function(key1) {
      let t = [];
      const d = jsonData[key1].data;

      // 타이틀 컬럼값 추가
      columns.forEach(col => {
        t.push(d[col.field] || '');
      });

      // 기준 날짜별 합계
      const baseDatesTotalPrice = getTotalPriceByBaseDates(baseDates, d);
      t = t.concat(baseDatesTotalPrice);

      data.push(t);

      // 자식 객체
      if (jsonData[key1].children) {
        const c = getExcelJsonData(baseDates, columns, jsonData[key1].children);
        data = data.concat(c);
      }
    });

    return data;
  }

  /**
   * 통계용 JSON 데이터 생성
   * @param {*} filter
   * @param {*} columns
   * @param {*} statData
   * @returns
   */
  function getTableData(filter, columns, statData) {
    // 클라이언트에 보낼 json 데이터를 만든다. (prime ng treetable)
    if (false) {
      // 참고용 샘플 데이터
      const sample = {
        cols: [
          { field: 'country', header: 'Country' },
          { field: 'category', header: 'Category' },
          { field: 'total', header: '합계' },
          { field: '20190221', header: '2019/02/21' },
          { field: '20190328', header: '2019/03/28' },
        ],
        data: [
          {
            data: { '20190221': 13978.24, '20190328': 128409.12, country: 'Afganistan', countryCode: 'AF', category: 'Total' },
            expanded: true,
            children: [
              { data: { '20190221': 13955.24, '20190328': 128269.44, category: 'Make Up', categoryCode: '002' } },
              { data: { '20190221': 0, '20190328': 16.68, category: 'Skin Care', categoryCode: '001' } },
            ],
          },
          {
            data: { '20190320': 1205.6, '20190321': 6796.67, '20190323': 3811, country: 'Hong Kong', countryCode: 'HK', category: 'Total' },
            expanded: true,
            children: [
              { data: { '20190320': 372, '20190321': 8.98, category: 'Make Up', categoryCode: '002' } },
              { data: { '20190320': 333.6, '20190321': 6.52, '20190323': 3800, category: 'Skin Care', categoryCode: '001' } },
            ],
          },
        ],
        expanded: true,
      };
    }

    // 기준 날짜 생성
    const cols = getColumnsAndBaseDates(filter, columns).columns;
    // 데이터 생성
    const data = getJsonData(statData);

    return {
      titleColsCount: columns.length - 1, // -1 을 해서 마지막 합계 컬럼은 제외시킨다.
      cols: cols,
      data: data,
    };
  }

  /**
   * 통계 엑셀용 JSON 데이터 생성
   * @param {*} filter
   * @param {*} columns
   * @param {*} statData
   * @returns
   */
  function getExcelData(filter, columns, statData) {
    // 기준 날짜 생성
    const excelCols = getExcelColumnsAndBaseDates(filter, columns);
    // 엑셀 데이터 생성
    const data = getExcelJsonData(excelCols.baseDates, columns, statData);

    return {
      columns: excelCols.columns,
      data: data,
    };
  }

  /**
   * 기준 날짜별 합계 배열을 반환한다.
   * @param {*} baseDates
   * @param {*} data
   * @returns
   */
  function getTotalPriceByBaseDates(baseDates, data) {
    return baseDates.map(function(baseDate) {
      return data[baseDate] || 0;
    });
  }

  /**
   * 헤더 컬럼 배열 및 기준 날짜 배열을 반환한다.
   * @param {*} filter
   * @param {*} columns
   * @param {*} isExcel
   * @returns
   */
  const getColumnsAndBaseDates = function(filter, columns, isExcel = false) {
    // 기준 날짜 생성
    const baseDates = [];
    filter.dateSeparator = filter.dateSeparator || '/';
    const start = new Date(filter.startDate);
    const end = new Date(filter.endDate);
    // console.log('start', start);
    // console.log('end', end);

    // 엑셀 셀 서식 표시형식
    const excelFormat = {
      price: { numFmt: '#,##0.00;[Red]-#,##0.00' },
    };

    // columns 배열의 마지막 값을 확인해서 엑셀 컬럼 사이즈를 설정한다.
    let width;
    if (isExcel) {
      width = columns[columns.length - 1].width || 12;
      columns = columns.map(function(col) {
        // 합계 셀값에 엑셀 포맷 적용
        if (col.field == 'total') col.style = excelFormat.price;
        return col;
      });
    } else {
      columns = columns.map(function(col) {
        // 트리테이블에 불필요한 column 속성 제거
        delete col.width;
        return col;
      });
    }

    if (filter.dateType === 1) {
      // 일별
      while (end.getTime() - start.getTime() >= 0) {
        const date = new Date(start);
        if (isExcel) {
          baseDates.push(ummaUtil.date.stringFormatDate(date));
          columns.push({ header: ummaUtil.date.stringFormatDate(date, filter.dateSeparator), width: width, style: excelFormat.price });
        } else {
          columns.push({ field: ummaUtil.date.stringFormatDate(date), header: ummaUtil.date.stringFormatDate(date, filter.dateSeparator) });
        }
        start.setUTCDate(start.getUTCDate() + 1);
      }
    } else if (filter.dateType === 2) {
      // 월별
      while (end.getTime() - start.getTime() >= 0) {
        const date = new Date(start);
        if (isExcel) {
          baseDates.push(ummaUtil.date.stringFormatMonth(date));
          columns.push({ header: ummaUtil.date.stringFormatMonth(date, filter.dateSeparator), width: width, style: excelFormat.price });
        } else {
          columns.push({ field: ummaUtil.date.stringFormatMonth(date), header: ummaUtil.date.stringFormatMonth(date, filter.dateSeparator) });
        }
        start.setUTCMonth(start.getUTCMonth() + 1);
      }
    } else if (filter.dateType === 3) {
      // 년별
      while (end.getTime() - start.getTime() >= 0) {
        const date = new Date(start);
        const year = ummaUtil.date.stringFormatYear(date);
        if (isExcel) {
          baseDates.push(year);
          columns.push({ header: year, width: width, style: excelFormat.price });
        } else {
          columns.push({ field: year, header: year });
        }
        start.setUTCFullYear(start.getUTCFullYear() + 1);
      }
    }

    return {
      columns: columns,
      baseDates: baseDates,
    };
  };
  const getExcelColumnsAndBaseDates = function(filter, columns) {
    return getColumnsAndBaseDates(filter, columns, true);
  };

  /**
   * 엑셀 생성 및 다운로드
   * @param {*} res
   * @param {*} columns
   * @param {*} data
   * @param {*} sheetName
   * @param {*} fileName
   */
  const downloadExcelFile = async function(res, columns, data, sheetName, fileName) {
    // 엑셀 시트 생성
    const wb = ummaExcel.createWorkBook();
    const ws = wb.addWorksheet(sheetName);

    // 엑셀 데이터 입력
    ws.columns = columns;
    ws.addRows(data);

    // 엑셀 시트 스타일 설정
    const headerRow = ws.getRow(1);
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.font = { bold: true };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };

    // ws.eachRow(function(row, rowNumber) {
    //   console.log('Row ' + rowNumber + ' = ' + JSON.stringify(row.values));
    // });

    // 엑셀 파일 다운로드
    await ummaExcel.send(res, wb, fileName);
  };

  /**
   * 필터에서 필수 파라메터들을 가져온다.
   * @param {*} filter
   * @param {*} tableName
   * @returns
   */
  function getParametersByFilterAndTableName(filter, tableName) {
    if (!filter) throw new ummaError.invalidParam('filter');

    const dateType = filter.dateType;
    let startDate = filter.startDate;
    let endDate = filter.endDate;
    const searchText = filter.searchText;

    if (!dateType) throw new ummaError.invalidParam('filter.dateType');
    if (!startDate || typeof startDate !== 'string') throw new ummaError.invalidParam('filter.startDate');
    if (!endDate || typeof endDate !== 'string') throw new ummaError.invalidParam('filter.endDate');

    if (dateType === 1) {
      // 일별,월별(1~31)
      if (startDate.length !== 10) throw new ummaError.invalidParam('filter.startDate (2019/01/01)');
      if (endDate.length !== 10) throw new ummaError.invalidParam('filter.endDate (2019/01/01)');
    } else if (dateType === 2) {
      // 분기별,반기별
      if (startDate.length !== 7) throw new ummaError.invalidParam('filter.startDate (2019/01)');
      if (endDate.length !== 7) throw new ummaError.invalidParam('filter.endDate (2019/01)');
    } else if (dateType === 3) {
      // 년도별
      if (startDate.length !== 4) throw new ummaError.invalidParam('filter.startDate (2019)');
      if (endDate.length !== 4) throw new ummaError.invalidParam('filter.endDate (2019)');
    } else {
      throw new ummaError.invalidParam('filter.dateType (1,2,3)');
    }

    // 일별/월별 시작날짜/종료날짜/테이블명 접미사
    const prefixTableName = 'stat_sales_';
    let suffixTableName;
    if (dateType === 1) {
      startDate = ummaUtil.date.stringFormatDate(new Date(startDate));
      endDate = ummaUtil.date.stringFormatDate(new Date(endDate));
      suffixTableName = '_daily';
    } else if (dateType === 2) {
      startDate = ummaUtil.date.stringFormatMonth(new Date(startDate));
      endDate = ummaUtil.date.stringFormatMonth(new Date(endDate));
      suffixTableName = '_monthly';
    } else if (dateType === 3) {
      startDate = ummaUtil.date.stringFormatYear(new Date(startDate));
      endDate = ummaUtil.date.stringFormatYear(new Date(endDate));
      suffixTableName = '_yearly';
    }

    // 테이블명
    const statTableName = `${prefixTableName}${tableName}${suffixTableName}`;

    // 검색조건
    return {
      dateType: dateType, // 일별/월별/년별
      startDate: startDate, // 시작일: 2019/01/01 또는 2019/01
      endDate: endDate, // 종료일: 2019/01/31 또는 2019/01
      statTableName: statTableName,
      queryLimit: filter.limit ? `LIMIT ${filter.skip || 0}, ${filter.limit}` : '',
      searchText: searchText,
    };
  }

  /**
   * 국가별 주요 카테고리 매출 통계
   * @param filter
   * @param options
   * @param isExcel
   */
  AdminStatisticsSales.countriesWithCategoryData = async function(filter, options, isExcel = false) {
    // const token = ummaUtil.token.getAccessToken(options);
    const params = getParametersByFilterAndTableName(filter, 'country_category');

    params.where = `order_created >= '${params.startDate}' AND order_created <= '${params.endDate}' AND product_total_price > 0`;

    // 데이터 조회
    const query = `SELECT
      t1.ranking,
      t3.order_created orderCreated,
      t3.ct_id ctId,
      ct.name ctName,
      t3.cat_cd catCd,
      t3.cat_name catName,
      t3.product_total_price productTotalPrice
    FROM (
      SELECT
        RANK() OVER (ORDER BY product_total_price DESC) AS ranking,
        ct_id,
        SUM(product_total_price) product_total_price
      FROM ${params.statTableName}
      WHERE ${params.where}
      GROUP BY ct_id
    ) t1
    LEFT JOIN country ct ON ct.id = t1.ct_id
    LEFT JOIN (
      SELECT
        order_created,
        ct_id,
        SUM(product_total_price) product_total_price
      FROM ${params.statTableName}
      WHERE ${params.where}
      GROUP BY order_created, ct_id
      ${params.queryLimit}
    ) t2 ON t2.ct_id = t1.ct_id
    LEFT JOIN (
      SELECT
        order_created,
        ct_id,
        cat_cd,
        cat_name,
        SUM(product_total_price) product_total_price
      FROM ${params.statTableName}
      WHERE ${params.where}
      GROUP BY order_created, ct_id, cat_cd
    ) t3 ON t3.order_created = t2.order_created AND t3.ct_id = t2.ct_id
    ORDER BY ranking, orderCreated
    `;

    const statistics = await executeSql(app.datasources.ummaDs, query);

    const temp = {};
    // 전체 합계
    const total = 'total';
    temp[total] = {};
    temp[total].data = {};
    temp[total].data.total = 0;

    statistics.forEach(function(stat) {
      const baseDate = stat.orderCreated;
      const key1 = stat.ctId;
      const key2 = stat.catCd;
      const productTotalPrice = stat.productTotalPrice;

      // 국가별 데이터
      if (key1) {
        if (!temp[key1]) {
          temp[key1] = {};
          temp[key1].expanded = true;
          temp[key1].data = {};
          temp[key1].data.ranking = stat.ranking;
          temp[key1].data.country = stat.ctName;
          temp[key1].data.countryCode = stat.ctId;
          temp[key1].data.category = '합계';
          temp[key1].data.total = 0;
        }
        // 국가 라인 합계
        temp[key1].data.total += productTotalPrice;
        // 국가 라인 날짜별 합계
        if (!temp[key1].data[baseDate]) {
          temp[key1].data[baseDate] = 0;
        }
        temp[key1].data[baseDate] += productTotalPrice;
      }

      // 카테고리별 데이터
      if (key2) {
        if (!temp[key1].children) {
          temp[key1].children = {};
        }
        if (!temp[key1].children[key2]) {
          temp[key1].children[key2] = {};
          temp[key1].children[key2].expanded = false;
          temp[key1].children[key2].data = {};
          temp[key1].children[key2].data.ranking = '';
          temp[key1].children[key2].data.country = '';
          temp[key1].children[key2].data.category = stat.catName;
          temp[key1].children[key2].data.categoryCode = stat.catCd;
          temp[key1].children[key2].data.total = 0;
        }
        // 카테고리 라인 합계
        temp[key1].children[key2].data.total += productTotalPrice;
        // 카테고리 라인 날짜별 합계
        temp[key1].children[key2].data[baseDate] = productTotalPrice;
      }

      // 전체 합계
      temp[total].data.total += productTotalPrice;
      // 전체 날짜별 합계
      if (baseDate) {
        if (!temp[total].data[baseDate]) {
          temp[total].data[baseDate] = 0;
        }
        temp[total].data[baseDate] += productTotalPrice;
      }
    });

    // 헤더 컬럼 설정
    const columns = [];
    columns.push({ field: 'ranking', header: '순위', width: 10 }); // columns[0]
    columns.push({ field: 'country', header: '국가', width: 20 }); // columns[1]
    columns.push({ field: 'category', header: '카테고리', width: 20 }); // columns[2]
    columns.push({ field: 'total', header: '합계', width: 12 }); // columns[3]

    if (isExcel) {
      return getExcelData(filter, columns, temp);
    }
    return getTableData(filter, columns, temp);
  };
  AdminStatisticsSales.countriesWithCategoryExcelData = async function(filter, options) {
    return await AdminStatisticsSales.countriesWithCategoryData(filter, options, true);
  };

  /**
   * 국가별 주요 카테고리 매출 통계
   * @param filter
   * @param options
   */
  AdminStatisticsSales.countriesWithCategory = async function(filter, options) {
    return await AdminStatisticsSales.countriesWithCategoryData(filter, options);
  };
  AdminStatisticsSales.remoteMethod('countriesWithCategory', {
    description: '국가별 주요 카테고리 매출 통계',
    notes: notes,
    accepts: ummaUtil.remoteMethod.accepts.filterAndOptions,
    returns: { root: true, type: { cols: [], data: [] } },
    http: { path: '/countries', verb: 'get' },
  });

  /**
   * 국가별 주요 카테고리 매출 통계 다운로드
   * @param res
   * @param filter
   * @param options
   */
  AdminStatisticsSales.countriesWithCategoryDownload = async function(res, filter, options) {
    const excelData = await AdminStatisticsSales.countriesWithCategoryExcelData(filter, options);
    const sheetName = '국가별 주요 카테고리 매출 통계';
    const fileName = 'umma-statistics-sales-country-category';
    await downloadExcelFile(res, excelData.columns, excelData.data, sheetName, fileName);
  };
  AdminStatisticsSales.remoteMethod('countriesWithCategoryDownload', {
    description: '국가별 주요 카테고리 매출 통계 다운로드',
    notes: notes,
    accepts: [ummaUtil.remoteMethod.accepts.res, ummaUtil.remoteMethod.accepts.filter, ummaUtil.remoteMethod.accepts.options],
    returns: { arg: 'body', type: 'file', root: true },
    http: { path: '/countries/download', verb: 'get' },
  });

  /**
   * 카테고리별 매출 통계
   * @param filter
   * @param options
   * @param isExcel
   */
  AdminStatisticsSales.categoriesData = async function(filter, options, isExcel = false) {
    // const token = ummaUtil.token.getAccessToken(options);
    const params = getParametersByFilterAndTableName(filter, 'category');

    params.where = `order_created >= '${params.startDate}' AND order_created <= '${params.endDate}' AND product_total_price > 0`;

    // 데이터 조회
    const query = `SELECT
      cat.cat_code catCode,
      cat.cat_name catName,
      cat.cat_depth catDepth,
      cat.cat_cd_1depth catCd1depth,
      cat.cat_name_1depth catName1depth,
      cat.cat_cd_2depth catCd2depth,
      cat.cat_name_2depth catName2depth,
      cat.cat_cd_3depth catCd3depth,
      cat.cat_name_3depth catName3depth,
      tt.order_created orderCreated,
      tt.cat_cd1 catCd1,
      tt.cat_cd2 catCd2,
      tt.cat_cd3 catCd3,
      tt.product_total_price productTotalPrice
    FROM (
      SELECT
        cat_code,
        cat_name,
        cat_depth,
        cat_cd_1depth,
        cat_name_1depth,
        cat_cd_2depth,
        cat_name_2depth,
        cat_cd_3depth,
        cat_name_3depth
      FROM view_category2
    ) cat
    LEFT JOIN (
      SELECT
        order_created,
        cat_cd1,
        cat_name1,
        cat_cd2,
        cat_name2,
        cat_cd3,
        cat_name3,
        SUM(product_total_price) product_total_price
      FROM ${params.statTableName}
      WHERE ${params.where}
      GROUP BY order_created, cat_cd1, cat_cd2, cat_cd3
    ) tt ON CONCAT(tt.cat_cd1, tt.cat_cd2, tt.cat_cd3) = cat.cat_code
    ORDER BY catCode, orderCreated
    `;

    const statistics = await executeSql(app.datasources.ummaDs, query);

    const temp = {};
    // 전체 합계
    const total = 'total';
    temp[total] = {};
    temp[total].data = {};
    temp[total].data.total = 0;

    statistics.forEach(function(stat) {
      const baseDate = stat.orderCreated;
      const key1 = stat.catCd1depth;
      const key2 = stat.catCd2depth;
      const key3 = stat.catCd3depth;
      const productTotalPrice = stat.productTotalPrice;

      // 카테고리 1
      if (key1) {
        if (!temp[key1]) {
          temp[key1] = {};
          temp[key1].expanded = true;
          temp[key1].data = {};
          temp[key1].data.category1 = stat.catName1depth;
          temp[key1].data.category1Code = stat.catCd1depth;
          temp[key1].data.category2 = '';
          temp[key1].data.category3 = '';
          temp[key1].data.total = 0;
        }
        if (productTotalPrice) {
          // 카테고리 1 라인 합계
          temp[key1].data.total += productTotalPrice;
          // 카테고리 1 날짜별 합계
          if (baseDate) {
            if (!temp[key1].data[baseDate]) {
              temp[key1].data[baseDate] = 0;
            }
            temp[key1].data[baseDate] += productTotalPrice;
          }
        }
      }

      // 카테고리 2
      if (key2) {
        if (!temp[key1].children) {
          temp[key1].children = {};
        }
        if (!temp[key1].children[key2]) {
          temp[key1].children[key2] = {};
          temp[key1].children[key2].expanded = false;
          temp[key1].children[key2].data = {};
          temp[key1].children[key2].data.category1 = '';
          temp[key1].children[key2].data.category2 = stat.catName2depth;
          temp[key1].children[key2].data.category2Code = stat.catCd2depth;
          temp[key1].children[key2].data.category3 = '';
          temp[key1].children[key2].data.total = 0;
        }
        if (productTotalPrice) {
          // 카테고리 2 라인 합계
          temp[key1].children[key2].data.total += productTotalPrice;
          // 카테고리 2 날짜별 합계
          if (baseDate) {
            if (!temp[key1].children[key2].data[baseDate]) {
              temp[key1].children[key2].data[baseDate] = 0;
            }
            temp[key1].children[key2].data[baseDate] += productTotalPrice;
          }
        }
      }

      // 카테고리 3
      if (key3) {
        if (!temp[key1].children[key2].children) {
          temp[key1].children[key2].children = {};
        }
        if (!temp[key1].children[key2].children[key3]) {
          temp[key1].children[key2].children[key3] = {};
          temp[key1].children[key2].children[key3].expanded = false;
          temp[key1].children[key2].children[key3].data = {};
          temp[key1].children[key2].children[key3].data.category1 = '';
          temp[key1].children[key2].children[key3].data.category2 = '';
          temp[key1].children[key2].children[key3].data.category3 = stat.catName3depth;
          temp[key1].children[key2].children[key3].data.category3Code = stat.catCd3depth;
          temp[key1].children[key2].children[key3].data.total = 0;
        }
        if (productTotalPrice) {
          // 카테고리 3 라인 합계
          temp[key1].children[key2].children[key3].data.total += productTotalPrice;
          // 카테고리 3 날짜별 합계
          if (baseDate) {
            temp[key1].children[key2].children[key3].data[baseDate] = productTotalPrice;
          }
        }
      }

      if (productTotalPrice) {
        // 전체 합계
        temp[total].data.total += productTotalPrice;
        // 전체 날짜별 합계
        if (baseDate) {
          if (!temp[total].data[baseDate]) {
            temp[total].data[baseDate] = 0;
          }
          temp[total].data[baseDate] += productTotalPrice;
        }
      }
    });

    // 헤더 컬럼 설정
    const columns = [];
    columns.push({ field: 'category1', header: '카테고리 1', width: 20 }); // columns[0]
    columns.push({ field: 'category2', header: '카테고리 2', width: 20 }); // columns[1]
    columns.push({ field: 'category3', header: '카테고리 3', width: 20 }); // columns[2]
    columns.push({ field: 'total', header: '합계', width: 12 }); // columns[3]

    if (isExcel) {
      return getExcelData(filter, columns, temp);
    }
    return getTableData(filter, columns, temp);
  };
  AdminStatisticsSales.categoriesExcelData = async function(filter, options) {
    return await AdminStatisticsSales.categoriesData(filter, options, true);
  };

  /**
   * 카테고리별 매출 통계
   * @param filter
   * @param options
   */
  AdminStatisticsSales.categories = async function(filter, options) {
    return await AdminStatisticsSales.categoriesData(filter, options);
  };
  AdminStatisticsSales.remoteMethod('categories', {
    description: '카테고리별 매출 통계',
    notes: notes,
    accepts: ummaUtil.remoteMethod.accepts.filterAndOptions,
    returns: { root: true, type: { cols: {}, data: {} } },
    http: { path: '/categories', verb: 'get' },
  });

  /**
   * 카테고리별 매출 통계 다운로드
   * @param res
   * @param filter
   * @param options
   */
  AdminStatisticsSales.categoriesDownload = async function(res, filter, options) {
    const excelData = await AdminStatisticsSales.categoriesExcelData(filter, options);
    const sheetName = '카테고리별 매출 통계';
    const fileName = 'umma-statistics-sales-category';
    await downloadExcelFile(res, excelData.columns, excelData.data, sheetName, fileName);
  };
  AdminStatisticsSales.remoteMethod('categoriesDownload', {
    description: '카테고리별 매출 통계 다운로드',
    notes: notes,
    accepts: [ummaUtil.remoteMethod.accepts.res, ummaUtil.remoteMethod.accepts.filter, ummaUtil.remoteMethod.accepts.options],
    returns: { arg: 'body', type: 'file', root: true },
    http: { path: '/categories/download', verb: 'get' },
  });

  /**
   * 브랜드별 매출 통계
   * @param filter
   * @param options
   * @param isExcel
   */
  AdminStatisticsSales.brandsData = async function(filter, options, isExcel = false) {
    // const token = ummaUtil.token.getAccessToken(options);
    const params = getParametersByFilterAndTableName(filter, 'brand');

    params.where = `order_created >= '${params.startDate}' AND order_created <= '${params.endDate}' AND product_total_price > 0`;
    params.where += params.searchText ? ` AND br_name LIKE "%${params.searchText}%"` : '';

    // 데이터 조회
    const query = `SELECT
	    t1.ranking,
      t2.order_created orderCreated,
      t2.br_id brId,
      t2.br_name brName,
      t2.product_total_price productTotalPrice
    FROM (
      SELECT
        RANK() OVER (ORDER BY product_total_price DESC) AS ranking,
		    br_id,
		    SUM(product_total_price) product_total_price
      FROM ${params.statTableName}
      WHERE ${params.where}
      GROUP BY br_id
    ) t1
    LEFT JOIN (
      SELECT
        order_created,
        br_id,
        br_name,
        SUM(product_total_price) product_total_price
      FROM ${params.statTableName}
      WHERE ${params.where}
      GROUP BY order_created, br_id
    ) t2 ON t2.br_id = t1.br_id
    ORDER BY ranking, orderCreated
    ${params.queryLimit}
    `;

    const statistics = await executeSql(app.datasources.ummaDs, query);

    const temp = {};
    // 전체 합계
    const total = 'total';
    temp[total] = {};
    temp[total].data = {};
    temp[total].data.total = 0;

    statistics.forEach(function(stat) {
      const baseDate = stat.orderCreated;
      const key1 = stat.ranking + '-' + stat.brId; // 문자 키로 만들어 정렬되지않게 한다.
      const productTotalPrice = stat.productTotalPrice;

      // 브랜드
      if (key1) {
        if (!temp[key1]) {
          temp[key1] = {};
          temp[key1].expanded = false;
          temp[key1].data = {};
          temp[key1].data.ranking = stat.ranking;
          temp[key1].data.brand = stat.brName;
          temp[key1].data.brandId = stat.brId;
          temp[key1].data.total = 0;
        }
        // 브랜드 라인 합계
        temp[key1].data.total += productTotalPrice;
        // 브랜드 라인 날짜별 합계
        temp[key1].data[baseDate] = productTotalPrice;
      }

      // 전체 합계
      temp[total].data.total += productTotalPrice;
      // 전체 날짜별 합계
      if (baseDate) {
        if (!temp[total].data[baseDate]) {
          temp[total].data[baseDate] = 0;
        }
        temp[total].data[baseDate] += productTotalPrice;
      }
    });

    // 헤더 컬럼 설정
    const columns = [];
    columns.push({ field: 'ranking', header: '순위', width: 10 }); // columns[0]
    columns.push({ field: 'brand', header: '브랜드', width: 20 }); // columns[1]
    columns.push({ field: 'total', header: '합계', width: 12 }); // columns[2]

    if (isExcel) {
      return getExcelData(filter, columns, temp);
    }
    return getTableData(filter, columns, temp);
  };
  AdminStatisticsSales.brandsExcelData = async function(filter, options) {
    return await AdminStatisticsSales.brandsData(filter, options, true);
  };

  /**
   * 브랜드별 매출 통계
   * @param filter
   * @param options
   */
  AdminStatisticsSales.brands = async function(filter, options) {
    return await AdminStatisticsSales.brandsData(filter, options);
  };
  AdminStatisticsSales.remoteMethod('brands', {
    description: '브랜드별 매출 통계',
    notes: notes,
    accepts: ummaUtil.remoteMethod.accepts.filterAndOptions,
    returns: { root: true, type: { cols: {}, data: {} } },
    http: { path: '/brands', verb: 'get' },
  });

  /**
   * 브랜드별 매출 통계 다운로드
   * @param res
   * @param filter
   * @param options
   */
  AdminStatisticsSales.brandsDownload = async function(res, filter, options) {
    const excelData = await AdminStatisticsSales.brandsExcelData(filter, options);
    const sheetName = '브랜드별 매출 통계';
    const fileName = 'umma-statistics-sales-brand';
    await downloadExcelFile(res, excelData.columns, excelData.data, sheetName, fileName);
  };
  AdminStatisticsSales.remoteMethod('brandsDownload', {
    description: '브랜드별 매출 통계 다운로드',
    notes: notes,
    accepts: [ummaUtil.remoteMethod.accepts.res, ummaUtil.remoteMethod.accepts.filter, ummaUtil.remoteMethod.accepts.options],
    returns: { arg: 'body', type: 'file', root: true },
    http: { path: '/brands/download', verb: 'get' },
  });

  /**
   * 바이어별 매출 통계
   * @param filter
   * @param options
   * @param isExcel
   */
  AdminStatisticsSales.buyersData = async function(filter, options, isExcel = false) {
    // const token = ummaUtil.token.getAccessToken(options);
    const params = getParametersByFilterAndTableName(filter, 'buyer');

    params.where = `order_created >= '${params.startDate}' AND order_created <= '${params.endDate}' AND subtotal_price > 0`;
    params.where += params.searchText ? ` AND company_name LIKE "%${params.searchText}%"` : '';

    // 데이터 조회
    const query = `SELECT
      t1.ranking,
      t2.order_created orderCreated,
      t2.role_id roleId,
      t2.company_id companyId,
      t2.ceo_first_name ceoFirstName,
      t2.ceo_last_name ceoLastName,
      t2.company_ct_id companyCtId,
      ct.name companyCtName,
      t2.subtotal_price subtotalPrice
    FROM (
      SELECT
        RANK() OVER (ORDER BY subtotal_price DESC) AS ranking,
        role_id,
        company_id,
        company_ct_id,
        SUM(subtotal_price) subtotal_price
      FROM ${params.statTableName}
      WHERE ${params.where}
      GROUP BY role_id, company_id
    ) t1
    LEFT JOIN country ct ON ct.id = t1.company_ct_id
    LEFT JOIN (
      SELECT
        order_created,
        role_id,
        company_id,
        company_name,
        ceo_first_name,
        ceo_last_name,
        company_ct_id,
        SUM(subtotal_price) subtotal_price
      FROM ${params.statTableName}
      WHERE ${params.where}
      GROUP BY order_created, role_id, company_id
    ) t2 ON t2.role_id = t1.role_id AND t2.company_id = t1.company_id
    ORDER BY ranking, orderCreated
    ${params.queryLimit}
    `;

    const statistics = await executeSql(app.datasources.ummaDs, query);

    const temp = {};
    // 전체 합계
    const total = 'total';
    temp[total] = {};
    temp[total].data = {};
    temp[total].data.total = 0;

    statistics.forEach(function(stat) {
      const baseDate = stat.orderCreated;
      const key1 = stat.ranking + '-' + stat.companyId; // 문자 키로 만들어 정렬되지않게 한다.
      const subtotalPrice = stat.subtotalPrice;

      // 바이어
      if (key1) {
        if (!temp[key1]) {
          temp[key1] = {};
          temp[key1].expanded = false;
          temp[key1].data = {};
          temp[key1].data.ranking = stat.ranking;
          temp[key1].data.country = stat.companyCtName;
          temp[key1].data.countryCode = stat.companyCtId;
          temp[key1].data.buyer = stat.ceoFirstName + ' ' + stat.ceoLastName;
          temp[key1].data.company = stat.companyName;
          temp[key1].data.companyId = stat.companyId;
          temp[key1].data.total = 0;
        }
        // 바이어 라인 합계
        temp[key1].data.total += subtotalPrice;
        // 바이어 라인 날짜별 합계
        temp[key1].data[baseDate] = subtotalPrice;
      }

      // 전체 합계
      temp[total].data.total += subtotalPrice;
      // 전체 날짜별 합계
      if (baseDate) {
        if (!temp[total].data[baseDate]) {
          temp[total].data[baseDate] = 0;
        }
        temp[total].data[baseDate] += subtotalPrice;
      }
    });

    // 헤더 컬럼 설정
    const columns = [];
    columns.push({ field: 'ranking', header: '순위', width: 10 }); // columns[0]
    columns.push({ field: 'country', header: '국가', width: 20 }); // columns[1]
    columns.push({ field: 'buyer', header: '대표', width: 20 }); // columns[2]
    columns.push({ field: 'company', header: '회사', width: 20 }); // columns[3]
    columns.push({ field: 'total', header: '합계', width: 12 }); // columns[4]

    if (isExcel) {
      return getExcelData(filter, columns, temp);
    }
    return getTableData(filter, columns, temp);
  };
  AdminStatisticsSales.buyersExcelData = async function(filter, options) {
    return await AdminStatisticsSales.buyersData(filter, options, true);
  };

  /**
   * 바이어별 매출 통계
   * @param filter
   * @param options
   */
  AdminStatisticsSales.buyers = async function(filter, options) {
    return await AdminStatisticsSales.buyersData(filter, options);
  };
  AdminStatisticsSales.remoteMethod('buyers', {
    description: '바이어별 매출 통계',
    notes: notes,
    accepts: ummaUtil.remoteMethod.accepts.filterAndOptions,
    returns: { root: true, type: { cols: {}, data: {} } },
    http: { path: '/buyers', verb: 'get' },
  });

  /**
   * 바이어별 매출 통계 다운로드
   * @param res
   * @param filter
   * @param options
   */
  AdminStatisticsSales.buyersDownload = async function(res, filter, options) {
    const excelData = await AdminStatisticsSales.buyersExcelData(filter, options);
    const sheetName = '바이어별 매출 통계';
    const fileName = 'umma-statistics-sales-buyer';
    await downloadExcelFile(res, excelData.columns, excelData.data, sheetName, fileName);
  };
  AdminStatisticsSales.remoteMethod('buyersDownload', {
    description: '바이어별 매출 통계 다운로드',
    notes: notes,
    accepts: [ummaUtil.remoteMethod.accepts.res, ummaUtil.remoteMethod.accepts.filter, ummaUtil.remoteMethod.accepts.options],
    returns: { arg: 'body', type: 'file', root: true },
    http: { path: '/buyers/download', verb: 'get' },
  });

  /**
   * 상품별 매출 통계
   * @param filter
   * @param options
   * @param isExcel
   */
  AdminStatisticsSales.productsData = async function(filter, options, isExcel = false) {
    // const token = ummaUtil.token.getAccessToken(options);
    const params = getParametersByFilterAndTableName(filter, 'product');

    params.where = `order_created >= '${params.startDate}' AND order_created <= '${params.endDate}' AND product_total_price > 0`;
    params.where += params.searchText ? ` AND pr_name LIKE "%${params.searchText}%"` : '';

    // 데이터 조회
    const query = `SELECT
      t1.ranking,
      t3.order_created orderCreated,
      t3.pr_id prId,
      t3.pr_name prName,
      t3.po_id poId,
      t3.po_name poName,
      t3.quantity quantity,
      t3.product_total_price productTotalPrice
    FROM (
      SELECT
        RANK() OVER (ORDER BY product_total_price DESC) AS ranking,
        pr_id,
        SUM(product_total_price) product_total_price
      FROM ${params.statTableName}
      WHERE ${params.where}
      GROUP BY pr_id
    ) t1
    LEFT JOIN (
      SELECT
        order_created,
        pr_id,
        SUM(product_total_price) product_total_price
      FROM ${params.statTableName}
      WHERE ${params.where}
      GROUP BY order_created, pr_id
      ${params.queryLimit}
    ) t2 ON t2.pr_id = t1.pr_id
    LEFT JOIN (
      SELECT
        order_created,
        pr_id,
        pr_name,
        po_id,
        po_name,
        SUM(quantity) quantity,
        SUM(product_total_price) product_total_price
      FROM ${params.statTableName}
      WHERE ${params.where}
      GROUP BY order_created, pr_id, po_id
    ) t3 ON t3.order_created = t2.order_created AND t3.pr_id = t2.pr_id
    ORDER BY ranking, orderCreated
    `;

    const statistics = await executeSql(app.datasources.ummaDs, query);

    const temp = {};
    // 전체 합계
    const total = 'total';
    temp[total] = {};
    temp[total].data = {};
    temp[total].data.total = 0;

    statistics.forEach(function(stat) {
      const baseDate = stat.orderCreated;
      const key1 = stat.ranking + '-' + stat.prId; // 문자 키로 만들어 정렬되지않게 한다.
      const key2 = stat.poId;
      const productTotalPrice = stat.productTotalPrice;

      // 상품
      if (key1) {
        if (!temp[key1]) {
          temp[key1] = {};
          temp[key1].expanded = true;
          temp[key1].data = {};
          temp[key1].data.ranking = stat.ranking;
          temp[key1].data.product = stat.prName;
          temp[key1].data.productId = stat.prId;
          temp[key1].data.productOption = '';
          temp[key1].data.total = 0;
        }
        // 상품 라인 합계
        temp[key1].data.total += productTotalPrice;
        // 상품 라인 날짜별 합계
        if (!temp[key1].data[baseDate]) {
          temp[key1].data[baseDate] = 0;
        }
        temp[key1].data[baseDate] += productTotalPrice;
      }

      // 상품옵션별 데이터
      if (key2 > 0) {
        if (!temp[key1].children) {
          temp[key1].children = {};
        }
        if (!temp[key1].children[key2]) {
          temp[key1].children[key2] = {};
          temp[key1].children[key2].expanded = false;
          temp[key1].children[key2].data = {};
          temp[key1].children[key2].data.ranking = '';
          temp[key1].children[key2].data.product = '';
          temp[key1].children[key2].data.productOption = stat.poName;
          temp[key1].children[key2].data.productOptionId = stat.poId;
          temp[key1].children[key2].data.total = 0;
        }

        // 상품옵션 라인 합계
        temp[key1].children[key2].data.total += productTotalPrice;
        // 상품옵션 라인 날짜별 합계
        temp[key1].children[key2].data[baseDate] = productTotalPrice;
      }

      // 전체 합계
      temp[total].data.total += productTotalPrice;
      // 전체 날짜별 합계
      if (baseDate) {
        if (!temp[total].data[baseDate]) {
          temp[total].data[baseDate] = 0;
        }
        temp[total].data[baseDate] += productTotalPrice;
      }
    });

    // 헤더 컬럼 설정
    const columns = [];
    columns.push({ field: 'ranking', header: '순위', width: 10 }); // columns[0]
    columns.push({ field: 'product', header: '상품', width: 60 }); // columns[1]
    columns.push({ field: 'productOption', header: '옵션', width: 30 }); // columns[2]
    columns.push({ field: 'total', header: '합계', width: 12 }); // columns[3]

    if (isExcel) {
      return getExcelData(filter, columns, temp);
    }
    return getTableData(filter, columns, temp);
  };
  AdminStatisticsSales.productsExcelData = async function(filter, options) {
    return await AdminStatisticsSales.productsData(filter, options, true);
  };

  /**
   * 상품별 매출 통계
   * @param filter
   * @param options
   */
  AdminStatisticsSales.products = async function(filter, options) {
    return await AdminStatisticsSales.productsData(filter, options);
  };
  AdminStatisticsSales.remoteMethod('products', {
    description: '상품별 매출 통계',
    notes: notes,
    accepts: ummaUtil.remoteMethod.accepts.filterAndOptions,
    returns: { root: true, type: { cols: {}, data: {} } },
    http: { path: '/products', verb: 'get' },
  });

  /**
   * 상품별 매출 통계 다운로드
   * @param res
   * @param filter
   * @param options
   */
  AdminStatisticsSales.productsDownload = async function(res, filter, options) {
    const excelData = await AdminStatisticsSales.productsExcelData(filter, options);
    const sheetName = '상품별 매출 통계';
    const fileName = 'umma-statistics-sales-product';
    await downloadExcelFile(res, excelData.columns, excelData.data, sheetName, fileName);
  };
  AdminStatisticsSales.remoteMethod('productsDownload', {
    description: '상품별 매출 통계 다운로드',
    notes: notes,
    accepts: [ummaUtil.remoteMethod.accepts.res, ummaUtil.remoteMethod.accepts.filter, ummaUtil.remoteMethod.accepts.options],
    returns: { arg: 'body', type: 'file', root: true },
    http: { path: '/products/download', verb: 'get' },
  });
};
