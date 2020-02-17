# Models

- 모델은 json 파일로 정의해서 만든다.

- js 파일은 필요한 모델에만 만들어서 사용한다.

- model-config.json 파일에 public: false 로 설정한 모델은 ACL 설정이 필요없다. => acls: []

- relations 설정을 잘 활용해서 만들면 편리하고 심플한 라우터 구현이 가능하다.

- 불필요한 리모트 메소드 정리
  - model-config.json 파일에서 options.remoting.sharedMethods 로 설정이 가능하지만, js 파일 내에서 처리하는 방법을 정리하였다.
  - /lib/loopback-helpers.js 헬퍼 함수를 만들어서 처리한다.

### Disable all remote method

```javascript
Model.sharedClass.methods().forEach(function(method) {
  Model.disableRemoteMethod(method.name, method.isStatic);
});
```

### Persisted model remote method

```javascript
/**
 * Disable Remote Method
 */
Model.disableRemoteMethodByName('count');
Model.disableRemoteMethodByName('find');
Model.disableRemoteMethodByName('findOne');
Model.disableRemoteMethodByName('findById');
Model.disableRemoteMethodByName('exists');
Model.disableRemoteMethodByName('create');
Model.disableRemoteMethodByName('upsert');
Model.disableRemoteMethodByName('deleteById');
Model.disableRemoteMethodByName('destroyAll');
Model.disableRemoteMethodByName('updateAll');
Model.disableRemoteMethodByName('prototype.updateAttributes');
Model.disableRemoteMethodByName('prototype.patchAttributes');
Model.disableRemoteMethodByName('createChangeStream');
Model.disableRemoteMethodByName('bulkUpdate');
Model.disableRemoteMethodByName('createUpdates');
Model.disableRemoteMethodByName('replaceById');
Model.disableRemoteMethodByName('replaceOrCreate');
Model.disableRemoteMethodByName('patchOrCreate');
Model.disableRemoteMethodByName('update');
Model.disableRemoteMethodByName('upsertWithWhere');
```

### User model remote method

```javascript
/**
 * Disable Remote Method
 */
Model.disableRemoteMethodByName('login');
Model.disableRemoteMethodByName('logout');
Model.disableRemoteMethodByName('confirm');
Model.disableRemoteMethodByName('resetPassword');
Model.disableRemoteMethodByName('setPassword');
Model.disableRemoteMethodByName('changePassword');
Model.disableRemoteMethodByName('prototype.verify');
Model.disableRemoteMethodByName('prototype.__count__accessTokens');
Model.disableRemoteMethodByName('prototype.__exists__accessTokens');
Model.disableRemoteMethodByName('prototype.__create__accessTokens');
Model.disableRemoteMethodByName('prototype.__delete__accessTokens');
Model.disableRemoteMethodByName('prototype.__destroy__accessTokens');
Model.disableRemoteMethodByName('prototype.__destroyById__accessTokens');
Model.disableRemoteMethodByName('prototype.__findById__accessTokens');
Model.disableRemoteMethodByName('prototype.__get__accessTokens');
Model.disableRemoteMethodByName('prototype.__update__accessTokens');
Model.disableRemoteMethodByName('prototype.__updateById__accessTokens');
Model.disableRemoteMethodByName('prototype.__link__accessTokens');
Model.disableRemoteMethodByName('prototype.__unlink__accessTokens');

// 아래 리모트 메소드는 persisted 모델과 같은 것들만 모아두었다.
Model.disableRemoteMethodByName('count');
Model.disableRemoteMethodByName('find');
Model.disableRemoteMethodByName('findOne');
Model.disableRemoteMethodByName('findById');
Model.disableRemoteMethodByName('exists');
Model.disableRemoteMethodByName('create');
Model.disableRemoteMethodByName('upsert');
Model.disableRemoteMethodByName('deleteById');
Model.disableRemoteMethodByName('destroyAll');
Model.disableRemoteMethodByName('updateAll');
Model.disableRemoteMethodByName('prototype.updateAttributes');
Model.disableRemoteMethodByName('prototype.patchAttributes');
Model.disableRemoteMethodByName('createChangeStream');
Model.disableRemoteMethodByName('bulkUpdate');
Model.disableRemoteMethodByName('createUpdates');
Model.disableRemoteMethodByName('replaceById');
Model.disableRemoteMethodByName('replaceOrCreate');
Model.disableRemoteMethodByName('patchOrCreate');
Model.disableRemoteMethodByName('update');
Model.disableRemoteMethodByName('upsertWithWhere');
```

### Container model remote method

```javascript
Model.disableRemoteMethodByName('getContainers');
Model.disableRemoteMethodByName('getContainer');
Model.disableRemoteMethodByName('createContainer');
Model.disableRemoteMethodByName('destroyContainer');
Model.disableRemoteMethodByName('getFiles');
Model.disableRemoteMethodByName('getFile');
Model.disableRemoteMethodByName('removeFile');
Model.disableRemoteMethodByName('upload');
Model.disableRemoteMethodByName('download');
Model.disableRemoteMethodByName('uploadStream');
Model.disableRemoteMethodByName('downloadStream');
```

### Include with filters

- 루프백 쿼리 사용시 인클루드 사용 예시
- 각각의 모델 릴레이션이 정의되어 있어야 한다.
- 인클루드로 리턴 받은 객체는 toJSON() 함수로 일반 JSON 객체로 변환해서 사용해야한다.
- https://loopback.io/doc/en/lb3/Include-filter.html#access-included-objects

```javascript
const orders = await Order.find({
  where: {},
  include: [
    {
      relation: 'user', // include the user object
      scope: {
        // further filter the user object
        fields: ['id', 'roleId', 'firstName', 'lastName'], // only show four fields
      },
    },
    {
      relation: 'product', // include the product object
      scope: {
        // further filter the product object
        fields: ['id', 'brName', 'prName', 'images'], // only show four fields
      },
    },
    {
      relation: 'paymentHistory', // include the paymentHistory object
      scope: {
        where: {},
        // further filter the paymentHistory object
        fields: ['paymentMethod', 'paymentAmount'], // only show two fields
        include: {
          // include orders for the owner
          relation: 'orders',
          scope: {
            where: { orderId: 5 }, // only select order with id 5
          },
        },
      },
    },
    {
      relation: 'debitHistory', // include the debitHistory object
      scope: {
        // further filter the debitHistory object
        fields: ['credit', 'creditBalance', 'eventDetail'], // only show three fields
      },
    },
  ],
});
orders.forEach(function(order) {
  const o = order.toJSON(); // include 데이터가 들어있으면 toJSON()으로 json 객체로 변환해서 사용해야한다.
  console.log(o.user);
  console.log(o.product);
});
```
