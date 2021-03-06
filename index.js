var express = require('express');
var helmet = require('helmet');
var app = express();
var cron = require('node-cron');
var nconf = require('nconf');
nconf.file('./config.json');
var mongoUrl = nconf.get('mongodb-url');
var mongoDb = nconf.get('mongodb-db');
var interval = nconf.get('schedule-interval');
var mongoose = require('mongoose');
var db = require('./lib/db');
var mo = require('./lib/mo');
//var dn = require('./lib/dn');
var dn = require('./lib/dnv2');
// var fs = require('fs');
// var log = require('./lib/log')(fs);
var scheduler = require('./scheduler_noThread');
var addspro = require('./lib/addspro');

var options = {
    //useMongoClient: true,
    autoIndex: false, // Don't build indexes
    reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
    reconnectInterval: 1000, // Reconnect every 500ms
    poolSize: 10, // Maintain up to 10 socket connections
    // If not connected, return errors immediately rather than waiting for reconnect
    bufferMaxEntries: 0
};

mongoose.connect(mongoUrl, options);

mongoose.connection.on('error', function(e) {
    console.log("db: mongodb error " + e);
});

mongoose.connection.on('connected', function(e) {
    console.log('db: mongodb is connected: ' + mongoUrl);
});

mongoose.connection.on('disconnecting', function() {
    console.log('db: mongodb is disconnecting!!!');
});

mongoose.connection.on('disconnected', function() {
    console.log('db: mongodb is disconnected!!!');
});

mongoose.connection.on('reconnected', function() {
    console.log('db: mongodb is reconnected: ' + mongoUrl);
});

mongoose.connection.on('timeout', function(e) {
    console.log("db: mongodb timeout " + e);
});

mongoose.connection.on('close', function() {
    console.log('db: mongodb connection closed');
});

