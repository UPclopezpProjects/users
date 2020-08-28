var initializer = {};


function answerResult(codigo){
	switch(codigo){
		case 1: res="Root id created ";break;
		case 2: res="Smart Contract address";break;
		case 3: res="Transaction address";break;
		case 4: res="Administrator id created in Root Smart Contract";break;
		case 10: res="Token generated";break;
		case 11: res="Token is valid";break;
		case 12: res="Token no valid";break;
		case 13: res="Owner of the token";break;
		default: res="Not Explanation";
	}
	return res;	
}


initializer.jsonRespOK = function (codigo) {
	var resp ={
		result: "Success",
		Explanation:answerResult(codigo)
	};
	return resp;
}


initializer.jsonRespOK = function (codigo,res) {
	var resp ={
		result: res,
		Explanation:answerResult(codigo)
	};
	return resp;
}


function answerError(codigo){
	switch(codigo){
		//Errors between 1 to 10 corresponds to Root creation
		//case 0 is not an error
		case 1: res="Error " + codigo + ": Root already created ";break;
		case 2: res="Error " + codigo + ": Someone else is trying to create the root";break;
		case 3: res="Error " + codigo + ": root has not been created";break;
		case 4: res="Error " + codigo + ": it is necessary to be a root for this request";break;
		//Errors respect to parameters
		case 10: res="Error " + codigo + ": some parameteres are empty";break;

		//Errors with respect to administrator
		case 20: res="Error " + codigo + ": the email for the administrator was already used";break;		
		case 21: res="Error " + codigo + ": the address for the administrator was already used";break;	

		//Errors with respect to users
		case 30: res="Error " + codigo + ": user does not exit";break;	
		//Errors respect to database conection
		case 50: res="Error " + codigo + ": problem accesing to the database";break;
		case 51: res="Error " + codigo + ": Check that mongodb is available";break;
		case 52: res="Error " + codigo + ": database unkown error"; break;
		case 53: res="Error " + codigo + ": query problems"; break;
		//Errors related with blockchain connection
		case 60: res="Error " + codigo + ": problem accesing to the blockchain";break;

		//About Token
		case 70: res="Error " + codigo + ": token not valid";break;
		default: res="Error " + codigo + ": Unkown";
	}
	return res;	
}


initializer.jsonRespError = function (codigo) {
	var resp ={
		result: "Error",
		Explanation:answerError(codigo)
	};
	return resp;
}


initializer.error = function (codigo) {
	return answerError(codigo);
}

initializer.someFieldIsEmpty = function(ob){
	var obj = ob.body;
	var n = Object.keys(obj).length;
	for(var i=0;i<n;i++){
		var field=Object.keys(obj)[i];
		var fieldV= obj[field];
		if(fieldV==""){
			return 10;
		}
	}
	return 0;
	
}



module.exports = initializer;