var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ConfirmationSchema = Schema({
    email: {type: String, required: true, max: 100},
    code: {type: String, required: true, max: 100},
});

module.exports = mongoose.model('Confirmation', ConfirmationSchema);