//
var User = require('../models/Users');
var Token = require('../models/Tokens');
var Consumer = require('../models/Consumers');

var axios = require('axios');
var bcrypt = require('bcrypt-nodejs');
var jwt = require('jwt-simple');
var md5 = require('md5');
var mongoosePaginate = require('mongoose-pagination');
var moment = require('moment');
//var mongoosePaginatee = require('mongoose-paginate-v2');

var service_jwt = require('../services/jwt');
var confirmation = require('../services/email');
var token = require('./token');
var permit = require('./permit');

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
function userCreate(req, res) {
    var typeOfUser = req.body.typeOfUser;
    switch(typeOfUser.toLowerCase()){
        case "root":
            checkRoot(req, res);
            break;
        case "administrator":
        case "tuser":
        case "merchant":
        case "carrier":
        case "acopio":
        case "productor":
        case "consumer":
            checkEmail(req, res, typeOfUser);
            break;
        default:
            res.status(404).send({message: 'El tipo de usuario "'+typeOfUser+'"" no existe'});
            break;
    }
}

function checkRoot(req, res) {
    User.findOne({ typeOfUser: 'Root' }, (err, userStored) => {
        if(err) {
            res.status(500).send({ message: 'Error en la petición' });
        }else {
            if(!userStored) {
                createRoot(req, res);
            }else {
                res.status(404).send({ message: "Ya existe un usario Root, no puedes crear más" });
            }
        }
    });
}

function checkEmail(req, res, typeOfUser){
    var email = req.body.email;
    User.findOne({email: email.toLowerCase()}, (err, emailStored) => {
        if(err){
            res.status(500).send({ message: 'Error en la petición' });
        }else{
            if(!emailStored){
                switch(typeOfUser.toLowerCase()){
                    case "administrator":
                        createAdministrator(req, res);
                        break;
                    case "tuser":
                    case "merchant":
                    case "carrier":
                    case "acopio":
                    case "productor":
                        createTUser(req, res);
                        break;
                    case "consumer":
                        createConsumer(req, res);
                        break;
                    default:
                        res.status(404).send({ message: 'Default case (checkEmail) if exists a emergency' });
                        break;
                }
            }else{
                console.log("Entré aquí - "+emailStored);
                res.status(404).send({ message: 'Ya existe un usuario con el email: '+email });
            }
        }
    });
}

function createRoot(req, res){
  var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
  if (req.headers.authorization) {
    var initialToken = req.headers.authorization;
    var payload = service_jwt.decodeToken(initialToken);
    var valid = moment().unix();
    var t;
    serviceInit(req, initialToken, function(data, err) {
      if (err) {
        res.status(500).send({ message: 'Error en la petición' });
      }else {
              var user = new User();
              var auditData = data;
              if(payload.life <= valid){
      					t = false;
      					console.log("Token caducado");
      				}else{
      					t = true;
      					console.log("Token vigente");
      				}
              user.email = req.body.email.toLowerCase();
              user.surnameA = req.body.surnameA;
              user.surnameB = req.body.surnameB;
              user.nameOfUser = req.body.nameOfUser;
              user.typeOfUser = req.body.typeOfUser;
              user.ip = ip;
              user.status = req.body.status;
              user.creationDate = req.body.creationDate;
              user.initialToken = initialToken;
              user.dp = req.body.dp; //DP ahora es un dato estático, pero debería cambiarse cuando esté lista la vista
              user.addressU = req.body.addressU;
              user.addressContract =  auditData.addCont;
              user.addressTransaction = auditData.addTran;


              //Pruebas con MD5
              var jsonData = {
                  email: req.body.email.toLowerCase(),
                  password: req.body.password,
                  surnameA: req.body.surnameA,
                  surnameB: req.body.surnameB,
                  nameOfUser: req.body.nameOfUser,
                  typeOfUser: req.body.typeOfUser,
                  status: req.body.status,
                  creationDate: req.body.creationDate,
                  initialToken: req.body.initialToken,
                  dp: req.body.dp,
                  addressU: req.body.addressU,
                  typeOfOperation: req.body.typeOfOperation,
                  nameOfOperation: req.body.nameOfOperation,
              };
              var hashX = md5(JSON.stringify(jsonData));
              /*
              if(req.body.hashX == hashX){
                  console.log("MD5 correcto");
              }else{
                  console.log("MD5 incorrecto");
              }*/

              if(user.initialToken == auditData.Token && req.body.hashX == hashX){
              //REVISAR SI EXISTE EL TIPO DE OPERACIÓN QUE SE ESTÁ EJECUTANDO
                  if(req.body.password){
                      //Encriptar contraseñas
                      bcrypt.hash(req.body.password, null, null, function(err, hash){
                          user.password = hash;
                          if(user.email != null && user.password != null && user.addressContract != null && user.addressTransaction != null && user.typeOfUser != null && user.initialToken != null && t == true){
                              //Guardar usuario
                              user.save((err, userStored) => {
                                  if(err) {
                                      res.status(500).send({ message: 'Error al guardar los datos' });
                                  }else{
                                      if(!userStored) {
                                          res.status(404).send({ message: 'El dato no ha sido guardado' });
                                      }else{
                                          Token.deleteMany({ email: 'email for initialToken' })
                                          .then(function(){
                                              console.log("Data deleted"); // Success
                                          })
                                          .catch(function(error){
                                              console.log(error); // Failure
                                          });
                                          //var generatedToken = service_jwt.createToken(user); //Guardar token en la base de datos
                                          token.tokenCreation(user.initialToken, user.email); //Guarda token en la base de datos
                                          /*res.status(200).send({
                                              message: userStored
                                          });*/
                                          req.body.typeOfOperation = 'authentication';
                                          req.body.nameOfOperation = 'loginUser';
                                          token.authenticate(req, res);
                                          /*res.status(200).send({
                                              user: userStored,
                                              token: initialToken
                                          });*/
                                      }
                                  }
                              });
                          }else if (t == false) {
                            res.status(200).send({ message: 'El token ha caducado' });
                          }else {
                            res.status(200).send({ message: 'Rellena todos los campos' });
                          }
                      });
                  }else {
                      res.status(200).send({ message: 'Introduce la contraseña' });
                  }
              }else if(user.initialToken != auditData.Token){
                  res.status(404).send({ message: 'Errores en los datos initialToken (users): '+user.initialToken+' - Token (audit): '+auditData.Token });
                  //res.status(404).send({ message: 'No tienes permisos para crear usuarios de tipo administrador' });
              }else if(req.body.hashX != hashX){
                  res.status(404).json({ message: 'Errores en los datos hashX (client): '+req.body.hashX+' - hashX(api): '+hashX });
              }
          }
      });
  }else {
    res.status(200).send({ message: 'No hay un token inicial' });
  }
}

