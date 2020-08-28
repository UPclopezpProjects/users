var error = require("../controller/errResulUtils");
var token = require("../controller/token");

var initializer = {};

initializer.createToken = function (req, res){
	var email=req.query.email;
	var password=req.query.password;
	var obj={body:{email:email,
					password:password
				  }
			};
	var answerCode = token.Token(obj,res);
	if(answerCode!=0){ 
		//it means that an error has happened
		//These erros are controlled when not callback functions are implemented yet 
		res.send(error.jsonRespError(answerCode)); //error code is sent as an answer
	}else{//it means that an error number 0 happened, it is out our reach
		//res.send("Root created with address:" + addressU);
	}
}

initializer.isValid = function (req, res){
	var tok=req.query.token;
	token.isValidTempo(tok,res);
}

initializer.who = function (req, res){
	var tok=req.query.token;
	token.whoPublic(tok,res);
}


module.exports = initializer;