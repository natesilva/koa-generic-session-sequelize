//
// Common tests that can apply to any koa-generic-session store provider.
//

/* global it, beforeEach */

'use strict';

const co = require('co');
const should = require('should');
const uid = require('uid-safe');

module.exports = function (store, sequelize) {
  const sess = { hello: 'howdy' };
  let sid;

  beforeEach(function () {
    sid = uid.sync(24);
  });

  it('should garbage collect old sessions', co.wrap(function* () {
    this.timeout(30000);                // eslint-disable-line no-invalid-this
    yield store.set(sid, sess, 1000);
    yield new Promise(resolve => { setTimeout(resolve, 1000); });
    let data = yield store.get(sid);
    should(data).not.be.ok();
    data = yield sequelize.models.Session.findById(sid);
    should.exist(data);
    const destroyCount = yield store.gc();
    destroyCount.should.be.aboveOrEqual(1);
    data = yield sequelize.models.Session.findById(sid);
    should(data).not.be.ok();
  }));
};
