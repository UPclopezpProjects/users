//
var User = require("../models/Users");

var axios = require('axios');
var bcrypt = require('bcrypt-nodejs');
var jwt = require('jwt-simple');

var service_jwt = require('../services/jwt');
var token = require("../controller/token");
var permit = require("../controller/permit");
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

            if(user.initialToken == auditData.Token){
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
                                        var generatedToken = service_jwt.createToken(user); //Guardar token en la base de datos
                                        token.tokenCreation(generatedToken, user.email);
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
            }else if(user.initialToken == auditData.Token){
                res.status(404).send({ message: 'No tienes permisos para crear usuarios de tipo administrador' });
            }else{
                res.status(404).send({ message: 'Errores en los datos initialToken (users) : '+user.initialToken+' - Token (audit): '+auditData.Token });
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

            var tokeninitial = req.headers.token;
            var typeOfOperation = req.body.typeOfOperation;
            var nameOfOperation = req.headers.nameofoperation;
            var typeOfOperationOK = permit.hasAccess(tokeninitial, typeOfOperation, nameOfOperation);
            //console.log("Aquí: "+typeOfOperationOK);
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
                                        token.tokenCreation(generatedToken, user.email);
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
            }else if(user.initialToken != auditData.Token){
                res.status(404).send({ message: 'Errores en los datos initialToken (users) : '+user.initialToken+' - Token (audit): '+auditData.Token });
            }else if(typeOfOperationOK == false){
                res.status(404).send({ message: 'No tienes permisos para crear usuarios de tipo administrador' });
            }else{
                res.status(404).send({ message: 'Errores en los datos typeOfOperationOK: '+typeOfOperationOK+' - initialToken (users) : '+user.initialToken+' - Token (audit): '+auditData.Token });
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

            var tokeninitial = req.headers.token;
            var typeOfOperation = req.body.typeOfOperation;
            var nameOfOperation = req.headers.nameofoperation;
            var typeOfOperationOK = permit.hasAccess(tokeninitial, typeOfOperation, nameOfOperation);
            console.log(typeOfOperationOK);

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
                                        token.tokenCreation(generatedToken, user.email);
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
            }else if(user.initialToken != auditData.Token){
                res.status(404).send({ message: 'Errores en los datos initialToken (users) : '+user.initialToken+' - Token (audit): '+auditData.Token });
            }else if(typeOfOperationOK != true){
                res.status(404).send({ message: 'No tienes permisos' });
            }else{
                res.status(404).send({ message: 'Errores en los datos typeOfOperationOK: '+typeOfOperationOK+' - initialToken (users) : '+user.initialToken+' - Token (audit): '+auditData.Token });
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
    var data;
    var url = 'http://'+host+':'+port+''+path+'';
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
        //console.log(error);
        next(null, error);
    });
}

