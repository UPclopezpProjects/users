//
var http = require('http');
var https = require('https');
var bcrypt = require('bcrypt-nodejs');
var service_jwt = require('../services/jwt');
var jwt = require('jwt-simple');
var Dictionary = require("../models/Transactions");
var Tokenn = require("../models/Tokens");
var moment = require('moment');
var secret = 'secret_key';
//

//var mongoose = require('mongoose');
var User = require("../models/Users");
var User_ = require("../controller/user");
var error = require("../controller/errResulUtils");
var result = require("../controller/errResulUtils");
var Token = require("../controller/Token");
var initializer = {};

//recepitG is a json that includes  all data about the root transaction
var receiptG;
var candado =true;
var statusV = {rootCreation:"rootCreation",
			   admorCreation:"admorCreationInRootSC"};
var blockchainAddress = "ws://host.docker.internal:7545";




initializer.getAddContrR = function (par,resp) {
	var r=result.someFieldIsEmpty(par);
	if (r==0){
		var tok=par.body.token;
		Token.whoP(tok,function(answer){
			if(answer.email==""){
				resp.send(error.jsonRespError(70));
			}else{
					User.find({type:statusV.rootCreation}).exec(function(err, users){
						if(err){
							resp.send(error.jsonRespError(50));
						}
				        if(users.length>0 && users.length<2){
				        	if(answer.email==users[0].email){ //we check that the token match with the root
				        		res = users[0].addressContract;
			        			resp.send(result.jsonRespOK(2,res));
		        			}else{
	        					resp.send(error.jsonRespError(4));
	        				}
				        }else{
							resp.send(error.jsonRespError(100));
				        }
				    });
			}
		});
	}else{
		res.send(error.jsonRespError(r));
	}
}



initializer.getAddTransR = function (par,resp) {
	var r=result.someFieldIsEmpty(par);
	if (r==0){
		var tok=par.body.token;
		Token.whoP(tok,function(answer){
			if(answer.email==""){
				res.send(error.jsonRespError(70));
			}else{
					User.find({type:statusV.rootCreation}).exec(function(err, users){
						if(err){
							resp.send(error.jsonRespError(50));
						}
				        if(users.length>0 && users.length<2){
				        	if(answer.email==users[0].email){ //we check that the token match with the root
				        		res = users[0].addressTransaction;
			        			resp.send(result.jsonRespOK(3,res));
		        			}else{
	        					resp.send(error.jsonRespError(4));
	        				}
				        }else{
							resp.send(error.jsonRespError(100));
				        }
				    });
			}
		});
	}else{
		res.send(error.jsonRespError(r));
	}
}

/*
function createUserSC(req){

	//falta implementar conectarse al microservicio de audit
	//it will be done by means a restfull request
	//resultado = sbi("172.18.0.2:3000",req);
	var resultado = {
		transactionHash:"0xFFFFFFFFFF",
		contractAddress:"0xFFFFFFFFFF"
	};
	//*****************************
	return resultado;
}
*/

//save root in the smart contract
function createRoot(req,resp){

	//llamar a través de proceso remoto la petición de agregar a la blockchain
	var receiptG = createUserSC(req);
   	User_.save(req,receiptG.contractAddress,receiptG.transactionHash,statusV.rootCreation,resp,1); //add user to the database
    return resultado;
}



function checkMutualExclusion(req,resp){
	//Considerar variables estáticas por el número de peticiones
	var res=0;
	if(candado){ //only one thread must intro in this part
		candado = false;
		User.find({type:statusV.rootCreation}).exec(function(err, users){
			if(err){
				candado = true;
				resp.send(error.jsonRespError(53));
			}
	        if(users.length>0)
	        {
	        	candado = true;
			   	resp.send(error.jsonRespError(1));
	        }else{
				var answer = createRoot(req,resp);
				res = answer;
	        }
	    });
	}else{
		res = 2; // error number 2 is returned
	}
	return res;
}

