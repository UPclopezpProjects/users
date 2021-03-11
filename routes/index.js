var path = require('path');
var express = require('express');
var jwt = require('jwt-simple');
var moment = require('moment');

var md_auth = require('../middlewares/authenticated');
var Token = require("../models/Tokens");
var User = require("../models/Users");
var service_jwt = require('../services/jwt');
var router = express.Router();

//var main = require('../controller/index.js');
//var modelRoot = require('../controller/modelRoot.js');
var userCreation = require('../controller/userCreation.js');
//var restAdmor = require('../controller/restAdmor.js');
//var restToken = require('../controller/restToken.js');
var sbi = require('../controller/sbi.js');
//var us = require('../controller/users.js');

//var root = require('../controller/root.js');

var UserController = require('../controller/user');
var TokenController = require('../controller/token');
var PermitController = require('../controller/permit');
var TransactionController = require('../controller/transaction');
var EmailController = require('../services/email');


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

router.get('/', function(req, res){
	res.render('index');
});
//UserAdministration
/*router.post('/userCreation', function(req, res){
  UserController.userCreation
});
router.put('/userUpdate/:id', function(req, res){
  UserController.userUpdate
});
router.delete('/userDelete/:id', function(req, res){
  UserController.userDelete
});
router.post('/login', function(req, res){
  UserController.loginUser
});*/
router.get('/userDetails/:id', UserController.getUser);
router.get('/usersDetails/:page?', UserController.getUsers);
router.post('/userCreation', UserController.userCreate);
router.post('/register', UserController.registerUser); //Consumer
router.put('/userUpdate/:id', UserController.userUpdate);
router.delete('/userDelete/:id', UserController.userDelete);


//Authentication
router.get('/getInitialToken', function (req, res) {
	validTime = moment().unix();
	if (count == true) {
		if (validTime > expiredTime) {
			Token.remove({email: 'email for initialToken'}, (err, tokenDelete) => {
				if(err){
					res.status(500).send({message: 'Error en la petición'});
				}else{
					expiredTime = moment().add(5000, 'ms').unix();
					var initialToken = service_jwt.initialToken(20); //Guardar token en la base de datos
					TokenController.tokenCreation(initialToken, 'email for initialToken');
					res.status(200).send({ message: true, token: initialToken });
				}
			});
		}else {
			//if (req.session.ID != req.sessionID) {
				//res.status(200).send({ message: 'El servicio está siendo usado, intente de nuevo más tarde' });
			//}else {
				res.status(200).send({ message: 'El servicio está siendo usado' });
			//}
		}
	}else {
		//req.session.ID = req.sessionID;
		//console.log(req.session.ID);
		count = true;
		expiredTime = moment().add(5000, 'ms').unix();
		var initialToken = service_jwt.initialToken(20); //Guardar token en la base de datos
		TokenController.tokenCreation(initialToken, 'email for initialToken');
		res.status(200).send({ message: true, token: initialToken });
	}
});
//router.get('/getInitialToken', TokenController.getInitialToken(req, res, booleanToken));
router.post('/login', TokenController.authenticate);
//router.post('/login/token', TokenController.checkTokens);
router.put('/tokenRenovation', TokenController.tokenRenovation);
router.post('/tokenIsValid', TokenController.tokenIsValid);

//Permit
/*router.get('/permitions', function(req, res){
	res.render('permitions');
});*/
router.get('/permitions', PermitController.permitions);


//Merchant
router.post('/merchantData', TransactionController.merchantData);


//Email
router.get('/getEmail', EmailController.getEmail);
//router.post('/sendEmail', EmailController.sendEmail);

/*----------Pruebas de conexión y obtención de datos----------*/


module.exports = router;
