const session = require('koa-generic-session');
const Sequelize = require('sequelize');
const SequelizeStore = require('..');
const koa = require('koa');

// set up Sequelize in the usual manner, or, for a quick example:
const sequelize = new Sequelize({
  logging: false,
  dialect: 'sqlite',
  storage: __dirname + '/example.db',
  operatorsAliases: false  // remove if using Sequelize v5
});

const app = koa();
app.keys = ['keys', 'keykeys'];
app.use(session({
  store: new SequelizeStore(
    sequelize,            // pass your sequelize object as the first arg
    {}                    // pass any config options for SequelizeStore as the second arg
  )
}));

function get() {
  const session = this.session;
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
