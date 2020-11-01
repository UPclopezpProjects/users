//
var User = require("../models/Users");
var Dictionary = require("../models/Transactions");
var Token = require("../models/Tokens");

var http = require('http');
//var https = require('https');
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
function userCreate(req, res) {
    var typeOfUser = req.body.typeOfUser;

    switch(typeOfUser.toLowerCase()){
        case "root":
            checkRoot(req, res);
            break;
        case "administrator":
        case "tuser":
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
                res.status(200).send({ message: "Ya existe un usario Root, no puedes crear más" });
            }
        }
    });
}

function checkEmail(req, res, typeOfUser){
    var email = req.body.email;
    User.findOne({email: email}, (err, emailStored) => {
        if(err){
            res.status(500).send({ message: 'Error en la petición' });
        }else{
            if(!emailStored){
                switch(typeOfUser.toLowerCase()){
                    case "administrator":
                        createAdministrator(req, res);
                        break;
                    case "tuser":
                        createTUser(req, res);
                        break;
                    default:
                        res.status(404).send({ message: 'Default case (checkEmail) if exists a emergency' });
                        break;
                }
            }else{
                res.status(404).send({ message: 'Ya existe un usuario con el email: '+email });
            }
        }
    });
}

function createRoot(req, res){
    serviceInit(req, function(data, err) {
        if (err) {
            res.status(500).send({ message: 'Error en la petición' });
        }else {
            var user = new User();
            var auditData = data;

            user.email = req.body.email;
            user.typeOfUser = req.body.typeOfUser;
            user.initialToken = req.body.initialToken;
            user.dp = req.body.dp; //DP ahora es un dato estático, pero debería cambiarse cuando esté lista la vista
            user.addressU = req.body.addressU;
            user.addressContract =  auditData.y.addCont;
            user.addressTransaction = auditData.y.addTran;

            //var key = req.body.key; //REVISAR
            //var hashX = req.body.hashX; //REVISAR
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
                                        var generatedToken = service_jwt.createToken(user); //Guardar token en la base de datos
                                        finalToken.tokenCreation(generatedToken, user.email);
                                        res.status(200).send({
                                            token: generatedToken
                                        });
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
        }
    });
}

