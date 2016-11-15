# koa-generic-session-sequelize

Store Koa sessions in a database using Sequelize.

## Usage

This session storage provider works with [koa-generic-session](https://github.com/koajs/generic-session) (a generic session middleware for koa).

It stores session data in a database defined by you, using the [Sequelize](http://docs.sequelizejs.com/) ORM. Sequelize 3.x is supported. (Sequelize 4.x works too, but may break in the future, as 4.x is pre-release software.)

It has been tested with SQLite, MySQL, PostgreSQL, and Azure Cloud SQL (Microsoft SQL Server).

### Installation

`npm install --save koa-generic-session-sequelize`

### Example

```js
var session = require('koa-generic-session');
var Sequelize = require('sequelize');
var sequelizeStore = require('koa-generic-session-sequelize');
var koa = require('koa');

// set up Sequelize in the usual manner, or, for a quick example:
var sequelize = new Sequelize({
  logging: false,
  dialect: 'sqlite',
  storage: __dirname + '/example.db'
});

var app = koa();
app.keys = ['keys', 'keykeys'];
app.use(session({
  store: sequelizeStore(
    sequelize,            // pass your sequelize object as the first arg
    {}                    // pass any config options for sequelizeStore as the second arg
  )
}));

function get() {
  var session = this.session;
  session.count = session.count || 0;
  session.count++;
  this.body = session.count;
}

function remove() {
  this.session = null;
  this.body = 0;
}

function *regenerate() {
  get.call(this);
  yield this.regenerateSession();
  get.call(this);
}

app.use(function *() {
  switch (this.path) {
  case '/get':
    get.call(this);
    break;
  case '/remove':
    remove.call(this);
    break;
  case '/regenerate':
    yield regenerate.call(this);
    break;
  }
});

app.listen(8080);
```

### Options

 - `tableName` - Name of the session table in the db (default: `Sessions`)
 - `modelName` - Name of the session model to be registered with Sequelize (default: `Session`)
 - `sync` - Create the sessions table if it doesn’t exist (default: `true`)
 - `syncTimeout` - If `sync` is `true`, how long to wait, in ms, for the sync to complete (default: `3000`)
 - `gcFrequency` - Do garbage collection after approximately this many requests. This deletes old expired sessions from the table. (default: `10000`, or approximately every 10,000 requests)
 - `timestamps` - If true, the table will have `updatedAt` and `createdAt` columns. (default: `false`)

### Unit tests

To run the unit tests, clone this Git repository, and run `npm install` in the checkout directory. Then run `npm test`. This will exercise the library against SQLite.

To test against MySQL, PostgreSQL, or SQL Server, edit the file `test/session-sequelize.test.js`, and uncomment the sections referencing those servers, and enter your credentials.
