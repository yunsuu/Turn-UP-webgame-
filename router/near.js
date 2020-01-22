var express = require('express');
var router = express.Router();
var request_a = require('request');
var xml2js = require('xml2js');
const geolib = require('geolib');
var async = require('async');
var parser = new xml2js.Parser();

var user_pos = {
    latitude: 37.570715,
    longitude: 126.974001
}
var api_key = 'm73MvyHfemg8Qhjp4Ctik5DsKOTRaqoccqBgsxB7vgc2UJ9C%2BOCtVFfvkHGoqloyMRkE2FWrV0ZKm%2FXr4Vb3Ag%3D%3D';
//var api_url1 = 'http://open.ev.or.kr:8080/openapi/services/rest/EvChargerService?serviceKey=' + api_key;
var api_url2 = `http://openapi.kepco.co.kr/service/EvInfoServiceV2/getEvSearchList?serviceKey=${api_key}&pageNo=1&numOfRows=1000000`;
var api_url3 = `http://open.ev.or.kr:8080/openapi/services/EvCharger/getChargerInfo?serviceKey=${api_key}&pageNo=1&pageSize=13187`;

router.post('/ChargeCenterSpeakAns', function(request, response) {
    console.log('ChargeCenterSpeakAns work');
    var params = request.body.action.parameters;
    var first = params.chargecentername.value;


//사용자위치

    var search_word = first;

    //api 링크

//예외처리


    async.series([
        function(callback) {
            request_a(api_url3, function(err, res, body) {

                var min = 10000000000 * 100 // 1000 k/m
                var result_v = 'defualt';
                var result_state = 'defualt';
                if (err) callback(err);
                parser.parseString(body, function(err, result) {
                    var item_arr = result.response.body[0].items[0].item;
                    for (var i in item_arr) {
                        var solo = item_arr[i];
                        var stat_name = solo.statNm[0];
                        var distance = geolib.getDistance(user_pos, { latitude: parseFloat(solo.lat[0]), longitude: parseFloat(solo.lng[0]) });
                        //키워드가 일치하고 최소값을 찾았을때
                        if (stat_name.includes(search_word) == true) {
                            min = distance;
                            result_v = stat_name;
                            var current_stat_n = parseInt(solo.stat[0]);
                            if (current_stat_n == 1) {
                                var result_state = '통신장애 상태';
                            } else if (current_stat_n == 2) {
                                var result_state = '충전가능 상태';
                            } else if (current_stat_n == 3) {
                                var result_state = '충전중';
                            } else if (current_stat_n == 4) {
                                var result_state = '운영중지 상태';
                            } else if (current_stat_n == 5) {
                                var result_state = '점검중';
                            }
                            console.log('api 1!!');
                            break;
                        }
                    }
                    callback(null, { distance: min, stat_name: result_v, currentstate: result_state });

                });
            });
        },
        function(callback) {

            var min = 100000000000 * 100 // 1000 k/m
            var result_v = 'defualt';
            var result_state = 'defualt';
            request_a(api_url2, function(err, res, body) {
                if (err) callback(err);
                parser.parseString(body, function(err, result) {
                    var item_arr = result.response.body[0].items[0].item;
                    for (var i in item_arr) {
                        var solo = item_arr[i];
                        var stat_name = solo.csNm[0];
                        var distance = geolib.getDistance(user_pos, { latitude: parseFloat(solo.lat[0]), longitude: parseFloat(solo.longi[0]) });
                        //키워드가 일치하고 최소값을 찾았을때
                        if (stat_name.includes(search_word) == true) {
                            min = distance;
                            result_v = stat_name;
                            var current_stat_n = parseInt(solo.cpStat[0]);
                            if (current_stat_n == 1) {
                                var result_state = '충전가능 상태';
                            } else if (current_stat_n == 2) {
                                var result_state = '충전중';
                            } else if (current_stat_n == 3) {
                                var result_state = '점검중';
                            } else if (current_stat_n == 4) {
                                var result_state = '통신장애 상태';
                            } else if (current_stat_n == 5) {
                                var result_state = '운영중지 상태';
                            }
                            console.log('api 2!');
                            break;
                        }
                    }
                    callback(null, { distance: min, stat_name: result_v, currentstate: result_state });
                });
            });
        }
    ], function(err, result) {
        console.log("결과값  ", result)
        if (err) {
            console.log(err);
            return;
        }
        result.sort(function (a, b) {
            //객체 거리의 오름차순으로 정렬
            return a.distance < b.distance ? -1 : a.distance > b.distance ? 1 : 0;
        });
        //리턴
        if (result[0].stat_name != 'defualt') {
            resMassage = `${result[0].stat_name} 충전소는 현재 ${result[0].currentstate} 입니다.`
            response.send({
                version: '1.0',
                resultCode: 'OK',
                output: {
                    resMessage: resMassage
                }
            });
        } else {
            //resMassage = `${result[0].stat_name} 충전소는 현재 ${result[0].currentstate} 입니다.`
            resMassage = '검색결과가 없습니다.'
            response.send({
                version: '1.0',
                resultCode: 'OK',
                output: {
                    resMessage: resMassage
                }
            });
        }
    });





    });