//this is the constructor of the root
initializer.Root=function(req,res){
	//We evaluate if some of the parameters are empty
	//In case, return an error
	var r=result.someFieldIsEmpty(req);
	if (r==0){
		var resp = checkMutualExclusion(req,res);
		res.send(resp);
		return 0;
	}else{
		return (r);
	}
}


function createAdmorSC(req,res){
	//createAdmorSC involves create Admor in database and add it within the root knowledge
	compiler = require('solc');
	const fs = require('fs');
	const rootSol = 'RootSC.sol';
	sourceCode = fs.readFileSync(rootSol, 'UTF8').toString();
	const path = require('path');
	const solc = require('solc');
	const veh = path.resolve('', '', rootSol);
	const source = fs.readFileSync(veh, 'UTF-8');

	var input = {
	    language: 'Solidity',
	    sources: {
	        rootSol : {
	            content: source
	        }
	    },
	    settings: {
	        outputSelection: {
	            '*': {
	                '*': [ '*' ]
	            }
	        }
	    }
	};
	compiledCode = JSON.parse(solc.compile(JSON.stringify(input)));
	contracts = compiledCode.contracts;
	rContract = contracts.rootSol.RootSC.abi; //it depends of the Contract name
	byteCodeVeh = contracts.rootSol.RootSC.evm.bytecode.object; //it depends of the Contract name

	addressA = req.body.addressU; //obtain Administrator address
	addressR = req.body.addressR; //obtain root address
	addressContract = req.body.addressContract; //obtain Contract Address of the root

	var resultado = 0;
	try{
		var Web3 = require('web3');
		var web3 = new Web3(Web3.givenProvider || blockchainAddress);

		//Adding Administrator in the blockchain*******************************
		//Object rootContract is created from abi template and the contract address
		var rootContract = new web3.eth.Contract(rContract, addressContract);
		rootContract.methods.addAdmor(addressA).send({from: addressR,gas: 4700000},
			function(err, transactionHash){
	    		if(err){
        			res.send(error.jsonResp(60));
        			return 60;
	    		}
	    	})
	    	.on('receipt', function(receipt){
	     		receiptG = receipt;//Getting the receipt of the transaction
	     		User_.save(req,"No contract address in this transaction",receiptG.transactionHash,statusV.admorCreation,res,4); //add user to the database
	     		candado=true;
	     	}).on('error', console.error);
	     //*********************************************************************
	}catch(err){
		resultado = 60;
	}

    return resultado;
}


function getRegister(regS,tok,fn){
		Token.whoP(tok,function(answer){
			if(answer.email==""){
				fn("");
			}else{
				regS.email = answer.email;
				User.find(regS).exec(function(err, users){
					if(err){
						fn("");
					}
			        if(users.length>0 && users.length<2){
			        	if(answer.email==users[0].email){ //we check that the token user match with the search
			        		res = users[0].addressContract;
	        				var answerR = {	email:users[0].email,
			                    				addressU:users[0].addressU,
			                    				addressContract:users[0].addressContract,
							                    addressTransaction:users[0].addressTransaction,
			                    				status:users[0].status,
			                    				token:users[0].token};
		                    fn(answerR);
	        			}else{
	        					fn("");
        				}
			        }else{
						fn("");
			        }
			    });
			}
		});
}

//Create an administrator
initializer.AddAdmor=function(req,res){
	//We evaluate if some of the parameters are empty
	//In case, return an error
	var r=result.someFieldIsEmpty(req);
	if (r==0){
		//First, we must verify that token is linked with the root
		//To do tat, we are going to form an objet with the search
		var search = {email:"",
					  type:statusV.rootCreation};
		getRegister(search,req.body.token,function(resultado){
			if(resultado==""){
				res.send(error.jsonRespError(4)); //error code is sent as an answer
			}else{
				//Avoid that an existence administrator can be duplicated in offchain
				var searchEmail = {email:req.body.email};
				User.find(searchEmail).exec(function(err, users){
					if(err || users.length>0){
						res.send(error.jsonRespError(20)); //error code is sent as an answer
					}else{
						var searchA = {addressU:req.body.addressU};
						User.find(searchA).exec(function(err, users){
							if(err || users.length>0){
								res.send(error.jsonRespError(21)); //error code is sent as an answer
							}else{
								//then we must obtain the root address
								req.body.addressR = resultado.addressU;
								//and the smart contract address
								req.body.addressContract = resultado.addressContract;
								//With all ingredients, we can create the AdmorSC
								var answer = createAdmorSC(req,res);
							}
						});
					}
				});
			}
		});
	}else{
		res.send(error.jsonRespError(r)); //error code is sent as an answer
	}
}

