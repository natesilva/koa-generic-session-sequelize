'use strict';

var EventEmitter = require('events').EventEmitter;
var util = require('util');

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

var SequelizeStore = module.exports = function (sequelize, options) {
  if (!(this instanceof SequelizeStore)) {
    return new SequelizeStore(sequelize, options);
  }

  EventEmitter.call(this);

  this.sequelize = sequelize;

  this.options = Object.assign({
    tableName: 'Sessions',
    modelName: 'Session',
    sync: true,               // if true, create the table if it doesn’t exist
    syncTimeout: 3000,        // if sync is true, how long to wait for initial sync (ms)
    gcFrequency: 10000,       // do garbage collection approx. every this many requests
    timestamps: false         // if true, add Sequelize updatedAt and createdAt columns
  }, options || {});

  this.Model = this.sequelize.define(this.options.modelName, {
    id: { type: this.sequelize.Sequelize.STRING, primaryKey: true },
    data: this.sequelize.Sequelize.TEXT,
    expires: this.sequelize.Sequelize.BIGINT
  }, {
    tableName: this.options.tableName,
    timestamps: this.options.timestamps,
    deletedAt: false,
    indexes: [{ fields: ['expires'] }]
  });

  this.synced = false;

  if (this.options.sync) {
    this.Model.sync().then(() => {
      this.synced = true;
      this.emit('connect');
    });
  } else {
    this.synced = true;
    this.emit('connect');
  }
};

util.inherits(SequelizeStore, EventEmitter);

SequelizeStore.prototype.waitForSync = function () {
  if (this.synced) { return this.sequelize.Promise.resolve(); }

  // wait for sync
  return new Promise((resolve, reject) => {
    var end = Date.now() + this.options.syncTimeout;
    var timerId = setInterval(() => {
      if (this.synced) {
        clearInterval(timerId);
        return resolve();
      }
      if (Date.now() > end) {
        clearInterval(timerId);
        var errMessage = 'could not sync() the ' + this.options.modelName + ' model to ' +
          'the database';
        return reject(new Error(errMessage));
      }
    }, 100);
  });
};

SequelizeStore.prototype.get = function (sid) {
  return this.waitForSync().then(() => {
    if (this.options.gcFrequency > 0) {
      if (getRandomInt(1, this.options.gcFrequency) === 1) { this.gc(); }
    }

    return this.Model.findOne({
      where: {
        id: sid,
        expires: {
          $gt: Math.floor(Date.now() / 1000)
        }
      }
    }).then(row => {
      if (!row) { return null; }
      return JSON.parse(row.data);
    });
  });
};

SequelizeStore.prototype.set = function (sid, sess, ttl) {
  return this.waitForSync().then(() => {
    var expires = Math.floor((Date.now() + (Math.max(ttl, 0) || 0)) / 1000);
    return this.Model.findOrInitialize({ where: { id: sid } })
      .then(function (result) {
        var instance = result[0];
        instance.data = JSON.stringify(sess);
        instance.expires = expires;
        return instance.save();
      })
      ;
  });
};

SequelizeStore.prototype.destroy = function (sid) {
  return this.waitForSync().then(() => {
    return this.Model.destroy({ where: { id: sid } });
  });
};

SequelizeStore.prototype.gc = function () {
  return this.waitForSync().then(() => {
    return this.Model.destroy(
      { where: { expires: { $lte: Math.floor(Date.now() / 1000) } } }
    );
  });
};

