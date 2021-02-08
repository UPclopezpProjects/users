var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = Schema({
    email: {type: String, required: true, max: 100},
    password: {type: String, required: true, max: 100},
    typeOfUser: {type: String, required: true, max: 20}, //"rootCreation","admorCreation" //
    nameOfUser: {type: String, required: true, max: 20},
    status: {type: String, required: true, max: 20},
    creationDate: {type: String, required: true, max: 20},
    initialToken: {type: String, required: true, max: 50}, //
    dp: {type: String, required: true, max: 200},
    addressU: {type: String, required: true, max: 200},
    addressContract: {type: String, required: true, max: 200}, //
    addressTransaction: {type: String, required: true, max: 200} //
});

//Example about models
//http://micaminomaster.com.co/herramientas-desarrollo/nodejs-projecto-esqueleto-mvc-crud/
module.exports = mongoose.model('User', UserSchema);