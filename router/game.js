var express = require('express');
var router = express.Router();

var mysql      = require('mysql');
var connection = mysql.createConnection({
    host     : '127.0.0.1',
    user     : 'nugu',
    password : '989922',
    port     : 3306,
    database : 'nugu'
});

router.get('/', function (req, res) { // /game/
    res.send('This isfewfwefwefwef');

    connection.query('SELECT * FROM `test`', function(err, rows, fields) {
       if (!err) {
           console.log(rows);
       } else {
           console.log(err);
       }
    });

});

module.exports = router;