var express = require('express');
var router = express.Router();
var sf = require('sf');
var mysql  = require('mysql');
var axios = require('axios');
var cheerio = require('cheerio');
const request = require('request');
const charset = require('charset'); //해당 사이트의 charset값을 알 수 있게 해준다.


var iconv = require('iconv-lite');

var rankMessageList = [
    '1위',
    '2위',
    '3위',
    '4위',
    '5위',
    '6위',
    '7위',
    '8위',
    '9위',
    '10위',
];

var con = mysql.createConnection({
    host     : '127.0.0.1',
    user     : 'nugu',
    password : '989922',
    port     : 3306,
    database : 'nugu'
});

//Dra
//Mus
//Liv
//http://ticket.interpark.com/TPGoodsList.asp?Ca={$type}&Sort=2

router.post('/concertwhat', function(req, response) {
    let params = req.body.action.parameters;
    let type_concert = params.musical_type.value;
    let before_type = type_concert;
    let hall = params.concert_hall.value;


    if ( type_concert === '연극' ) { type_concert = 'Dra'; }
    if ( type_concert === '뮤지컬' ) { type_concert = 'Mus'; }
    if ( type_concert === '콘서트' ) { type_concert = 'Liv'; }

    getRanks(`http://ticket.interpark.com/TPGoodsList.asp?Ca=${type_concert}&Sort=2`)
        .then(function(dataList) {
            let showList = [];

            dataList.forEach(function(item) {
                if ( item.place.includes(hall) ) {
                    if ( showList.length < 5 ) {
                        showList.push(item);
                    }
                }
            });

            resMessage = '';
            resMessage += `${hall}에서 진행하는 ${before_type}은 `;

            for ( let i in showList ) {
                if ( i == showList.length-1 ) {
                    resMessage += `${showList[i].title} `;
                } else {
                    resMessage += `${showList[i].title}, `;
                }
            }

            resMessage += '입니다. ';

            if ( showList.length === 0 ) {
                resMessage = `${hall}에서 진행하는 ${before_type}은 없습니다`;
            }

            response.send({
                version: '1.0',
                resultCode: 'OK',
                output: {
                    resMessage1: resMessage
                }
            });
        });

});

router.post('/next', function(req, response) {
    let params = req.body.action.parameters;
    let type_concert = params.type_concert.value;
    let type_period = params.type_period.value;

    if ( type_concert === '연극' ) { type_concert = 'Dra'; }
    if ( type_concert === '뮤지컬' ) { type_concert = 'Mus'; }
    if ( type_concert === '콘서트' ) { type_concert = 'Liv'; }

    request({
            url:`http://ticket.interpark.com/TPGoodsList.asp?Ca=${type_concert}&Sort=2`,
            encoding: null
        }
        ,function (error, res, body) {
            if( !error && res.statusCode == 200 )
            {
                const enc = charset(res.headers, body); // 해당 사이트의 charset값을 획득
                const i_result = iconv.decode(body, enc); // 획득한 charset값으로 body를 디코딩

                let dataList = [];

                const $ = cheerio.load(i_result);
                const $trList = $('div.Rk_gen2 table tbody tr');

                $trList.each(function(i, elem) {
                    dataList.push( $(this).find('td.RKtxt span.fw_bold a').text() );
                });

                let resMessage = "";

                for ( let idx = 5; idx < 10; idx++ ) {
                    resMessage += (rankMessageList[idx] + "는 " + dataList[idx]  + ". ");
                }

                response.send({
                    version: '1.0',
                    resultCode: 'OK',
                    output: {
                        resMessage: resMessage
                    }
                });
            }
        });
});

router.post('/information', function(req, response) {
    let params = req.body.action.parameters;
    let type_concert = params.type_concert.value;
    let type_period = params.type_period.value;
    let rank = params.rank.value.replace(/[^0-9]/g,"");

    if ( type_concert === '연극' ) { type_concert = 'Dra'; }
    if ( type_concert === '뮤지컬' ) { type_concert = 'Mus'; }
    if ( type_concert === '콘서트' ) { type_concert = 'Liv'; }

    getRanks(`http://ticket.interpark.com/TPGoodsList.asp?Ca=${type_concert}&Sort=2`)
        .then(function(dataList) {
            let url = 'http://ticket.interpark.com' + dataList[rank-1].link;

            getInfo(url).then(function(info) {
                console.log(info.title);

                let resMessage = '';

                resMessage += '' + info.title + '의 ';
                resMessage += '장소는 ' + info.place + '이며 ';
                resMessage += '기간은 ' + info.term.split('~')[0].trim() + '부터 ' + info.term.split('~')[1].trim() + '까지, ';
                resMessage += '' + info.cast + '등이 출연합니다';

                response.send({
                    version: '1.0',
                    resultCode: 'OK',
                    output: {
                        resMessage: resMessage
                    }
                });
            });
        });
});


