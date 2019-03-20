'use strict';

const EventEmitter = require('events').EventEmitter;

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

class SequelizeStore extends EventEmitter {
  constructor(sequelize, options) {
    super();

    this.sequelize = sequelize;

    this.options = Object.assign(
      {
        tableName: 'Sessions',
        modelName: 'Session',
        sync: true, // if true, create the table if it doesn’t exist
        syncTimeout: 3000, // if sync is true, how long to wait for initial sync (ms)
        gcFrequency: 10000, // do garbage collection approx. every this many requests
        timestamps: false, // if true, add Sequelize updatedAt and createdAt columns
        browserSessionLifetime: 86400 * 1000 // how long to remember sessions without a TTL
      },
      options || {}
    );

    this.Model = this.sequelize.define(
      this.options.modelName,
      {
        id: { type: this.sequelize.Sequelize.STRING(100), primaryKey: true },
        data: this.sequelize.Sequelize.TEXT,
        expires: this.sequelize.Sequelize.BIGINT
      },
      {
        tableName: this.options.tableName,
        timestamps: this.options.timestamps,
        deletedAt: false,
        paranoid: false,
        indexes: [{ fields: ['expires'] }]
      }
    );

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
  }

  waitForSync() {
    if (this.synced) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const end = Date.now() + this.options.syncTimeout;
      const timerId = setInterval(() => {
        if (this.synced) {
          clearInterval(timerId);
          return resolve();
        }
        if (Date.now() > end) {
          clearInterval(timerId);
          const errMessage = `could not sync() the ${this.options.modelName} model`;
          return reject(new Error(errMessage));
        }
      }, 100);
    });
  }

  get(sid) {
    return this.waitForSync().then(() => {
      if (this.options.gcFrequency > 0) {
        if (getRandomInt(1, this.options.gcFrequency) === 1) {
          this.gc();
        }
      }

      return this.Model.findOne({
        where: {
          id: sid,
          expires: {
            [this.sequelize.Sequelize.Op.gt]: Math.floor(Date.now() / 1000)
          }
        }
      }).then(row => {
        if (!row || !row.data) {
          return null;
        }
        return JSON.parse(row.data);
      });
    });
  }

  set(sid, sess, ttl) {
    if (!ttl) {
      if (sess.cookie && sess.cookie.maxAge) {
        // standard expiring cookie
        return this.set(sid, sess, sess.cookie.maxAge);
      } else if (this.options.browserSessionLifetime > 0) {
        // browser-session cookie
        return this.set(sid, sess, this.options.browserSessionLifetime);
      }
    }

    return this.waitForSync().then(() => {
      const expires = Math.floor((Date.now() + (Math.max(ttl, 0) || 0)) / 1000);
      return this.Model.findOrBuild({ where: { id: sid } }).then(function(result) {
        const instance = result[0];
        instance.data = JSON.stringify(sess);
        instance.expires = expires;
        return instance.save();
      });
    });
  }

  destroy(sid) {
    return this.waitForSync().then(() => {
      return this.Model.destroy({ where: { id: sid } });
    });
  }

  gc() {
    return this.waitForSync().then(() => {
      return this.Model.destroy({
        where: {
          expires: { [this.sequelize.Sequelize.Op.lte]: Math.floor(Date.now() / 1000) }
        }
      });
    });
  }
}

module.exports = SequelizeStore;
