const methodOverride = require('method-override');
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const multer = require('multer'); 
const bodyParser = require('body-parser');

//Routery
const indexRouter = require('./routes/index');
const registerRouter = require('./routes/register');
const loginRouter = require('./routes/login');
const panelRouter = require('./routes/panel');
const eventsRouter = require('./routes/events');
const logoutRouter = require('./routes/logout');
const adminRoutes = require('./routes/admin');

var app = express();

require('dotenv').config();
if (!process.env.FERNET_ENCRYPTION_KEY) {
  console.error('Brak klucza FERNET_ENCRYPTION_KEY w pliku .env');
  process.exit(1);
}

const PORT = process.env.PORT || 3000;

app.set('view engine', 'pug');

app.set('views', [
  path.join(__dirname, 'views'),
  path.join(__dirname, 'views/panel'),
  path.join(__dirname, 'views/admin-panel')
]);
app.use(methodOverride('_method'));
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
app.use(upload.single('image'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/register', registerRouter);
app.use('/login', loginRouter);
app.use('/decrypt-password',eventsRouter);
app.use('/panel', panelRouter);
app.use('/events', eventsRouter);
app.use('/logout', logoutRouter);
app.use('/admin', adminRoutes);

app.use((req, res, next) => {
  console.log("Request method:", req.method);
  console.log("Received body:", req.body);
  next();
});

app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

app.listen(PORT, () => {
  console.log('Listening on port :3000');
});

module.exports = app;
