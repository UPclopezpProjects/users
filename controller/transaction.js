var axios = require('axios');

function merchantData(req, res){
    serviceInitMerchant(req, function(data, err) {
        if (err) {
            res.status(500).send({ message: 'Error en la petición' });
        }else {
            res.status(200).send({ message: data.message });
            console.log(data);
        }
    });
}

/*
Funciones encargada de invocar los servicios RESTful y devolver el objeto JSON correspondiente.
*/
function serviceInitMerchant(req, next) {
    var map = req.body.map;
    var id = req.body.id;
    var fId = req.body.fId;
    var date = req.body.date;
    var description = req.body.description;
    var type = req.body.type;

    var data;
    var url = 'http://'+host+':'+port.merchant+''+path.merchant+'';
    axios.post(url, {
        map: map,
        id: id,
        fId: fId,
        date: date,
        description: description,
        type: type
    })
    .then(response => {
        //console.log(response.data);
        data = response.data;
        next(data, null);
    })
    .catch(error => {
        console.log(error);
        next(null, error);
    });
}

module.exports = {
    merchantData
};
