//
// Common tests that can apply to any koa-generic-session store provider.
//

/* global it, beforeEach */

'use strict';

const should = require('should');
const uid = require('uid-safe');

module.exports = function (store, sequelize) {
  const sess = { hello: 'howdy' };
  let sid;

  beforeEach(function () {
    sid = uid.sync(24);
  });

  it('should garbage collect old sessions', function () {
    this.timeout(30000);                // eslint-disable-line no-invalid-this
    return store.set(sid, sess, 1000)
      .then(function () { return new Promise(resolve => { setTimeout(resolve, 1000); }); })
      .then(function () { return store.get(sid); })
      .then(function (data) { should.not.exist(data); })
      .then(function () { return sequelize.models.Session.findById(sid); })
      .then(function (data) { should.exist(data); })
      .then(function () { return store.gc(); })
      .then(function (destroyCount) { destroyCount.should.be.aboveOrEqual(1); })
      .then(function () { return sequelize.models.Session.findById(sid); })
      .then(function (data) { should.not.exist(data); })
      ;
  });
};