function createAdministrator(req, res){
    var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
    serviceInit(req, req.headers.authorization, function(data, err) {
        if (err) {
            res.status(500).send({ message: 'Error en la petición' });
        }else {
            var user = new User();
            var auditData = data;

            user.email = req.body.email.toLowerCase();
            user.surnameA = req.body.surnameA;
            user.surnameB = req.body.surnameB;
            user.nameOfUser = req.body.nameOfUser;
            user.typeOfUser = req.body.typeOfUser;
            user.ip = ip;
            user.status = req.body.status;
            user.creationDate = req.body.creationDate;
            user.initialToken = req.headers.authorization;
            user.dp = req.body.dp; //DP ahora es un dato estático, pero debería cambiarse cuando esté lista la vista
            user.addressU = req.body.addressU;
            user.addressContract =  auditData.y.addCont;
            user.addressTransaction = auditData.y.addTran;
            //var key = req.body.key; //REVISAR
            //var hashX = req.body.hashX; //REVISAR

            var tokeninitial = req.headers.authorization;
            var typeOfOperation = req.body.typeOfOperation;
            var nameOfOperation = req.body.nameOfOperation;
            permit.hasAccess(tokeninitial, typeOfOperation, nameOfOperation)
                .then(typeOfOperationOK => {
                    //Pruebas con MD5
                    var jsonData = {
                        email: req.body.email.toLowerCase(),
                        password: req.body.password,
                        surnameA: req.body.surnameA,
                        surnameB: req.body.surnameB,
                        nameOfUser: req.body.nameOfUser,
                        typeOfUser: req.body.typeOfUser,
                        status: req.body.status,
                        creationDate: req.body.creationDate,
                        initialToken: req.body.initialToken,
                        dp: req.body.dp,
                        addressU: req.body.addressU,
                        typeOfOperation: req.body.typeOfOperation,
                        nameOfOperation: req.body.nameOfOperation,
                    };
                    var hashX = md5(JSON.stringify(jsonData));
                    /*
                    if(req.body.hashX == hashX){
                        console.log("MD5 correcto");
                    }else{
                        console.log("MD5 incorrecto");
                    }*/
                    if(typeOfOperationOK == true && user.initialToken == auditData.Token && req.body.hashX == hashX){
                        if(req.body.password){
                            //Encriptar contraseñas
                            bcrypt.hash(req.body.password, null, null, function(err, hash){
                                user.password = hash;
                                if(user.email != null && user.password != null && user.addressContract != null && user.addressTransaction != null && user.typeOfUser != null && user.initialToken != null){
                                    //Guardar usuario
                                    user.save((err, userStored) => {
                                        if(err) {
                                            return res.status(500).json({ message: 'Error al guardar los datos' });
                                        }else {
                                            if(!userStored) {
                                                return res.status(404).json({ message: 'El dato no ha sido guardado' });
                                            }else {
                                              count = false;
                                              req.session.flag = 0;
                                              var generatedToken = service_jwt.createToken(user); //Guardar token en la base de datos
                                                token.tokenCreation(generatedToken, user.email);
                                                return res.status(200).json({
                                                    message: generatedToken //Guardar el token
                                                });
                                            }
                                        }
                                    });
                                }else {
                                    return res.status(200).json({ message: 'Rellena todos los campos' });
                                }
                            });
                        }else {
                            return res.status(200).json({ message: 'Introduce la contraseña' });
                        }
                    }else if(user.initialToken != auditData.Token){
                        return res.status(404).json({ message: 'Errores en los datos initialToken (users) : '+user.initialToken+' - Token (audit): '+auditData.Token });
                    }else if(typeOfOperationOK != true){
                        return res.status(404).json({ message: 'No tienes permisos para crear administradores' });
                    }else if(req.body.hashX != hashX){
                        return res.status(404).json({ message: 'HashX no coincide: '+hashX });
                    }else{
                        return res.status(404).json({ message: 'Errores en los datos typeOfOperationOK: '+typeOfOperationOK+' - initialToken (users): '+user.initialToken+' - Token (audit): '+auditData.Token+' - hashX (client): '+req.body.hashX+' - hashX(api): '+hashX });
                    }
                })
                .catch(err => {
                     // never goes here
                     console.log(err);
                     return res.status(550).json(err);
                 });
        }
    });
}

