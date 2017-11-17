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
    response.sendFile(__dirname + "/public/html/redirect.html");
});

app.use(express.static('public/html'));

/**
 * ADAPTERS FOR PHP PROJECT
 * 
 * Instead of rewriting client side code, redirect
 * the request to a NodeJS function
 */
app.get('/newGame.php', newGame);
app.get('/newPlayer.php', findGameWithRoomCode);
app.get('/playersInGame.php', getPlayersList);
app.get('/everyoneIn.php', everyoneIn);
// app.get('/newDrawing.php', newDrawing);

/**
 * QUERY
 * 
 * Used to simplify SQL queries
 * 
 * @param {string} sql : SQL string
 * @param {array} params : Parameter array
 * @param {*} request : Used to pass variables through callbacks
 * @param {*} response : Used to pass response through callbacks
 * @param {*} callback : Callback
 */
function query(sql, params, request, response, callback){
    var client = new pg.Client(connectionString);
    client.connect(function(err) {
        if (err) {
            console.log("Error connecting to DB: ")
            console.log(err);
            callback(err, null, request, response);
        }
        var query = client.query(sql, params, function(err, result) {
            client.end(function(err) {
                if (err) throw err;
            });

            if (err) {
                console.log("Error in query: ")
                console.log(err);
                callback(err, null, request, response);
            } else if (result == undefined || result == null) {
                console.log("No results!");
                callback("No results", null, response);
            } else {
                console.log("SQL: " + sql);
                console.log("PARAMS " + JSON.stringify(params));
                console.log("Found result: " + JSON.stringify(result.rows));
                callback(null, result.rows, request, response);
            }
        });
    });
}

/**
 * RETURN_JSON
 * 
 * Used to return JSON to client
 * 
 * @param {*} error : Error messages
 * @param {*} result : result from SQL or data to send back
 * @param {*} response : Response to send
 */
function returnJSON(error, result, response) {
    if (error) {
        response.status(500).json({"success":false,"data":error});
    } else {
        response.status(200).json(result);
    }
}

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});


/**
 * HELPER FUNCTIONS
 */

// CREATE A NEW GAME
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
function newGame(request, response) {
    var sql = "INSERT INTO public.\"Games\" (id, \"startTimestamp\", \"endTimestamp\", \"stageID\") VALUES (default,NULL,NULL,NULL) RETURNING id";
    var params = [];
    query(sql, params, request, response, newRoomCode);
}
function newRoomCode(err, result, request, response) {
    if (err) {
        console.log("Error in query: ")
        console.log(err);
        returnJSON(err, null, response);
    } else if (result == undefined || result == null) {
        console.log("No results!");
        returnJSON("No results", null, response);
    }
    var roomCode = randomString();
    var sql = "INSERT INTO public.\"RoomCodes\" (\"roomCode\", \"gameID\") VALUES ( $1::text , $2::int ) RETURNING *";
    var params = [roomCode, result[0].id];
    query(sql, params, request, response, handleNewGame);
}
function handleNewGame(err, result, request, response) {
    console.log("Handle New Game: " + JSON.stringify(result.rows));
    returnJSON(err, result[0], response)
}

// CREATE A NEW PLAYER
function findGameWithRoomCode(request, response) {
    var sql = "SELECT * FROM public.\"RoomCodes\" WHERE \"RoomCodes\".\"roomCode\" = $1::text";
    var params = [request.query.roomCode];
    query(sql, params, request, response, newPlayer);
}
function newPlayer(err, result, request, response) {
    if (err) {
        console.log("Error in query: ")
        console.log(err);
        returnJSON(err, null, response);
    } else if (result == undefined || result == null) {
        console.log("No results!");
        returnJSON("No results", null, response);
    }
    var sql = "INSERT INTO public.\"Players\" (id, name, \"gameID\") VALUES (default,$1::text,$2::int) RETURNING *";
    var params = [request.query.playerName, result[0].gameID];
    query(sql, params, request, response, handleNewPlayer);
}
function handleNewPlayer(err, result, request, response) {
    console.log("Handle New Player: " + JSON.stringify(result.rows));
    returnJSON(err, result[0], response)
}

// LIST PLAYERS IN GAME
function getPlayersList(request, response) {
    var sql = "SELECT * FROM public.\"Players\" WHERE \"gameID\" = $1::int";
    var params = [request.query.gameID];
    query(sql, params, request, response, checkIfReady);
}
function checkIfReady(err, result, request, response) {
    if (err) {
        console.log("Error in query: ")
        console.log(err);
        returnJSON(err, null, response);
    } else if (result == undefined || result == null) {
        console.log("No results!");
        returnJSON("No results", null, response);
    }
    // returnJSON(null, result, response);
    request.list = {};
    result.forEach(element => {
        request.list[element.id] = element.name;
    });
    console.log("List of players: " + JSON.stringify(request.list));
    var sql = "SELECT \"startTimestamp\" FROM public.\"Games\" WHERE id = $1";
    var params = [request.query.gameID];
    query(sql, params, request, response, handlePlayersList);
}
function handlePlayersList(err, result, request, response) {
        request.list.ready = result[0].startTimestamp;
        console.log("Returning List: " + JSON.stringify(request.list));
        returnJSON(err, request.list, response)
}

// INDICATE EVERYONE IS IN
function everyoneIn(request, response) {
    var sql = "UPDATE public.\"Games\" SET \"startTimestamp\" = $1::timestamp WHERE id = $2::int RETURNING *";
    var params = [
        new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        request.query.gameID
    ];
    query(sql, params, request, response, handleEveryoneIn);
}
function handleEveryoneIn(err, result, request, response) {
    if (err) {
        console.log("Error in query: ")
        console.log(err);
        returnJSON(err, null, response);
    }
    response.end();
}

// CREATE NEW DRAWING