function decodeToken(token){
    var secret = 'secret_key';
    var payload = jwt.decode(token, secret);
    return payload;
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

    var tokeninitial = req.headers.token;
    var typeOfOperation = req.headers.typeofoperation;
    var nameOfOperation = req.headers.nameofoperation;
    var typeOfOperationOK = permit.hasAccess(tokeninitial, typeOfOperation, nameOfOperation);

    var id = req.params.id.toLowerCase(); //CAMBIAR ESTE DATO POR LA VARIABLE QUE CONTENDRÁ LOS ID's DE LOS USUARIOS REGISTRADOS
    var update = req.body;
    var bool = false;

    if(typeOfOperationOK == true && id == payload._id && !req.body.email){
        User.findOneAndUpdate({ email: id }, update, (err, userUpdate) => {
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
    var tokeninitial = req.headers.token;
    var typeOfOperation = req.headers.typeofoperation;
    var nameOfOperation = req.headers.nameofoperation;
    var typeOfOperationOK = permit.hasAccess(tokeninitial, typeOfOperation, nameOfOperation);

    var id = req.params.id.toLowerCase(); //CAMBIAR ESTE DATO POR LA VARIABLE QUE CONTENDRÁ LOS ID's DE LOS USUARIOS REGISTRADOS
    var update = req.body;
    var bool = false;
    var query = { email: id, typeOfUser: 'Administrator' };

    User.findOne(query, (err, usersStored) => {
        if(err) {
            res.status(500).send({message: 'Error en la petición'});
        }else {
            if(!usersStored) {
                res.status(404).send({message: 'No se ha encontrado el dato'});
            }else {
                if(typeOfOperationOK == true && !req.body.email){ //se quita payload y se enlista un array con todos los id's de los usuarios administradores
                    User.findOneAndUpdate({ email: id }, update, (err, userUpdate) => {
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
    var tokeninitial = req.headers.token;
    var typeOfOperation = req.headers.typeofoperation;
    var nameOfOperation = req.headers.nameofoperation;
    var typeOfOperationOK = permit.hasAccess(tokeninitial, typeOfOperation, nameOfOperation);

    var id = req.params.id.toLowerCase(); //CAMBIAR ESTE DATO POR LA VARIABLE QUE CONTENDRÁ LOS ID's DE LOS USUARIOS REGISTRADOS
    var update = req.body;
    var bool = false;
    var query = { email: id, typeOfUser: 'TUser' };

    User.findOne(query, (err, usersStored) => {
        if(err) {
            res.status(500).send({message: 'Error en la petición'});
        }else {
            if(!usersStored) {
                res.status(404).send({message: 'No se ha encontrado el dato'});
            }else {
                if(typeOfOperationOK == true && !req.body.email){
                    User.findOneAndUpdate({ email: id }, update, (err, userUpdate) => {
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

    var tokeninitial = req.headers.token;
    var typeOfOperation = req.headers.typeofoperation;
    var nameOfOperation = req.headers.nameofoperation;
    var typeOfOperationOK = permit.hasAccess(tokeninitial, typeOfOperation, nameOfOperation);

    var id = req.params.id.toLowerCase(); //CAMBIAR ESTE DATO POR LA VARIABLE QUE CONTENDRÁ LOS ID's DE LOS USUARIOS REGISTRADOS
    var update = req.body;
    var bool = false;

    if(typeOfOperationOK == true && id == payload._id){
        User.findOneAndRemove({ email: id }, update, (err, userDelete) => {
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
    }else if(typeOfOperationOK == false){
        res.status(200).send({message: 'No tienes permisos para borrar tus datos'});
    }else if(id != payload._id) {
        res.status(200).send({message: 'Los ID´s no coinciden'});
    }else{
        res.status(404).send({ message: 'Errores en los datos typeOfOperationOK: '+typeOfOperationOK+' - ID (users) : '+id+' - ID (token): '+payload._id });
    }
}

function deleteAdministrator(req, res){
    var tokeninitial = req.headers.token;
    var typeOfOperation = req.headers.typeofoperation;
    var nameOfOperation = req.headers.nameofoperation;
    var typeOfOperationOK = permit.hasAccess(tokeninitial, typeOfOperation, nameOfOperation);

    var id = req.params.id.toLowerCase(); //CAMBIAR ESTE DATO POR LA VARIABLE QUE CONTENDRÁ LOS ID's DE LOS USUARIOS REGISTRADOS
    var update = req.body;
    var bool = false;
    var query = { email: id, typeOfUser: 'Administrator' };

    User.findOne(query, (err, usersStored) => {
        if(err) {
            res.status(500).send({message: 'Error en la petición'});
        }else {
            if(!usersStored) {
                res.status(404).send({message: 'No se ha encontrado el dato'});
            }else {
                if(typeOfOperationOK == true){ //se quita payload y se enlista un array con todos los id's de los usuarios administradores
                    User.findOneAndRemove({ email: id }, update, (err, userDelete) => {
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
    var tokeninitial = req.headers.token;
    var typeOfOperation = req.headers.typeofoperation;
    var nameOfOperation = req.headers.nameofoperation;
    var typeOfOperationOK = permit.hasAccess(tokeninitial, typeOfOperation, nameOfOperation);

    var id = req.params.id.toLowerCase(); //CAMBIAR ESTE DATO POR LA VARIABLE QUE CONTENDRÁ LOS ID's DE LOS USUARIOS REGISTRADOS
    var update = req.body;
    var bool = false;
    var query = { email: id, typeOfUser: 'TUser' };

    User.findOne(query, (err, usersStored) => {
        if(err) {
            res.status(500).send({message: 'Error en la petición'});
        }else {
            if(!usersStored) {
                res.status(404).send({message: 'No se ha encontrado el dato'});
            }else {
                if(typeOfOperationOK == true){ //se quita payload y se enlista un array con todos los id's de los usuarios administradores
                    User.findOneAndRemove({ email: id }, update, (err, userDelete) => {
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
//--------------------------------------------New--------------------------------------------

module.exports = {
    userCreate,
    userUpdate,
    userDelete
};
