var express = require('express');
var router = express.Router();
var http = require('http').createServer(router);
var io = require('socket.io')(http);

// 시/구/동/
// 서울시/강남구/역삼동


router.get('/', function(request, response) {
    response.send(html);
});

io.on('connection', function(socket){
    console.log('a user connected');
});



module.exports = router;