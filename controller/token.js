//
var Token = require("../models/Tokens");
var User = require("../models/Users");

var jwt = require('jwt-simple');
var moment = require('moment');
var bcrypt = require('bcrypt-nodejs');


var service_jwt = require('../services/jwt');
var permit = require("./permit");
//

//var User = require("../models/Users");
//var errResulUtils = require("../controller/errResulUtils");
//var initializer = {};

//--------------------------------------------New--------------------------------------------
function authenticate(req, res){
	console.log(req.body);
    var email = req.body.email;
    var password = req.body.password;
    var typeOfUser = req.body.typeOfUser; //FALTA CHECAR ESTO
    var typeOfOperation = req.body.typeOfOperation;
    var nameOfOperation = req.body.nameOfOperation;

    var query = { email: email };
    if(req.body.email != '' && req.body.password != ''){
    	//Modificar
	    User.findOne(query, (err, user) => {
	    	if(err){
	    		res.status(500).send({message: 'Error en la petición'});
	    	}else{
	    		if(!user){
	    			res.status(404).send({message: 'El usuario no existe'});
	    		}else{
	    			//Comprobar la contraseña
	    			bcrypt.compare(password, user.password, function(err, check){
	    				if(check){
	    					//Duvuelve los datos del usuario logueado
	    					if(req.body.gethash){
	    						//Delvover un token de JWT
	    						console.log("ERROR");
	    					}else{
	    						var temporalToken = service_jwt.createToken(user);
	    						//res.status(200).send({ message: true, token: user.initialToken, user: user });
	    						permit.hasAccess(temporalToken, typeOfOperation, nameOfOperation)
								.then(typeOfOperationOK => {
									console.log('typeOfOperationOK: '+typeOfOperationOK);
									if(typeOfOperationOK == true){
		    							res.status(200).send({ message: true, user: user, token: temporalToken });
									}else if(typeOfOperationOK == false){
		    							res.status(200).send({ message: false });
									}
								})
								.catch(err => {
									// never goes here
									console.log(err);
									return res.status(505).json({message: "Error 505"});
								});
	    					}
	    				}else{
	    					res.status(404).send({message: 'El usuario no se ha podido indentificar'});
	    				}
	    			})
	    		}
	    	}
	    });
	}else{
		res.status(404).json({ message: 'Rellena todos los campos' });
	}
}

function tokenCreation(newToken, email){
	var token = new Token();
	token.generatedToken = newToken;
	token.email = email;

	token.save((err, tokentStored) => {
		if(err){
			return 'message: Error al guardar los datos';
		}else{
			if(!tokentStored){
				return 'message: El dato no ha sido guardado';
			}else{
				console.log("Token guardado");
				//res.status(200).send({datos: tokentStored});
			}
		}
	});
}

