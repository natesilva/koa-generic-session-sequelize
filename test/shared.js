/* global it, beforeEach, after */

var should = require('should');
var uid = require('uid-safe');
var Sequelize = require('sequelize');
var sequelizeStore = require('../index.js');

exports.sharedTests = function (config) {
  var sequelize = new Sequelize(config);
  var store = sequelizeStore(sequelize, { sync: true, tableName: '_sessions_test' });
  var sess = { hello: 'howdy' };
  var sid;

  beforeEach(function () {
    sid = uid.sync(24);
  });

  after(function() {
    sequelize.close();
  });

  it('should set and get ok', function () {
    return store.set(sid, sess, 5000)
      .then(function () { return store.get(sid); })
      .then(function (data) { sess.should.deepEqual(data); })
      ;
  });

  it('should set and get non-western text', function () {
    var sess = { japanese: '今日は', hindi: 'नमस्ते', hebrew: 'שלום' };
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
    this.timeout(3000);
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
    this.timeout(30000);

    var promises = [];
    for (var i = 0; i < 500; ++i) {
      // use an IIFE to avoid scope issues
      (function (sid) {
        promises.push(
          store.set(sid, sess, 30000)
            .then(function () { return store.get(sid); })
            .then(function (data) { sess.should.deepEqual(data); })
            .then(function () { })
        );
      })(uid.sync(24));
    }
    return Promise.all(promises);
  });

  it('should garbage collect old sessions', function () {
    this.timeout(30000);
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
