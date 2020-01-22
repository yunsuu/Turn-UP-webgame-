var express = require('express');
var router = express.Router();
var request_a = require('request');
var xml2js = require('xml2js');
const geolib = require('geolib');
var async = require('async');
var parser = new xml2js.Parser();
router.post('/bigtitleans', function(request, response) {

    var params = request.body.action.parameters;
    var first = params.big.value;
    //var second = params.second1.value;


//사용자위치
    var user_pos = {
        latitude: 37.568831,
        longitude: 126.979878
    }

    var search_word = first;

//예외처리

    var api_key = 'm73MvyHfemg8Qhjp4Ctik5DsKOTRaqoccqBgsxB7vgc2UJ9C%2BOCtVFfvkHGoqloyMRkE2FWrV0ZKm%2FXr4Vb3Ag%3D%3D';
    var api_url1 = 'http://open.ev.or.kr:8080/openapi/services/rest/EvChargerService?serviceKey=' + api_key;
    var api_url2 = `http://openapi.kepco.co.kr/service/EvInfoServiceV2/getEvSearchList?serviceKey=${api_key}&pageNo=1&numOfRows=14000`;


    async.series([
        function(callback) {
            request_a(api_url1, function(err, res, body) {
                var min = 1000 * 100 // 1000 k/m
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
                        if (stat_name.includes(search_word) == true && distance < min) {
                            console.log(distance);
                            min = distance;
                            result_v = stat_name;
                            var current_stat_n = parseInt(solo.stat[0]);
                            if (current_stat_n == 1) {
                                var result_state = '통신이상 상태';
                            } else if (current_stat_n == 2) {
                                var result_state = '충전대기 상태';
                            } else if (current_stat_n == 3) {
                                var result_state = '충전중';
                            } else if (current_stat_n == 4) {
                                var result_state = '운영중지 상태';
                            } else if (current_stat_n == 5) {
                                var result_state = '점검중';
                            }
                        }
                    }
                    callback(null, { distance: min, stat_name: result_v, currentstate: result_state });
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
                        //키워드가 일치하고 최소값을 찾았을때
                        if (stat_name.includes(search_word) == true && distance < min) {
                            console.log(distance);
                            min = distance;
                            result_v = stat_name;
                            var current_stat_n = parseInt(solo.cpStat[0]);
                            if (current_stat_n == 1) {
                                var result_state = '충전가능 상태';
                            } else if (current_stat_n == 2) {
                                var result_state = '충전중';
                            } else if (current_stat_n == 3) {
                                var result_state = '점검 상태';
                            } else if (current_stat_n == 4) {
                                var result_state = '통신장애 상태';
                            } else if (current_stat_n == 5) {
                                var result_state = '통신미연결 상태';
                            }
                        }
                    }
                    callback(null, { distance: min, stat_name: result_v, currentstate: result_state });
                });
            });
        },

    ], function(err, result) {
        if (err) {
            console.log(err);
            return;
        }
        result.sort(function(a, b) {
            //객체 거리의 오름차순으로 정렬
            return a.distance < b.distance ? -1 : a.distance > b.distance ? 1 : 0;
        });
        //리턴
        if(result[0].stat_name != 'defualt'){
            var resMassage = `${result[0].stat_name}, 현재 ${result[0].currentstate} 입니다.`
        }
        else{
            var resMassage = '검색결과가 없습니다.'
        }

    });

    response.send({
        version: '1.0',
        resultCode: 'OK',
        output: {
            resMessage: resMassage
        }
    });

});

module.exports = router;