router.post('/nearbyChargeCenterans', function(request, response) {
    console.log('nearbyChargeCenterans work')
//사용자위치


//예외처리
    push_result = function(arr, ins) {
        for (var i in arr) {

            if (arr[i].stat_name == ins.stat_name) {

                return false;
            }
        }
        return true;
    }



    var search_word = '휴게소';
    var radius = 5 * 100; //반경 5키로이내
    var result_arr = [];

    async.series([
        function(callback) {
            request_a(api_url1, function(err, res, body) {
                var min = 1000 * 100 // 1000 k/m
                if (err) callback(err);
                parser.parseString(body, function(err, result) {
                    var item_arr = result.response.body[0].items[0].item;
                    for (var i in item_arr) {
                        var solo = item_arr[i];
                        var stat_name = solo.statNm[0];
                        var distance = geolib.getDistance(user_pos, { latitude: parseFloat(solo.lat[0]), longitude: parseFloat(solo.lng[0]) });
                        var current_stat_n = parseInt(solo.stat[0]); //충전소상태
                        //키워드가 일치하고 최소값을 찾았을때
                        if (distance < radius && current_stat_n == 2) {
                            var ins = { distance: distance, stat_name: stat_name, addr: solo.addrDoro[0] }
                            //console.log('1번', ins);
                            if (push_result(result_arr, ins)) {
                                result_arr.push(ins)
                            }
                        }
                    }
                    callback(null, '성공1');
                });
            });
        },
        function(callback) {
            var min = 1000 * 100 // 1000 k/m
            var result_v = 'defualt';
            var result_state = 'defualt';
            request_a(api_url2, function(err, res, body) {
                if (err) callback(err);
                parser.parseString(body, function(err, result) {
                    var item_arr = result.response.body[0].items[0].item;
                    for (var i in item_arr) {
                        var solo = item_arr[i];
                        var stat_name = solo.csNm[0];
                        var distance = geolib.getDistance(user_pos, { latitude: parseFloat(solo.lat[0]), longitude: parseFloat(solo.longi[0]) });
                        var current_stat_n = parseInt(solo.cpStat[0]); //충전소상태
                        //키워드가 일치하고 최소값을 찾았을때
                        if (distance < radius && current_stat_n == 1) {
                            var ins = { distance: distance, stat_name: stat_name, addr: solo.addr[0] }
                            //console.log('2번', ins);
                            if (push_result(result_arr, ins)) {
                                result_arr.push(ins)
                            }
                        }
                    }
                    callback(null, '성공2');
                });
            });
        },

    ], function(err, result) {
        if (err) {
            console.log(err);
            return;
        }
        result_arr.sort(function(a, b) {
            //객체 거리의 오름차순으로 정렬
            return a.distance < b.distance ? -1 : a.distance > b.distance ? 1 : 0;
        });
        //리턴

        var resMassage = '';
        if (result_arr.length == 0) {
            resMassage = `현재 충전가능한 충전소가 없습니다.`
        } else {
            resMassage += '반경 5킬로미터 이내 충전가능한 곳을 알려드릴게요'
            for (var i in result_arr) {
                if (i > 5) break;
                resMassage += `...${result_arr[i].stat_name} 충전소`;
            }
        }
        resMassage += '가 있습니다.'
        response.send({
            version: '1.0',
            resultCode: 'OK',
            output: {
                resNearbyChargeCenter: resMassage
            }
        });

    });


});

