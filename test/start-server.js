// Copyright IBM Corp. 2015. All Rights Reserved.
// Node module: loopback-example-relations
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT
'use strict';
const app = require('../server/server');

module.exports = function(done) {
  if (app.loaded) {
    app.once('started', done);
    app.setServer(app.start());
  } else {
    app.once('loaded', function() {
      app.once('started', done);
      app.setServer(app.start());
    });
  }
};
