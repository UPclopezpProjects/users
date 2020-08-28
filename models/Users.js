var mongoose = require('mongoose');
var Schema = mongoose.Schema;
 
var UserSchema = new Schema({
    email: {type: String, required: true, max: 50},
    password: {type: String, required: true, max: 50},
    addressU: {type: String, required: true, max: 200},
    addressContract: {type: String, required: true, max: 200},
    addressTransaction: {type: String, required: true, max: 200},
    status: {type: String, required: true, max: 100},//"rootCreation","admorCreation"
    token:{type: String, required: true, max: 50}
});

//Example about models
//http://micaminomaster.com.co/herramientas-desarrollo/nodejs-projecto-esqueleto-mvc-crud/ 
module.exports = mongoose.model('User', UserSchema);