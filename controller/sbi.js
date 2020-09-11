var error = require("../controller/errResulUtils");

var initializer = {};

initializer.permit = function (req, res){
	var token=req.query.token;
	var typeEvent=req.query.typeEvent;
	var obj={body:{token:token,
					typeEvent:typeEvent
				  }
			};
	res.send(obj);
	/*
	var answerCode = root.Root(obj,res);
	if(answerCode!=0){ 
		//it means that an error has happened
		//These erros are controlled when not callback functions are implemented yet 
		res.send(error.jsonRespError(answerCode)); //error code is sent as an answer
	}else{//it means that an error number 0 happened, it is out our reach
		//res.send("Root created with address:" + addressU);
	}
	*/
}

module.exports = initializer;