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
  }));

  it('should set and get non-western text', co.wrap(function* () {
    const sess = { japanese: '今日は', hindi: 'नमस्ते', hebrew: 'שלום' };
    yield store.set(sid, sess, 5000);
    const data = yield store.get(sid);
    sess.should.deepEqual(data);
  }));

  it('should handle non-existent session ids', co.wrap(function* () {
    const data = yield store.get('abcdefg');
    should.not.exist(data);
  }));

  it('should expire', co.wrap(function* () {
    this.timeout(3000);                 // eslint-disable-line no-invalid-this
    yield store.set(sid, sess, 1000);
    yield new Promise(function (resolve) { setTimeout(resolve, 2000); });
    const data = yield store.get(sid);
    should.not.exist(data);
  }));

  it('should destroy ok', co.wrap(function* () {
    yield store.set(sid, sess, 5000);
    yield store.destroy(sid);
    const data = yield store.get(sid);
    should.not.exist(data);
  }));

  it('should handle lots of requests at once', co.wrap(function* () {
    this.timeout(30000);                // eslint-disable-line no-invalid-this

    const handleRequest = co.wrap(function* (sid) {
      yield store.set(sid, sess, 30000);
      let data = yield store.get(sid);
      sess.should.deepEqual(data);
      yield store.destroy(sid);
      data = yield store.get(sid);
      should.not.exist(data);
    });

    const promises = [];
    for (let i = 0; i < 500; ++i) {
      promises.push(handleRequest(uid.sync(24)));
    }
    yield Promise.all(promises);
  }));
};
