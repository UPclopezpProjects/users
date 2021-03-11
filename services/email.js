var Confirmation = require('../models/Confirmations');
var User = require('../models/Users');

var nodemailer = require('nodemailer');
var bcrypt = require('bcrypt-nodejs');


function sendEmail(email){
    var confirmation = new Confirmation();
    var code = null;
    bcrypt.hash(email, null, null, function(err, hash){
        code = hash;
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: 'pruebas.postman.residencia@gmail.com',
                pass: 'Postman123_'
            }
        });

        var mailOptions = {
            from: 'pruebas.postman.residencia@gmail.com',
            to: email,
            subject: 'Email confirmation - AvocadoPath',
            text: 'Please click: http://localhost:3001/getEmail/?code='+code+'&email='+email+''
        };

        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                console.log(error);
            } else {
                confirmation.email = email;
                confirmation.code = code;
                confirmation.save((err, confirmationStored) => {
                    if(err) {
                        console.log('message: Error al guardar los datos');
                    }else{
                        if(!confirmationStored) {
                        console.log('message: El dato no ha sido guardado');
                        }else{
                        console.log(confirmationStored);
                        return confirmationStored;
                        }
                    }
                });
            }
        });
    });
}

function getEmail(req, res){
    var id = req.query.code;
    var email = req.query.email;
    var bool = false;
    Confirmation.findOneAndRemove({ email: email, code: id }, (err, confirmationDelete) => {
        if(err){
            res.status(500).send({message: 'Error al eliminar los datos'});
        }else{
            if(!confirmationDelete){
              User.findOne({ email: email, typeOfUser: 'Consumer' }, (err, userStored) => {
                if(err) {
                  res.status(500).send({ message: 'Error en la petición' });
                }else {
                  if(!userStored) {
                    res.status(404).send({message: 'El dato no existe'});
                  }else {
                    if(userStored.status == 'true'){
                      res.status(200).send({message: 'Ya haz confirmado tu dirección email'});
                    }else {
                      res.status(200).send({message: 'No deberías estar acá'});
                    }
                  }
                }
              });
            }else{
                bool = true;
                User.findOneAndUpdate({ email: email, typeOfUser: 'Consumer' }, {status: bool}, (err, userUpdate) => {
                    if(err){
                        res.status(500).send({message: 'Error al actualizar los datos'});
                    }else{
                        if(!userUpdate){
                            res.status(404).send({message: 'El dato no existe y no ha sido actualizado'});
                        }else{
                          res.status(200).send({message: bool});
                        }
                    }
                });
            }
        }
    });
}

module.exports = {
    sendEmail,
    getEmail
};
