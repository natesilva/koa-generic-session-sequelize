/* global describe, after */

'use strict';

const fs = require('fs');
const shared = require('./shared');
const config = require('./config');

describe('test/session-sequelize.test.js', function () {
  if (config.sqlite && config.sqlite.deleteAfterTests) {
    after(function () {
      this.timeout(5000);               // eslint-disable-line no-invalid-this
      // give SQLite time to release its lock on the file, then delete it
      setTimeout(function () {
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
