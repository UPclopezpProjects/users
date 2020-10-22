var express = require('express');
var router = express.Router();

//var main = require('../controller/index.js');
//var modelRoot = require('../controller/modelRoot.js');
var userCreation = require('../controller/userCreation.js');
//var restAdmor = require('../controller/restAdmor.js');
//var restToken = require('../controller/restToken.js');
var sbi = require('../controller/sbi.js');
//var us = require('../controller/users.js');

var root = require('../controller/root.js');

var UserController = require('../controller/user');
var TokenController = require('../controller/token');
var PermitController = require('../controller/permit')




//************************************************
//************************************************
//ROUTES FOR RESTFUL REQUESTS
//************************************************
//TOKEN
//************************************************
//router.post('/exec/getToken', restToken.createToken);
//router.post('/exec/isValid', restToken.isValid); //not token public is available
//router.post('/exec/who', restToken.who); //not token public is available
//************************************************

//ROOT
router.post('/exec/rootConstructor', userCreation.createUser);
//router.post('/exec/getAddContrR', userCreation.getAddContrR);
//router.post('/exec/getAddTransR', userCreation.getAddTransR);
//************************************************
//ADMINISTRATOR
//router.post('/exec/admorConstructor', restAdmor.createAdmor);
//router.post('/exec/getAddContrR', restRoot.getAddContrR);
//router.post('/exec/getAddTransR', restRoot.getAddTransR);
//************************************************


//SBI
router.post('/exec/permit', sbi.permit);
//router.post('/exec/getAddContrR', restRoot.getAddContrR);
//router.post('/exec/getAddTransR', restRoot.getAddTransR);
//************************************************
//************************************************




/*----------Pruebas de conexión y obtención de datos----------*/
//UserAdministration
router.post('/userCreation', UserController.userCreation);
router.put('/userUpdate', UserController.userUpdate);
router.delete('/userDelete', UserController.userDelete);
router.post('/login', UserController.loginUser);

//Authentication
router.put('/tokenRenovation', TokenController.tokenRenovation);
router.post('/tokenIsValid', TokenController.tokenIsValid);



//Permit
router.post('/hasAcces', PermitController.hasAcces);
/*----------Pruebas de conexión y obtención de datos----------*/

module.exports = router;