function tokenRenovation(req, res){
	var token = req.body.generatedToken.replace(/['"]+/g, '');
	var payload = decodeToken(token);

	var email = req.body.email;
	var query = { generatedToken: token, email: email };

	var updateLife = moment().add(7, 'd').unix();
	var user = {
		_id: payload._id,
		typeOfUser: payload.typeOfUser,
		DP: payload.DP,
		creation: payload.creation,
		life: updateLife,
	};
	var generatedToken = service_jwt.renovationToken(user); //Guardar token en la base de datos
	var update = { generatedToken: generatedToken };

	Token.findOneAndUpdate(query, update, (err, data) => {
		if(err){
			res.status(500).send({message: 'Error en la petición'});
		}else{
			if(!data){
				res.status(404).send({message: 'El token o email no existe'});
			}else{
				res.status(200).send({
					message: generatedToken
				});
			}
		}
	});
}

function tokenIsValid(req, res){
    var token = req.body.generatedToken.replace(/['"]+/g, '');
	var payload = decodeToken(token);

	var query = { generatedToken: token };
	var valid = moment().unix();

	var bol;
	Token.findOne(query, (err, data) => {
		if(err){
			res.status(500).send({message: 'Error en la petición'});
		}else{
			if(!data){
				res.status(404).send({message: 'El token no existe'});
			}else{
				if(payload.life <= valid){
					bol = false;
					console.log("Token caducado");
					res.status(200).send({message: bol});
				}else{
					bol = true;
					console.log("Token vigente");
					res.status(200).send({message: bol});
				}
			}
		}
	});
}
/*
function checkTokens(typeOfOperation, nameOfOperation, token, user, res){
	var payload = decodeToken(token);
	//console.log(payload);
	var valid = moment().unix();
	var email = user.email;
    var query = {};

	permit.hasAccess(token, typeOfOperation, nameOfOperation)
	.then(typeOfOperationOK => {
		console.log('typeOfOperationOK: '+typeOfOperationOK);
		if(payload.life <= valid){
			return res.status(200).json({message: "Caducado"});
		}else{
			//localStorage.setItem('currentUser', JSON.stringify({ token: token, email: payload.email }));
			Token.findOne({ generatedToken: token, email: email })
				.then(tokenStored => {
					return tokenStored;
	        	})
	        	.then(token => {
	        		//console.log("token1: "+token);
	        		//console.log("token2: "+JSON.stringify(token));
	        		var userType = payload.typeOfUser;
	        		if(token == 'null' || token == null || token == "null"){
						return res.status(404).json({
							message: null
						});
					}else if(typeOfOperationOK == true){
						return res.status(200).json({
							message: true
						});
					}else if(typeOfOperationOK == false){
						return res.status(200).json({
							message: false
						});
					}
	        	})
	        	.catch(err => {
					console.log(err);
					return res.status(505).json({message: "Error 505"});
				});
		}
		if(typeOfOperationOK == true){
			return true;
		}else if(typeOfOperationOK == false){
			return false;
		}
	})
	.catch(err => {
		// never goes here
		console.log(err);
		return res.status(505).json({message: "Error 505"});
	});
}
*/
function decodeToken(token){
    var secret = 'secret_key';
    var payload = jwt.decode(token, secret);
    return payload;
}

function verifyToken(token){

}
//--------------------------------------------New--------------------------------------------

/*


function getToday(){
	var today = new Date();
	dateC=today.toISOString();
	return dateC;
}

function saveTokenInDatabase(req,resp,token){
	var dateC = getToday();
	var param = {	email:req.body.email,
					token:token,
					creation:dateC,
					life:"3600" //seconds
				};
	var tokenObj = new Token(param);

    tokenObj.save(function(err){
        if( err ){
        	resp.send(errResulUtils.jsonRespError(50));
        }else{
        	resp.send(errResulUtils.jsonRespOK(10,token));
        }
    });
}



function generateToken(){
	var date = new Date();
	var timestamp = date.getTime(); //timestamp creationg
	valor = Math. random();  	 	//random creating
	var result = timestamp *valor//nonce creation
	return (Math.trunc(result)); //returning only integer part
}




function checkUserInDataBase(req,res){
	var param = {	email:req.body.email,
					password:req.body.password
				};

		User.find(param).exec(function(err, users){
			if(err){
				res.send(errResulUtils.jsonRespError(50));
			}
	        if(users.length>0 && users.length<2){
        		token = generateToken();
        		saveTokenInDatabase(req,res,token);
	        }else{
				res.send(errResulUtils.jsonRespError(30));
	        }
	    });

}

//Create a Token object
initializer.Token=function(req,res){
	//We evaluate if some of the parameters are empty
	//In case, return an error
	var r=errResulUtils.someFieldIsEmpty(req);

	if (r==0){
			checkUserInDataBase(req,res);
			r=0;//it is callback in database, error control must be controlled previouslly
	}
	return r;
}


function isStillFresch(creation,life,cDate){
	const origin = Date.parse(creation);
	var originPlusLife = parseInt(origin) + (parseInt(life)*1000); //it must be multiplicated for 1000 because miliseconds
	const now = parseInt(Date.parse(cDate));
	if(now<=originPlusLife){
		return true;
	}else{
		return false;
	}
}


//returns through callback function creator email or empty
function who(tok,fn){
	isValid(tok,function(resultado){
		if(resultado){
			var param={token:tok};
			//Find the token in the database
			Token.find(param).exec(function(err, tokens){
				if(err){
					fn("");
				}
		        if(tokens.length==1){
		        	//Consult who is the creator
		        	var answer = {	email:tokens[0].email,
                    				token:tokens[0].token};
		       		fn(answer);
			     }
		    });
		}else{
			fn("");
		}
	});
}


//returns through callback function true or false
function isValid(tok,fn){
	var param={token:tok};
	//Check if token exists in the database
	Token.find(param).exec(function(err, tokens){
		if(err || (tokens.length==0)){
			fn(false);
		}
        if(tokens.length==1){
        	//Consult creation and life en seconds
       		creation = tokens[0].creation;
       		life = tokens[0].life;
       		var dateC = getToday();//Calculate current date
	       	var r=isStillFresch(creation,life,dateC); //Evaluate if current date wrt creationg and life is still valid
	       	fn(r);
	     }
    });
}


initializer.isValidTempo=function(token,res){
	isValid(token,function(resultado){
		if(resultado){
			res.send(errResulUtils.jsonRespOK(11,resultado));
		}else{
			res.send(errResulUtils.jsonRespOK(12,resultado));
		}
	});
}


initializer.whoPublic=function(token,res){
	who(token,function(resultado){
		if(resultado==""){
			res.send(errResulUtils.jsonRespError(70));
		}else{
			res.send(errResulUtils.jsonRespOK(13,resultado));
		}
	});
}

initializer.whoP=function(token,fn){
	who(token,function(resultado){
			fn(resultado);
	});
}

*/


module.exports = {
	authenticate,
	//checkTokens,
	tokenCreation,
	tokenRenovation,
	tokenIsValid
};