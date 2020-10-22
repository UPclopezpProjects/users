//
global.host = '172.20.0.2';
global.port = '3000';
global.method = {
  POST: 'POST',
  GET: 'GET',
  PUT: 'PUT',
  DELETE: 'DELETE'
};
global.path = '/exec/createUser';
//

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
    secret: '12345',
    resave: false,
    saveUninitialized: true
}));

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});


// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  var resp = {result:"error de users - :C"};
  res.send(resp);
  //res.render('error');
});

var mongoose = require('mongoose');
var mongoDB = 'mongodb://172.17.0.1:27017/users';

var port = process.env.PORT || 3001;

mongoose.connect(mongoDB, {useFindAndModify: false, useUnifiedTopology: true, useNewUrlParser: true}, (err, res) => {
  if(err){
    throw err;
  }else{
    console.log("Conexión exitosa (Base de datos)...");
    app.listen(port, function(){
      console.log("Microservicio 'Users' escuchando en -> http://localhost:"+port);
    });
  }
});
//app.listen(3001);
/*mongoose.connect(mongoDB,{
  useFindAndModify: false,
  useUnifiedTopology: true,
  useNewUrlParser: true});*/
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
module.exports = app;