app.use(helmet({
    frameguard: {
        action: 'deny'
    }
}));
app.get('/', function(req, res) {


    // var filter = {
    //     msisdn: '60122618872',
    //     shortCode: '32066',
    //     keyword: 'BABY',
    //     postback: false
    // };
    // db.retrieve('addspros', filter).then(recs => {
    //     console.log(res);
    //     recs.forEach(addspro => {
    //         console.log(addspro);
    //     });
    // });


    // db.save('broadcasts', {
    //     occurred: new Date(),
    //     gateway: 'MMP',
    //     account: 'funnet',
    //     shortCode: '32238',
    //     keywords: JSON.stringify(['ARCADE', 'GAME']),
    //     subscribers: 50,
    //     content: 'download funny video at bit.ly/Sdd5sj'
    // }).then(saved => {
    //     console.log(saved.insertedId);
    //     db.update('broadcast', { '_id': saved.insertedId }, {
    //         $set: {
    //             doneOn: new Date()
    //         }
    //     });
    // });

    // var xml = '<MEXCOMM><MSISDN>60169567966</MSISDN>   <MSGID>5517441978376601922</MSGID><STATUS>0000</STATUS></MEXCOMM>';
    // var parseString = require('xml2js').parseString;
    // parseString(xml, { 'trim': true }, function(err, result) {
    //     console.log(result);
    //     console.log(result.MEXCOMM.STATUS[0]);
    // });

    //var url = 'https://sit-mkservices.azurewebsites.net/push/ice?';
    // var url = 'https://sit-mkservices.azurewebsites.net/push/mk?to=61022618872';
    // var fetch = require('node-fetch');
    // console.log('calling ' + new Date());
    // var fetchOptions = {};
    // var filterSubscriber = {
    //     telcoId: { $in: ['MY_UMOBILE', 'MY_DIGI'] },
    //     keyword: { $in: ['ADD', 'BPP'] },
    //     gateway: 'MMP',
    //     service: 'ON',
    //     shortCode: "39938"
    // };

    // var promises = [];
    // db.retrieve('subscribers', filterSubscriber).then(res => {
    //     console.log(res);
    // });

    // // var url = 'https://sit-mkservices.azurewebsites.net/push/mk?to=60122618872';
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
    // fetchOptions = { method: 'POST', headers };

    // fetch(url, fetchOptions).then(result => {
    //     console.log('responded: ' + new Date());

    //     console.log(result.headers.raw());
    //     var res = JSON.stringify(result.headers.raw());
    //     console.log(res['x-premio-sms-trans-id']);
    //     // return result.headers.raw();
    //     //  .then(headers => {
    //     //     console.log(headers);
    //     // });
    //     // result.headers.raw().then(headers={
    //     //     console.log(headers);
    //     // });
    //     // // result.text().then(body => {
    //     // //     console.log('<- ' + body);
    //     // //     return body;
    //     // // });
    //     // return result.text();
    //     // }).then(headers => {
    //     //     console.log('save headers -(s) ' + JSON.stringify(headers));
    //     //     // }).then(body => {
    //     //     //     console.log('save body -(s) ' + body);
    //     // }).then(text => {
    //     //     console.log('<- :' + text);
    // }).catch(err => {
    //     console.log(err);
    // });
    //fetch(url, { method: 'POST', headers }).then(result => {
    // fetch(url).then(result => {
    //     console.log('responded: ' + new Date());
    //     //console.log(result.headers.raw());
    //     //  .then(headers => {
    //     //     console.log(headers);
    //     // });
    //     // result.headers.raw().then(headers={
    //     //     console.log(headers);
    //     // });
    //     result.text().then(body => {
    //         console.log('<- ' + body);
    //     });
    //     // console.log(result.text());
    // }).catch(err => {
    //     console.log(err);
    // });

    // var master = require('./lib/master');
    // master.retrieveMTUrl('MK', 33278).then(res => {
    //     console.log(res);
    // }).catch(err => {
    //     console.log(err);
    // });

    // var master = require('./lib/master');
    // master.retrieveKeywords('MK', 32278).then(res => {
    //     console.log(res);
    // }).catch(err => {
    //     console.log(err);
    // });

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
    // master.retrieveMTExtraParams('MEXCOMM')
    //     .then(extraMTParams => {
    //         console.log(extraMTParams);
    //         console.log(extraMTParams['7']);
    //         console.log(extraMTParams['23']);
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
    // db.retrieve('masters', filter).then(result => {
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
    // db.retrieveOne('masters', filter).then(result => {
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
// app.get('/dn/ice', function(req, res) {
//     dn.save('ICE', req);
//     res.send('200');
// });

app.get('/dn/mexcomm', function(req, res) {
    dn.save('MEXCOMM', req).then(saved => { res.send('-1'); }).catch(err => { res.send('-1'); });
});

app.get('/dn/mk', function(req, res) {
    dn.save('MK', req).then(saved => { res.send('-1'); }).catch(err => { res.send('-1'); });
});

// app.get('/dn/mmp', function(req, res) {
//     dn.save('MMP', req);
//     res.send('200');
// });

app.get('/aff/addspro', function(req, res) {
    addspro.save(req);
    res.send('200');
});

app.get('/aff/addsprolanded', function(req, res) {
    addspro.landed(req);
    res.send('200');
});

app.get('/campaignSettings', function(req, res) {
    res.writeHead(200, { "Content-Type": "application/json" });
    fs.readFile('./landingPages/campaign.json', function(err, json) {
        if (err) {
            throw err;
        }

        res.write(json);
        res.end();
    });
});

app.get('/campaign', function(req, res) {
    res.writeHead(200, { "Content-Type": "text/html" });
    fs.readFile('./landingPages/campaign.html', function(err, html) {
        if (err) {
            throw err;
        }

        res.write(html);
        res.end();
    });
});

app.get('/tnc', function(req, res) {
    res.writeHead(200, { "Content-Type": "text/html" });
    fs.readFile('./landingPages/tnc.html', function(err, html) {
        if (err) {
            throw err;
        }

        res.write(html);
        res.end();
    });
});

// function startScheduleWithThread() {
//     console.log('schedule(thread) started, every ' + interval + ' minutes');
//     cron.schedule('*/' + interval + ' * * * *', function() {
//         var spawn = require('threads').spawn;
//         var thread = spawn('./scheduler.js');
//         thread.send({})
//             .on('message', function(response) {
//                 console.log(response);
//                 thread.kill();
//             });
//     });
// }

function startSchedule() {
    console.log('schedule(noThread) started, every ' + interval + ' minutes');
    cron.schedule('*/' + interval + ' * * * *', function() {
        scheduler.run();
    });
}

var port = process.port || 8872;
app.use(express.static(__dirname + '/public'));
app.listen(port, function() {
    console.log('[' + new Date() + '] funnet app listening on port ' + port);
});

console.log('preparing mongodb at ' + mongoUrl);
//startScheduleWithThread();
startSchedule();