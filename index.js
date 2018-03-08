var express = require('express');
var app = express();
var cron = require('node-cron');
var nconf = require('nconf');
nconf.file('./config.json');
var mongoUrl = nconf.get('mongodb-url');
var mongoDb = nconf.get('mongodb-db');
var interval = nconf.get('schedule-interval');
var db = require('./lib/db');
var mo = require('./lib/mo');
var dn = require('./lib/dn');
var fs = require('fs');
var log = require('./lib/log')(fs);

app.get('/', function(req, res) {
    // var url = 'https://sit-mkservices.azurewebsites.net/push/ice?';
    // var fetch = require('node-fetch');
    // console.log('calling ' + new Date());
    // var headers = {
    //     // urlConn.setRequestProperty(“x-premio-sms-cpid”, “SPUsername”); 
    //     // urlConn.setRequestProperty(“x-premio-sms-password”, “SPPassword”); 
    //     // urlConn.setRequestProperty(“x-premio-sms-service”, “SPServiceID”); 
    //     // urlConn.setRequestProperty(“x-premio-sms-oa”, “32248”); 
    //     // urlConn.setRequestProperty(“x-premio-sms-da”, “60121234567”); 
    //     // urlConn.setRequestProperty(“x-premio-sms-refid”, “SPRef-001”); 
    //     // urlConn.setRequestProperty(“x-premio-sms-type”, “MT_PUSH”); 
    //     // urlConn.setRequestProperty(“x-premio-sms-msgdata”,  URLEncoder.encode(“Hello Premio”, “UTF-8”)); 
    //     // urlConn.setRequestProperty(“x-premio-sms-coding”, “0”);
    //     // urlConn.setRequestProperty(“x-premio-sms-tariffid”, “0000”); urlConn.setRequestProperty(“x-premio-sms-contenttype”, “0”);
    //     'x-premio-sms-da': '60122618872'
    // };
    // fetch(url, { method: 'POST', headers }).then(result => {
    //     console.log('responded: ' + new Date());
    //     console.log(result.headers.raw());
    //     //  .then(headers => {
    //     //     console.log(headers);
    //     // });
    //     // result.headers.raw().then(headers={
    //     //     console.log(headers);
    //     // });
    //     // result.text().then(body => {
    //     //     console.log('<- ' + body);
    //     // });
    // }).catch(err => {
    //     console.log(err);
    // });

    var master = require('./lib/master');
    master.retrieveKeywords('MK', 32278).then(res => {
        console.log(res);
    }).catch(err => {
        console.log(err);
    });

    // var service = 'ON';
    // var filterSubscriber = {
    //     gateway: 'MK',
    //     msisdn: '0122618873',
    //     shortCode: 32300,
    //     telcoId: '1',
    //     keyword: 'HAPPY'
    // };
    // // if (!(service == 'STOP' && keyword == 'ALL'))
    // //     filterSubscriber.keyword = 'BOLA';

    // //log.save('testlog 1 more time');

    // db.any('subscribers', filterSubscriber).then(function(found) {
    //     console.log('exists?' + found);
    // }).catch(err => {
    //     console.log(err);
    // });

    // var mt = require('./lib/mt');
    // mt.push('MK', 'http://sit-mkservices.azurewebsites.net/push?msisdn=60122618872');

    // var master = require('./lib/master');
    // master.retrieveCredentials('Mexcomm', 'enettwo')
    //     .then(credentials => {
    //         console.log(credentials);
    //     }).catch(err => {
    //         console.log(err);
    //     });

    // var gateway = 'Mexcomm';
    // var userName = 'enettwo';
    // var filter = {
    //     'gateway': gateway,
    //     'accounts.userName': userName
    // };
    // var db = require('./lib/db');
    // console.log('retrieveMany');
    // db.retrieve('master', filter).then(result => {
    //     console.log(result);

    //     result.forEach(element => {
    //         var found = false;
    //         var accounts = element.accounts;
    //         for (i = 0; i < accounts.length; i++) {
    //             var account = accounts[i];
    //             if (account.userName == userName) {
    //                 console.log({
    //                     userName: account.userName,
    //                     password: account.password
    //                 });
    //                 found = true;
    //                 break;
    //             }
    //         }
    //         console.log('forEach');
    //     });

    // }).catch(err => {
    //     console.log(err);
    // });
    // console.log('retrieveOne');
    // db.retrieveOne('master', filter).then(result => {
    //     console.log(result);

    //     var accounts = result.accounts;
    //     for (i = 0; i < accounts.length; i++) {
    //         var account = accounts[i];
    //         if (account.userName == userName) {
    //             console.log({
    //                 userName: account.userName,
    //                 password: account.password
    //             });
    //             found = true;
    //             break;
    //         }
    //     }
    // }).catch(err => {
    //     console.log(err);
    // });
    // db.save('test', { on: new Date() }).then(res => {
    //     console.log(res);
    // });


    //var filterDate = new Date(2018, 1, 17, 23, 55, 0, 0);
    // var curr = new Date();
    // var filterDate = new Date(curr.getFullYear(),
    //     curr.getMonth(), 18, 0, 30, 0, 0);
    // db.retrieve('schedules', { 'contents.date': filterDate }).then(res => {
    //     console.log(res);
    // });

    // var filterSubscriber = {
    //     telcoId: { $in: ['1', '3'] },
    //     keyword: { $in: ['UMA', 'UMB', 'UMC'] },
    //     gateway: schedule.gateway,
    //     service: 'ON',
    //     shortCode: schedule.shortCode
    // };


    res.send('done [' + new Date().toString() + ']');
});

//MO
app.get('/mo/ice', function(req, res) {
    mo.save('ICE', req);
    res.send('200');
});

app.get('/mo/mexcomm', function(req, res) {
    mo.save('MEXCOMM', req);
    res.send('-1');
});

app.get('/mo/mk', function(req, res) {
    mo.save('MK', req);
    res.send('-1');
});

app.get('/mo/mmp', function(req, res) {
    mo.save('MMP', req);
    res.send('200');
});

//DN
app.get('/dn/ice', function(req, res) {
    dn.save('ICE', req);
    res.send('200');
});

app.get('/dn/mexcomm', function(req, res) {
    dn.save('MEXCOMM', req);
    res.send('-1');
});

app.get('/dn/mk', function(req, res) {
    dn.save('MK', req);
    res.send('-1');
});

app.get('/dn/mmp', function(req, res) {
    dn.save('MMP', req);
    res.send('200');
});

function startSchedule() {
    console.log('schedule started, every ' + interval + ' minutes');
    cron.schedule('*/' + interval + ' * * * *', function() {
        var spawn = require('threads').spawn;
        var thread = spawn('./scheduler.js');
        thread.send({})
            .on('message', function(response) {
                console.log(response);
                thread.kill();
            });
    });
}

var port = process.port || 8872;
app.listen(port, function() {
    console.log('[' + new Date() + '] funnet app listening on port ' + port);
});

console.log('preparing mongodb at ' + mongoUrl);
startSchedule();