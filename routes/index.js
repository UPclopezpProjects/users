var express = require('express');
var router = express.Router();

var main = require('../controller/index.js');
var modelRoot = require('../controller/modelRoot.js');
var restRoot = require('../controller/restRoot.js');
var restAdmor = require('../controller/restAdmor.js');
var restToken = require('../controller/restToken.js');
var us = require('../controller/users.js');
/* GET home page. */

/*router.get('/', function(req, res, next) {
  var r = initialized();
  res.render('index', { title: 'Sig-in' });
});
*/

/* GET home page. */
/*router.get('/getMyContract', function(req, res, next) {
  getMyContract(req,res);
});

router.post('/exec/createContract', function (req, res, next){
	var answer = createContract(req,res);
   	res.render('contractCreated', { resp: answer });
 });
*/


//router.get('/getMyContract/dirs/:dirId', main.getMyContract);
//router.get('/getMyContract',root.getRootSCAddress); //tempo

//************************************************
//************************************************
//ROUTES FOR RESTFUL REQUESTS
//************************************************
//TOKEN
//************************************************
router.post('/exec/getToken', restToken.createToken);
//router.post('/exec/isValid', restToken.isValid); //not token public is available
router.post('/exec/who', restToken.who); //not token public is available
//************************************************

//ROOT
router.post('/exec/rootConstructor', restRoot.createRoot); 
router.post('/exec/getAddContrR', restRoot.getAddContrR);
router.post('/exec/getAddTransR', restRoot.getAddTransR);
//************************************************
//ADMINISTRATOR
router.post('/exec/admorConstructor', restAdmor.createAdmor); 
//router.post('/exec/getAddContrR', restRoot.getAddContrR);
//router.post('/exec/getAddTransR', restRoot.getAddTransR);
//************************************************

//************************************************
//************************************************
//routes returning some model
//router.get('/', main.index);
//router.post('/exec/rootConstructorM', modelRoot.createRoot); // returns a model about root created
//router.post('/exec/authenticate', us.login);

//router.post('/getSmartContract', us.getSmartContract);

//************************************************



module.exports = router;



