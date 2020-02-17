'use strict';

const logger = require('../../lib/logger')(module);
const ummaUtil = require('../../lib/umma-util');
const ummaError = require('../../lib/umma-error');
const axios = require('axios');
// table converter
const tabletojson = require('tabletojson');

const NODE_ENV = process.env.NODE_ENV;
const { disableAllMethods, executeSql } = require('../../lib/loopback-helpers');

// day formats
const aDay = 1000 * 60 * 60 * 24;
const aWeek = 7 * 1000 * 60 * 60 * 24;
const today = new Date();

const conversionUrl = 'https://free.currconv.com';

// api keys
// development api key
let currencyExternalApi = 'b63d447d3d0ea8c810b9';

if (NODE_ENV === 'staging') {
  currencyExternalApi = '1995630114f07a80b49d';
}
if (NODE_ENV === 'production') {
  currencyExternalApi = '7c422d6fa58539943b2b';
}

let app = {
  umma: require('../../reference'), // 개발 참조용 레퍼런스 파일
};

module.exports = function(CurrencyRate) {
  const Model = CurrencyRate;
  /**
   * Disable Remote Method
   * 기존 룹벡 메서드 비활성화
   */
  disableAllMethods(Model, ['count', 'find', 'findOne', 'findById', 'deleteById']);

  Model.on('attached', function(a) {
    app = a;

    // override method
    Model.destroyById = Model.deleteById;

    /**
     * 환율 삭제
     * acl: Owner, Admin
     * @param id
     */
    Model.deleteById = async function(id) {
      const findInquiryId = await CurrencyRate.findOne({ where: { id: id } });
      const theId = findInquiryId.inquiryId;
      const isItClosed = await app.models.Inquiry.findOne({ where: { id: theId } });
      if (isItClosed.status === 1) throw new ummaError.customMessage('This thread is closed');
      return await CurrencyRate.updateAll(
        { id: id },
        {
          replyDelete: 1,
          deleted: new Date(),
        }
      );
    };
    Model.remoteMethod('deleteById', {
      description: '환율 답변 삭제',
      accepts: ummaUtil.remoteMethod.accepts.idAndOptions,
      returns: { root: true, type: { count: Number } },
      http: { path: '/:id', verb: 'delete' },
    });

    /**
     * 환율 다중 삭제
     * acl: Owner, Admin
     * @param ids
     * @param options
     */
    Model.deleteByIds = async function(ids, options) {
      const token = ummaUtil.token.getAccessToken(options);
      const replyDelete = 1;
      let where = { id: { inq: ids }, replyDelete: { neq: replyDelete } };

      // 관리자가 아닌 경우 OWNER 조건 추가
      where = ummaUtil.where.addOwnerByTokenWithoutAdmin(token, where);

      return await Model.updateAll(where, {
        replyDelete: replyDelete,
        deleted: new Date(),
      });
    };
    Model.remoteMethod('deleteByIds', {
      description: '환율 답변 다중 삭제',
      accepts: ummaUtil.remoteMethod.accepts.idsArrayAndOptions,
      returns: { root: true, type: { count: Number } },
      http: { path: '/deleteByIds', verb: 'post' },
    });
  });
  Model.on('dataSourceAttached', function() {});

  /**
   * 환율 생셩
   * @param param
   * @param options
   */
  CurrencyRate.createRate = async function(param, options) {
    const token = ummaUtil.token.getAccessToken(options);
    const productTable = app.models.Product;
    const getNames = await app.models.Admin.findById(token.userId, { fields: { firstName: true, lastName: true } });
    const createCurrency = {
      adminRoleId: token.roleId,
      adminUserId: token.userId,
      firstName: getNames.firstName,
      lastName: getNames.lastName,
      currencyRate: ummaUtil.number.formatMoney(param.currencyRate),
      expirationDate: param.expirationDate,
    };
    await CurrencyRate.create(createCurrency);
    try {
      await executeSql(app.datasources.ummaDs, `UPDATE product SET retail_price = retail_price_krw / '${param.currencyRate}'`);
    } catch (err) {
      logger.error(err);
    }
    return true;
  };
  CurrencyRate.remoteMethod('createRate', {
    description: '인쿼리 답변 등록',
    notes: '{currencyRate: Number}',
    accepts: ummaUtil.remoteMethod.accepts.paramObjectAndOptions,
    returns: { root: true, type: Boolean },
    http: { path: '/createRate', verb: 'post' },
  });

  /**
   * currency rate log/history
   * @param filter
   * @param options
   */
  CurrencyRate.list = async function(filter, options) {
    const token = ummaUtil.token.getAccessToken(options);
    filter = ummaUtil.filter.validate.limit(filter);
    return await CurrencyRate.find(filter);
  };
  CurrencyRate.remoteMethod('list', {
    description: '환율 리스트 가져오기',
    accepts: ummaUtil.remoteMethod.accepts.filterAndOptions,
    returns: { root: true, type: ['CurrencyRate'] },
    http: { path: '/list', verb: 'get' },
  });

  /**
   * currency rate count
   * @param where
   * @param options
   */
  CurrencyRate.countRate = async function(where, options) {
    const token = ummaUtil.token.getAccessToken(options);

    where = ummaUtil.where.addOwnerByTokenWithoutAdmin(token, where);

    return await CurrencyRate.count(where);
  };
  CurrencyRate.remoteMethod('countRate', {
    description: '환율 로그 카운트',
    accepts: ummaUtil.remoteMethod.accepts.whereAndOptions,
    returns: { root: true, type: Number },
    http: { path: '/countRate', verb: 'get' },
  });

  /**
   * get latest rate
   * @param where
   */
  CurrencyRate.getLatestRate = async function(where) {
    const getLatest = await CurrencyRate.findOne({ fields: { currencyRate: true }, order: 'created DESC' });
    if (!getLatest) throw new ummaError.customMessage('환율 기준이 없습니다. 환율부터 등록하는 것을 권장합니다.');
    return getLatest.currencyRate;
  };
  CurrencyRate.remoteMethod('getLatestRate', {
    description: 'get latest rate',
    accepts: ummaUtil.remoteMethod.accepts.where,
    returns: { root: true, type: Number },
    http: { path: '/getLatestRate', verb: 'get' },
  });

  // 현재 등로된 환율
  /**
   * acl: 관리자
   */
  CurrencyRate.dashboardCurrencyRate = async function() {
    const r = {};

    const rateObject = await CurrencyRate.findOne({ order: 'created DESC' });
    const openDate = rateObject.created;
    const daysDiff = Math.abs(today.getTime() - openDate.getTime());
    const daysSinceUpdate = Math.ceil(daysDiff / aDay);
    r.ourRate = rateObject.currencyRate;
    r.user = `${rateObject.firstName} ${rateObject.lastName}`;
    r.editedSince = daysSinceUpdate;
    const currentRate = axios
      .get(`${conversionUrl}/api/v7/convert?q=USD_KRW&compact=ultra&apiKey=${currencyExternalApi}`)
      .then(response => response.data.USD_KRW);
    // fix this code.
    if (await currentRate) {
      r.currentGlobalRate = await currentRate;
    } else {
      r.currentGlobalRate = '로딩 중';
    }
    return r;
  };
  CurrencyRate.remoteMethod('dashboardCurrencyRate', {
    description: '현재 등로된 환율',
    returns: { root: true, type: 'object' },
    http: { path: '/dashboardCurrencyRate', verb: 'get' },
  });

  // 이번 달 국제 평균 환율
  /**
   * acl: 관리자
   */
  CurrencyRate.currencyRateAverage = async function() {
    const eachDayRates = [];
    // date one week ago
    const setMonth = new Date(new Date().setDate(new Date().getDate() - 7)).getMonth();
    const setDate = new Date(new Date().setDate(new Date().getDate() - 7)).getDate();
    const rnDate = `${today.getFullYear()}-${setMonth + 1}-${setDate}`;
    const endOfTheMonth = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

    const url = `${conversionUrl}/api/v7/convert?q=USD_KRW&compact=ultra&date=${rnDate}&endDate=${endOfTheMonth}&apiKey=${currencyExternalApi}`;
    const rateObjects = axios.get(url).then(response => response.data.USD_KRW);
    for (const [key, value] of Object.entries(await rateObjects)) {
      eachDayRates.push(value);
    }
    const getAverage = eachDayRates.reduce((acc, cur) => acc + cur) / eachDayRates.length;
    const [latestRate] = eachDayRates.slice(-1);
    const data = {
      eachDayRates: await rateObjects,
      average: getAverage,
      currentRate: latestRate,
    };
    return data;
  };
  CurrencyRate.remoteMethod('currencyRateAverage', {
    description: '현재 등로된 환율',
    returns: { root: true, type: 'object' },
    http: { path: '/currencyRateAverage', verb: 'get' },
  });

  // new conversion rate api using Naver

  CurrencyRate.getNaverRates = async function() {
    const newData = [];
    const ratePerDay = [];
    const dates = [];
    const rateData = axios.get('https://finance.naver.com/marketindex/exchangeDailyQuote.nhn?marketindexCd=FX_USDKRW&page=1').then(response => response.data);
    const converted = tabletojson.convert(await rateData)[0];
    converted.map(rate => {
      const rates = parseFloat(rate['�۱�'].replace(/,/g, ''));
      const dateRange = rate['��� ��'];
      const obj = { date: dateRange, rate: rates };
      ratePerDay.push(rates);
      newData.push(obj);
      dates.push(dateRange);
    });
    const todayRate = converted[0]['�۱�'];
    const averageRate = ratePerDay.reduce((acc, cur) => acc + cur) / ratePerDay.length;
    const data = {
      today: parseFloat(todayRate.replace(/,/g, '')),
      newData: newData,
      average: averageRate,
    };
    return data;
  };
  CurrencyRate.remoteMethod('getNaverRates', {
    description: 'new conversion rate api using Naver',
    returns: { root: true, type: 'object' },
    http: { path: '/getNaverRates', verb: 'get' },
  });

  // get naver rates by graph (bar) - testing phase

  CurrencyRate.showRatesGraph = async function() {
    // label array
    const labels = [];
    // rates array
    const data = [];
    const latestRate = await CurrencyRate.getLatestRate();
    // get rate table from naver
    const rateData = axios.get('https://finance.naver.com/marketindex/exchangeDailyQuote.nhn?marketindexCd=FX_USDKRW&page=1').then(response => response.data);
    const converted = tabletojson.convert(await rateData)[0];
    converted.map(rate => {
      const rates = parseFloat(rate['�۱�'].replace(/,/g, ''));
      const dateRange = rate['��� ��'];
      // push dates
      labels.push(dateRange);
      // push rates
      data.push(rates);
    });

    const results = {
      labels: labels.reverse(),
      datasets: [
        {
          label: '매도환율 (네이버 출처)',
          backgroundColor: '#42A5F5',
          borderColor: '#1E88E5',
          data: data.reverse(),
        },
      ],
    };
    return results;
  };
  CurrencyRate.remoteMethod('showRatesGraph', {
    description: 'new conversion rate api using Naver and display by graph',
    returns: { root: true, type: 'object' },
    http: { path: '/showRatesGraph', verb: 'get' },
  });
};
