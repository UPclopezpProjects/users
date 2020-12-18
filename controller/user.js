//
var User = require("../models/Users");

var axios = require('axios');
var bcrypt = require('bcrypt-nodejs');
var jwt = require('jwt-simple');
var md5 = require('md5');
var mongoosePaginate = require('mongoose-pagination');
//var mongoosePaginatee = require('mongoose-paginate-v2');

var service_jwt = require('../services/jwt');
var token = require("./token");
var permit = require("./permit");
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
            user.addressContract =  auditData.addCont;
            user.addressTransaction = auditData.addTran;

            //Pruebas con MD5
            var jsonData = {
                email: req.body.email,
                password: req.body.password,
                typeOfUser: req.body.typeOfUser,
                initialToken: req.body.initialToken,
                typeOfOperation: req.body.typeOfOperation,
                nameOfOperation: req.body.nameOfOperation,
                addressU: req.body.addressU,
                dp: req.body.dp
            };
            var hashX = md5(JSON.stringify(jsonData));
            if(req.body.hashX == hashX){
                console.log("MD5 correcto");
            }else{
                console.log("MD5 incorrecto");
            }

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
                                        var generatedToken = service_jwt.createToken(user); //Guardar token en la base de datos
                                        token.tokenCreation(generatedToken, user.email);
                                        /*res.status(200).send({
                                            message: userStored
                                        });*/
                                        res.status(200).send({
                                            user: userStored,
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
                res.status(404).send({ message: 'Errores en los datos initialToken (users): '+user.initialToken+' - Token (audit): '+auditData.Token });
                //res.status(404).send({ message: 'No tienes permisos para crear usuarios de tipo administrador' });
            }else if(req.body.hashX != hashX){
                res.status(404).json({ message: 'Errores en los datos hashX (client): '+req.body.hashX+' - hashX(api): '+hashX });
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
            user.addressContract =  auditData.addCont;
            user.addressTransaction = auditData.addTran;

            //var key = req.body.key; //REVISAR
            //var hashX = req.body.hashX; //REVISAR

            var tokeninitial = req.headers.authorization;
            var typeOfOperation = req.body.typeOfOperation;
            var nameOfOperation = req.body.nameOfOperation;
            permit.hasAccess(tokeninitial, typeOfOperation, nameOfOperation)
                .then(typeOfOperationOK => {
                    //Pruebas con MD5
                    var jsonData = {
                        email: req.body.email,
                        password: req.body.password,
                        typeOfUser: req.body.typeOfUser,
                        initialToken: req.body.initialToken,
                        typeOfOperation: req.body.typeOfOperation,
                        nameOfOperation: req.body.nameOfOperation,
                        addressU: req.body.addressU,
                        dp: req.body.dp
                    };
                    var hashX = md5(JSON.stringify(jsonData));
                    if(req.body.hashX == hashX){
                        console.log("MD5 correcto");
                    }else{
                        console.log("MD5 incorrecto");
                    }
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
                        return res.status(404).json({ message: 'No tienes permisos' });
                    }else if(req.body.hashX != hashX){
                        return res.status(404).json({ message: 'HashX no coincide' });
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
            user.addressContract =  auditData.addCont;
            user.addressTransaction = auditData.addTran;

            //var key = req.body.key; //REVISAR
            //var hashX = req.body.hashX; //REVISAR

            var tokeninitial = req.headers.authorization;
            var typeOfOperation = req.body.typeOfOperation;
            var nameOfOperation = req.body.nameOfOperation;
            permit.hasAccess(tokeninitial, typeOfOperation, nameOfOperation)
                .then(typeOfOperationOK => {
                    //Pruebas con MD5
                    var jsonData = {
                        email: req.body.email,
                        password: req.body.password,
                        typeOfUser: req.body.typeOfUser,
                        initialToken: req.body.initialToken,
                        typeOfOperation: req.body.typeOfOperation,
                        nameOfOperation: req.body.nameOfOperation,
                        addressU: req.body.addressU,
                        dp: req.body.dp
                    };
                    var hashX = md5(JSON.stringify(jsonData));
                    if(req.body.hashX == hashX){
                        console.log("MD5 correcto");
                    }else{
                        console.log("MD5 incorrecto");
                    }
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
                        return res.status(404).json({ message: 'No tienes permisos' });
                    }else if(req.body.hashX != hashX){
                        return res.status(404).json({ message: 'HashX no coincide' });
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

/*
Funciones encargada de invocar los servicios RESTful y devolver el objeto JSON correspondiente.
*/
function serviceInit(req, next) {
    var key = req.body.addressU;
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
        console.log(error);
        next(null, error);
    });
}

function decodeToken(token){
    var secret = 'secret_key';
    var payload = jwt.decode(token, secret);
    return payload;
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
    var tokeninitial = req.headers.authorization;
    var typeOfOperation = req.body.typeOfOperation;
    var nameOfOperation = req.body.nameOfOperation;
    permit.hasAccess(tokeninitial, typeOfOperation, nameOfOperation)
    .then(typeOfOperationOK => {
        tokeninitial.replace(/['"]+/g, '');
        var payload = decodeToken(tokeninitial);
        var id = req.params.id.toLowerCase(); //CAMBIAR ESTE DATO POR LA VARIABLE QUE CONTENDRÁ LOS ID's DE LOS USUARIOS REGISTRADOS
        var bool = false;
        var jsonData = {
            email: id,
            password: req.body.password,
            typeOfUser: req.body.typeOfUser,
            initialToken: req.body.initialToken,
            typeOfOperation: req.body.typeOfOperation,
            nameOfOperation: req.body.nameOfOperation,
            addressU: req.body.addressU,
            dp: req.body.dp
        };
        var hashX = md5(JSON.stringify(jsonData));
        console.log(hashX);
        if(req.body.hashX == hashX){
            console.log("MD5 correcto");
        }else{
            console.log("MD5 incorrecto");
        }
        if(typeOfOperationOK == true && id == payload._id && !req.body.email && req.body.hashX == hashX){
            //Pedir contraseña para confimar cambio
            if(req.body.password){
                bcrypt.hash(req.body.password, null, null, function(err, hash){
                    req.body.password = hash;
                    User.findOneAndUpdate({ email: id }, {password: req.body.password, dp: req.body.dp}, (err, userUpdate) => {
                        if(err){
                            res.status(500).send({message: 'Error al actualizar los datos'});
                        }else{
                            if(!userUpdate){
                                res.status(404).send({message: 'El dato no existe y no ha sido actualizado'});
                            }else{
                                bool = true;
                                res.status(200).send({message: bool});
                            }
                        }
                    });
                });
            }else{
                User.findOneAndUpdate({ email: id }, {dp: req.body.dp}, (err, userUpdate) => {
                    if(err){
                        res.status(500).send({message: 'Error al actualizar los datos'});
                    }else{
                        if(!userUpdate){
                            res.status(404).send({message: 'El dato no existe y no ha sido actualizado'});
                        }else{
                            bool = true;
                            res.status(200).send({message: bool});
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
        }else if(req.body.hashX != hashX){
            return res.status(404).json({ message: 'HashX no coincide' });
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
                        email: id,
                        password: req.body.password,
                        typeOfUser: req.body.typeOfUser,
                        initialToken: req.body.initialToken,
                        typeOfOperation: req.body.typeOfOperation,
                        nameOfOperation: req.body.nameOfOperation,
                        addressU: req.body.addressU,
                        dp: req.body.dp
                    };
                    var hashX = md5(JSON.stringify(jsonData));
                    console.log(hashX);
                    if(req.body.hashX == hashX){
                        console.log("MD5 correcto");
                    }else{
                        console.log("MD5 incorrecto");
                    }
                    if(typeOfOperationOK == true && !req.body.email && req.body.hashX == hashX){
                        //Pedir contraseña para confimar cambio
                        if(req.body.password){
                            bcrypt.hash(req.body.password, null, null, function(err, hash){
                                req.body.password = hash;
                                User.findOneAndUpdate({ email: id }, {password: req.body.password, dp: req.body.dp}, (err, userUpdate) => {
                                    if(err){
                                        res.status(500).send({message: 'Error al actualizar los datos'});
                                    }else{
                                        if(!userUpdate){
                                            res.status(404).send({message: 'El dato no existe y no ha sido actualizado'});
                                        }else{
                                            bool = true;
                                            res.status(200).send({message: bool});
                                        }
                                    }
                                });
                            });
                        }else{
                            User.findOneAndUpdate({ email: id }, {dp: req.body.dp}, (err, userUpdate) => {
                                if(err){
                                    res.status(500).send({message: 'Error al actualizar los datos'});
                                }else{
                                    if(!userUpdate){
                                        res.status(404).send({message: 'El dato no existe y no ha sido actualizado'});
                                    }else{
                                        bool = true;
                                        res.status(200).send({message: bool});
                                    }
                                }
                            });
                        }
                    }else if(typeOfOperationOK == false){
                        res.status(404).send({message: 'No tienes permisos para actualizar tus datos'});
                    }else if(req.body.email){
                        res.status(404).send({message: 'No puedes actualizar el email - contacta con el desarrollador'});
                    }else if(req.body.hashX != hashX){
                        return res.status(404).json({ message: 'HashX no coincide' });
                    }else{
                        return res.status(404).json({ message: 'Errores en los datos typeOfOperationOK: '+typeOfOperationOK+' - initialToken (users): '+user.initialToken+' - Token (audit): '+auditData.Token+' - hashX (client): '+req.body.hashX+' - hashX(api): '+hashX });
                    }
                }
            }
        });
    });
}

function updateTUser(req, res){
    var tokeninitial = req.headers.authorization;
    var typeOfOperation = req.body.typeOfOperation;
    var nameOfOperation = req.body.nameOfOperation;
    permit.hasAccess(tokeninitial, typeOfOperation, nameOfOperation)
    .then(typeOfOperationOK => {
        var id = req.params.id.toLowerCase(); //CAMBIAR ESTE DATO POR LA VARIABLE QUE CONTENDRÁ LOS ID's DE LOS USUARIOS REGISTRADOS
        var bool = false;
        var query = { email: id, typeOfUser: 'TUser' };
        User.findOne(query, (err, usersStored) => {
            if(err) {
                res.status(500).send({message: 'Error en la petición'});
            }else {
                if(!usersStored) {
                    res.status(404).send({message: 'No se ha encontrado el dato'});
                }else {
                    var jsonData = {
                        email: id,
                        password: req.body.password,
                        typeOfUser: req.body.typeOfUser,
                        initialToken: req.body.initialToken,
                        typeOfOperation: req.body.typeOfOperation,
                        nameOfOperation: req.body.nameOfOperation,
                        addressU: req.body.addressU,
                        dp: req.body.dp
                    };
                    var hashX = md5(JSON.stringify(jsonData));
                    console.log(hashX);
                    if(req.body.hashX == hashX){
                        console.log("MD5 correcto");
                    }else{
                        console.log("MD5 incorrecto");
                    }
                    if(typeOfOperationOK == true && !req.body.email && req.body.hashX == hashX){
                        //Pedir contraseña para confimar cambio
                        if(req.body.password){
                            bcrypt.hash(req.body.password, null, null, function(err, hash){
                                req.body.password = hash;
                                User.findOneAndUpdate({ email: id }, {password: req.body.password, dp: req.body.dp}, (err, userUpdate) => {
                                    if(err){
                                        res.status(500).send({message: 'Error al actualizar los datos'});
                                    }else{
                                        if(!userUpdate){
                                            res.status(404).send({message: 'El dato no existe y no ha sido actualizado'});
                                        }else{
                                            bool = true;
                                            res.status(200).send({message: bool});
                                        }
                                    }
                                });
                            });
                        }else{
                            User.findOneAndUpdate({ email: id }, {dp: req.body.dp}, (err, userUpdate) => {
                                if(err){
                                    res.status(500).send({message: 'Error al actualizar los datos'});
                                }else{
                                    if(!userUpdate){
                                        res.status(404).send({message: 'El dato no existe y no ha sido actualizado'});
                                    }else{
                                        bool = true;
                                        res.status(200).send({message: bool});
                                    }
                                }
                            });
                        }
                    }else if(typeOfOperationOK == false){
                        res.status(404).send({message: 'No tienes permisos para actualizar tus datos'});
                    }else if(req.body.email){
                        res.status(404).send({message: 'No puedes actualizar el email - contacta con el desarrollador'});
                    }else if(req.body.hashX != hashX){
                        return res.status(404).json({ message: 'HashX no coincide' });
                    }else{
                        return res.status(404).json({ message: 'Errores en los datos typeOfOperationOK: '+typeOfOperationOK+' - initialToken (users): '+user.initialToken+' - Token (audit): '+auditData.Token+' - hashX (client): '+req.body.hashX+' - hashX(api): '+hashX });
                    }
                }
            }
        });
    });
}

function userDelete(req, res) {
    var typeOfOperation = req.body.typeOfOperation;
    var nameOfOperation = req.body.nameOfOperation;
    console.log(req.body);
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
        console.log(typeOfOperationOK);

        tokeninitial.replace(/['"]+/g, '');
        var payload = decodeToken(tokeninitial);
        var id = req.params.id.toLowerCase(); //CAMBIAR ESTE DATO POR LA VARIABLE QUE CONTENDRÁ LOS ID's DE LOS USUARIOS REGISTRADOS
        var bool = false;
        if(typeOfOperationOK == true && id == payload._id && !req.body.email){
            //Pedir contraseña para confimar cambio
            User.findOneAndRemove({ email: id }, (err, userUpdate) => {
                    if(err){
                        res.status(500).send({message: 'Error al actualizar los datos'});
                    }else{
                        if(!userUpdate){
                            res.status(404).send({message: 'El dato no existe y no ha sido actualizado'});
                        }else{
                            bool = true;
                            res.status(200).send({message: bool});
                        }
                    }
                });
        }else if(typeOfOperationOK == false){
            res.status(404).send({message: 'No tienes permisos para actualizar tus datos'});
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
                            User.findOneAndRemove({ email: id }, (err, userUpdate) => {
                                if(err){
                                    res.status(500).send({message: 'Error al actualizar los datos'});
                                }else{
                                    if(!userUpdate){
                                        res.status(404).send({message: 'El dato no existe y no ha sido actualizado'});
                                    }else{
                                        bool = true;
                                        res.status(200).send({message: bool});
                                    }
                                }
                            });
                    }else if(typeOfOperationOK == false){
                        res.status(404).send({message: 'No tienes permisos para actualizar tus datos'});
                    }else if(req.body.email){
                        res.status(404).send({message: 'No puedes actualizar el email - contacta con el desarrollador'});
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
        var query = { email: id, typeOfUser: 'TUser' };
        User.findOne(query, (err, usersStored) => {
            if(err) {
                res.status(500).send({message: 'Error en la petición'});
            }else {
                if(!usersStored) {
                    res.status(404).send({message: 'No se ha encontrado el dato'});
                }else {
                    if(typeOfOperationOK == true && !req.body.email){
                        //Pedir contraseña para confimar cambio
                            User.findOneAndRemove({ email: id }, (err, userUpdate) => {
                                if(err){
                                    res.status(500).send({message: 'Error al actualizar los datos'});
                                }else{
                                    if(!userUpdate){
                                        res.status(404).send({message: 'El dato no existe y no ha sido actualizado'});
                                    }else{
                                        bool = true;
                                        res.status(200).send({message: bool});
                                    }
                                }
                            });
                    }else if(typeOfOperationOK == false){
                        res.status(404).send({message: 'No tienes permisos para actualizar tus datos'});
                    }else if(req.body.email){
                        res.status(404).send({message: 'No puedes actualizar el email - contacta con el desarrollador'});
                    }else{
                        res.status(404).send({ message: 'Errores en los datos typeOfOperationOK: '+typeOfOperationOK+' - ID (users) : '+id +' - ID (token): '+payload._id+' - Email: '+req.body.email });
                    }
                }
            }
        });
    });
}

function getUser(req, res){
    var userId = req.params.id;
    User.findOne({email: userId}, (err, users) => {
        if(err){
            res.status(500).send({message: 'Error en la petición'});
        }else{
            if(!users){
                res.status(404).send({message: 'El dato no existe'});
            }else{
                res.status(200).send({users});
            }
        }
    });
}
function getUsers(req, res){
    if(req.params.page){
        var page = req.params.page;
    }else{
        var page = 1;
    }
    var itemsPerPage = 3;
    User.find().sort('email').paginate(page, itemsPerPage, function(err, users, total){
        if(err){
            res.status(500).send({message: 'Error en la petición'});

        }else{
            if(!users){
                res.status(404).send({message: 'No hay datos'});
            }else{
                return res.status(200).send({
                    total_items: total,
                    users: users
                });
            }
        }
    });
}
//--------------------------------------------New--------------------------------------------

module.exports = {
    userCreate,
    userUpdate,
    userDelete,
    getUser,
    getUsers
};
