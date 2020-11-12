var User = require("../models/Users");
var Dictionary = require("../models/Transactions");


var jwt = require('jwt-simple');
var moment = require('moment');

function permissAccesTo(payload, typeOfOperation, nameOfOperation, next){
	var query = { typeOfOperation: typeOfOperation, nameOfOperation: nameOfOperation};
	var userPermition;
	var transaction;
	Dictionary.findOne(query, (err, transactionStored) => {
		if(err){
			transaction = null;
			next(null, err);
		}else{
			if(!transactionStored){
				transaction = 'message: El dato no existe';
				next(transaction, null);
			}else{
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
				next(userPermition, null);
			}
		}
	});
}


function decodeToken(token){
    var secret = 'secret_key';
    var payload = jwt.decode(token, secret);
    return payload;
}

function hasAccess(token, typeOfOperation, nameOfOperation){
	var token = token.replace(/['"]+/g, '');
	var payload = decodeToken(token);
	var typeOfOperationOK = null;

	permissAccesTo(payload, typeOfOperation, nameOfOperation, function(data, err) {
		if (err) {
			return 'message: Error en la petición';
        }else {
        	var dpArray = payload.DP;
		    var dpJSON = JSON.parse(dpArray);

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
		    console.log(data);
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
        }
        console.log(typeOfOperationOK);
        return typeOfOperationOK;
    });
}

function permitions(req, res){
    var email = req.body.email;
    User.findOne( {email: email.toLowerCase() }, (err, user) => {
        if(err){
            res.status(500).send({ message: 'Error en la petición' });
        }else{
            if(!user){
                res.status(404).send({ message: 'El usuario no existe' });
            }else{
                var dpArray = user.dp;
                var dpJSON = JSON.parse(dpArray);
                res.status(200).send({ permitions: dpJSON });
            }
        }
    });
}
module.exports = {
	hasAccess,
	permitions
};