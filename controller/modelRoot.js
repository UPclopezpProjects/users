var root = require("../controller/root");
var error = require("../controller/errResulUtils");

var initializer = {};

initializer.createRoot = function (req, res){
	var answerCode = root.Root(req,res);
	if(answerCode!=0){ 
		//it means that an error has happened
		//These erros are controlled when not callback functions are implemented yet 
		res.send(error.jsonRespError(answerCode)); //error code is sent as an answer
	}else{//it means that an error number 0 happened, it is out our reach
		//res.send("Root created with address:" + addressRoot);
		var addressU=req.body.addressU;
		res.render('contractCreated', { resp: "Root created with address:" + addressU});
	}


	
}



initializer.getRootSCAddress = function (req, res){
	var email=req.body.email;
	var pass=req.body.pass;	
	var answer = root.getRootSCAddress(email,pass,res);
}


initializer.createAdmor = function (req, res){
}




module.exports = initializer;