router.post('/information2', function(req, response) {
    let params = req.body.action.parameters;
    let type_concert = params.type_concert.value;
    let type_period = params.type_period.value;
    let rank = params.rank1.value.replace(/[^0-9]/g,"");

    if ( type_concert === '연극' ) { type_concert = 'Dra'; }
    if ( type_concert === '뮤지컬' ) { type_concert = 'Mus'; }
    if ( type_concert === '콘서트' ) { type_concert = 'Liv'; }

    getRanks(`http://ticket.interpark.com/TPGoodsList.asp?Ca=${type_concert}&Sort=2`)
        .then(function(dataList) {
            let url = 'http://ticket.interpark.com' + dataList[rank-1].link;

            getInfo(url).then(function(info) {
                let resMessage = '';

                resMessage += '' + info.title + '의 ';
                resMessage += '장소는 ' + info.place + '이며 ';
                resMessage += '기간은 ' + info.term.split('~')[0].trim() + '부터' + info.term.split('~')[1].trim() + '까지, ';
                resMessage += '' + info.cast + '등이 출연합니다';

                response.send({
                    version: '1.0',
                    resultCode: 'OK',
                    output: {
                        resMessage: resMessage
                    }
                });
            });
        });
});


function getRanks(url)
{
    return new Promise((resolve) => {
        request({
                url: url,
                encoding: null
            }
            ,function (error, res, body) {
                if( !error && res.statusCode == 200 )
                {
                    const enc = charset(res.headers, body); // 해당 사이트의 charset값을 획득
                    const i_result = iconv.decode(body, enc); // 획득한 charset값으로 body를 디코딩

                    let dataList = [];

                    const $ = cheerio.load(i_result);
                    const $trList = $('div.Rk_gen2 table tbody tr');

                    $trList.each(function(i, elem) {
                        dataList.push({
                            title: $(this).find('td.RKtxt span.fw_bold a').text(),
                            link: $(this).find('td.RKtxt span.fw_bold a').attr('href'),
                            place: $(this).find('td.Rkdate > a').text()
                        });
                    });

                    resolve(dataList);
                }
            });
    });
}

function getInfo(url)
{
    return new Promise((resolve) => {
        request({
                url: url,
                encoding: null
            }
            ,function (error, res, body) {
                if( !error && res.statusCode == 200 )
                {
                    const enc = charset(res.headers, body); // 해당 사이트의 charset값을 획득
                    const i_result = iconv.decode(body, enc); // 획득한 charset값으로 body를 디코딩

                    let data = {};

                    const $ = cheerio.load(i_result);
                    //const $trList = $('div.Rk_gen2 table tbody tr');

                    let people = $('#TabA > div.TabA_Info > ul > li.item.item4 > dl > dd > a');
                    let cast = [];

                    people.each(function(i, elem) {
                        if ( cast.length < 5 ) {
                            cast.push($(this).text());
                        }
                    });


                    if ($('#TabA > div.TabA_Info > ul > li:nth-child(1) > dl > dt').text() === '부제') {
                        data = {
                            title: $('span#IDGoodsName').text(),
                            place: $('#TabA > div.TabA_Info > ul > li:nth-child(2) > dl > dd').text(),
                            term: $('#TabA > div.TabA_Info > ul > li:nth-child(3) > dl > dd > span:nth-child(1)').text(),
                            cast: cast,
                        };
                    } else {
                        data = {
                            title: $('span#IDGoodsName').text(),
                            place: $('#TabA > div.TabA_Info > ul > li:nth-child(1) > dl > dd').text(),
                            term: $('#TabA > div.TabA_Info > ul > li:nth-child(2) > dl > dd > span:nth-child(1)').text(),
                            cast: cast,
                        };
                    }

                    resolve(data);
                }
            });
    });
}

router.post('/weekRank', function(req, response) {
    let params = req.body.action.parameters;
    let type_concert = params.type_concert.value;
    let type_period = params.type_period.value;

    if ( type_concert === '연극' ) { type_concert = 'Dra'; }
    if ( type_concert === '뮤지컬' ) { type_concert = 'Mus'; }
    if ( type_concert === '콘서트' ) { type_concert = 'Liv'; }

    request({
            url:`http://ticket.interpark.com/TPGoodsList.asp?Ca=${type_concert}&Sort=2`,
            encoding: null
        }
        ,function (error, res, body) {
            if( !error && res.statusCode == 200 )
            {
                const enc = charset(res.headers, body); // 해당 사이트의 charset값을 획득
                const i_result = iconv.decode(body, enc); // 획득한 charset값으로 body를 디코딩

                let dataList = [];

                const $ = cheerio.load(i_result);
                const $trList = $('div.Rk_gen2 table tbody tr');

                $trList.each(function(i, elem) {
                    dataList.push( $(this).find('td.RKtxt span.fw_bold a').text() );
                });


                let resMessage = "";

                for ( let idx = 0; idx < 5; idx++ ) {
                    resMessage += (rankMessageList[idx] + "는 " + dataList[idx]  + ". ");
                }

                response.send({
                    version: '1.0',
                    resultCode: 'OK',
                    output: {
                        resMessage: resMessage
                    }
                });
            }
        });
});

router.post('/mylocation', function(req, response) {
    response.send({
        version: '1.0',
        resultCode: 'OK',
        output: {
            resMessage2: '현재위치에서 가장 가까운 공연장은 세종문화회관. 국립극장. 충무아트센터. 삼성홀. 블루스퀘어 입니다'
        }
    });
});

module.exports = router;