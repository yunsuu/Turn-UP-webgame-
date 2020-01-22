var express = require('express');
var router = express.Router();
var request_a = require('request');
var xml2js = require('xml2js');
var parser = new xml2js.Parser();

// 시/구/동/
// 서울시/강남구/역삼동


router.post('/bigsmalltitleans', function(request, response) {

    var params = request.body.action.parameters;
    var first = params.first1.value;
    var second = params.second1.value;

    console.log(typeof (first), typeof(second));

    //공백제거

    //예외처리

    var api_key = 'm73MvyHfemg8Qhjp4Ctik5DsKOTRaqoccqBgsxB7vgc2UJ9C%2BOCtVFfvkHGoqloyMRkE2FWrV0ZKm%2FXr4Vb3Ag%3D%3D';
    var api_url = 'http://open.ev.or.kr:8080/openapi/services/rest/EvChargerService?serviceKey=' + api_key;

    /*
    충전기상태
    1. 통신이상
    2. 충전대기
    3. 충전중
    4. 운영중지
    5. 점검중
    */

    var stat_list = ``;
    request_a(api_url, function(err, res, body) {
        parser.parseString(body, function(err, result) {

            var item_arr = result.response.body[0].items[0].item;
            for (var i in item_arr) {
                var solo = item_arr[i];
                //영업요일이 아니면 거르기
                var stat_name = solo.statNm[0];
                if (stat_name.includes(first) == true && stat_name.includes(second) == true) {
                    var current_stat_n = parseInt(solo.stat[0]);
                    if (current_stat_n == 1) {
                        var current_text = '통신이상 상태';
                    } else if (current_stat_n == 2) {
                        var current_text = '충전대기 상태';
                    } else if (current_stat_n == 3) {
                        var current_text = '충전중';
                    } else if (current_stat_n == 4) {
                        var current_text = '운영중지 상태';
                    } else if (current_stat_n == 5) {
                        var current_text = '점검중';
                    }
                    stat_list = stat_list + ` ${current_text}입니다.`
                    break;
                }
            }
            var input_name = first + ' ' + second;
            if(stat_list == '') result_text = `..말씀해주신 충전소는 없는 충전소입니다..`;
            else result_text = input_name + ' 충전소는 현재' + stat_list;

            response.send({
                version: '1.0',
                resultCode: 'OK',
                output: {
                    resMessage: result_text
                }
            });


        });
    });
});

module.exports = router;