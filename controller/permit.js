var User = require("../models/Users");
var Dictionary = require("../models/Transactions");


var jwt = require('jwt-simple');
var moment = require('moment');

function decodeToken(token){
    var secret = 'secret_key';
    var payload = jwt.decode(token, secret);
    return payload;
}

function hasAccess(token, typeOfOperation, nameOfOperation){
	var token = token.replace(/['"]+/g, '');
	//console.log(token);
	var payload = decodeToken(token);
	var dpArray = payload.DP;
	var dpJSON = JSON.parse(dpArray);
	var typeOfOperationOK = null;
	var userPermition = null;

	if(token == null || token == undefined || token == ''){
		return 'message: La petición no tiene la cabecera';
	}
	try{
		if(payload.life <= moment().unix()){
			return 'message: El token ha expirado';
		}
	}catch(ex){
		console.log("Ex: "+ex);
		return 'message: Token no válido';
	}

	var query = { typeOfOperation: typeOfOperation, nameOfOperation: nameOfOperation};
	return new Promise(function(resolve, reject) {
		Dictionary.findOne(query)
		.then(transactionStored => {
			var permitionArray = transactionStored.permitAccessTo;
			var permitionJSON = JSON.parse(permitionArray);
			var userType = payload.typeOfUser;

			if(userType == 'Root'){
				userPermition = permitionJSON.Root;
			}else if(userType == 'Administrator'){
				userPermition = permitionJSON.Administrator;
			}else if(userType == 'TUser'){
				userPermition = permitionJSON.TUser;
			}else{
				return 'message: No existe este tipo de usuario';
			}
			return userPermition;
	    })
	    .then(data => {
			if(data == true){
		    	switch(typeOfOperation) {
			        case 'create':
			        	if(nameOfOperation == 'createRoot'){
			                typeOfOperationOK = true; //Se envía true por defecto ya que es la única vez que se podrá crear un usario Root
			            } else if(nameOfOperation == 'createAdministrator'){
			                typeOfOperationOK = dpJSON.createAdministrator;
			            }else if(nameOfOperation == 'createTUser'){
			                typeOfOperationOK = dpJSON.createTUser;
			            }
			        	break;
			        case 'read':
			            if(nameOfOperation == 'readMe') {
			                typeOfOperationOK = dpJSON.readMe;
			            }else if(nameOfOperation == 'readAdministrator') {
			                typeOfOperationOK = dpJSON.readAdministrator;
			            }else if(nameOfOperation == 'readTUser') {
			                typeOfOperationOK = dpJSON.readTUser;
			            }
			        	break;
			        case 'update':
			            if(nameOfOperation == 'updateMe') {
			                typeOfOperationOK = dpJSON.updateMe;
			            }else if(nameOfOperation == 'updateAdministrator') {
			                typeOfOperationOK = dpJSON.updateAdministrator;
			            }else if(nameOfOperation == 'updateTUser'){
			                typeOfOperationOK = dpJSON.updateTUser;
			            }
			            break;
			        case 'delete':
			            if(nameOfOperation == 'deleteMe') {
			                typeOfOperationOK = dpJSON.deleteMe;
			            }else if(nameOfOperation == 'deleteAdministrator') {
			                typeOfOperationOK = dpJSON.deleteAdministrator;
			            }else if(nameOfOperation == 'deleteTUser'){
			                typeOfOperationOK = dpJSON.deleteTUser;
			            }
			            break;
			        case 'authentication':
			            if(nameOfOperation == 'loginUser') {
			                typeOfOperationOK = dpJSON.loginUser;
			            }
			            break;
			        default:
		       			return 'message: Default case (hasAccess) if exists a emergency';
			        	break;
			    }
			}else if (data == false){
				typeOfOperationOK = false;
			}
			resolve(typeOfOperationOK);
		})
	    .then(undefined, function(err){
	    	reject(err);
	    })
	    .catch(err => {
	    	console.log(err);
	    	return res.status(505).json({message: "Error 505"});
	    });
	});
}

/*
function permitions(req, res){
	var email = req.body.email;
	let promise = new Promise(function(resolve, reject) {
		User.findOne({email: email})
		.then(user => {
			var dpArray = user.dp;
			var dpJSON = JSON.parse(dpArray);
			resolve(dpJSON)
		})
		.then(undefined, function(err){
			reject(err)
		});
	});

	promise
		.then(data => {
			res.status(200).send({ message: data });
		})
}
*/
function permitions(req, res){
	var tokeninitial = req.body.token;
	var typeOfOperation = req.body.typeOfOperation;
	var nameOfOperation = req.body.nameOfOperation;
	hasAccess(tokeninitial, typeOfOperation, nameOfOperation)
	.then(typeOfOperationOK => {
		console.log(typeOfOperationOK);
		return res.status(200).send({message: typeOfOperationOK});
	})
	.catch(err => {
		console.log(err);
		return res.status(550).json(err);
	});
}
module.exports = {
	hasAccess,
	permitions
};