require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const multer = require('multer'); 
const bodyParser = require('body-parser');
//Routery
var indexRouter = require('./routes/index');
const registerRouter = require('./routes/register');
const loginRouter = require('./routes/login');
const eventsRouter = require('./routes/events');
 

var app = express();

require('dotenv').config();

const PORT = process.env.PORT || 3000;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
// Konfiguracja multer - przechowywanie plików w pamięci
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
// Middleware do parsowania danych formularza (URL encoded)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());  // Middleware do obsługi danych JSON
// Middleware do obsługi plików
app.use(upload.single('image')); // 'image' to nazwa pola w formularzu, które przesyła plik
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/register', registerRouter);
app.use('/login', loginRouter);
app.use('/events',eventsRouter)

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
  res.render('error');
});

app.listen(PORT, () => {
  console.log('Listening on port :3000');
});

module.exports = app;