function createAdministrator(req, res){
    serviceInit(req, function(data, err) {
        if (err) {
            res.status(500).send({ message: 'Error en la petición' });
        }else {
            var user = new User();
            var auditData = data;

            user.email = req.body.email;
            user.typeOfUser = req.body.typeOfUser;
            user.initialToken = req.body.initialToken;
            user.dp = req.body.dp; //DP ahora es un dato estático, pero debería cambiarse cuando esté lista la vista
            user.addressU = req.body.addressU;
            user.addressContract =  auditData.y.addCont;
            user.addressTransaction = auditData.y.addTran;

            //var key = req.body.key; //REVISAR
            //var hashX = req.body.hashX; //REVISAR

            var typeOfOperation = req.body.typeOfOperation;
            var nameOfOperation = 'createAdministrator';
            var typeOfOperationOK = hasAccess(req, res, typeOfOperation, nameOfOperation);

            if(typeOfOperationOK == true && user.initialToken == auditData.Token){
                if(req.body.password){
                    //Encriptar contraseñas
                    bcrypt.hash(req.body.password, null, null, function(err, hash){
                        user.password = hash;
                        if(user.email != null && user.password != null && user.addressContract != null && user.addressTransaction != null && user.typeOfUser != null && user.initialToken != null){
                            //Guardar usuario
                            user.save((err, userStored) => {
                                if(err) {
                                    res.status(500).send({ message: 'Error al guardar los datos' });
                                }else {
                                    if(!userStored) {
                                        res.status(404).send({ message: 'El dato no ha sido guardado' });
                                    }else {
                                        var generatedToken = service_jwt.createToken(user); //Guardar token en la base de datos
                                        finalToken.tokenCreation(generatedToken, user.email);
                                        res.status(200).send({
                                            token: generatedToken
                                        });
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
            }else if(user.initialToken != auditData.Token && typeOfOperationOK == true){
                res.status(404).send({ message: 'Errores en los datos initialToken (users) : '+user.initialToken+' - Token (audit): '+auditData.Token });
            }else if(user.initialToken == auditData.Token && typeOfOperationOK == false){
                res.status(404).send({ message: 'No tienes permisos para crear usuarios de tipo administrador' });
            }else{
                res.status(404).send({ message: 'Errores en los datos typeOfOperationOK:'+typeOfOperationOK+' - initialToken (users) : '+user.initialToken+' - Token (audit): '+auditData.Token });
            }
        }
    });
}

function createTUser(req, res){
    serviceInit(req, function(data, err) {
        if (err) {
            res.status(500).send({ message: 'Error en la petición' });
        }else {
            var user = new User();
            var auditData = data;

            user.email = req.body.email;
            user.typeOfUser = req.body.typeOfUser;
            user.initialToken = req.body.initialToken;
            user.dp = req.body.dp; //DP ahora es un dato estático, pero debería cambiarse cuando esté lista la vista
            user.addressU = req.body.addressU;
            user.addressContract =  auditData.y.addCont;
            user.addressTransaction = auditData.y.addTran;

            //var key = req.body.key; //REVISAR
            //var hashX = req.body.hashX; //REVISAR

            var typeOfOperation = req.body.typeOfOperation;
            var nameOfOperation = 'createTUser';
            var typeOfOperationOK = hasAccess(req, res, typeOfOperation, nameOfOperation);
            console.log("typeOfOperationOK: "+typeOfOperationOK);
            if(typeOfOperationOK == true && user.initialToken == auditData.Token){
                if(req.body.password){
                    //Encriptar contraseñas
                    bcrypt.hash(req.body.password, null, null, function(err, hash){
                        user.password = hash;
                        if(user.email != null && user.password != null && user.addressContract != null && user.addressTransaction != null && user.typeOfUser != null && user.initialToken != null){
                            //Guardar usuario
                            user.save((err, userStored) => {
                                if(err) {
                                    res.status(500).send({ message: 'Error al guardar los datos' });
                                }else {
                                    if(!userStored) {
                                        res.status(404).send({ message: 'El dato no ha sido guardado' });
                                    }else {
                                        var generatedToken = service_jwt.createToken(user); //Guardar token en la base de datos
                                        finalToken.tokenCreation(generatedToken, user.email);
                                        res.status(200).send({
                                            token: generatedToken //Guardar el token
                                        });
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
            }else if(user.initialToken != auditData.Token && typeOfOperationOK == true){
                res.status(404).send({ message: 'Errores en los datos initialToken (users) : '+user.initialToken+' - Token (audit): '+auditData.Token });
            }else if(user.initialToken == auditData.Token && typeOfOperationOK == false){
                res.status(404).send({ message: 'No tienes permisos' });
            }else{
                res.status(404).send({ message: 'Errores en los datos typeOfOperationOK:'+typeOfOperationOK+' - initialToken (users) : '+user.initialToken+' - Token (audit): '+auditData.Token });
            }
        }
    });
}

/*
Funciones encargada de invocar los servicios RESTful y devolver el objeto JSON correspondiente.
*/
function serviceInit(req, next) {
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
}

function decodeToken(token){
    var payload = jwt.decode(token, secret);
    return payload;
}

function hasAccess(req, res, typeOfOperation, nameOfOperation){
    var token = req.headers.token.replace(/['"]+/g, '');
    var payload = decodeToken(token);

    var dpArray = payload.DP;
    var dpJSON = JSON.parse(dpArray);

    var typeOfOperationOK;
    if(!req.headers.token){
        return res.status(403).send({message: 'La petición no tiene la cabecera'});
    }
    try{
        if(payload.life <= moment().unix()){
            return res.status(401).send({message: 'El token ha expirado'});
        }
    }catch(ex){
        //console.log(ex);
        return res.status(403).send({message: 'Token no válido'});
    }

    switch(typeOfOperation) {
        case 'create':
            if(nameOfOperation == 'createAdministrator'){
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
         return res.status(404).send({ message: 'Default case (hasAccess) if exists a emergency' });
         break;
     }
     //console.log('typeOfOperationOK: '+typeOfOperationOK);
     return typeOfOperationOK;

}

function userUpdate(req, res) {
    var typeOfOperation = req.headers.typeofoperation;
    var nameOfOperation = req.headers.nameofoperation;

    var email = req.body.email;
    User.findOne({email: email}, (err, emailStored) => {
        if(err){
            res.status(500).send({ message: 'Error en la petición' });
        }else{
            if(!emailStored){
                switch(typeOfOperation) {
                    case 'update':
                        if(nameOfOperation == 'updateMe') {
                            updateMe(req, res);
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
    var token = req.headers.token.replace(/['"]+/g, '');
    var payload = decodeToken(token);

    var typeOfOperation = req.headers.typeofoperation;
    var nameOfOperation = 'updateMe';
    var typeOfOperationOK = hasAccess(req, res, typeOfOperation, nameOfOperation);

    var id = req.params.id; //CAMBIAR ESTE DATO POR LA VARIABLE QUE CONTENDRÁ LOS ID's DE LOS USUARIOS REGISTRADOS
    var update = req.body;
    var bool = false;

    if(typeOfOperationOK == true && id == payload._id && !req.body.email){
        User.findByIdAndUpdate(id, update, (err, userUpdate) => {
            if(err){
                res.status(500).send({message: 'Error al actualizar los datos'});
            }else{
                if(!userUpdate){
                    res.status(404).send({message: 'El dato no existe y no ha sido actualizado'});
                }else{
                    bool = true;
                    res.status(200).send({response: bool});
                }
            }
        });
    }else if(typeOfOperationOK == false){
        res.status(200).send({message: 'No tienes permisos para actualizar tus datos'});
    }else if(id != payload._id) {
        res.status(200).send({message: 'Los ID´s no coinciden'});
    }else if(req.body.email){
        res.status(200).send({message: 'No puedes actualizar tu email - contacta con el desarrollador'});
    }else{
        res.status(404).send({ message: 'Errores en los datos typeOfOperationOK: '+typeOfOperationOK+' - ID (users) : '+id +' - ID (token): '+payload._id+' - Email: '+req.body.email });
    }
}

function updateAdministrator(req, res){
    var typeOfOperation = req.headers.typeofoperation;
    var nameOfOperation = 'updateAdministrator';
    var typeOfOperationOK = hasAccess(req, res, typeOfOperation, nameOfOperation);

    var id = req.params.id; //CAMBIAR ESTE DATO POR LA VARIABLE QUE CONTENDRÁ LOS ID's DE LOS USUARIOS REGISTRADOS
    var update = req.body;
    var bool = false;
    var query = { _id: id, typeOfUser: 'Administrator' };

    User.findOne(query, (err, usersStored) => {
        if(err) {
            res.status(500).send({message: 'Error en la petición'});
        }else {
            if(!usersStored) {
                res.status(404).send({message: 'No se ha encontrado el dato'});
            }else {
                if(typeOfOperationOK == true && !req.body.email){ //se quita payload y se enlista un array con todos los id's de los usuarios administradores
                    User.findByIdAndUpdate(id, update, (err, userUpdate) => {
                        if(err){
                            res.status(500).send({message: 'Error al actualizar los datos'})
                        }else{
                            if(!userUpdate){
                                res.status(404).send({message: 'El dato no existe y no ha sido actualizado'});
                            }else{
                                bool = true;
                                res.status(200).send({response: bool});
                            }
                        }
                    });
                }else if(typeOfOperationOK == false){
                    res.status(200).send({message: 'No tienes permisos para actualizar datos de administradores'});
                }else if(req.body.email){
                    res.status(200).send({message: 'No puedes actualizar tu email - contacta con el desarrollador'});
                }else{
                    res.status(404).send({ message: 'Errores en los datos typeOfOperationOK: '+typeOfOperationOK+' - ID (users) : '+id +' - ID (token): '+payload._id+' - Email: '+req.body.email });
                }
            }
        }
    });
}

function updateTUser(req, res){
    var typeOfOperation = req.headers.typeofoperation;
    var nameOfOperation = 'updateTUser';
    var typeOfOperationOK = hasAccess(req, res, typeOfOperation, nameOfOperation);

    var id = req.params.id; //CAMBIAR ESTE DATO POR LA VARIABLE QUE CONTENDRÁ LOS ID's DE LOS USUARIOS REGISTRADOS
    var update = req.body;
    var bool = false;
    var query = { _id: id, typeOfUser: 'TUser' };

    User.findOne(query, (err, usersStored) => {
        if(err) {
            res.status(500).send({message: 'Error en la petición'});
        }else {
            if(!usersStored) {
                res.status(404).send({message: 'No se ha encontrado el dato'});
            }else {
                if(typeOfOperationOK == true && !req.body.email){
                    User.findByIdAndUpdate(id, update, (err, userUpdate) => {
                        if(err){
                            res.status(500).send({message: 'Error al actualizar los datos'})
                        }else{
                            if(!userUpdate){
                                res.status(404).send({message: 'El dato no existe y no ha sido actualizado'});
                            }else{
                                bool = true;
                                res.status(200).send({response: bool});
                            }
                        }
                    });
                }else if(typeOfOperationOK == false){
                    res.status(200).send({message: 'No tienes permisos para actualizar datos de usuarios normales'});
                }else if(req.body.email){
                    res.status(200).send({message: 'No puedes actualizar tu email - contacta con el desarrollador'});
                }else{
                    res.status(404).send({ message: 'Errores en los datos typeOfOperationOK: '+typeOfOperationOK+' - ID (users) : '+id +' - ID (token): '+payload._id+' - Email: '+req.body.email });
                }
            }
        }
    });
}

function userDelete(req, res) {
    var typeOfOperation = req.headers.typeofoperation;
    var nameOfOperation = req.headers.nameofoperation;

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
    var token = req.headers.token.replace(/['"]+/g, '');
    var payload = decodeToken(token);

    var typeOfOperation = req.headers.typeofoperation;
    var nameOfOperation = 'deleteMe';
    var typeOfOperationOK = hasAccess(req, res, typeOfOperation, nameOfOperation);

    var id = req.params.id; //CAMBIAR ESTE DATO POR LA VARIABLE QUE CONTENDRÁ LOS ID's DE LOS USUARIOS REGISTRADOS
    var update = req.body;
    var bool = false;

    if(typeOfOperationOK == true && id == payload._id){
        User.findByIdAndRemove(id, update, (err, userDelete) => {
            if(err){
                res.status(500).send({message: 'Error al eliminar los datos'});
            }else{
                if(!userDelete){
                    res.status(404).send({message: 'El dato no existe y no ha sido eliminado'});
                }else{
                    bool = true;
                    res.status(200).send({response: bool});
                }
            }
        });
    }else if(typeOfOperationOK == false && id == payload._id){
        res.status(200).send({message: 'No tienes permisos para borrar tus datos'});
    }else if(typeOfOperationOK == true && id != payload._id) {
        res.status(200).send({message: 'Los ID´s no coinciden'});
    }else{
        res.status(404).send({ message: 'Errores en los datos typeOfOperationOK:'+typeOfOperationOK+' - ID (users) : '+id+' - ID (token): '+payload._id });
    }
}

function deleteAdministrator(req, res){
    var typeOfOperation = req.headers.typeofoperation;
    var nameOfOperation = 'deleteAdministrator';
    var typeOfOperationOK = hasAccess(req, res, typeOfOperation, nameOfOperation);

    var id = req.params.id; //CAMBIAR ESTE DATO POR LA VARIABLE QUE CONTENDRÁ LOS ID's DE LOS USUARIOS REGISTRADOS
    var update = req.body;
    var bool = false;
    var query = { _id: id, typeOfUser: 'Administrator' };

    User.findOne(query, (err, usersStored) => {
        if(err) {
            res.status(500).send({message: 'Error en la petición'});
        }else {
            if(!usersStored) {
                res.status(404).send({message: 'No se ha encontrado el dato'});
            }else {
                if(typeOfOperationOK == true){ //se quita payload y se enlista un array con todos los id's de los usuarios administradores
                    User.findByIdAndRemove(id, update, (err, userDelete) => {
                        if(err){
                            res.status(500).send({message: 'Error al eliminar los datos'})
                        }else{
                            if(!userDelete){
                                res.status(404).send({message: 'El dato no existe y no ha sido eliminado'});
                            }else{
                                bool = true;
                                res.status(200).send({response: bool});
                            }
                        }
                    });
                }else if(typeOfOperationOK == false){
                    res.status(200).send({message: 'No tienes permisos para eliminar los datos de administradores'});
                }
            }
        }
    });
}

function deleteTUser(req, res){
    var typeOfOperation = req.headers.typeofoperation;
    var nameOfOperation = 'deleteTUser';
    var typeOfOperationOK = hasAccess(req, res, typeOfOperation, nameOfOperation);

    var id = req.params.id; //CAMBIAR ESTE DATO POR LA VARIABLE QUE CONTENDRÁ LOS ID's DE LOS USUARIOS REGISTRADOS
    var update = req.body;
    var bool = false;
    var query = { _id: id, typeOfUser: 'TUser' };

    User.findOne(query, (err, usersStored) => {
        if(err) {
            res.status(500).send({message: 'Error en la petición'});
        }else {
            if(!usersStored) {
                res.status(404).send({message: 'No se ha encontrado el dato'});
            }else {
                if(typeOfOperationOK == true){ //se quita payload y se enlista un array con todos los id's de los usuarios administradores
                    User.findByIdAndRemove(id, update, (err, userDelete) => {
                        if(err){
                            res.status(500).send({message: 'Error al eliminar los datos'})
                        }else{
                            if(!userDelete){
                                res.status(404).send({message: 'El dato no existe y no ha sido eliminado'});
                            }else{
                                bool = true;
                                res.status(200).send({response: bool});
                            }
                        }
                    });
                }else if(typeOfOperationOK == false){
                    res.status(200).send({message: 'No tienes permisos para eliminar los datos de usuarios normales'});
                }
            }
        }
    });
}

function loginUser(req, res){
    var token = req.headers.token.replace(/['"]+/g, '');
    var payload = decodeToken(token);
    var id = payload._id;

    var email = req.body.email;
    var password = req.body.password;
    var typeOfUser = req.body.typeOfUser; //FALTA CHECAR ESTO

    var typeOfOperation = req.headers.typeofoperation;
    var nameOfOperation = 'loginUser';
    var typeOfOperationOK = hasAccess(req, res, typeOfOperation, nameOfOperation);
    var query = {_id: id, email: email.toLowerCase()};
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
                                if(typeOfOperationOK == true && user._id == payload._id && req.body.typeOfUser == user.typeOfUser){
                                    res.status(200).send({
                                        token: "Entraste"
                                    });
                                }else if(typeOfOperationOK == false){
                                    res.status(200).send({message: 'No tienes permisos para iniciar sesión'});
                                }else if(user._id != payload._id){
                                    res.status(200).send({message: 'Los ID´s no coinciden'});
                                }else if(req.body.typeOfUser != user.typeOfUser){
                                    res.status(200).send({message: 'El tipo de usuario -'+req.body.typeOfUser+'- no coincide con el tipo de usuario -'+user.typeOfUser+'-'});
                                }else{
                                    res.status(200).send({message: 'Existen errores al loguearse'});
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
    userCreate,
    userUpdate,
    userDelete,
    loginUser
};
