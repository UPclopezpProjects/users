var jwt = require('jwt-simple');
var moment = require('moment');
var secret = 'secret_key';
var algorithm = 'HS256';
//var algorithm = 'HS384';


exports.createToken = function(user){
	var payload = {
		_id: user.email.toLowerCase(),
		typeOfUser: user.typeOfUser,
		DP: user.dp,
		creation: moment().unix(), //Momento de creación del token (fecha y hora exacta)
		life: moment().add(7, 'd').unix() //Agrega 7 días en tiempo UNIX
	};
	return jwt.encode(payload, secret, algorithm);
};
/*
exports.generateToken = function(user, dp){
	var payload = {
		userId: user._id,
		userEmail: user.email,
		userPassword: user.password,
		typeOfUser: user.typeOfUser,
		DP: dp,
		creation: moment().unix(), //Momento de creación del token (fecha y hora exacta)
		life: moment().add(7, 'days').unix() //Cambiar esto para que solo dure mientras esté la sesión
	};
	return jwt.encode(payload, secret, algorithm);
};
*/
exports.renovationToken = function(user){
	var payload = {
		_id: user._id,
		typeOfUser: user.typeOfUser,
		DP: user.DP,
		creation: user.creation,
		life: user.life,
	};
	return jwt.encode(payload, secret, algorithm);
};

/*
module.exports = {
	createToken,
	generateToken,
	renovationToken
};
*/