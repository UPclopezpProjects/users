var Dictionary = require("../models/Transactions");

function hasAcces(req, res){
	var typeOfOperation = req.body.typeOfOperation;
	var typeOfUser = req.body.typeOfUser;
	var query = {typeOfOperation: typeOfOperation, typeOfUser: typeOfUser};

	Dictionary.findOne(query, (err, data) =>{
		if(err){
			res.status(500).send({message: 'Error en la petición'});
		}else{
			if(!data){
				console.log(data);
				res.status(404).send({message: 'El dato no existe'});
			}else{
				User.findOne({ token: Token }, (err, data) => {
					if(err){
						res.status(500).send({message: 'Error en la petición'});
					}else{
						if(!data){
							res.status(404).send({message: 'El token no existe'});
						}else{
							if(data.life <= valid){
								console.log("Token caducado");
								res.status(200).send({response: bol});
							}else{
								bol = true;
								console.log("Token vigente");
								res.status(200).send({response: bol});
							}
						}
					}
				});
			}
		}
	});
}
module.exports = {
	hasAcces
};