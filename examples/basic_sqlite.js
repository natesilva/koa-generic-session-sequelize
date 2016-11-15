var session = require('koa-generic-session');
var Sequelize = require('sequelize');
var sequelizeStore = require('..');
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
