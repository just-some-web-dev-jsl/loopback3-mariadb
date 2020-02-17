/* eslint-disable camelcase */
'use strict';

// 최형석 개인 테스트 계정
// process.env.PAYPAL_CLIENT_ID = 'AZ65KL-yije70z0FGUtxjKKiu85LP2DpqOICHt_8yEyaybcuxScCuuhzILp0dc-B0pi6XPTRpcJf2H0I';
// process.env.PAYPAL_CLIENT_SECRET = 'EJnC-bUEi2QROWuTZzO5PWHMWqfQEUe6ZwE8Di5ZDQhKPKgcmUitw69coag1BIv-HxaZw7fhs8EIMZd2';

/**
 * [페이팔 결제 프로세스]
 * intent: CAPTURE 일 경우
 * - createOrder > captureOrder > refundCapture
 * intent: AUTHORIZE 일 경우
 * - createOrder > authorizeOrder > captureAuthorization > refundCapture
 *
 * [페이팔 status]
 * CREATED, SAVED, APPROVED, VOIDED, COMPLETED
 */

const logger = require('./logger')(module);
const checkoutNodeJssdk = require('@paypal/checkout-server-sdk');

/**
 * Set up and return PayPal JavaScript SDK environment with PayPal access credentials.
 */
const environment = function() {
  const clientId = process.env.PAYPAL_CLIENT_ID || 'PAYPAL-SANDBOX-CLIENT-ID';
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET || 'PAYPAL-SANDBOX-CLIENT-SECRET';

  return process.env.NODE_ENV !== 'production'
    ? new checkoutNodeJssdk.core.SandboxEnvironment(clientId, clientSecret)
    : new checkoutNodeJssdk.core.LiveEnvironment(clientId, clientSecret);
};

/**
 * Returns PayPal HTTP client instance with environment that has access credentials context.
 * Use this instance to invoke PayPal APIs, provided the credentials have access.
 */
const client = function() {
  return new checkoutNodeJssdk.core.PayPalHttpClient(environment());
};

/**
 * createOrder
 * @param {Object} requestBody
 */
const createOrder = async function(requestBody, debug = false) {
  // sample data
  // requestBody = {
  //   intent: 'CAPTURE',
  //   purchase_units: [{ amount: { currency_code: 'USD', value: '100.00' } }],
  // };

  const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
  // request.headers['prefer'] = 'return=representation';
  request.requestBody(requestBody);

  const response = await client().execute(request);

  if (debug) {
    console.log('Status Code: ' + response.statusCode);
    console.log('Status: ' + response.result.status);
    console.log('Order ID: ' + response.result.id);
    console.log('Links:');
    response.result.links.forEach((item, index) => {
      const rel = item.rel;
      const href = item.href;
      const method = item.method;
      const message = `\t${rel}: ${href}\tCall Type: ${method}`;
      console.log(message);
    });
    // To toggle print the whole body comment/uncomment the below line
    console.log(JSON.stringify(response.result, null, 4));
  }

  return response;
};

/**
 * patchOrder
 * 클라이언트 sdk 가 commit=false 일때만 사용 가능
 * 되도록 patch 사용을 피해야 한다.
 * @param {String} orderId
 * @param {Object} requestBody
 */
const patchOrder = async function(orderId, requestBody, debug = false) {
  // sample data
  // requestBody = [
  //   {
  //     op: 'replace',
  //     path: '/intent',
  //     value: 'CAPTURE',
  //   },
  //   {
  //     op: 'replace',
  //     path: "/purchase_units/@reference_id=='PUHF'/amount",
  //     value: {
  //       currency_code: 'USD',
  //       value: '200.00',
  //       breakdown: {
  //         item_total: {
  //           currency_code: 'USD',
  //           value: '180.00',
  //         },
  //         tax_total: {
  //           currency_code: 'USD',
  //           value: '20.00',
  //         },
  //       },
  //     },
  //   },
  // ];

  const request = new checkoutNodeJssdk.orders.OrdersPatchRequest(orderId);
  request.requestBody(requestBody);

  const response = await client().execute(request);

  if (debug) {
    console.log('Status Code: ' + response.statusCode);
    console.log('Status: ' + response.result.status);
    console.log('Order ID: ' + response.result.id);
    console.log('Links:');
    response.result.links.forEach((item, index) => {
      const rel = item.rel;
      const href = item.href;
      const method = item.method;
      const message = `\t${rel}: ${href}\tCall Type: ${method}`;
      console.log(message);
    });
    // To toggle print the whole body comment/uncomment the below line
    console.log(JSON.stringify(response.result, null, 4));
  }

  return response;
};

