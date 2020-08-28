var root = require("../controller/root");
var error = require("../controller/errResulUtils");

var initializer = {};


initializer.createAdmor = function (req, res){
	var token=req.query.token;
	var email=req.query.email;
	var password=req.query.password;
	var addressA=req.query.addressA; //obtain Administrator address
	//var addressR=req.query.addressR; //obtain root address
	//var addressContract=req.query.addressContract; //obtain Contract Address of the root

	var obj={body:{ token:token,
					email:email,
					password:password,
					addressU:addressA,
					addressR:" ",
					addressContract:" "
				  }
			};
	root.AddAdmor(obj,res); //Root is who creates each administrator
}



module.exports = initializer;