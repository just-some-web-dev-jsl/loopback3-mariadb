/* eslint-disable no-unused-expressions */
'use strict';

const app = require('../server/server');
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const assert = chai.assert;
const expect = chai.expect;
const should = chai.should();

function json(verb, url) {
  return chai
    .request(app)
    [verb](url)
    .set('Content-Type', 'application/json')
    .set('Accept', 'application/json');
}

describe('Test API server', function() {
  before(done => {
    require('./start-server');
    done();
  });

  after(done => {
    app.removeAllListeners('started');
    app.removeAllListeners('loaded');
    done();
    process.exit();
  });

  context('Check process.env loaded', () => {
    it('should return process.env', done => {
      expect(['development', 'staging', 'production']).to.include(process.env.NODE_ENV);
      expect(process.env.MYSQL_HOST).to.be.string;
      expect(process.env.MONGO_URI).to.be.string;
      expect(process.env.AWS_S3_KEY_ID).to.be.string;
      expect(process.env.CHANNELIO_API_ACCESS_KEY).to.be.string;
      done();
    });
  });

  context('REST API request', () => {
    it('should return a list of all brands', done => {
      json('get', '/api/v1/brands').end((err, res) => {
        expect(res).to.be.json;
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body).to.be.a('array');
        done();
      });
    });

    it('should return a list of all brands with id & name', done => {
      json('get', '/api/v1/brands?filter[fields][id]=true&filter[fields][name]=true').end((err, res) => {
        expect(res).to.be.json;
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body).to.be.a('array');
        done();
      });
    });

    it('should return a brand with id 1', done => {
      json('get', '/api/v1/brands/1').end((err, res) => {
        expect(res).to.be.json;
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body.name).to.be.a('string');
        done();
      });
    });

    it('should return a buyer with id 1', done => {
      json('get', '/api/v1/buyers/1').end((err, res) => {
        expect(res).to.be.json;
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body).to.be.a('object');
        expect(res.body.email).to.be.a('string');
        expect(res.body.firstName).to.be.a('string');
        expect(res.body.lastName).to.be.a('string');
        expect(res.body.roleId).to.equal(2);
        done();
      });
    });

    it('should return only 2 buyers', done => {
      json('get', '/api/v1/buyers?filter[limit]=2').end((err, res) => {
        expect(res).to.be.json;
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body).to.be.a('array');
        expect(res.body.length).to.equal(2);
        done();
      });
    });

    it('should return a getCodes', done => {
      json('get', '/api/v1/common-codes/get-codes').end((err, res) => {
        expect(res).to.be.json;
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body['common-codes'].USER_STATUS.length).to.equal(5);
        done();
      });
    });

    it('should return a getBrandCodes', done => {
      json('get', '/api/v1/brands/get-codes').end((err, res) => {
        expect(res).to.be.json;
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body).to.be.a('array');
        expect(res.body[0]).to.have.property('id');
        expect(res.body[0]).to.have.property('name');
        done();
      });
    });

    it('should return a product with productOption', done => {
      json('get', '/api/v1/products/10001?filter[include]=productOption').end((err, res) => {
        expect(res).to.be.json;
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body['productOption']).to.be.a('array');
        done();
      });
    });
  });

  // server/config.json 파일 json.limit: "1mb" 로 설정하고 테스트
  context('REST API request POST big json data', () => {
    // 더미 데이터 생성
    const body = {
      dummy: [],
    };
    for (let i = 0; i < 5000; i++) {
      body.dummy.push({
        picture: 'http://placehold.it/32x32',
        age: 33,
        eyeColor: 'brown',
        name: {
          first: 'Bowen',
          last: 'Sexton',
        },
        company: 'TELEPARK',
        email: 'bowen.sexton@telepark.ca',
        phone: '+1 (816) 577-3995',
        address: '343 Hazel Court, Kenmar, North Dakota, 3226',
        about: 'Consequat excepteur aute ipsum anim ut elit mollit irure Lorem et quis est aute anim.',
        registered: 'Wednesday, April 27, 2016 5:59 AM',
        latitude: '80.490271',
        longitude: '-155.350134',
      });
    }
    const bodyLength = (JSON.stringify(body).length / 1024).toFixed() + ' KB';

    it(`should error return request entity too large. post json data size: ${bodyLength}`, done => {
      json('post', '/api/v1/products/create-product')
        .send(body)
        .end((err, res) => {
          // {"error":{"statusCode":413,"name":"PayloadTooLargeError","message":"request entity too large"}}
          expect(res).to.have.status(413);
          done();
        });
    });
  });

  context('Unexpected Usage', () => {
    it('should not crash the server when posting a bad id', done => {
      json('post', '/api/v1/buyers/create-user')
        .send({})
        .end((err, res) => {
          expect(res).to.have.status(400);
          done();
        });
    });
  });
});
