// https://loopback.io/doc/en/lb3/Accessing-related-models.html

'use strict';

module.exports = function(MyUser) {
  //
  // 유저모델 모든 리모트 메소드 정리

  MyUser.disableRemoteMethodByName('updateAll'); // 유저 모델에는 없는 리모트 메소드 인듯

  MyUser.disableRemoteMethodByName('prototype.__count__accessTokens');
  MyUser.disableRemoteMethodByName('prototype.__create__accessTokens');
  MyUser.disableRemoteMethodByName('prototype.__delete__accessTokens');
  MyUser.disableRemoteMethodByName('prototype.__destroyById__accessTokens');
  MyUser.disableRemoteMethodByName('prototype.__findById__accessTokens');
  MyUser.disableRemoteMethodByName('prototype.__get__accessTokens');
  MyUser.disableRemoteMethodByName('prototype.__updateById__accessTokens');

  MyUser.disableRemoteMethodByName('upsert'); // disables PATCH /MyUsers
  MyUser.disableRemoteMethodByName('find'); // disables GET /MyUsers
  MyUser.disableRemoteMethodByName('replaceOrCreate'); // disables PUT /MyUsers
  MyUser.disableRemoteMethodByName('create'); // disables POST /MyUsers

  MyUser.disableRemoteMethodByName('prototype.updateAttributes'); // disables PATCH /MyUsers/{id}
  MyUser.disableRemoteMethodByName('findById'); // disables GET /MyUsers/{id}
  MyUser.disableRemoteMethodByName('exists'); // disables HEAD /MyUsers/{id}
  MyUser.disableRemoteMethodByName('replaceById'); // disables PUT /MyUsers/{id}
  MyUser.disableRemoteMethodByName('deleteById'); // disables DELETE /MyUsers/{id}

  MyUser.disableRemoteMethodByName('prototype.__get__accessTokens'); // disable GET /MyUsers/{id}/accessTokens
  MyUser.disableRemoteMethodByName('prototype.__create__accessTokens'); // disable POST /MyUsers/{id}/accessTokens
  MyUser.disableRemoteMethodByName('prototype.__delete__accessTokens'); // disable DELETE /MyUsers/{id}/accessTokens

  MyUser.disableRemoteMethodByName('prototype.__findById__accessTokens'); // disable GET /MyUsers/{id}/accessTokens/{fk}
  MyUser.disableRemoteMethodByName('prototype.__updateById__accessTokens'); // disable PUT /MyUsers/{id}/accessTokens/{fk}
  MyUser.disableRemoteMethodByName('prototype.__destroyById__accessTokens'); // disable DELETE /MyUsers/{id}/accessTokens/{fk}

  MyUser.disableRemoteMethodByName('prototype.__count__accessTokens'); // disable  GET /MyUsers/{id}/accessTokens/count

  MyUser.disableRemoteMethodByName('prototype.verify'); // disable POST /MyUsers/{id}/verify
  MyUser.disableRemoteMethodByName('changePassword'); // disable POST /MyUsers/change-password
  MyUser.disableRemoteMethodByName('createChangeStream'); // disable GET and POST /MyUsers/change-stream

  MyUser.disableRemoteMethodByName('confirm'); // disables GET /MyUsers/confirm
  MyUser.disableRemoteMethodByName('count'); // disables GET /MyUsers/count
  MyUser.disableRemoteMethodByName('findOne'); // disables GET /MyUsers/findOne

  MyUser.disableRemoteMethodByName('login'); // disables POST /MyUsers/login
  MyUser.disableRemoteMethodByName('logout'); // disables POST /MyUsers/logout

  MyUser.disableRemoteMethodByName('resetPassword'); // disables POST /MyUsers/reset
  MyUser.disableRemoteMethodByName('setPassword'); // disables POST /MyUsers/reset-password
  MyUser.disableRemoteMethodByName('update'); // disables POST /MyUsers/update
  MyUser.disableRemoteMethodByName('upsertWithWhere'); // disables POST /MyUsers/upsertWithWhere
};

module.exports = function(ViewProduct) {
  //
  // model-config.json 파일에서 설정하는게 기본이지만, 필요시 아래처럼 사용할 수 있음

  // Read-Only endpoints for PersistedModel
  ViewProduct.disableRemoteMethodByName('create');
  ViewProduct.disableRemoteMethodByName('upsert');
  ViewProduct.disableRemoteMethodByName('deleteById');
  ViewProduct.disableRemoteMethodByName('updateAll');
  ViewProduct.disableRemoteMethodByName('prototype.updateAttributes');
  ViewProduct.disableRemoteMethodByName('prototype.patchAttributes');
  ViewProduct.disableRemoteMethodByName('createChangeStream');
  ViewProduct.disableRemoteMethodByName('bulkUpdate');
  ViewProduct.disableRemoteMethodByName('createUpdates');
  ViewProduct.disableRemoteMethodByName('replaceById');
  ViewProduct.disableRemoteMethodByName('replaceOrCreate');
  ViewProduct.disableRemoteMethodByName('upsertWithWhere');
};

module.exports = function(Product) {
  Product.disableRemoteMethodByName('create'); // Removes (POST) /products
  Product.disableRemoteMethodByName('upsert'); // Removes (PUT) /products
  Product.disableRemoteMethodByName('deleteById'); // Removes (DELETE) /products/:id
  Product.disableRemoteMethodByName('updateAll'); // Removes (POST) /products/update
  Product.disableRemoteMethodByName('prototype.updateAttributes'); // Removes (PUT) /products/:id
  Product.disableRemoteMethodByName('prototype.patchAttributes'); // Removes (PATCH) /products/:id
  Product.disableRemoteMethodByName('createChangeStream'); // Removes (GET|POST) /products/change-stream
};

module.exports = function(Post) {
  // 어떤 모델에 존재하는지 모름
  Post.disableRemoteMethodByName('prototype.__get__tags');
  Post.disableRemoteMethodByName('prototype.__create__tags');
};
