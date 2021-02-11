const createError = require('http-errors'),
    express = require('express'),
    path = require('path'),
    cookieParser = require('cookie-parser'),
    logger = require('morgan'),
    favicon = require(`serve-favicon`),
    indexRouter = require('./routes/index'),
    users = require(`./config/users`),
    app = express(),
    passport = require(`passport`),
    LocalStrategy = require(`passport-local`).Strategy,
    expressSession = require(`express-session`);


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'assets')));
app.use(require('express-session')({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
}));


//app.use(favicon(path.join(__dirname, `public`, `img`, `favicon.ico`)));


app.use('/', indexRouter);



app.use(function(req, res, next) {
    next(createError(404));
});

app.use(function(err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    res.status(err.status || 500);
    res.render(`index`);
});



module.exports = app;