var jwt = require('jwt-simple');
var moment = require('moment');
var secret = 'secret_key';
var algorithm = 'HS256';
//var algorithm = 'HS384';


exports.createToken = function(req, user, type){
	var payload = {
		userId: user._id,
		userEmail: user.email,
		userPassword: user.password,
		typeOfUser: user.typeOfUser,
		initialToken: user.initialToken,
		key: req.body.key, //REVISAR
		DP: req.body.dp,
		DC: type.description,
		creation: moment().unix(), //Momento de creación del token (fecha y hora exacta)
		life: moment().add(7, 'd').unix() //Agrega 7 días en tiempo UNIX
	};
	return jwt.encode(payload, secret, algorithm);
};

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

exports.renovationToken = function(data){
	var payload = {
		userId: data._id,
		userEmail: data.email,
		token: data.generateToken,
		creation: data.creation, //Momento de creación del token (fecha y hora exacta)
		life: data.life //Cambiar esto para que solo dure mientras esté la sesión
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