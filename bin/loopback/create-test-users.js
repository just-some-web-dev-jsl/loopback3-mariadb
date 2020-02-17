'use strict';

const path = require('path');
const app = require('../../server/server');
const Admin = app.models.Admin;
const Buyer = app.models.Buyer;
const Seller = app.models.Seller;
const CustomRole = app.models.CustomRole;
// const CustomRoleMapping = app.models.CustomRoleMapping;
const ds = app.dataSources.ummaDs;

// 관리자
const admins = [
  {
    id: 1,
    roleId: 1,
    userType: 'SA',
    companyId: 1,
    ctId: 'KR',
    firstName: 'test',
    lastName: 'admin',
    email: 'TEST_USER_EMAIL',
    password: 'abc123!',
    emailVerified: 1,
  },
];
// 바이어
const buyers = [
  // {
  //   id: 1,
  //   roleId: 2,
  //   userType: 'R',
  //   companyId: 1,
  //   ctId: 'KR',
  //   firstName: 'test',
  //   lastName: 'buyer',
  //   email: 'TEST_USER_EMAIL',
  //   password: 'abc123!',
  //   emailVerified: 1,
  // },
];
// 셀러
const sellers = [
  // {
  //   id: 1,
  //   roleId: 3,
  //   userType: 'S',
  //   companyId: 1,
  //   ctId: 'KR',
  //   firstName: 'test',
  //   lastName: 'seller',
  //   email: 'TEST_USER_EMAIL',
  //   password: 'abc123!',
  //   emailVerified: 1,
  // },
];

// 롤 생성
async function createRole(roleName, userId) {
  // create the role
  const role = await CustomRole.create({
    name: roleName,
  });

  console.log('Created role:', role);

  const principal = await role.principals.create({
    principalType: roleName,
    principalId: userId,
  });
  return console.log('Created principal:', principal);
}

async function run() {
  try {
    // 모두 삭제
    // await Admin.destroyAll();
    // await Buyer.destroyAll();
    // await Seller.destroyAll();
    // console.log('Destroyed all.');
    await ds.connector.execute('truncate table admin', null, (err, result) => {});
    await ds.connector.execute('truncate table buyer;', null, (err, result) => {});
    await ds.connector.execute('truncate table seller;', null, (err, result) => {});
    await ds.connector.execute('truncate table custom_role;', null, (err, result) => {});
    await ds.connector.execute('truncate table custom_role_mapping;', null, (err, result) => {});
    await ds.connector.execute('truncate table custom_access_token', null, (err, result) => {});
    await ds.connector.execute('truncate table custom_acl', null, (err, result) => {});

    console.log('truncated all table!');

    let results;

    // 관리자
    results = await Admin.create(admins);
    console.log('Created admins:', results);
    // create the role
    for (let i = 0; i < results.length; i += 1) {
      await createRole('admin', results[i].id);
    }

    // 바이어
    results = await Buyer.create(buyers);
    console.log('Created buyers:', results);
    // create the role
    for (let i = 0; i < results.length; i += 1) {
      await createRole('buyer', results[i].id);
    }

    // 셀러
    results = await Seller.create(sellers);
    console.log('Created sellers:', results);
    // create the role
    for (let i = 0; i < results.length; i += 1) {
      await createRole('seller', results[i].id);
    }

    console.log('------------------------------');
  } catch (err) {
    throw err;
  }
}

run().then(() => {
  ds.connector.execute('select * from custom_role_mapping', null, (err, result) => {
    if (err) throw err;
    console.log(result);
    process.exit();
  });
});