/**
 * getOrder
 * @param {String} orderId
 */
const getOrder = async function(orderId, debug = false) {
  const request = new checkoutNodeJssdk.orders.OrdersGetRequest(orderId);

  const response = await client().execute(request);

  if (debug) {
    console.log('Status Code: ' + response.statusCode);
    console.log('Status: ' + response.result.status);
    console.log('Order ID: ' + response.result.id);
    console.log('Links:');
    response.result.links.forEach((item, index) => {
      const rel = item.rel;
      const href = item.href;
      const method = item.method;
      const message = `\t${rel}: ${href}\tCall Type: ${method}`;
      console.log(message);
    });
    console.log(`Gross Amount: ${response.result.purchase_units[0].amount.currency_code} ${response.result.purchase_units[0].amount.value}`);
    // To toggle print the whole body comment/uncomment the below line
    console.log(JSON.stringify(response.result, null, 4));
  }

  return response;
};

/**
 * captureOrder
 * @param {String} orderId
 */
const captureOrder = async function(orderId, debug = false) {
  const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderId);
  request.requestBody({});

  const response = await client().execute(request);

  if (debug) {
    console.log('Status Code: ' + response.statusCode);
    console.log('Status: ' + response.result.status);
    console.log('Order ID: ' + response.result.id);
    console.log('Capture ID: ' + response.result.purchase_units[0].payments.captures[0].id);
    console.log('Links:');
    response.result.links.forEach((item, index) => {
      const rel = item.rel;
      const href = item.href;
      const method = item.method;
      const message = `\t${rel}: ${href}\tCall Type: ${method}`;
      console.log(message);
    });
    // To toggle print the whole body comment/uncomment the below line
    console.log(JSON.stringify(response.result, null, 4));
  }

  return response;
};

/**
 * autorizeOrder
 * intent=authorize 일 경우 사용가능
 * @param {String} orderId
 */
const autorizeOrder = async function(orderId, debug = false) {
  const request = new checkoutNodeJssdk.orders.OrdersAuthorizeRequest(orderId);
  request.requestBody({});

  const response = await client().execute(request);

  if (debug) {
    console.log('Status Code: ' + response.statusCode);
    console.log('Status: ' + response.result.status);
    console.log('Order ID: ' + response.result.id);
    console.log('Authorization ID: ' + response.result.purchase_units[0].payments.authorizations[0].id);
    console.log('Links:');
    response.result.links.forEach((item, index) => {
      const rel = item.rel;
      const href = item.href;
      const method = item.method;
      const message = `\t${rel}: ${href}\tCall Type: ${method}`;
      console.log(message);
    });
    // To toggle print the whole body comment/uncomment the below line
    console.log(JSON.stringify(response.result, null, 4));
  }

  return response;
};

/**
 * captureAuthorization
 * @param {String} authorizationId
 */
const captureAuthorization = async function(authorizationId, debug = false) {
  const request = new checkoutNodeJssdk.payments.AuthorizationsCaptureRequest(authorizationId);
  request.requestBody({});

  const response = await client().execute(request);

  if (debug) {
    console.log('Status Code: ' + response.statusCode);
    console.log('Status: ' + response.result.status);
    console.log('Result ID: ' + response.result.id);
    console.log('Capture ID: ' + response.result.purchase_units[0].payments.captures[0].id);
    console.log('Payer ID: ' + response.result.payer.payer_id);
    console.log('Links:');
    response.result.links.forEach((item, index) => {
      const rel = item.rel;
      const href = item.href;
      const method = item.method;
      const message = `\t${rel}: ${href}\tCall Type: ${method}`;
      console.log(message);
    });
    // To toggle print the whole body comment/uncomment the below line
    console.log(JSON.stringify(response.result, null, 4));
  }

  return response;
};

