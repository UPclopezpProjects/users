//
var User = require("../models/Users");
var Dictionary = require("../models/Transactions");
var Token = require("../models/Tokens");

var http = require('http');
var https = require('https');
var bcrypt = require('bcrypt-nodejs');
var jwt = require('jwt-simple');
var moment = require('moment');

var service_jwt = require('../services/jwt');
var finalToken = require("../controller/token");
var secret = 'secret_key';
//



/*var errResulUtils = require("../controller/errResulUtils");

var initializer = {};
//Save root in database


initializer.save = function (req,addrC,addrT, statusp,resp,who) {
    var param = {   email:req.body.email,
                    password:req.body.password,
                    addressU:req.body.addressU,
                    addressContract:addrC,
                    addressTransaction:addrT,
                    status:statusp,
                    token:String(req.body.token)};
    console.log(String(req.body.token));
    var user = new User(param);

    user.save(function(err){
        if( err ){
            resp.send(errResulUtils.jsonRespError(50));
        }else{
            resp.send(errResulUtils.jsonRespOK(who,user._id));;
        }
    });
}*/

//--------------------------------------------New--------------------------------------------
/*
Funciones encargada de invocar los servicios RESTful y devolver el objeto JSON correspondiente.
*/
function createUserSCC(req, next) {
    var key = req.body.key;
    var hashX = req.body.hashX;
    var typeOfUser = req.body.typeOfUser;
    var initialToken = req.body.initialToken;
    var typeOfOperation = req.body.typeOfOperation;

    //var option = 'http://172.20.0.3:3000/exec/createUser?key=0xA1a66A73294C539344e9e2Dc8881471cC3b2f496&hashX=sldajfkldsjlfa&typeOfUser=Administrator&Token=2421412421&typeOfOperation=create1';

    var options = {
        host: host,
        port: port,
        path: '/exec/createUser'+'?'+'key='+key+'&hashX='+hashX+'&typeOfUser='+typeOfUser+'&Token='+initialToken+'&typeOfOperation='+typeOfOperation, //ESTO TENDRÁ QUE CAMBIARSE
        method: method.POST,
    };


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
            //console.log('Respuesta: ', response);
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
/*
Funciones encargada de invocar los servicios RESTful y devolver el objeto JSON correspondiente.
*/

function userCreation(req, res) {
    createUserSCC(req, function(data, err) {
        if (err) {
            res.status(500).send({message: 'Error en la petición'});
        } else {
            //console.log('Datos: ', data);
            //res.status(200).send({message: "Probando métodos"});
            //res.status(200).send({data: data});
            var user = new User();
            user.email = req.body.email; //Prueba
            user.addressU = req.body.addressU; //Prueba
            user.addressContract =  data.y.addCont;
            user.addressTransaction = data.y.addTran;
            user.typeOfUser = req.body.typeOfUser;
            user.initialToken = req.body.initialToken;
            //var key = req.body.key; //REVISAR
            //var hashX = req.body.hashX; //REVISAR
            var dp = req.body.dp; //DP ahora es un dato estático, pero debería cambiarse cuando esté lista la vista
            var typeOfOperation = req.body.typeOfOperation;
            if(req.body.password){
                //Encriptar contraseñas
                bcrypt.hash(req.body.password, null, null, function(err, hash){
                    user.password = hash;
                    if(user.email != null && user.password != null && user.addressU != null && user.addressContract != null && user.addressTransaction != null && user.typeOfUser != null && user.initialToken != null){
                        //Guardar usuario
                        user.save((err, userStored) => {
                            if(err) {
                                res.status(500).send({message: 'Error al guardar los datos'});
                            }else {
                                if(!userStored) {
                                    res.status(404).send({message: 'El dato no ha sido guardado'});
                                }else if(user.initialToken == data.Token) { //data.Token es lo que manda audit
                                    Dictionary.findOne({typeOfOperation: typeOfOperation}, (err, type) => {
                                        if(err){
                                            res.status(500).send({message: 'Error en la petición'});
                                        }else{
                                            if(!type){
                                                res.status(404).send({message: 'La operación '+typeOfOperation+' no existe'});
                                            }else{
                                                //var description = type.description;
                                                var initialToken = user.initialToken; //Esto en realidad tendría que ser una función que genere un token verdadero, no uno puesto manualmente (como está abajo)
                                                var generatedToken = service_jwt.createToken(req, user, type);
                                                var authToken = service_jwt.generateToken(user, dp);

                                                finalToken.tokenCreation(user, initialToken, generatedToken, authToken, dp);
                                                res.status(200).send({
                                                    token: generatedToken
                                                });
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
    //CORREGIR AQUÍ PORQUE UTILIZO UN TOKEN PARA ACTUALIZAR PERO DEBEN SER VARIOS Y DEPENDIENDO SI TIENE PERMISOS
    /*Esto debería funcionar como un middleware y con el authToken*/
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
    /*Esto debería funcionar como un middleware y con el authToken*/

    var userId = payload.userId;
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
                            var Token = userUpdate.initialToken; //Consulta a la base de datos para comparar el token inicial
                            var email = userUpdate.email; //Consulta a la base de datos para comparar el email
                            var query = { initialToken: Token, email: email }; //Consulta a la base de datos para comparar el token inicial y el email

                            /*Token.findOneAndUpdate(query, {email: update.email}, (err, data) => {
                                if(err){
                                    res.status(500).send({message: 'Error en la petición'});
                                }else{
                                    if(!data){
                                        console.log(userUpdate, Token, email);
                                        res.status(404).send({message: 'El token o email no existe'});
                                    }else{
                                        //var description = type.description;
                                        //console.log(description);

                                        //var updateToken = service_jwt.renovationToken(data);
                                        //finalToken.tokenRenovation();

                                        res.status(200).send({response: bol});
                                    }
                                }
                            });*/
                            res.status(200).send({response: bol});

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
    var userId = payload.userId;
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
                            var Token = userDelete.initialToken;
                            var email = userDelete.email;
                            var query = { initialToken: Token, email: email };
                            /*Token.findOneAndRemove(query, (err, data) => {
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
                            });*/
                            res.status(200).send({response: bol});

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
                            if(user.typeOfUser.toLowerCase() == typeOfUser.toLowerCase()){ //PREGUNTA
                                res.status(200).send({
                                    token: service_jwt.generateToken(user, R)
                                });
                                //FALTA GUARDARLO Y HACER QUE ESTE TOKEN REEMPLACE EL TOKEN GENERADO ANTERIORMENTE POR HABER INICIADO SESIÓN
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
//--------------------------------------------New--------------------------------------------

module.exports = {
    createUserSCC,
    serviceInit,
    userCreation,
    userUpdate,
    userDelete,
    loginUser
};
