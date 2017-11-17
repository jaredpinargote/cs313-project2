var express = require('express');
var app = express();
var url = require('url');
var pg = require("pg");

connectionString = process.env.DATABASE_URL
if(connectionString == null){
    connectionString = "postgres://postgres:1q\@W3e\$R@localhost/cs313";
}

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
    console.log("Working");
    response.sendFile(__dirname + "/public/html/redirect.html");
});

app.get('/result', function(request, response) {
    response.render('pages/result');
});

app.use(express.static('public/html'));

app.get('/newGame.php', function(request, response) {
    newGame(response);
});

function query(sql, params, response, callback){
    var client = new pg.Client(connectionString);
    client.connect(function(err) {
        if (err) {
            console.log("Error connecting to DB: ")
            console.log(err);
            callback(err, null, response);
        }
        var query = client.query(sql, params, function(err, result) {
            client.end(function(err) {
                if (err) throw err;
            });

            if (err) {
                console.log("Error in query: ")
                console.log(err);
                callback(err, null, response);
            }
            console.log("SQL: " + sql);
            console.log("PARAMS " + JSON.stringify(params));
            console.log("Found result: " + JSON.stringify(result.rows));
            callback(null, result.rows, response);
        });
    });
}

function newGame(response) {
    var sql = "INSERT INTO public.\"Games\" (id, \"startTimestamp\", \"endTimestamp\", \"stageID\") VALUES (default,NULL,NULL,NULL) RETURNING id";
    var params = [];
    query(sql, params, response, newRoomCode);
}

function newRoomCode(err, result, response) {
    var roomCode = randomString();
    var sql = "INSERT INTO public.\"RoomCodes\" (\"roomCode\", \"gameID\") VALUES ( $1::text , $2::int ) RETURNING *";
    var params = [roomCode, result[0].id];
    query(sql, params, response, handleNewGame);
}

function handleNewGame(err, result, response) {
    console.log("Handle New Game: " + JSON.stringify(result.rows));
    returnJSON(err, result[0], response)
}

function returnJSON(error, result, response) {
    if (error) {
        response.status(500).json({"success":false,"data":error});
    } else {
        response.status(200).json(result);
    }
}

function randomString() {
    var length = 4;
    var str = "";
    for (var i = 0; i < length; i++) {
        num = Math.floor(Math.random() * 26) + 65;
        chr = String.fromCharCode(num);
        console.log(num+":"+chr);
        str += chr;
    }
    return str;
}

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});
