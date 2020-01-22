var express = require('express');
var cookieParser = require('cookie-parser');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var ejs = require('ejs');

app.engine('ejs', ejs.renderFile);

var mysql = require('mysql');
var db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'dbname'
});
db.connect();

//동기식 mysql 쿼리 처리 객체
var mysqlSync = require('sync-mysql');
var dbSync = new mysqlSync({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'dbname'
});

//미들웨어 (정적폴더 접근 허용 및 쿠키분석 활성화)
app.use(express.static('img'));
app.use('/static', express.static('public'));
app.use('/nodemodules', express.static('node_modules'));
app.use(cookieParser());

//get 라우터 부분
app.get('/', function(req, res) {
    res.send('hello!!');
});

app.get('/login', function(req, res) {
    res.sendFile('/webgame/login.html');
});

app.get('/signup', function(req, res) {
    res.sendFile('/webgame/signup.html');
});

app.get('/menu', function(req, res) {
    res.sendFile('/webgame/menu.html');
})

app.get('/queue', function(req, res) {
    res.sendFile('/webgame/queue.html');
})

app.get('/game/:idx', function(req, res) {
    //res.send('hello!');
    idx = req.params.idx; //멀티방번호
    var room = dbSync.query(`SELECT * FROM multi_room where idx=${idx};`);
    room = room[0];
    res.render('testg.ejs', { text: room.current_matrix, userA: room.userA, userB: room.userB, current_turn: room.current_turn, now_player: room.now_player });

});

//post 라우터 부분
app.post('/deleteRoom', function(req, res) {
    var room_num = req.body.room_num;
    console.log('방삭제', room_num)
    db.query(`DELETE FROM multi_room where idx=${room_num};`, function(err, result) {
        if (err) throw err
    });
})

app.post('/login', function(req, res) {
    var post = req.body
    console.log(post.id, post.pwd);
    check = dbSync.query(`SELECT * FROM user_table where id='${post.id}' AND password=${post.pwd}`);
    //로그인 성공하면
    if (check.length != 0) {
        console.log(check[0].id)
        res.cookie('user', check[0].id, {
            maxAge: 1000 * 60 * 60
        });
        res.send(`<script> alert('로그인 성공'); location.href = './menu';</script>`)
    } else {
        console.log('로그인 실패');
        res.send(`<script> alert('로그인 실패'); location.href = './login';</script>`)
    }
})

app.post('/signup', function(req, res) {
    var post = req.body
    if (post.pwd1 != post.pwd2) {
        res.send(`<script> alert('비밀번호가 일치하지 않습니다.'); location.href = '/';</script>`)
        return;
    }
    id_check = dbSync.query(`SELECT EXISTS (SELECT id FROM user_table where id='${post.id}') as inChk`);
    if (id_check[0].inChk != 0) {
        res.send(`<script> alert('이 이름의 아이디를 사용하는 유저가 있습니다.'); location.href = './login';</script>`);
        return;
    }
    console.log(id_check)
    dbSync.query(`INSERT INTO user_table (id, password) VALUES('${post.id}', '${post.pwd1}');`);
    res.send(`<script> alert('회원가입 완료.'); location.href = './login';</script>`);
})


user_name_arr = new Array() //유저 매칭큐 (이름저장)
socket_id_arr = new Array() //유저 매칭큐 (소켓ID저장)

