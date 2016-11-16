//
// Common tests that can apply to any koa-generic-session store provider.
//

/* global it, beforeEach */

'use strict';

const should = require('should');
const uid = require('uid-safe');

module.exports = function (store) {
  const sess = { hello: 'howdy' };
  let sid;

  beforeEach(function () {
    sid = uid.sync(24);
  });

  it('should set and get ok', function () {
    return store.set(sid, sess, 5000)
      .then(function () { return store.get(sid); })
      .then(function (data) { sess.should.deepEqual(data); })
      ;
  });

  it('should set and get non-western text', function () {
    const sess = { japanese: '今日は', hindi: 'नमस्ते', hebrew: 'שלום' };
    return store.set(sid, sess, 5000)
      .then(function () { return store.get(sid); })
      .then(function (data) { sess.should.deepEqual(data); })
      ;
  });

  it('should handle non-existent session ids', function () {
    return store.get('abcdefg')
      .then(function (data) { should.not.exist(data); })
      ;
  });

  it('should expire', function () {
    this.timeout(3000);                 // eslint-disable-line no-invalid-this
    return store.set(sid, sess, 1000)
      .then(function () {
        return new Promise(function (resolve) { setTimeout(resolve, 2000); });
      })
      .then(function () { return store.get(sid); })
      .then(function (data) { should.not.exist(data); })
      ;
  });

  it('should destroy ok', function () {
    return store.set(sid, sess, 5000)
      .then(function () { return store.destroy(sid); })
      .then(function (destroyCount) { destroyCount.should.equal(1); })
      .then(function () { return store.get(sid); })
      .then(function (data) { should.not.exist(data); })
      ;
  });

  it('should handle lots of requests at once', function () {
    this.timeout(30000);                // eslint-disable-line no-invalid-this

    const promises = [];
    for (let i = 0; i < 500; ++i) {
      // use an IIFE to avoid scope issues
      (function (sid) {
        promises.push(
          store.set(sid, sess, 30000)
            .then(function () { return store.get(sid); })
            .then(function (data) { sess.should.deepEqual(data); })
            .then(function () { return store.destroy(sid); })
            .then(function () { return store.get(sid); })
            .then(function (data) { should.not.exist(data); })
        );
      })(uid.sync(24));
    }
    return Promise.all(promises);
  });
};
