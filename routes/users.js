var express = require('express');
var router = express.Router();

//var users = require('../controller/users.js');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

//router.post('/exec/authenticate', users.index);


module.exports = router;