router.post('/bigsmalltitleans', function(request, response) {
    console.log('bigsmalltitleans work')

    var params = request.body.action.parameters;
    var first = params.first1.value;
    var second = params.second1.value;




    /*
    충전기상태
    1. 통신이상
    2. 충전대기
    3. 충전중
    4. 운영중지
    5. 점검중
    */


/////////////////////////

    async.series([
        function(callback) {
            request_a(api_url1, function(err, res, body) {
                parser.parseString(body, function(err, result) {
                    var result_text = 'defualt';
                    var item_arr = result.response.body[0].items[0].item;
                    for (var i in item_arr) {
                        var solo = item_arr[i];
                        //영업요일이 아니면 거르기
                        var stat_name = solo.statNm[0];
                        if (stat_name.includes(first) == true && stat_name.includes(second) == true) {
                            var current_stat_n = parseInt(solo.stat[0]);
                            if (current_stat_n == 1) {
                                var current_text = '통신장애 상태';
                            } else if (current_stat_n == 2) {
                                var current_text = '충전가능 상태';
                            } else if (current_stat_n == 3) {
                                var current_text = '충전중';
                            } else if (current_stat_n == 4) {
                                var current_text = '운영중지 상태';
                            } else if (current_stat_n == 5) {
                                var current_text = '점검중';
                            }
                            result_text = `현재 ${first} ${second} 충전소는 ${current_text} 입니다`;
                        }
                    }
                    callback(null, result_text);

                });
            });
        },
        function(callback) {
            //한전
            request_a(api_url2, function(err, res, body) {
                parser.parseString(body, function(err, result) {
                    var item_arr = result.response.body[0].items[0].item;
                    var result_text = 'defualt';
                    for (var i in item_arr) {
                        var solo = item_arr[i];
                        //영업요일이 아니면 거르기
                        var stat_name = solo.csNm[0];

                        if (stat_name.includes(first) == true && stat_name.includes(second) == true) {

                            var current_stat_n = parseInt(solo.cpStat[0]); //충전소상태
                            if (current_stat_n == 1) {
                                var result_state = '충전가능 상태';
                            } else if (current_stat_n == 2) {
                                var result_state = '충전중';
                            } else if (current_stat_n == 3) {
                                var result_state = '점검중';
                            } else if (current_stat_n == 4) {
                                var result_state = '통신장애 상태';
                            } else if (current_stat_n == 5) {
                                var result_state = '운영중지 상태';
                            }
                            result_text = `현재 ${first} ${second} 충전소는 ${result_state} 입니다`;
                        }
                    }
                    callback(null, result_text);
                });
            });

        }

    ], function(err, result) {
        if (err) console.log('에러값', err);
        else{
            var trig = 0;
            for (var i in result){
                if(result[i] != 'defualt'){
                    //전송
                    trig = 1;
                    response.send({
                        version: '1.0',
                        resultCode: 'OK',
                        output: {
                            resMessage: result[i]
                        }
                    });
                }
            }
            if(trig == 0){
                //아닌거전송
                response.send({
                    version: '1.0',
                    resultCode: 'OK',
                    output: {
                        resMessage: '검색하신 충전소는 없는 충전소 입니다.'
                    }
                });
            }
        }
    });
});


module.exports = router;