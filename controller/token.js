//
var Token = require("../models/Tokens");

var service_jwt = require('../services/jwt');
var moment = require('moment');
//

var User = require("../models/Users");
var mongoose = require('mongoose');
var errResulUtils = require("../controller/errResulUtils");
var initializer = {};

//--------------------------------------------New--------------------------------------------
function tokenCreation(user, initialToken, generatedToken, authToken, dp){
	var token = new Token();
	iat = moment().unix(); //Momento de creación del token (fecha y hora exacta)
	exp = moment().add(1, 'm').unix(); //Agrega 1 minutos en tiempo UNIX
	token.email = user.email; //Prueba
	token.initialToken = initialToken;
	token.generatedToken = generatedToken;
	//token.authToken = service_jwt.generateToken(user, dp);
	token.authToken = authToken;
	token.creation = iat;
	token.life = exp;
	//console.log(token);
	token.save((err, tokentStored) => {
		if(err){
			res.status(500).send({message: 'Error al guardar los datos'})
		}else{
			if(!tokentStored){
				res.status(404).send({message: 'El dato no ha sido guardado'});
			}else{
				console.log("Token guardado");
				//res.status(200).send({datos: tokentStored});
			}
		}
	});
}

function tokenRenovation(req, res){
	var initialToken = req.body.initialToken; //Tendría que ser con el authToken
	var email = req.body.email;
	var query = { initialToken: initialToken, email: email };
	var update = moment().add(7, 'd').unix();

	Token.findOneAndUpdate(query, {life: update}, (err, data) => {
		if(err){
			res.status(500).send({message: 'Error en la petición'});
		}else{
			if(!data){
				res.status(404).send({message: 'El token o email no existe'});
			}else{
				res.status(200).send({
					token: service_jwt.renovationToken(data)
				});
			}
		}
	});
}

function tokenIsValid(req, res){
	var initialToken = req.body.initialToken;
	var valid = moment().unix();
	var bol = false;

	Token.findOne({ initialToken: initialToken }, (err, data) => {
	console.log("2");

		if(err){
			res.status(500).send({message: 'Error en la petición'});
		}else{
			if(!data){
				res.status(404).send({message: 'El token no existe'});
			}else{
				if(data.life <= valid){
					console.log("Token caducado");
					res.status(200).send({response: bol});
				}else{
					bol = true;
					console.log("Token vigente");
					res.status(200).send({response: bol});
				}
			}
		}
	});
}
//--------------------------------------------New--------------------------------------------


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


module.exports = {
	tokenCreation,
	tokenRenovation,
	tokenIsValid
};