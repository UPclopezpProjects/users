var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TransactionSchema = Schema({
   stage: {type: String, required: true, max: 100},
    serviceName: {type: String, required: true, max: 100},
    typeOfOperation: {type: String, required: true, max: 100},
    nameOfOperation: {type: String, required: true, max: 100},
    permitAccessTo: {type: String, required: true, max: 300},
    description: {type: String, required: true, max: 100}
});

//Example about models
//http://micaminomaster.com.co/herramientas-desarrollo/nodejs-projecto-esqueleto-mvc-crud/
module.exports = mongoose.model('Transaction', TransactionSchema);