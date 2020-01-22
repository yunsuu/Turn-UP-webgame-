var express = require('express');
var router = express.Router();
var request_a = require('request');
var xml2js = require('xml2js');
var parser = new xml2js.Parser();
var moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");


// 시/구/동/
// 서울시/강남구/역삼동


router.post('/answerjuso', function(request, response) {

    let params = request.body.action.parameters;
    let city = params.first.value;
    let province = params.second.value;
    let county = params.third.value;


    var real_time = moment().format('MMMM Do YYYY, HH:mm');
    var c_time = moment().format('HHmm');
    var day = moment().days()
    if (day == 0) day = 7;

    var si = city;
    var gu = province;
    var dong = county;
    var store_name = ''; //약국이름
    console.log(day, c_time, si, gu, dong);

    var api_key = 'm73MvyHfemg8Qhjp4Ctik5DsKOTRaqoccqBgsxB7vgc2UJ9C%2BOCtVFfvkHGoqloyMRkE2FWrV0ZKm%2FXr4Vb3Ag%3D%3D';
    var api_R = `&Q0=${si}&Q1=${gu}&QT=1&QN=${store_name}&ORD=NAME&pageNo=1&numOfRows=100000`;
    api_R = encodeURI(api_R);
    var api_url = 'http://apis.data.go.kr/B552657/ErmctInsttInfoInqireService/getParmacyListInfoInqire?serviceKey=' + api_key + api_R;
    var store_list = ``;
    var store_n = 0;
    request_a(api_url, function(err, res, body) {
        parser.parseString(body, function(err, result) {
            var item_arr = result.response.body[0].items[0].item;
            //console.log(item_arr[0].dutyTime1c);
            //console.log(parseInt(solo["dutyTime" + day + "c"]));
            for (var i in item_arr) {
                var solo = item_arr[i];
                var t_open = parseInt(solo["dutyTime" + day + "s"])
                var t_close = parseInt(solo["dutyTime" + day + "c"])
                c_time = parseInt(c_time);

                //영업요일이 아니면 거르기
                if (isNaN(t_open) || isNaN(t_close)) continue;
                if (t_open <= c_time && c_time <= t_close) {
                    //동거르기
                    if (solo.dutyAddr[0].includes(dong) == true) {
                        store_list = '..' + store_list + solo.dutyName[0] + '....주소는' +  solo.dutyAddr[0] + '.입니다.';
                        store_n = store_n + 1;
                    }
                }
            }
            if(store_n == 0) var result_text = '현재 ' + province +' ' + county + '에는 운영중인 약국이 없습니다...';
            else var result_text = province+' '+county+' 에 현재'+` 운영중인 ${store_n}개 약국을 알려드릴게요.${store_list}`;

            response.send({
                version: '1.0',
                resultCode: 'OK',
                output: {
                    resMessage: result_text,
                }
            });

        });
    });

    //26예외처리랑
});

module.exports = router;