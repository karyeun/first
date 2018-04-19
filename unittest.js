var fetch = require('node-fetch');
var fs = require('fs');
var log = require('./lib/log')(fs);
var parseString = require('xml2js').parseString;
var logType = 'UnitTest';

// var mtUrlIce = 'http://sit-mkservices.azurewebsites.net/push/ice?';
// var mtUrlMexcomm = 'http://sit-mkservices.azurewebsites.net/push/mexcomm?';
// var mtUrlMk = 'http://sit-mkservices.azurewebsites.net/push/mk?';
// var mtUrlMmp = 'http://sit-mkservices.azurewebsites.net/push/mmp?';
var mtUrlIce = 'http://202.76.237.92:43100/mt_receiver?';
var mtUrlMexcomm = 'http://203.223.147.133:8001/MTPush/MTPush.aspx?';
var mtUrlMk = 'http://mis.etracker.cc/mcppush/mcppush.aspx?';
var mtUrlMmp = 'http://id.belivemobile.com/v4/my/postmt.php?';
var gateway,
    url;

process.argv.forEach(function(val, index, array) {
    if (index === 2) gateway = val;
    //else if (index === 3) count = val;
    //else if (index === 4) clean = val;
});

if ('ICE,MEXCOMM,MK,MMP,'.indexOf(gateway + ',') < 0) {
    log.save('*gateway is not found: ' + gateway, logType);
    return;
}

log.save('gateway: ' + gateway, logType);

var mt = {
    gateway: gateway,
    userName: 'dummy',
    password: 'password',
    shortCode: '36200',
    keyword: 'BOY',
    content: encodeURIComponent('Download funny video at http://is.gd/B7McJ9'),
    price: 400,
    telcoId: '1',
    msisdn: '60122618872'
};
if (gateway == 'ICE') {
    url = mtUrlIce;
    headers = {
        'x-premio-sms-cpid': mt.userName,
        'x-premio-sms-password': mt.password,
        'x-premio-sms-service': mt.keyword,
        'x-premio-sms-oa': mt.shortCode,
        'x-premio-sms-da': mt.msisdn,
        'x-premio-sms-refid': '',
        'x-premio-sms-type': 'MT_PUSH',
        'x-premio-sms-msgdata': mt.content,
        'x-premio-sms-coding': '0',
        'x-premio-sms-tariffid': mt.price,
        'x-premio-sms-contenttype': '0'
    };
} else if (gateway == 'MEXCOMM') {
    url = mtUrlMexcomm;
    url += 'User=' + mt.userName +
        '&Pass=' + mt.password +
        '&Shortcode=' + mt.shortCode +
        '&msisdn=' + mt.msisdn +
        '&Telcoid=' + mt.telcoId +
        '&Keyword=' + mt.keyword +
        '&Smstype=TEXT' +
        '&Body=' + mt.content +
        '&Price=' + mt.price; //+                          
} else if (gateway == 'MK') {
    url = mtUrlMk;
    url += ('user=' + mt.userName +
        '&pass=' + mt.password +
        '&type=0' +
        '&to=' + mt.msisdn +
        '&text=' + mt.content +
        '&from=' + mt.shortCode +
        '&telcoid=' + mt.telcoId +
        '&keyword=' + mt.keyword +
        '&charge=1' +
        '&price=' + mt.price); //+
} else if (gateway == 'MMP') {
    url = mtUrlMmp;
    url += ('user=' + mt.userName +
        '&pass=' + mt.password +
        '&msisdn=' + mt.msisdn +
        '&body=' + mt.content +
        '&type=1' +
        '&shortcode=' + mt.shortCode +
        '&keyword=' + mt.keyword +
        '&operator=' + mt.telcoId +
        '&telcoid=' + mt.telcoId +
        '&country=my' +
        '&price=' + mt.price); //+
}

log.save('> ' + url, logType);
var fetchOptions = {};
if (mt.gateway == 'ICE') {
    mt.request += JSON.stringify(headers);
    fetchOptions = { method: 'POST', headers };
}

fetch(url, fetchOptions).then(result => {
    mt.responseOn = new Date();
    if (mt.gateway == 'ICE') {
        mt.response = JSON.stringify(result.headers.raw());
        log.save('<- (' + mt.gateway + ') ' + mt.response, logType);
        //process mtid-begin
        for (var hkey in result.headers) {
            result.headers[hkey.toLowerCase()] = result.headers[hkey];
        }
        mt.status = result.status;
        var headers = result.headers.raw();
        if (mt.status == '200') mt.mtid = headers['x-premio-sms-trans-id'][0];
        else mt.err = headers['x-premio-sms-errorcode'][0];
        //process mtid-end

        log.save(JSON.stringify(mt), logType);
    } else { //MEXCOMM,MK,MMP
        result.text().then(body => {
            mt.response = body;
            log.save('<- (' + mt.gateway + ') ' + mt.response, logType);
            //process mtid-begin
            if ('MK,MMP'.indexOf(mt.gateway) >= 0) {
                var response = body.split(',');
                if (response.length == 3) {
                    if (mt.gateway == 'MK') {
                        mt.status = response[2];
                        if (mt.status == '200') mt.mtid = response[1];
                        else mt.err = mt.status;
                    } else { //MMP
                        mt.status = response[1];
                        if (mt.status.toUpperCase() == 'OK') mt.mtid = response[2];
                        else mt.err = response[2];
                    }
                } else {
                    mt.err = body;
                }

                log.save(JSON.stringify(mt), logType);
            } else { //MEXCOMM
                parseString(body, { 'trim': true }, (err, result) => {
                    mt.status = result.MEXCOMM.STATUS[0];
                    if (mt.status == '0000') mt.mtid = result.MEXCOMM.MSGID[0];
                    else mt.err = mt.status;

                    log.save(JSON.stringify(mt), logType);
                });
            }
            //process mtid-end                                  
        }).catch(err => {
            log.save(String(err), logType);
        });
    }
}).catch(err => {
    log.save(String(err), logType);
});