//--------------------------------------------New--------------------------------------------
function createUserSCC(req, next) {
	var key = req.body.key;
	var hashX = req.body.hashX;
	var typeOfUser = req.body.typeOfUser;
	var Token = req.body.Token;
	var typeOfOperation = req.body.typeOfOperation;
	/*
	//HTTPS
	var options = 'https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY';
	var options = {
        host: 'api.nasa.gov',
        port: '443',
        path: '/planetary/apod?api_key=DEMO_KEY',
        method: 'GET',
    };
    */
    var option = 'http://172.20.0.3:3000/exec/createUser?key=0xA1a66A73294C539344e9e2Dc8881471cC3b2f496&hashX=sldajfkldsjlfa&typeOfUser=Administrator&Token=2421412421&typeOfOperation=create1';
    var options = {
        host: '172.20.0.2',
        port: '3000',
        //path: '/exec/createUser?key=0xA1a66A73294C539344e9e2Dc8881471cC3b2f496&hash=sldajfkldsjlfa&typeOfUser=1',
        path: '/exec/createUser'+'?'+'key='+key+'&hashX='+hashX+'&typeOfUser='+typeOfUser+'&Token='+Token+'&typeOfOperation='+typeOfOperation,
        method: 'POST',
    };
    //var path = '/exec/createUser'+'?'+'key='+key+'&hashX='+hashX+'&typeOfUser='+typeOfUser+'&Token='+Token+'&typeOfOperation='+typeOfOperation;
    //console.log(path);


    // Se invoca el servicio RESTful con las opciones configuradas previamente y sin objeto JSON
    serviceInit(options, function (data, err) {
        if (err) {
            //console.log('Error: ', err);
            next(null, err);
        } else {
            //console.log('Data: ', data);
            next(data, null);
        }
    });
};

/**
 * Función encargada de invocar los servicios RESTful y devolver
 * el objeto JSON correspondiente.
 */
function serviceInit(options, next) {
	var req = http.request(options, (res) => {
    	var contentType = res.headers['content-type'];
        //Variable para guardar los datos del servicio RESTfull
        var data = '';
        res.on('data', function (chunk) {
            // Cada vez que se recojan datos se agregan a la variable
            data += chunk;
        }).on('end', function () {
            // Al terminar de recibir datos los procesamos
            var response = null;
            // Nos aseguramos de que sea tipo JSON antes de convertirlo
            if (contentType.indexOf('application/json') != -1) {
                response = JSON.parse(data);
            }
            // Invocamos el next con los datos de respuesta e imprimos en cosola
            console.log('Respuesta: ', response);
            next(response, null);
        })
        .on('error', function(err) {
            // Si hay errores los sacamos por consola
            console.error('Error al procesar el mensaje: ' + err)
        })
        .on('uncaughtException', function (err) {
            // Si hay alguna excepción no capturada la sacamos por consola
            console.error(err);
        });
    }).on('error', function (err) {
        // Si hay errores los sacamos por consola y le pasamos los errores a next.
        console.error('Error en la petición HTTP: ' + err);
        next(null, err);
    });
    //var jsonObject;
    //req.write(jsonObject);
    //console.log(req);
    req.end();
};

