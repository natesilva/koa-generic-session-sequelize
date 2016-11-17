// database configuration for unit tests

'use strict';

const tmp = require('tmp');

const config = {};
module.exports = config;

// SQLite -- doesn’t require a server and should always work

config.sqlite = {
  logging: false,
  dialect: 'sqlite',
  storage: tmp.tmpNameSync(),   // create a temp file for SQLite testing
  deleteAfterTests: true        // and delete that temp file after testing
};

// Uncomment and edit any of the following to test against those DBs:

// config.mysql = {
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
//     collate: 'utf8mb4_unicode_ci'
//   }
// };

// config.postgres = {
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
// };

// config.mssql = {
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
// };
