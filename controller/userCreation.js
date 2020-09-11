var root = require("../controller/root");
var error = require("../controller/errResulUtils");

var initializer = {};

initializer.createUser = function (req, res){
	var email=req.query.email;
	var password=req.query.password;
	var addressU=req.query.addressU;
	var type=req.query.type; // 1 is the root
	var token=req.query.token; // 1 is the root	
	var obj={body:{email:email,
					password:password,
					addressU:addressU,
					token:token
				  }
			};
	var answerCode=0;
	switch(type){
		case "1":
			answerCode = root.Root(obj,res);
			break;
		//case "2":
			//answerCode = root.AddAdmor(obj,res);
		default: 
			answerCode =31;
	}


	if(answerCode!=0){ 
		//it means that an error has happened
		//These erros are controlled when not callback functions are implemented yet 
		res.send(error.jsonRespError(answerCode)); //error code is sent as an answer
	}else{//it means that an error number 0 happened, it is out our reach
		//res.send("Root created with address:" + addressU);
	}
}


initializer.getAddContrR = function (req, res){
	var token=req.query.token;	
	var obj={body:{token:token}};
	root.getAddContrR(obj,res);
}

initializer.getAddTransR = function (req, res){
	var token=req.query.token;	
	var obj={body:{token:token}};
	root.getAddTransR(obj,res);
}



module.exports = initializer;