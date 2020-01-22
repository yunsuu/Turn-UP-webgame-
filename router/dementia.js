var express = require('express');
var router = express.Router();
var sf = require('sf');
var mysql  = require('mysql');

var con = mysql.createConnection({
    host     : '127.0.0.1',
    user     : 'nugu',
    password : '989922',
    port     : 3306,
    database : 'nugu'
});

router.get('/question/:question_idx', function(req, res) {
   var sql = sf("SELECT * FROM `question` FROM idx={idx}", {
   });
});

router.get('/response/:user_idx/:question_idx', function(req, res) {
    var sql = sf("INSERT INTO `response`(`user_idx`, `question_idx`, `response`, `created_at`) VALUES({user_idx}, {question_idx}, '{response}', now())", {
        user_idx: req.params.user_idx,
        question_idx: req.params.question_idx,
        response: req.query.response,
    });
    con.query(sql, function(err, result) {
        if (err) throw err;
        console.log('1 row inserted at `response` table');
        res.send('1 row inserted at `resonse` table');
    });
});

router.get('/result/:user_idx', function(req, res) {
    var sql = sf("SELECT COUNT(*) AS count FROM `response` WHERE user_idx={user_idx} and response='y'", {
        user_idx: req.params.user_idx
    });
    con.query(sql, function(err, result) {
        if (err) throw err;
        res.send(result);
    });
});

router.get('/delete/:user_idx', function(req, res) {
    var sql = sf("DELETE FROM `response` WHERE user_idx={user_idx}", {
        user_idx: req.params.user_idx
    });
    con.query(sql, function(err, result) {
        if (err) throw err;
        res.send("deleted success");
    });
});

module.exports = router;