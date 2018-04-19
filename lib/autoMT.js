var fetch = require('node-fetch');
var nconf = require('nconf');
nconf.file('./config.json');
var mtUrlMEXCOMM = nconf.get('mt-url-mexcomm');
var mtUrlMK = nconf.get('mt-url-mk');
var mtUrlMMP = nconf.get('mt-url-mmp');
var fetchDelay = nconf.get('fetch-delay-ms');
var fs = require('fs');
var log = require('./log')(fs);
var logType = 'autoMT';
var db = require('./db');
var parseString = require('xml2js').parseString;
var sleep = require('system-sleep');
var string = require('./string');
var contentsForNewSubscription = [
    'http://is.gd/B7McJ9',
    'http://is.gd/fBJZIe',
    'http://bit.ly/1KPxCaE',
    'http://bit.ly/1W0N5uD',
    'http://bit.ly/1IoPhTm'
];

module.exports = {
    retrieveBroadcastInfo: function(gateway, telcoId, shortCode, keyword) {
        return new Promise(function(resolve, reject) {
            db.retrieveOne('masters', { 'gateway': gateway }).then(result => {
                var broadcastInfo = {
                    extraMTParams: ''
                };

                var telcoParams = {};
                var telcos = result.telcos;
                for (i = 0; i < telcos.length; i++) {
                    var telco = telcos[i];
                    if (telco.id == telcoId) {
                        broadcastInfo.extraMTParams = string.isNullOrEmpty(telco.extraMTParams) ? '' : telco.extraMTParams;
                        break;
                    }
                }

                var accounts = result.accounts;
                for (i = 0; i < accounts.length; i++) {
                    var account = accounts[i];
                    var shortCodes = account.shortCodes;
                    for (j = 0; j < shortCodes.length; j++) {
                        if (shortCodes[j].shortCode == shortCode) { //shortCode matched.                              
                            var keywords = shortCodes[j].keywords;
                            for (k = 0; k < keywords.length; k++) {
                                if (keywords[k].keyword == keyword) {
                                    broadcastInfo.price = keywords[k].price;
                                    broadcastInfo.autoMT = keywords[k].autoMT;
                                    if (string.isNullOrEmpty(broadcastInfo.autoMT)) broadcastInfo.autoMT = 1; //make it 1 by default.

                                    var mtUrl = shortCodes[j].mtUrl;
                                    if (string.isNullOrEmpty(mtUrl)) broadcastInfo.mtUrl = null;
                                    else broadcastInfo.mtUrl = mtUrl; //mtUrl

                                    //assign current account
                                    broadcastInfo.credentials = {
                                        userName: account.userName,
                                        password: account.password
                                    };
                                    resolve(broadcastInfo);
                                    break; //found shortCode,keyword with price.
                                }
                            }
                        }
                    }
                }

                reject('AutoMT no broadcast info matches.');
            }).catch(err => {
                log.save(String(err), logType);
                reject(err);
            });
        });
    },

    moArrived: function(mo) { //addspro check
        if (mo.service == 'ON') {
            var autoMTName = '[autoMT]::' + mo.gateway + '/' +
                '[' + mo.telcoId + ']/' +
                mo.shortCode + '/' +
                mo.keyword + '/' +
                mo.msisdn;
            log.save(autoMTName, logType);
            this.retrieveBroadcastInfo(mo.gateway, mo.telcoId, mo.shortCode, mo.keyword).then(res => {
                var credentials = res.credentials;
                var autoMT = res.autoMT;
                var mtUrl = res.mtUrl;
                var extraParams = res.extraMTParams;
                var price = res.price;

                if (credentials == null) {
                    log.save(autoMTName + '=>no credentials.', logType);
                    return;
                }

                var urlMT;
                if (mtUrl == null) {
                    if (mo.gateway == 'MEXCOMM') urlMT = mtUrlMEXCOMM;
                    else if (mo.gateway == 'MK') urlMT = mtUrlMK;
                    else if (mo.gateway == 'MMP') urlMT = mtUrlMMP;
                } else
                    urlMT = mtUrl;

                var autoMTContents = [];
                for (var auto = 0; auto < autoMT; auto++) {
                    var randomContent = Math.floor(Math.random() * contentsForNewSubscription.length);
                    autoMTContents[auto] = contentsForNewSubscription[randomContent];
                };

                autoMTContents.forEach(content => {
                    var mt = {
                        userName: credentials.userName,
                        password: credentials.password,
                        shortCode: mo.shortCode,
                        msisdn: mo.msisdn,
                        telcoId: mo.telcoId,
                        keyword: mo.keyword,
                        content: encodeURIComponent(content),
                        price: price
                    };
                    var url = urlMT;
                    var headers = {};
                    if (url.substring(url.length - 1) != '?') url += '?';
                    if (mo.gateway == 'MEXCOMM') {
                        url += 'User=' + mt.userName +
                            '&Pass=' + mt.password +
                            '&Shortcode=' + mt.shortCode +
                            '&msisdn=' + mt.msisdn +
                            '&Telcoid=' + mt.telcoId +
                            '&Keyword=' + mt.keyword +
                            '&Smstype=TEXT' +
                            '&Body=' + mt.content +
                            '&Price=' + mt.price;
                    } else if (mo.gateway == 'MK') {
                        url += ('user=' + mt.userName +
                            '&pass=' + mt.password +
                            '&type=0' +
                            '&to=' + mt.msisdn +
                            '&text=' + mt.content +
                            '&from=' + mt.shortCode +
                            '&telcoid=' + mt.telcoId +
                            '&keyword=' + mt.keyword +
                            '&charge=1' +
                            '&price=' + mt.price);
                    } else if (mo.gateway == 'MMP') {
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
                            '&price=' + mt.price);
                    }
                    if (!string.isNullOrEmpty(extraParams))
                        url += ('&' + extraParams);

                    mt.gateway = mo.gateway;
                    mt.request = url;
                    mt.occurred = new Date();

                    console.log('push-> (' + mt.gateway + ') ' + mt.request);

                    sleep(fetchDelay);
                    fetch(url).then(result => {
                        mt.responseOn = new Date();
                        //MEXCOMM,MK,MMP
                        result.text().then(body => {
                            mt.response = body;
                            console.log('<- (' + mt.gateway + ') ' + mt.response);
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

                                db.save('mts', mt).then(mtSaved => {
                                    log.save(autoMTName + ' saved.', logType);
                                }).catch(err => {
                                    log.save(String(err), logType);
                                });

                            } else { //MEXCOMM
                                parseString(body, { 'trim': true }, (err, result) => {
                                    if (err) {
                                        log.save(String(err), logType);
                                    } else {
                                        try {
                                            mt.status = result.MEXCOMM.STATUS[0];
                                            if (mt.status == '0000') mt.mtid = result.MEXCOMM.MSGID[0];
                                            else mt.err = mt.status;
                                        } catch (e) {
                                            log.save(String(e), logType);
                                        }
                                    }

                                    db.save('mts', mt).then(mtSaved => {
                                        log.save(autoMTName + ' saved.', logType);
                                    }).catch(err => {
                                        log.save(String(err), logType);
                                    });
                                });
                            }
                            //process mtid-end                                  
                        }).catch(err => {
                            log.save(String(err), logType);
                        });
                    }).catch(err => {
                        log.save(String(err), logType);
                    });
                });
            }).catch(err => {
                log.save(String(err), logType);
            });
        }
    }
};