//소켓통신 코드
io.on('connection', function(socket) {
    socket.on('In Queue', function(msg) {
        socket_id_arr.push(socket.id)
        user_name_arr.push(msg.user_name) //쿠키이름 보내기
        console.log(socket.id, msg.user_name, socket_id_arr.length, user_name_arr.length);
        if (socket_id_arr.length % 2 == 0 && socket.length != 0) {
            var socket_a = socket_id_arr.shift();
            var socket_b = socket_id_arr.shift();
            var name_a = user_name_arr.shift();
            var name_b = user_name_arr.shift();;
            dbSync.query(`INSERT INTO multi_room (userA, userB, current_matrix) VALUES(?, ?, ?)`, [name_a, name_b, init_mtx]);
            var room_idx = dbSync.query(`SELECT * FROM multi_room where userA="${name_a}" AND userB="${name_b}"`);
            console.log('매칭됨', name_a, name_b, '방번호:', room_idx[0].idx)
            io.to(socket_a).emit('Complete match', { room_num: room_idx[0].idx });
            io.to(socket_b).emit('Complete match', { room_num: room_idx[0].idx });
        }
    });

    socket.on('Square Click', function(msg) {
        // 입력온 값을 db에 저장
        mtx_state = msg.changed_matrix;
        current_turn = msg.current_turn - 1;
        var userA = msg.userA
        var userB = msg.userB
        if (current_turn % 2 == 0) { now_player = userA; } else { now_player = userB; }
        dbSync.query(`UPDATE multi_room SET current_matrix = ? where idx=${msg.room_num};`, [mtx_state]);
        dbSync.query(`UPDATE multi_room SET current_turn = current_turn - 1 where idx=${msg.room_num};`)
        dbSync.query(`UPDATE multi_room SET now_player = ? where idx=${msg.room_num};`, [now_player]);
        io.emit('Square Click', { 'i': msg.i, 'j': msg.j, current_turn: current_turn, now_player: now_player });
    });

});

//게임 초기화 정보들 (턴수, 매트릭스 상태)
current_turn = 0;
init_mtx = `    <div class="line">
            <div class="square" id="_1_1" name="0" style="transform: translateX(0px);"></div>
            <div class="square" id="_1_2" name="0" style="transform: translateX(0px); background: rgb(254, 227, 145);"></div>
            <div class="square" id="_1_3" name="0" style="transform: translateX(0px);"></div>
            <div class="square" id="_1_4" name="0" style="transform: translateX(0px);"></div>
            
        </div>
        <div class="line">
            <div class="square" id="_2_1" name="0" style="transform: translateX(0px); background: rgb(254, 227, 145);"></div>
            <div class="square" id="_2_2" name="0" style="transform: translateX(0px); background: rgb(254, 227, 145);"></div>
            <div class="square" id="_2_3" name="0" style="transform: translateX(0px); background: rgb(254, 227, 145);"></div>
            <div class="square" id="_2_4" name="0" style="transform: translateX(0px); background: rgb(254, 227, 145);"></div>
            
        </div>
        <div class="line">
            <div class="square" id="_3_1" name="0" style="transform: translateX(0px);"></div>
            <div class="square" id="_3_2" name="0" style="transform: translateX(0px);"></div>
            <div class="square" id="_3_3" name="0" style="transform: translateX(0px);"></div>
            <div class="square" id="_3_4" name="0" style="transform: translateX(0px);"></div>
            
        </div>
 <div class="line">
            <div class="square" id="_4_1" name="0" style="transform: translateX(0px);"></div>
            <div class="square" id="_4_2" name="0" style="transform: translateX(0px);"></div>
            <div class="square" id="_4_3" name="0" style="transform: translateX(0px);"></div>
            <div class="square" id="_4_4" name="0" style="transform: translateX(0px);"></div>
            
        </div>
`




///////////////////////////////////////////////

var dementiaRouter = require('./router/dementia.js');
var drugRouter = require('./router/drug.js');
var concertRouter = require('./router/concert');
var carRouter = require('./router/car');
var bigsmallRouter = require('./router/bigsmall');
var nearRouter = require('./router/near');

app.use('/dementia', dementiaRouter);
app.use('/drug', drugRouter);
app.use('/concert', concertRouter);
app.use('/car', carRouter);
app.use('/bigsmall', bigsmallRouter);
app.use('/near', nearRouter);

http.listen(80, function() {
    console.log('Example app listening on port 3000!');
});