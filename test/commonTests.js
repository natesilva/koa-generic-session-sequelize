//
// Common tests that can apply to any koa-generic-session store provider.
//

/* global it, beforeEach */

'use strict';

const co = require('co');
const should = require('should');
const uid = require('uid-safe');

module.exports = function (store) {
  const sess = { hello: 'howdy' };
  let sid;

  beforeEach(function () {
    sid = uid.sync(24);
  });

  it('should set and get ok', co.wrap(function* () {
    yield store.set(sid, sess, 5000);
    const data = yield store.get(sid);
    sess.should.deepEqual(data);
    data.value = 42;
    yield store.set(sid, data, 5000);
    const data2 = yield store.get(sid);
    data2.value.should.equal(42);
  }));

  it('should set and get non-western text', co.wrap(function* () {
    const sess = { japanese: '今日は', hindi: 'नमस्ते', hebrew: 'שלום' };
    yield store.set(sid, sess, 5000);
    const data = yield store.get(sid);
    sess.should.deepEqual(data);
  }));

  it('should handle non-existent session ids', co.wrap(function* () {
    const data = yield store.get('abcdefg');
    should(data).not.be.ok();
  }));

  it('should expire', co.wrap(function* () {
    this.timeout(3000);                 // eslint-disable-line no-invalid-this
    yield store.set(sid, sess, 1000);
    yield new Promise(function (resolve) { setTimeout(resolve, 2000); });
    const data = yield store.get(sid);
    should(data).not.be.ok();
  }));

  it('should destroy ok', co.wrap(function* () {
    yield store.set(sid, sess, 5000);
    yield store.destroy(sid);
    const data = yield store.get(sid);
    should(data).not.be.ok();
  }));

  it('should handle lots of requests at once', co.wrap(function* () {
    this.timeout(30000);                // eslint-disable-line no-invalid-this

    const handleRequest = co.wrap(function* (sid) {
      yield store.set(sid, sess, 30000);
      let data = yield store.get(sid);
      sess.should.deepEqual(data);
      yield store.destroy(sid);
      data = yield store.get(sid);
      should(data).not.be.ok();
    });

    const promises = [];
    for (let i = 0; i < 500; ++i) {
      promises.push(handleRequest(uid.sync(24)));
    }
    yield Promise.all(promises);
  }));

  it.only('should handle requests where ttl is in the cookie property', co.wrap(function* () {
    // koa-generic-session does this. It documents passing ttl as the 3rd param to set()
    // but actually omits that and expects us to use sess.cookie.maxAge.
    let sess = {
      cookie: {
        maxAge: 3600000,
        signed: false,
        httpOnly: true,
        path: '/',
        overwrite: true
      },
      hello: 'howdy'
    };

    this.timeout(5000);                 // eslint-disable-line no-invalid-this

    yield store.set(sid, sess, undefined);
    yield new Promise(function (resolve) { setTimeout(resolve, 1000); });
    let data = yield store.get(sid);
    sess.should.deepEqual(data);

    // test expiration too
    sess.cookie.maxAge = 100;           // one tenth of a second
    yield store.set(sid, sess, undefined);
    yield new Promise(function (resolve) { setTimeout(resolve, 2000); });
    data = yield store.get(sid);
    should(data).not.be.ok();
  }));
};
