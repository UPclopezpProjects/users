var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ConsumerSchema = Schema({
    email: {type: String, required: true, max: 100},
    password: {type: String, required: true, max: 100},
    nameOfUser: {type: String, required: true, max: 100},
    surnameP: {type: String, required: true, max: 100},
    surnameM: {type: String, required: true, max: 100},
    ip: {type: String, required: true, max: 100},
    typeOfUser: {type: String, required: true, max: 20},
    dp: {type: String, required: true, max: 200},

});

module.exports = mongoose.model('Consumer', ConsumerSchema);