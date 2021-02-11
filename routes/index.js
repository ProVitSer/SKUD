const express = require('express'),
    router = express.Router();



router.get('/', function(req, res, next) {
    res.render('index');
});

router.get('/index', function(req, res, next) {
    res.render('index');
});

router.get('/user', function(req, res, next) {
    res.render('user');
});

router.get('/office', function(req, res, next) {
    res.render('office');
});

router.get('/report', function(req, res, next) {
    res.render('report');
});

module.exports = router;