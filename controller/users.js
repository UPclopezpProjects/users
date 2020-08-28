var User = require("../models/Users");
var errResulUtils = require("../controller/errResulUtils");

var initializer = {};
//Save root in database


initializer.save = function (req,addrC,addrT, statusp,resp,who) {
    var param = {   email:req.body.email,
                    password:req.body.password,
                    addressU:req.body.addressU,
                    addressContract:addrC,
                    addressTransaction:addrT,
                    status:statusp,
                    token:String(req.body.token)};
    console.log(String(req.body.token));                    
    var user = new User(param);
            
    user.save(function(err){
        if( err ){ 
            resp.send(errResulUtils.jsonRespError(50)); 
        }else{
            resp.send(errResulUtils.jsonRespOK(who,user._id));;
        }
    });    
}

module.exports = initializer;
