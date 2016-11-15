/* global describe, after */

'use strict';

var fs = require('fs');
var tmp = require('tmp');
var shared = require('./shared');

var config = {
  // Testing against SQLite doesn’t require a server and should always work
  sqlite: {
    logging: false,
    dialect: 'sqlite',
    storage: tmp.tmpNameSync(),   // create a temp file for SQLite testing
    deleteAfterTests: true        // and delete that temp file after testing
  },

  // Uncomment and edit any of the following to test against those DBs:

  // mysql: {
  //   logging: false,
  //   dialect: 'mysql',
  //   host: '<MYSQL HOST NAME>',
  //   username: '<MYSQL USER NAME>',
  //   password: '<MYSQL PASSWORD>',
  //   database: '<MYSQL DB NAME>',
  //   pool: {
  //     max: 50,
  //     min: 1
  //   },
  //   define: {
  //     charset: 'utf8mb4',
  //     collate: 'utf8mb4_unicode_ci  '
  //   }
  // },

  // postgres: {
  //   logging: false,
  //   dialect: 'postgres',
  //   host: '<POSTGRESQL HOST NAME>',
  //   username: '<POSTGRESQL USER NAME>',
  //   password: '<POSTGRESQL PASSWORD>',
  //   database: '<POSTGRESQL DB NAME>',
  //   dialectOptions: {
  //     ssl: true                   // some PostgreSQL hosts require SSL
  //   },
  //   pool: {
  //     max: 50,
  //     min: 1
  //   }
  // },

  // mssql: {
  //   logging: false,
  //   dialect: 'mssql',
  //   host: '<MSSQL HOST NAME>',
  //   username: '<MSSQL USER NAME>',
  //   password: '<MSSQL PASSWORD>',
  //   database: '<MSSQL DB NAME>',
  //   dialectOptions: {
  //     encrypt: true               // Azure, and some MS SQL servers need this
  //   },
  //   pool: {
  //     max: 50,
  //     min: 1
  //   }
  // }
};

describe('test/session-sequelize.test.js', function () {
  if (config.sqlite && config.sqlite.deleteAfterTests) {
    after(function () {
      this.timeout(5000);   // eslint-disable-line no-invalid-this
      // give SQLite time to release its lock on the file, then delete it
      setTimeout(function() {
        if (fs.existsSync(config.sqlite.storage)) {
          try {
            fs.unlinkSync(config.sqlite.storage);
          } catch (err) {
            // ignore: on Windows we sometimes can't unlink the temp file
          }
        }
      }, 2000);
    });
  }

  // run the shared test suite once for each db engine
  Object.keys(config).forEach(function (dbengine) {
    describe(dbengine, function () {
      shared.sharedTests(config[dbengine]);
    });
  });
});