function userCreation(req, res) {
    createUserSCC(req, function(data, err) {
        if (err) {
            res.status(500).send({message: 'Error en la petición'});
        } else {
        	var token = new Tokenn();
        	iat = moment().unix(); //Momento de creación del token (fecha y hora exacta)
			exp = moment().add(1, 'm').unix(); //Agrega 1 minutos en tiempo UNIX
			token.email = req.body.email; //Prueba
			token.token = req.body.Token;
			token.creation = iat;
			token.life = exp;
			//console.log(token);
			token.save();



    		//console.log('Datos: ', data);
			//res.status(200).send({message: "Probando métodos"});
            //res.status(200).send({data: data});
            var user = new User();

			user.email = req.body.email; //Prueba
			user.addressU = req.body.addressU; //Prueba

            user.addressContract =  data.y.addCont;
            user.addressTransaction = data.y.addTran;
            //var key = req.body.key;
			//var hashX = req.body.hashX;
			user.type = req.body.typeOfUser;
			user.token = req.body.Token;
			var typeOfOperation = req.body.typeOfOperation;

			if(req.body.password){
				//Encriptar contraseñas
				bcrypt.hash(req.body.password, null, null, function(err, hash){
					user.password = hash;

					if(user.email != null && user.password != null && user.addressU != null && user.addressContract != null && user.addressTransaction != null && user.type != null && user.token != null){
						//Guardar usuario
						user.save((err, userStored) => {
							if(err) {
								res.status(500).send({message: 'Error al guardar los datos'});
							}else {
								if(!userStored) {
									res.status(404).send({message: 'El dato no ha sido guardado'});
								}else if(req.body.Token == data.Token) {
									Dictionary.findOne({typeOfOperation: typeOfOperation}, (err, type) => {
										if(err){
											res.status(500).send({message: 'Error en la petición'});
										}else{
											if(!type){
												res.status(404).send({message: 'La operación '+typeOfOperation+' no existe'});
											}else{
												var description = type.description;
												res.status(200).send({
													token: service_jwt.createToken(req, user, description)
												});
												//res.status(200).send({typeOfOperation: type});
											}
										}
									});
								}
							}
						});
					}else{
						res.status(200).send({message: "Rellena todos los campos"});
					}
				});
			}else{
				res.status(200).send({message: "Introduce la contraseña"});
			}
        }
    });
};