function createTUser(req, res){
    var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
    serviceInit(req, req.headers.authorization, function(data, err) {
        if (err) {
            res.status(500).send({ message: 'Error en la petición' });
        }else {
            var user = new User();
            var auditData = data;

            user.email = req.body.email.toLowerCase();
            user.surnameA = req.body.surnameA;
            user.surnameB = req.body.surnameB;
            user.nameOfUser = req.body.nameOfUser;
            user.typeOfUser = req.body.typeOfUser;
            user.ip = ip;
            user.status = req.body.status;
            user.creationDate = req.body.creationDate;
            user.initialToken = req.headers.authorization;
            user.dp = req.body.dp; //DP ahora es un dato estático, pero debería cambiarse cuando esté lista la vista
            user.addressU = req.body.addressU;
            user.addressContract =  auditData.y.addCont;
            user.addressTransaction = auditData.y.addTran;
            //var key = req.body.key; //REVISAR
            //var hashX = req.body.hashX; //REVISAR

            var tokeninitial = req.headers.authorization;
            var typeOfOperation = req.body.typeOfOperation;
            var nameOfOperation = req.body.nameOfOperation;
            permit.hasAccess(tokeninitial, typeOfOperation, nameOfOperation)
                .then(typeOfOperationOK => {
                    //Pruebas con MD5
                    var jsonData = {
                        email: req.body.email.toLowerCase(),
                        password: req.body.password,
                        surnameA: req.body.surnameA,
                        surnameB: req.body.surnameB,
                        nameOfUser: req.body.nameOfUser,
                        typeOfUser: req.body.typeOfUser,
                        status: req.body.status,
                        creationDate: req.body.creationDate,
                        initialToken: req.body.initialToken,
                        dp: req.body.dp,
                        addressU: req.body.addressU,
                        typeOfOperation: req.body.typeOfOperation,
                        nameOfOperation: req.body.nameOfOperation,
                    };
                    var hashX = md5(JSON.stringify(jsonData));
                    /*
                    if(req.body.hashX == hashX){
                        console.log("MD5 correcto");
                    }else{
                        console.log("MD5 incorrecto");
                    }¨*/
                    //console.log(req.body);
                    if(typeOfOperationOK == true && user.initialToken == auditData.Token && req.body.hashX == hashX){
                        if(req.body.password){
                            //Encriptar contraseñas
                            bcrypt.hash(req.body.password, null, null, function(err, hash){
                                user.password = hash;
                                if(user.email != null && user.password != null && user.addressContract != null && user.addressTransaction != null && user.typeOfUser != null && user.initialToken != null){
                                    //Guardar usuario
                                    user.save((err, userStored) => {
                                        if(err) {
                                            return res.status(500).json({ message: 'Error al guardar los datos'+err });
                                        }else {
                                            if(!userStored) {
                                                return res.status(404).json({ message: 'El dato no ha sido guardado' });
                                            }else {
                                                var generatedToken = service_jwt.createToken(user); //Guardar token en la base de datos
                                                token.tokenCreation(generatedToken, user.email);
                                                return res.status(200).json({
                                                    message: generatedToken //Guardar el token
                                                });
                                            }
                                        }
                                    });
                                }else {
                                    return res.status(200).json({ message: 'Rellena todos los campos' });
                                }
                            });
                        }else {
                            return res.status(200).json({ message: 'Introduce la contraseña' });
                        }
                    }else if(user.initialToken != auditData.Token){
                        return res.status(404).json({ message: 'Errores en los datos initialToken (users): '+user.initialToken+' - Token (audit): '+auditData.Token });
                    }else if(typeOfOperationOK != true){
                        return res.status(404).json({ message: 'No tienes permisos para crear usuarios normales' });
                    }else if(req.body.hashX != hashX){
                        return res.status(404).json({ message: 'HashX no coincide: '+hashX });
                    }else{
                        return res.status(404).json({ message: 'Errores en los datos typeOfOperationOK: '+typeOfOperationOK+' - initialToken (users): '+user.initialToken+' - Token (audit): '+auditData.Token+' - hashX (client): '+req.body.hashX+' - hashX(api): '+hashX });
                    }
                })
                .catch(err => {
                    // never goes here
                    console.log(err);
                    return res.status(550).json(err);
                });
        }
    });
}

function createConsumer(req, res){
    var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
    var initialToken = service_jwt.initialToken(10);
    serviceInit(req, initialToken, function(data, err) {
        if (err) {
            res.status(500).send({ message: 'Error en la petición' });
        }else {
            var user = new User();
            var auditData = data;

            user.email = req.body.email.toLowerCase();
            user.surnameA = req.body.surnameA;
            user.surnameB = req.body.surnameB;
            user.nameOfUser = req.body.nameOfUser;
            user.typeOfUser = req.body.typeOfUser;
            user.ip = ip;
            user.status = req.body.status; //El cliente por defecto debería asignar este valor a falso y verdaero para los demás
            user.creationDate = req.body.creationDate;
            user.initialToken = initialToken;
            user.dp = req.body.dp; //DP ahora es un dato estático, pero debería cambiarse cuando esté lista la vista
            user.addressU = req.body.addressU;
            user.addressContract =  auditData.y.addCont;
            user.addressTransaction = auditData.y.addTran;

            //Pruebas con MD5
            var jsonData = {
                email: req.body.email.toLowerCase(),
                password: req.body.password,
                surnameA: req.body.surnameA,
                surnameB: req.body.surnameB,
                nameOfUser: req.body.nameOfUser,
                typeOfUser: req.body.typeOfUser,
                status: req.body.status,
                creationDate: req.body.creationDate,
                initialToken: req.body.initialToken,
                dp: req.body.dp,
                addressU: req.body.addressU,
                typeOfOperation: req.body.typeOfOperation,
                nameOfOperation: req.body.nameOfOperation,
            };
            var hashX = md5(JSON.stringify(jsonData));

            if(user.initialToken == auditData.Token && req.body.hashX == hashX){
            //REVISAR SI EXISTE EL TIPO DE OPERACIÓN QUE SE ESTÁ EJECUTANDO
                if(req.body.password){
                    //Encriptar contraseñas
                    bcrypt.hash(req.body.password, null, null, function(err, hash){
                        user.password = hash;
                        if(user.email != null && user.password != null && user.addressContract != null && user.addressTransaction != null && user.typeOfUser != null && user.initialToken != null){
                            //Guardar usuario
                            user.save((err, userStored) => {
                                if(err) {
                                    res.status(500).send({ message: 'Error al guardar los datos' });
                                }else{
                                    if(!userStored) {
                                        res.status(404).send({ message: 'El dato no ha sido guardado' });
                                    }else{
                                        token.tokenCreation(user.initialToken, user.email); //Guarda token en la base de datos
                                        /*res.status(200).send({
                                            message: userStored
                                        });*/
                                        req.body.typeOfOperation = 'authentication';
                                        req.body.nameOfOperation = 'loginUser';
                                        confirmation.sendEmail(user.email);
                                        token.authenticate(req, res);
                                    }
                                }
                            });
                        }else {
                            res.status(200).send({ message: 'Rellena todos los campos' });
                        }
                    });
                }else {
                    res.status(200).send({ message: 'Introduce la contraseña' });
                }
            }else if(user.initialToken != auditData.Token){
                res.status(404).send({ message: 'Errores en los datos initialToken (users): '+user.initialToken+' - Token (audit): '+auditData.Token });
                //res.status(404).send({ message: 'No tienes permisos para crear usuarios de tipo administrador' });
            }else if(req.body.hashX != hashX){
                res.status(404).json({ message: 'Errores en los datos hashX (client): '+req.body.hashX+' - hashX(api): '+hashX });
            }
        }
    });
}

/*
Funciones encargada de invocar los servicios RESTful y devolver el objeto JSON correspondiente.
*/
function serviceInit(req, initialToken, next) {
    //console.log("serviceInit");
    var key = req.body.addressU;
    var hashX = req.body.hashX;
    var typeOfUser = req.body.typeOfUser;
    var initialToken = initialToken;
    var typeOfOperation = req.body.typeOfOperation;
    var data;
    var url = 'http://'+host+':'+port.audit+''+path.audit+'';
    axios.post(url, {
        key: key,
        hashX: hashX,
        typeOfUser: typeOfUser,
        Token: initialToken,
        typeOfOperation: typeOfOperation
    })
    .then(response => {
        //console.log(response.data);
        data = response.data;
        next(data, null);
    })
    .catch(error => {
        console.log(error);
        next(null, error);
    });
}

