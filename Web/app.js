const methodOverride = require('method-override');
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const multer = require('multer');     //obsługa plików
const bodyParser = require('body-parser');

//Routery
const indexRouter = require('./routes/index');
const registerRouter = require('./routes/register');
const loginRouter = require('./routes/login');
const panelRouter = require('./routes/panel');
const eventsRouter = require('./routes/events');

var app = express();

require('dotenv').config();

const PORT = process.env.PORT || 3000;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(methodOverride('_method')); //Umożliwia korzystanie z PUT/PATCH w formularzach

// Konfiguracja multer - przechowywanie plików w pamięci
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Middleware do obsługi plików
app.use(upload.single('image')); // 'image' to nazwa pola w formularzu, które przesyła plik



// Middleware do parsowania danych formularza (URL encoded)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());  // Middleware do obsługi danych JSON

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/register', registerRouter);
app.use('/login', loginRouter);
app.use('/panel', panelRouter);
app.use('/events', eventsRouter);


//debugowanie
app.use((req, res, next) => {
  console.log("Request method:", req.method);  // Logowanie metody HTTP
  console.log("Received body:", req.body);  // Logowanie danych z formularza
  next();
});


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