function userUpdate(req, res){
	if(!req.headers.token || !req.headers.typeofoperation){
		return res.status(403).send({message: 'La petición no tiene la cabecera'});
	}
	var token = req.headers.token.replace(/['"]+/g, '');
	try{
		var payload = jwt.decode(token, secret);
		if(payload.exp <= moment().unix()){
			return res.status(401).send({message: 'El token ha expirado'});
		}
	}catch(ex){
		//console.log(ex);
		return res.status(403).send({message: 'Token no válido'});
	}
	var userId = payload.id;
	var update = req.body;
	var typeOfOperation = req.headers.typeofoperation; //Hay que checar
	var bol = false;
	User.findByIdAndUpdate(userId, update, (err, userUpdate) => {
		if(err){
			res.status(500).send({message: 'Error al guardar los datos'})
		}else{
			if(!userUpdate){
				res.status(404).send({message: 'El dato no ha sido actualizado'});
			}else{
				bol = true;
				Dictionary.findOne({typeOfOperation: typeOfOperation}, (err, type) => {
					if(err){
						res.status(500).send({message: 'Error en la petición'});
					}else{
						if(!type){
							res.status(404).send({message: 'La operación '+typeOfOperation+' no existe'});
						}else{
							var Token = userUpdate.token;
							var email = userUpdate.email;
							var query = { token: Token, email: email };
							Tokenn.findOneAndUpdate(query, {email: update.email}, (err, data) => {
								if(err){
									res.status(500).send({message: 'Error en la petición'});
								}else{
									if(!data){
										console.log(userUpdate, Token, email);
										res.status(404).send({message: 'El token o email no existe'});
									}else{
										var description = type.description;
										console.log(description);
										res.status(200).send({response: bol});
									}
								}
							});
							//res.status(200).send({typeOfOperation: type});
						}
					}
				});
				//res.status(200).send({user: userUpdate});
			}
		}
	});
}

function userDelete(req, res){
	if(!req.headers.token || !req.headers.typeofoperation){
		return res.status(403).send({message: 'La petición no tiene la cabecera'});
	}
	var token = req.headers.token.replace(/['"]+/g, '');
	try{
		var payload = jwt.decode(token, secret);
		if(payload.exp <= moment().unix()){
			return res.status(401).send({message: 'El token ha expirado'});
		}
	}catch(ex){
		//console.log(ex);
		return res.status(403).send({message: 'Token no válido'});
	}
	var userId = payload.id;
	var typeOfOperation = req.headers.typeofoperation; //Hay que checar
	var bol = false;
	User.findByIdAndRemove(userId, (err, userDelete) => {
		if(err){
			res.status(500).send({message: 'Error al eliminar el usuario'})
		}else{
			if(!userDelete){
				res.status(404).send({message: 'El usuario no ha sido eliminado'});
			}else{
				bol = true;
				Dictionary.findOne({typeOfOperation: typeOfOperation}, (err, type) => {
					if(err){
						res.status(500).send({message: 'Error en la petición'});
					}else{
						if(!type){
							res.status(404).send({message: 'La operación '+typeOfOperation+' no existe'});
						}else{
							var Token = userDelete.token;
							var email = userDelete.email;
							var query = { token: Token, email: email };
							Tokenn.findOneAndRemove(query, (err, data) => {
								if(err){
									res.status(500).send({message: 'Error en la petición'});
								}else{
									if(!data){
										res.status(404).send({message: 'El token o email no existe'});
									}else{
										var description = type.description;
										console.log(description);
										res.status(200).send({response: bol});
									}
								}
							});
							//res.status(200).send({typeOfOperation: type});
						}
					}
				});
				//res.status(200).send({user: userUpdate});
			}
		}
	});
}

function loginUser(req, res){
	var email = req.body.email;
	var password = req.body.password;
	var typeOfUser = req.body.typeOfUser; //FALTA CHECAR ESTO
	var R = 'USADO PARA SABER SI TIENE ACCESO AL RECURSO';

	User.findOne({email: email.toLowerCase()}, (err, user) => {
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
							if(user.type.toLowerCase() == typeOfUser.toLowerCase()){ //CHECAR
								res.status(200).send({
									token: jwtt.generateToken(user, R)
								});
							}else{
								res.status(404).send({message: 'El tipo de usuario no existe'});
							}
						}
					}else{
						res.status(404).send({message: 'El usuario no se ha podido indentificar'});
					}
				})
			}
		}
	});
}

function tokenRenovation(req, res){
	var Token = req.body.Token;
	var email = req.body.email;
	var query = { token: Token, email: email };
	var update = moment().add(7, 'd').unix();

	Tokenn.findOneAndUpdate(query, {life: update}, (err, data) => {
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

function tokeIsValid(req, res){
	var Token = req.body.Token;
	var valid = moment().unix();
	var bol = false;

	Tokenn.findOne({ token: Token }, (err, data) => {
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

function hasAcces(req, res){
	var typeOfOperation = req.body.typeOfOperation;
	var typeOfUser = req.body.typeOfUser;
	var query = {typeOfOperation: typeOfOperation, typeOfUser: typeOfUser};

	Dictionary.findOne(query, (err, data) =>{
		if(err){
			res.status(500).send({message: 'Error en la petición'});
		}else{
			if(!data){
				console.log(data);
				res.status(404).send({message: 'El dato no existe'});
			}else{
				console.log(data);
				var n =  data.description;
				res.status(200).send({response: n});
			}
		}
	});
}
//--------------------------------------------New--------------------------------------------

module.exports = {
	initializer,
	createUserSCC,
	serviceInit,
	userCreation,
	userUpdate,
	userDelete,
	loginUser,
	tokenRenovation,
	tokeIsValid,
	hasAcces
};