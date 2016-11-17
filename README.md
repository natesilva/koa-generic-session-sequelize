# koa-generic-session-sequelize

Store Koa sessions in a database using Sequelize.

## Usage

This session storage provider works with [koa-generic-session](https://github.com/koajs/generic-session) (session middleware for Koa) and with [koa-session-minimal](https://github.com/longztian/koa-session-minimal) (session middleware for Koa 2).

It stores session data in a database defined by you, using the [Sequelize](http://docs.sequelizejs.com/) ORM.

It has been tested with SQLite, MySQL, PostgreSQL, and Microsoft SQL Server.

### Installation

`npm install --save koa-generic-session-sequelize`

### Example

Full example in [examples/basic_sqlite.js](examples/basic_sqlite.js).

```js
const SequelizeStore = require('koa-generic-session-sequelize');

// set up Sequelize in the usual manner
// for a quick example using the sqlite3 module:
const sequelize = new Sequelize({
  logging: false,
  dialect: 'sqlite',
  storage: __dirname + '/example.db'
});

app.use(session({
  store: new SequelizeStore(
    sequelize,            // pass your sequelize object as the first arg
    {}                    // pass any config options for sequelizeStore as the second arg (see below)
  )
}));
```

### Options

 - `tableName` - Name of the session table in the db (default: `Sessions`)
 - `modelName` - Name of the session model to be registered with Sequelize (default: `Session`)
 - `sync` - Create the sessions table if it doesn’t exist (default: `true`)
 - `syncTimeout` - If `sync` is `true`, how long to wait, in ms, for the sync to complete (default: `3000`)
 - `gcFrequency` - Do garbage collection after approximately this many requests. This deletes expired session data from the table. Set to `0` to never do garbage collection. (default: `10000`, or approximately every 10,000 requests)
 - `timestamps` - If true, the table will have `updatedAt` and `createdAt` columns. (default: `false`)

### Replication

Sequelize supports replication (configured as `options.replication`). This lets you use one server for writes and another server, or a group of servers, for reads.

However, if there is any lag between the time a write is committed and when it becomes visible on your read servers, you should not use that configuration for session data. Create a separate Sequelize instance for the session data that does not use replication. If you try to use replication you’ll get inconsistent results.

This only affects traditional replication. If your replication system has no lag—because servers share an underlying storage layer, as with in-region Amazon Aurora replicas—you may safely use replication.

### Unit tests

To run the test suite, clone this repository and run `npm install` in the checkout directory. Then run `npm test`. This will exercise the library against SQLite.

To test against MySQL, PostgreSQL, or SQL Server, edit `test/config.js`. Uncomment sections referencing those servers and enter your credentials. The table `_sess_test` will be created during testing.
