var express = require('express');
var app = express();
var url = require('url');

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
    response.render('pages/index');
});

app.get('/result', function(request, response) {
    response.render('pages/result');
});

app.get('/getRates', function(request, response) {
    var params = url.parse(request.url, true);
    var weight = params.query.weight;
    var type = params.query.type;
    params.query.price = weight * calculateRate(weight, type);
    response.render('pages/result', params.query);
});

function calculateRate(weight, type) {
    switch (type) {
        case "stamped":
            var weights = [1, 2, 3, 3.5];
            var rates   = [0.49, 0.70, 0.91, 1.12];
            return rate(weight, weights, rates);
            break;
        case "metered":
            var weights = [1, 2, 3, 3.5];
            var rates   = [0.46, 0.67, 0.88, 1.09];
            return rate(weight, weights, rates);
            break;
        case "flats":
            var weights = [1,2,3,4,5,6,7,8,9,10,11,12,13];
            var rates   = [0.98,1.19,1.40,1.61,1.82,2.03,2.24,2.45,2.66,2.87,3.08,3.29,3.50];
            return rate(weight, weights, rates);
            break;
        case "parcels":
            var weights = [1, 2, 3, 3.5];
            var rates   = [3.00,3.00,3.00,3.00,3.16,3.32,3.48,3.64,3.80,3.96,4.19,4.36,4.53];
            return rate(weight, weights, rates);
            break;
        default:
            break;
    }
}

function rate(weight, weights, rates) {
    for(var i = 0; i < weights.length; i++) {
        console.log("Key: " + weights[i] + " Weight: " + weight);
        if(weight < weights[i]) {
            return rates[i];
        }
    }
    return rates[rates.length-1];
}

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});