function userUpdate(req, res) {
    var typeOfOperation = req.body.typeOfOperation;
    var nameOfOperation = req.body.nameOfOperation;
    var email = req.body.email;
    User.findOne({email: email}, (err, emailStored) => {
        if(err){
            res.status(500).send({ message: 'Error en la petición' });
        }else{
            if(!emailStored){
                switch(typeOfOperation) {
                    case 'update':
                        if(nameOfOperation == 'updateMe') {
                            var payload = service_jwt.decodeToken(req.headers.authorization);
                            console.log(payload);
                            if(payload.typeOfUser == 'Consumer'){
                                updateConsumer(req, res);
                            }else{
                                updateMe(req, res);
                            }
                        }else if(nameOfOperation == 'updateAdministrator') {
                            updateAdministrator(req, res);
                        }else if(nameOfOperation == 'updateTUser'){
                            updateTUser(req, res);
                        }
                        break;
                    default:
                        return res.status(404).send({ message: 'Default case (userUpdate) if exists a emergency' });
                        break;
                    }
            }else{
                res.status(404).send({ message: 'Ya existe un usuario con el email: '+email });
            }
        }
    });
}

function updateMe(req, res){
    var tokeninitial = req.headers.authorization;
    var typeOfOperation = req.body.typeOfOperation;
    var nameOfOperation = req.body.nameOfOperation;
    permit.hasAccess(tokeninitial, typeOfOperation, nameOfOperation)
    .then(typeOfOperationOK => {
        tokeninitial.replace(/['"]+/g, '');
        //var payload = decodeToken(tokeninitial);
        var payload = service_jwt.decodeToken(tokeninitial);
        var id = req.params.id.toLowerCase(); //CAMBIAR ESTE DATO POR LA VARIABLE QUE CONTENDRÁ LOS ID's DE LOS USUARIOS REGISTRADOS
        var jsonData = {
            email: req.body.email.toLowerCase(),
            password: req.body.password,
            surnameA: req.body.surnameA,
            surnameB: req.body.surnameB,
            nameOfUser: req.body.nameOfUser,
            typeOfUser: req.body.typeOfUser,
            status: req.body.status,
            creationDate: req.body.creationDate,
            initialToken: req.body.initialToken,
            dp: req.body.dp,
            addressU: req.body.addressU,
            typeOfOperation: req.body.typeOfOperation,
            nameOfOperation: req.body.nameOfOperation,
        };
        //console.log(jsonData);
        var hashX = md5(JSON.stringify(jsonData));
        //console.log(hashX);
        /*if(req.body.hashX == hashX){
            console.log("MD5 correcto");
        }else{
            console.log("MD5 incorrecto");
        }*/
        if(typeOfOperationOK == true && id == payload._id && !req.body.email && !req.body.dp && req.body.hashX == hashX){
            //Pedir contraseña para confimar cambio
            if(req.body.password){
                bcrypt.hash(req.body.password, null, null, function(err, hash){
                    req.body.password = hash;
                    User.findOneAndUpdate({ email: id }, {password: req.body.password, surnameA: req.body.surnameA, surnameB: req.body.surnameB, nameOfUser: req.body.nameOfUser, status: req.body.status}, (err, userUpdate) => {
                        if(err){
                            res.status(500).send({message: 'Error al actualizar los datos'});
                        }else{
                            if(!userUpdate){
                                res.status(404).send({message: 'El dato no existe y no ha sido actualizado'});
                            }else{
                                token.tokenRenovation(userUpdate, nameOfOperation, res); //Guardar token en la base de datos
                            }
                        }
                    });
                });
            }else{
                User.findOneAndUpdate({ email: id }, {surnameA: req.body.surnameA, surnameB: req.body.surnameB, nameOfUser: req.body.nameOfUser, status: req.body.status}, (err, userUpdate) => {
                    if(err){
                        res.status(500).send({message: 'Error al actualizar los datos'});
                    }else{
                        if(!userUpdate){
                            res.status(404).send({message: 'El dato no existe y no ha sido actualizado'});
                        }else{
                            token.tokenRenovation(userUpdate, nameOfOperation, res); //Guardar token en la base de datos
                        }
                    }
                });
            }
        }else if(typeOfOperationOK == false){
            res.status(404).send({message: 'No tienes permisos para actualizar tus datos'});
        }else if(id != payload._id) {
            res.status(404).send({message: 'Los ID´s no coinciden'});
        }else if(req.body.email){
            res.status(404).send({message: 'No puedes actualizar tu email - contacta con el desarrollador'});
        }else if(req.body.dp){
            res.status(404).send({message: 'No puedes actualizar tus permisos'});
        }else if(req.body.hashX != hashX){
            return res.status(404).json({ message: 'HashX no coincide: '+hashX });
        }else{
            return res.status(404).json({ message: 'Errores en los datos typeOfOperationOK: '+typeOfOperationOK+' - initialToken (users): '+user.initialToken+' - Token (audit): '+auditData.Token+' - hashX (client): '+req.body.hashX+' - hashX(api): '+hashX });
        }
    })
    .catch(err => {
        // never goes here
        console.log(err);
        return res.status(550).json(err);
    });
}

//Cambiar nombre de tokeninitial a token
function updateAdministrator(req, res){
    var tokeninitial = req.headers.authorization;
    var typeOfOperation = req.body.typeOfOperation;
    var nameOfOperation = req.body.nameOfOperation;
    permit.hasAccess(tokeninitial, typeOfOperation, nameOfOperation)
    .then(typeOfOperationOK => {
        var id = req.params.id.toLowerCase(); //CAMBIAR ESTE DATO POR LA VARIABLE QUE CONTENDRÁ LOS ID's DE LOS USUARIOS REGISTRADOS
        var bool = false;
        var query = { email: id, typeOfUser: 'Administrator' };
        User.findOne(query, (err, usersStored) => {
            if(err) {
                res.status(500).send({message: 'Error en la petición'});
            }else {
                if(!usersStored) {
                    res.status(404).send({message: 'No se ha encontrado el dato'});
                }else {
                    var jsonData = {
                        email: req.body.email.toLowerCase(),
                        password: req.body.password,
                        surnameA: req.body.surnameA,
                        surnameB: req.body.surnameB,
                        nameOfUser: req.body.nameOfUser,
                        typeOfUser: req.body.typeOfUser,
                        status: req.body.status,
                        creationDate: req.body.creationDate,
                        initialToken: req.body.initialToken,
                        dp: req.body.dp,
                        addressU: req.body.addressU,
                        typeOfOperation: req.body.typeOfOperation,
                        nameOfOperation: req.body.nameOfOperation,
                    };
                    var hashX = md5(JSON.stringify(jsonData));
                    /*console.log(hashX);
                    if(req.body.hashX == hashX){
                        console.log("MD5 correcto");
                    }else{
                        console.log("MD5 incorrecto");
                    }*/
                    if(typeOfOperationOK == true && !req.body.email && req.body.hashX == hashX){
                        //Pedir contraseña para confimar cambio
                        if(req.body.password){
                            bcrypt.hash(req.body.password, null, null, function(err, hash){
                                req.body.password = hash;
                                User.findOneAndUpdate({ email: id }, {password: req.body.password, surnameA: req.body.surnameA, surnameB: req.body.surnameB, nameOfUser: req.body.nameOfUser, status: req.body.status, dp: req.body.dp}, (err, userUpdate) => {
                                    if(err){
                                        res.status(500).send({message: 'Error al actualizar los datos'});
                                    }else{
                                        if(!userUpdate){
                                            res.status(404).send({message: 'El dato no existe y no ha sido actualizado'});
                                        }else{
                                            //bool = true;
                                            //res.status(200).send({message: bool});
                                            token.tokenRenovation(userUpdate, nameOfOperation, res); //Guardar token en la base de datos
                                        }
                                    }
                                });
                            });
                        }else if(!req.body.password){
                            User.findOneAndUpdate({ email: id }, {surnameA: req.body.surnameA, surnameB: req.body.surnameB, nameOfUser: req.body.nameOfUser, status: req.body.status, dp: req.body.dp}, (err, userUpdate) => {
                                if(err){
                                    res.status(500).send({message: 'Error al actualizar los datos'});
                                }else{
                                    if(!userUpdate){
                                        res.status(404).send({message: 'El dato no existe y no ha sido actualizado'});
                                    }else{
                                        //bool = true;
                                        //res.status(200).send({message: bool});
                                        token.tokenRenovation(userUpdate, nameOfOperation, res); //Guardar token en la base de datos
                                    }
                                }
                            });
                        }
                    }else if(typeOfOperationOK == false){
                        res.status(404).send({message: 'No tienes permisos para actualizar los datos de administradores'});
                    }else if(req.body.email){
                        res.status(404).send({message: 'No puedes actualizar el email - contacta con el desarrollador'});
                    }else if(req.body.hashX != hashX){
                        return res.status(404).json({ message: 'HashX no coincide: '+hashX });
                    }else{
                        return res.status(404).json({ message: 'Errores en los datos typeOfOperationOK: '+typeOfOperationOK+' - initialToken (users): '+user.initialToken+' - Token (audit): '+auditData.Token+' - hashX (client): '+req.body.hashX+' - hashX(api): '+hashX });
                    }
                }
            }
        });
    });
}

function updateTUser(req, res){
    //console.log(req.body);
    var tokeninitial = req.headers.authorization;
    var typeOfOperation = req.body.typeOfOperation;
    var nameOfOperation = req.body.nameOfOperation;
    permit.hasAccess(tokeninitial, typeOfOperation, nameOfOperation)
    .then(typeOfOperationOK => {
        var id = req.params.id.toLowerCase(); //CAMBIAR ESTE DATO POR LA VARIABLE QUE CONTENDRÁ LOS ID's DE LOS USUARIOS REGISTRADOS
        var bool = false;
        //var query = { email: id, typeOfUser: 'TUser' };
        //var query = { email: id };

        var jsonData = {
            email: req.body.email.toLowerCase(),
            password: req.body.password,
            surnameA: req.body.surnameA,
            surnameB: req.body.surnameB,
            nameOfUser: req.body.nameOfUser,
            typeOfUser: req.body.typeOfUser,
            status: req.body.status,
            creationDate: req.body.creationDate,
            initialToken: req.body.initialToken,
            dp: req.body.dp,
            addressU: req.body.addressU,
            typeOfOperation: req.body.typeOfOperation,
            nameOfOperation: req.body.nameOfOperation,
        };
        var hashX = md5(JSON.stringify(jsonData));
        /*
        console.log(hashX);
        if(req.body.hashX == hashX){
            console.log("MD5 correcto");
        }else{
            console.log("MD5 incorrecto");
        }*/
        if(typeOfOperationOK == true && !req.body.email && req.body.hashX == hashX){
            //Pedir contraseña para confimar cambio
            if(req.body.password){
                bcrypt.hash(req.body.password, null, null, function(err, hash){
                    req.body.password = hash;
                    User.findOneAndUpdate({ email: id }, {password: req.body.password, surnameA: req.body.surnameA, surnameB: req.body.surnameB, nameOfUser: req.body.nameOfUser, status: req.body.status, dp: req.body.dp}, (err, userUpdate) => {
                        if(err){
                            res.status(500).send({message: 'Error al actualizar los datos'});
                        }else{
                            if(!userUpdate){
                                res.status(404).send({message: 'El dato no existe y no ha sido actualizado'});
                            }else{
                                //bool = true;
                                //res.status(200).send({message: bool});
                                token.tokenRenovation(userUpdate, nameOfOperation, res); //Guardar token en la base de datos
                            }
                        }
                    });
                });
            } else if(!req.body.password){
                User.findOneAndUpdate({ email: id }, {surnameA: req.body.surnameA, surnameB: req.body.surnameB, nameOfUser: req.body.nameOfUser, status: req.body.status, dp: req.body.dp}, (err, userUpdate) => {
                    if(err){
                        res.status(500).send({message: 'Error al actualizar los datos'});
                    }else{
                        if(!userUpdate){
                            res.status(404).send({message: 'El dato no existe y no ha sido actualizado'});
                        }else{
                            //bool = true;
                            //res.status(200).send({message: bool});
                            token.tokenRenovation(userUpdate, nameOfOperation, res); //Guardar token en la base de datos
                        }
                    }
                });
            }
        }else if(typeOfOperationOK == false){
            res.status(404).send({message: 'No tienes permisos para actualizar los datos de usuarios normales'});
        }else if(req.body.email){
            res.status(404).send({message: 'No puedes actualizar el email - contacta con el desarrollador'});
        }else if(req.body.hashX != hashX){
            return res.status(404).json({ message: 'HashX no coincide: '+hashX });
        }else{
            return res.status(404).json({ message: 'Errores en los datos typeOfOperationOK: '+typeOfOperationOK+' - initialToken (users): '+user.initialToken+' - Token (audit): '+auditData.Token+' - hashX (client): '+req.body.hashX+' - hashX(api): '+hashX });
        }
    });
}

function userDelete(req, res) {
    var typeOfOperation = req.body.typeOfOperation;
    var nameOfOperation = req.body.nameOfOperation;
    switch(typeOfOperation) {
        case 'delete':
            if(nameOfOperation == 'deleteMe') {
                deleteMe(req, res);
            }else if(nameOfOperation == 'deleteAdministrator') {
                deleteAdministrator(req, res);
            }else if(nameOfOperation == 'deleteTUser'){
                deleteTUser(req, res);
            }
            break;
        default:
        return res.status(404).send({ message: 'Default case (userDelete) if exists a emergency' });
        break;
    }
}

function deleteMe(req, res){
    var tokeninitial = req.headers.authorization;
    var typeOfOperation = req.body.typeOfOperation;
    var nameOfOperation = req.body.nameOfOperation;
    permit.hasAccess(tokeninitial, typeOfOperation, nameOfOperation)
    .then(typeOfOperationOK => {
        //console.log(typeOfOperationOK);
        tokeninitial.replace(/['"]+/g, '');
        //var payload = decodeToken(tokeninitial);
        var payload = service_jwt.decodeToken(tokeninitial);
        var id = req.params.id.toLowerCase(); //CAMBIAR ESTE DATO POR LA VARIABLE QUE CONTENDRÁ LOS ID's DE LOS USUARIOS REGISTRADOS
        var bool = false;
        if(typeOfOperationOK == true && id == payload._id && !req.body.email){
            //Pedir contraseña para confimar cambio
            User.findOneAndRemove({ email: id }, (err, userDelete) => {
                if(err){
                    res.status(500).send({message: 'Error al eliminar los datos'});
                }else{
                    if(!userDelete){
                        //res.status(404).send({message: 'El dato no existe y no ha sido eliminado'});
                        Consumer.findOneAndRemove({ email: id }, (err, userDelete) => {
                            if(err){
                                res.status(500).send({message: 'Error al eliminar los datos'});
                            }else{
                                if(!userDelete){
                                    res.status(404).send({message: 'El dato no existe y no ha sido eliminado'});
                                }else{
                                    //bool = true;
                                    //res.status(200).send({message: bool});
                                    token.tokenDelete(userDelete, nameOfOperation, res);
                                }
                            }
                        });
                    }else{
                        //bool = true;
                        //res.status(200).send({message: bool});
                        token.tokenDelete(userDelete, nameOfOperation, res);

                    }
                }
            });
        }else if(typeOfOperationOK == false){
            res.status(404).send({message: 'No tienes permisos para eliminar tus datos'});
        }else if(id != payload._id) {
            res.status(404).send({message: 'Los ID´s no coinciden'});
        }else if(req.body.email){
            res.status(404).send({message: 'No puedes eliminar tu email - contacta con el desarrollador'});
        }else{
            res.status(404).send({message: 'Errores en los datos typeOfOperationOK: '+typeOfOperationOK+' - ID (users) : '+id +' - ID (token): '+payload._id+' - Email: '+req.body.email });
        }
    })
    .catch(err => {
        // never goes here
        console.log(err);
        return res.status(550).json(err);
    });
}

function deleteAdministrator(req, res){
    var tokeninitial = req.headers.authorization;
    var typeOfOperation = req.body.typeOfOperation;
    var nameOfOperation = req.body.nameOfOperation;
    permit.hasAccess(tokeninitial, typeOfOperation, nameOfOperation)
    .then(typeOfOperationOK => {
        var id = req.params.id.toLowerCase(); //CAMBIAR ESTE DATO POR LA VARIABLE QUE CONTENDRÁ LOS ID's DE LOS USUARIOS REGISTRADOS
        var bool = false;
        var query = { email: id, typeOfUser: 'Administrator' };
        User.findOne(query, (err, usersStored) => {
            if(err) {
                res.status(500).send({message: 'Error en la petición'});
            }else {
                if(!usersStored) {
                    res.status(404).send({message: 'No se ha encontrado el dato'});
                }else {
                    if(typeOfOperationOK == true && !req.body.email){
                        //Pedir contraseña para confimar cambio
                            User.findOneAndRemove({ email: id }, (err, userDelete) => {
                                if(err){
                                    res.status(500).send({message: 'Error al eliminar los datos'});
                                }else{
                                    if(!userDelete){
                                        res.status(404).send({message: 'El dato no existe y no ha sido eliminado'});
                                    }else{
                                        //bool = true;
                                        //res.status(200).send({message: bool});
                                        token.tokenDelete(userDelete, nameOfOperation, res);
                                    }
                                }
                            });
                    }else if(typeOfOperationOK == false){
                        res.status(404).send({message: 'No tienes permisos para eliminar administradores'});
                    }else if(req.body.email){
                        res.status(404).send({message: 'No puedes eliminar el email - contacta con el desarrollador'});
                    }else{
                        res.status(404).send({ message: 'Errores en los datos typeOfOperationOK: '+typeOfOperationOK+' - ID (users) : '+id +' - ID (token): '+payload._id+' - Email: '+req.body.email });
                    }
                }
            }
        });
    });
}

function deleteTUser(req, res){
    var tokeninitial = req.headers.authorization;
    var typeOfOperation = req.body.typeOfOperation;
    var nameOfOperation = req.body.nameOfOperation;
    permit.hasAccess(tokeninitial, typeOfOperation, nameOfOperation)
    .then(typeOfOperationOK => {
        var id = req.params.id.toLowerCase(); //CAMBIAR ESTE DATO POR LA VARIABLE QUE CONTENDRÁ LOS ID's DE LOS USUARIOS REGISTRADOS
        var bool = false;
        //var query = { email: id, typeOfUser: 'TUser' };
        var query = { email: id };
        if(typeOfOperationOK == true && !req.body.email){
            //Pedir contraseña para confimar cambio
            User.findOneAndRemove({ email: id }, (err, userDelete) => {
                if(err){
                    res.status(500).send({message: 'Error al eliminar los datos'});
                }else{
                    if(!userDelete){
                        res.status(404).send({message: 'El dato no existe y no ha sido eliminado'});
                    }else{
                        //bool = true;
                        //res.status(200).send({message: bool});
                        token.tokenDelete(userDelete, nameOfOperation, res);
                    }
                }
            });
        }else if(typeOfOperationOK == false){
            res.status(404).send({message: 'No tienes permisos para eliminar usuarios normales'});
        }else if(req.body.email){
            res.status(404).send({message: 'No puedes eliminar el email - contacta con el desarrollador'});
        }else{
            res.status(404).send({ message: 'Errores en los datos typeOfOperationOK: '+typeOfOperationOK+' - ID (users) : '+id +' - ID (token): '+payload._id+' - Email: '+req.body.email });
        }
    });
}

function getUser(req, res){
    var userId = req.params.id;
    var token = req.headers.authorization;
    var payload = service_jwt.decodeToken(token);
    var typeOfOperation = 'read';
    var nameOfOperation;
    User.findOne({email: userId}, (err, user) => {
        if(err){
            res.status(500).send({message: 'Error en la petición'});
        }else{
            if(!user){
                //res.status(404).send({message: 'El dato no existe'});
                Consumer.findOne({email: userId}, (err, user) => {
                    if(err){
                        res.status(500).send({message: 'Error en la petición'});
                    }else{
                        if(!user){
                            //res.status(404).send({message: 'El dato no existe'});
                        }else{
                            nameOfOperation = 'readMe';
                            permit.hasAccess(token, typeOfOperation, nameOfOperation) //Antes de verificar los permisos verificar el dueño del token
                            .then(typeOfOperationOK => {
                                //console.log(typeOfOperationOK);
                                if(typeOfOperationOK == true){
                                    res.status(200).send({ user });
                                }else{
                                    res.status(404).send({message: 'No tienes permisos para ver estos datos'});
                                }
                            })
                            .catch(err => {
                                // never goes here
                                console.log(err);
                                return res.status(550).json(err);
                            });
                        }
                    }
                });
            }else{
                if(payload._id == req.params.id){
                    nameOfOperation = 'readMe';
                }else if(user.typeOfUser == 'Administrator') {
                    nameOfOperation = 'readAdministrator';
                }else {
                    nameOfOperation = 'readTUser';
                }
                permit.hasAccess(token, typeOfOperation, nameOfOperation) //Antes de verificar los permisos verificar el dueño del token
                .then(typeOfOperationOK => {
                    //console.log(typeOfOperationOK);
                    if(typeOfOperationOK == true){
                        res.status(200).send({ user });
                    }else{
                        res.status(404).send({message: 'No tienes permisos para ver estos datos'});
                    }
                })
                .catch(err => {
                    // never goes here
                    console.log(err);
                    return res.status(550).json(err);
                });
            }
        }
    });
}

function getUsers(req, res){
    var payload = service_jwt.decodeToken(req.headers.authorization);
    if(req.params.page){
        var page = req.params.page;
    }else{
        var page = 1;
    }
    var itemsPerPage = 5;
    User.find().sort('email').paginate(page, itemsPerPage, function(err, users, total){
        if(err){
            res.status(500).send({message: 'Error en la petición'});
        }else{
            if(!users){
                res.status(404).send({message: 'No hay datos'});
            }else{
                if(payload.typeOfUser == 'Root' || payload.typeOfUser == 'Administrator'){
                    var token = req.headers.authorization;
                    var typeOfOperation = 'read';
                    var nameOfOperation = 'readAdministrator';
                    var usersView = [];
                    permit.hasAccess(token, typeOfOperation, nameOfOperation)
                    .then(typeOfOperationOK => {
                        if(typeOfOperationOK == true){
                            for(var user of users){
                                if(user.typeOfUser == 'Administrator' && user.email != payload._id){
                                    usersView.push(user);
                                }
                            }
                        }
                        nameOfOperation = 'readTUser';
                        permit.hasAccess(token, typeOfOperation, nameOfOperation)
                        .then(typeOfOperationOK => {
                            if(typeOfOperationOK == true){
                                for(var user of users){
                                    if(user.typeOfUser == 'TUser' || user.typeOfUser == 'Merchant' || user.typeOfUser == 'Carrier' || user.typeOfUser == 'Acopio' || user.typeOfUser == 'Productor'){
                                        usersView.push(user);
                                    }
                                }
                            }
                            //console.log(usersView);
                            return res.status(200).send({ total_items: total, users: usersView });
                        })
                        .catch(err => {
                            // never goes here
                            console.log(err);
                            return res.status(550).json(err);
                        });
                    })
                    .catch(err => {
                        // never goes here
                        console.log(err);
                        return res.status(550).json(err);
                    });
                 }else{
                     return res.status(400).send({ message: "No tienes permisos para ver datos de otros usuarios" });
                 }
             }
         }
    });
}

function registerUser(req, res){
    var email = req.body.email;
    Consumer.findOne({email: email.toLowerCase()}, (err, emailStored) => {
        if(err){
            res.status(500).send({ message: 'Error en la petición' });
        }else{
            if(!emailStored){
                var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
                var dp = '{ "createAdministrator": '+false+', "createTUser": '+false+', "updateMe": '+true+', "updateAdministrator": '+false+', "updateTUser": '+false+', "deleteMe": '+true+', "deleteAdministrator": '+false+', "deleteTUser": '+false+', "readMe": '+true+', "readAdministrator": '+false+', "readTUser": '+false+', "loginUser": '+true+' }';
                var consumer = new Consumer();

                consumer.email = req.body.email.toLowerCase();
                consumer.password = req.body.password;
                consumer.nameOfUser = req.body.nameOfUser;
                consumer.surnameP = req.body.surnameP;
                consumer.surnameM = req.body.surnameM;
                consumer.ip = ip;
                consumer.typeOfUser = 'Consumer';
                consumer.dp = dp;
                if(req.body.password){
                    //Encriptar contraseñas
                    bcrypt.hash(req.body.password, null, null, function(err, hash){
                        consumer.password = hash;
                        if(consumer.email != null && consumer.password != null && consumer.nameOfUser != null && consumer.surnameM != null && consumer.surnameM != null){
                            //Guardar usuario
                            consumer.save((err, userStored) => {
                                if(err) {
                                    console.log(err);
                                    res.status(500).json({ message: 'Error al guardar los datos' });
                                }else {
                                    if(!userStored) {
                                        res.status(404).json({ message: 'El dato no ha sido guardado' });
                                    }else {
                                        var generatedToken = service_jwt.createToken(consumer); //Guardar token en la base de datos
                                        token.tokenCreation(generatedToken, consumer.email);
                                        req.body.typeOfOperation = 'authentication';
                                        req.body.nameOfOperation = 'loginUser';
                                        confirmation.sendEmail(email);
                                        token.authenticateConsumers(req, res);
                                    }
                                }
                            });
                        }else {
                            res.status(200).json({ message: 'Rellena todos los campos' });
                        }
                    });
                }else {
                    res.status(200).json({ message: 'Introduce la contraseña' });
                }
            }else{
                console.log("Entré aquí - "+emailStored);
                res.status(404).send({ message: 'Ya existe un usuario con el email: '+email });
            }
        }
    });

}

function updateConsumer(req, res){
    var tokeninitial = req.headers.authorization;
    var typeOfOperation = req.body.typeOfOperation;
    var nameOfOperation = req.body.nameOfOperation;
    permit.hasAccess(tokeninitial, typeOfOperation, nameOfOperation)
    .then(typeOfOperationOK => {
        tokeninitial.replace(/['"]+/g, '');
        //var payload = decodeToken(tokeninitial);
        var payload = service_jwt.decodeToken(tokeninitial);
        var id = req.params.id.toLowerCase(); //CAMBIAR ESTE DATO POR LA VARIABLE QUE CONTENDRÁ LOS ID's DE LOS USUARIOS REGISTRADOS
        if(typeOfOperationOK == true && id == payload._id && !req.body.email && !req.body.dp){
            //Pedir contraseña para confimar cambio
            if(req.body.password){
                bcrypt.hash(req.body.password, null, null, function(err, hash){
                    req.body.password = hash;
                    Consumer.findOneAndUpdate({ email: id }, {password: req.body.password, nameOfUser: req.body.nameOfUser, surnameP: req.body.surnameP, surnameM: req.body.surnameM}, (err, userUpdate) => {
                        if(err){
                            res.status(500).send({message: 'Error al actualizar los datos'});
                        }else{
                            if(!userUpdate){
                                res.status(404).send({message: 'El dato no existe y no ha sido actualizado'});
                            }else{
                                token.tokenRenovation(userUpdate, nameOfOperation, res); //Guardar token en la base de datos
                            }
                        }
                    });
                });
            }else{
                Consumer.findOneAndUpdate({ email: id }, {nameOfUser: req.body.nameOfUser, surnameP: req.body.surnameP, surnameM: req.body.surnameM}, (err, userUpdate) => {
                    if(err){
                        res.status(500).send({message: 'Error al actualizar los datos'});
                    }else{
                        if(!userUpdate){
                            res.status(404).send({message: 'El dato no existe y no ha sido actualizado'});
                        }else{
                            token.tokenRenovation(userUpdate, nameOfOperation, res); //Guardar token en la base de datos
                        }
                    }
                });
            }
        }else if(typeOfOperationOK == false){
            res.status(404).send({message: 'No tienes permisos para actualizar tus datos'});
        }else if(id != payload._id) {
            res.status(404).send({message: 'Los ID´s no coinciden'});
        }else if(req.body.email){
            res.status(404).send({message: 'No puedes actualizar tu email - contacta con el desarrollador'});
        }else if(req.body.dp){
            res.status(404).send({message: 'No puedes actualizar tus permisos'});
        }else if(req.body.hashX != hashX){
            return res.status(404).json({ message: 'HashX no coincide: '+hashX });
        }else{
            return res.status(404).json({ message: 'Errores en los datos typeOfOperationOK: '+typeOfOperationOK+' - initialToken (users): '+user.initialToken+' - Token (audit): '+auditData.Token+' - hashX (client): '+req.body.hashX+' - hashX(api): '+hashX });
        }
    })
    .catch(err => {
        // never goes here
        console.log(err);
        return res.status(550).json(err);
    });
}
/*
function deleteConsumer(req, res){
    var tokeninitial = req.headers.authorization;
    var typeOfOperation = req.body.typeOfOperation;
    var nameOfOperation = req.body.nameOfOperation;
    permit.hasAccess(tokeninitial, typeOfOperation, nameOfOperation)
    .then(typeOfOperationOK => {
        //console.log(typeOfOperationOK);
        tokeninitial.replace(/['"]+/g, '');
        //var payload = decodeToken(tokeninitial);
        var payload = service_jwt.decodeToken(tokeninitial);
        var id = req.params.id.toLowerCase(); //CAMBIAR ESTE DATO POR LA VARIABLE QUE CONTENDRÁ LOS ID's DE LOS USUARIOS REGISTRADOS
        var bool = false;
        if(typeOfOperationOK == true && id == payload._id && !req.body.email){
            //Pedir contraseña para confimar cambio
            Consumer.findOneAndRemove({ email: id }, (err, userDelete) => {
                    if(err){
                        res.status(500).send({message: 'Error al actualizar los datos'});
                    }else{
                        if(!userDelete){
                            res.status(404).send({message: 'El dato no existe y no ha sido actualizado'});
                        }else{
                            bool = true;
                            res.status(200).send({message: bool});
                        }
                    }
                });
        }else if(typeOfOperationOK == false){
            res.status(404).send({message: 'No tienes permisos para eliminar tus datos'});
        }else if(id != payload._id) {
            res.status(404).send({message: 'Los ID´s no coinciden'});
        }else if(req.body.email){
            res.status(404).send({message: 'No puedes actualizar tu email - contacta con el desarrollador'});
        }else{
            res.status(404).send({ message: 'Errores en los datos typeOfOperationOK: '+typeOfOperationOK+' - ID (users) : '+id +' - ID (token): '+payload._id+' - Email: '+req.body.email });
        }
    })
    .catch(err => {
        // never goes here
        console.log(err);
        return res.status(550).json(err);
    });
}
*/

//--------------------------------------------New--------------------------------------------

module.exports = {
    userCreate,
    userUpdate,
    userDelete,
    getUser,
    getUsers,
    registerUser
};
