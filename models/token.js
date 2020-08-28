var mongoose = require('mongoose');
var Schema = mongoose.Schema;
 
var TokenSchema = new Schema({
    email: {type: String, required: true, max: 50},
    token: {type: String, required: true, max: 50},
    creation: {type: String, required: true, max: 20},
    life: {type: String, required: true, max: 5}
});

//Example about models
//http://micaminomaster.com.co/herramientas-desarrollo/nodejs-projecto-esqueleto-mvc-crud/ 
module.exports = mongoose.model('Token', TokenSchema);