/**
 * refundCapture
 * @param {String} captureId
 * @param {Object} requestBody
 */
const refundCapture = async function(captureId, requestBody, debug = false) {
  // sample data
  // requestBody = {
  //   amount: {
  //     value: '20.00',
  //     currency_code: 'USD',
  //   },
  // };
  const request = new checkoutNodeJssdk.payments.CapturesRefundRequest(captureId);
  request.requestBody(requestBody);

  const response = await client().execute(request);

  if (debug) {
    console.log('Status Code: ' + response.statusCode);
    console.log('Status: ' + response.result.status);
    console.log('Refund ID: ' + response.result.id);
    console.log('Links:');
    response.result.links.forEach((item, index) => {
      const rel = item.rel;
      const href = item.href;
      const method = item.method;
      const message = `\t${rel}: ${href}\tCall Type: ${method}`;
      console.log(message);
    });
    // To toggle print the whole body comment/uncomment the below line
    console.log(JSON.stringify(response.result, null, 4));
  }

  return response;
};

module.exports = {
  client: client,
  createOrder: createOrder,
  patchOrder: patchOrder,
  captureOrder: captureOrder,
  autorizeOrder: autorizeOrder,
  captureAuthorization: captureAuthorization,
  getOrder: getOrder,
  refundCapture: refundCapture,
};

/**
* Create Order Full parameters
return {
  "intent": "CAPTURE",
  "application_context": {
    "return_url": "https://example.com",
    "cancel_url": "https://example.com",
    "brand_name": "EXAMPLE INC",
    "locale": "en-US",
    "landing_page": "BILLING",
    "shipping_preference": "SET_PROVIDED_ADDRESS",
    "user_action": "CONTINUE"
  },
  "purchase_units": [
    {
      "reference_id": "PUHF",
      "description": "Sporting Goods",
      "custom_id": "CUST-HighFashions",
      "invoice_id": "CUST-HighFashions",
      "soft_descriptor": "HighFashions",
      "payment_instruction": {
        "platform_fees": [{
          "amount": {}
        }],
        "disbursement_mode": "INSTANT"
      },
      "amount": {
        "currency_code": "USD",
        "value": "230.00",
        "breakdown": {
          "item_total": {
            "currency_code": "USD",
            "value": "180.00"
          },
          "shipping": {
            "currency_code": "USD",
            "value": "30.00"
          },
          "handling": {
            "currency_code": "USD",
            "value": "10.00"
          },
          "tax_total": {
            "currency_code": "USD",
            "value": "20.00"
          },
          "shipping_discount": {
            "currency_code": "USD",
            "value": "10"
          }
        }
      },
      "items": [
        {
          "name": "T-Shirt",
          "description": "Green XL",
          "sku": "sku01",
          "unit_amount": {
            "currency_code": "USD",
            "value": "90.00"
          },
          "tax": {
            "currency_code": "USD",
            "value": "10.00"
          },
          "quantity": "1",
          "category": "PHYSICAL_GOODS"
        },
        {
          "name": "Shoes",
          "description": "Running, Size 10.5",
          "sku": "sku02",
          "unit_amount": {
            "currency_code": "USD",
            "value": "45.00"
          },
          "tax": {
            "currency_code": "USD",
            "value": "5.00"
          },
          "quantity": "2",
          "category": "PHYSICAL_GOODS"
        }
      ],
      "shipping": {
        "method": "United States Postal Service",
        "address": {
          "name": {
            "give_name":"John",
            "surname":"Doe"
          },
          "address_line_1": "123 Townsend St",
          "address_line_2": "Floor 6",
          "admin_area_2": "San Francisco",
          "admin_area_1": "CA",
          "postal_code": "94107",
          "country_code": "US"
        }
      }
    }
  ]
};
*/
