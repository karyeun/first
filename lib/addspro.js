var url = require('url');
var db = require('./db');
var string = require('./string');
var fs = require('fs');
var log = require('./log')(fs);
var logType = 'addspro';
var fetch = require('node-fetch');
var urlAddspro = 'https://re.mengine.me/conversion.php?transaction_id=';
var postbackPercentage = 40; //in % 
var urlCampaign = 'http://fntsb.net/campaignSettings';

module.exports = {
    landed: req => {
        var addsprolanded = {
            occurred: new Date(),
        };

        var q = url.parse(req.url, true);
        addsprolanded.query = decodeURIComponent(q.search);

        db.save('addsproslandeds', addsprolanded).then(result => {
            log.save('addspro landed: ' + addsprolanded.query, logType);
        });
    },

    save: req => {
        var addspro = {
            occurred: new Date(),
            converted: false,
            postback: false
        };

        var q = url.parse(req.url, true);
        addspro.query = decodeURIComponent(q.search);

        for (var key in q.query) {
            q.query[key.toLowerCase()] = q.query[key];
        }

        var query = q.query; //return {key:value, ..}
        addspro.transId = query.trans_id;
        addspro.aff = query.aff;
        addspro.shortCode = query.shortcode;
        addspro.keyword = query.keyword;
        addspro.msisdn = query.msisdn;

        if (string.isNullOrEmpty(addspro.transId) ||
            string.isNullOrEmpty(addspro.aff) ||
            string.isNullOrEmpty(addspro.shortCode) ||
            string.isNullOrEmpty(addspro.keyword) ||
            string.isNullOrEmpty(addspro.msisdn)) {
            log.save('unexpected addspro response> ' + JSON.stringify(addspro.response), logType);
            return;
        }

        db.save('addspros', addspro).then(result => {
            log.save('addspro\'s query saved: transId[' + addspro.transId + ']', logType);
        });
    },

    moArrived: mo => { //addspro check
        if (mo.service == 'ON') {
            var moName = '(' + mo.gateway + ') [ON][' + mo.telcoId + ']' + mo.msisdn + '/' + mo.shortCode + '/' + mo.keyword;
            fetch(urlCampaign).then(body => {
                body.json().then(campaign => {
                    var campaignName = campaign.gateway + '/' + campaign.shortCode + '/' + campaign.keyword;
                    if (mo.gateway == campaign.gateway &&
                        mo.shortCode == campaign.shortCode &&
                        mo.keyword == campaign.keyword &&
                        campaign.aimTelco.indexOf(mo.telcoId + ',') >= 0) {
                        var filter = {
                            shortCode: mo.shortCode,
                            keyword: mo.keyword,
                            converted: false
                        };
                        db.latest('addspros', filter).then(addspro => {
                            if (addspro) {
                                var addsproName = 'addspro transId[' + addspro.transId + '] ';
                                var updatedValue = {
                                    converted: true
                                };

                                var randomPercentage = Math.floor(Math.random() * 100) + 1;
                                var postbackRequired = (randomPercentage <= postbackPercentage);
                                if (postbackRequired) {
                                    log.save('TO postback> ' + addsproName, logType);
                                    var addsproUrlCall = urlAddspro + addspro.transId;
                                    log.save('addspro.postback> ' + addsproUrlCall, logType);
                                    updatedValue.request = addsproUrlCall;
                                    updatedValue.requestOn = new Date();
                                    fetch(addsproUrlCall).then(result => {
                                        updatedValue.responseOn = new Date();
                                        result.text().then(body => {
                                            updatedValue.response = body;
                                            updatedValue.postback = true;
                                            log.save('addspro.postback< ' + body, logType);
                                            db.update('addspros', addspro, { $set: updatedValue }).then(updated => {
                                                log.save(addsproName + 'postback/updated', logType);
                                            }).catch(err => {
                                                log.save(String(err), logType);
                                            });
                                        }).catch(err => {
                                            log.save(String(err), logType);
                                        });
                                    }).catch(err => {
                                        log.save(String(err), logType);
                                    });
                                } else {
                                    log.save('NO postback> ' + addsproName, logType);
                                    db.update('addspros', addspro, { $set: updatedValue }).then(updated => {
                                        log.save(addsproName + 'converted only', logType);
                                    }).catch(err => {
                                        log.save(String(err), logType);
                                    });
                                }
                            } else
                                log.save('no matching addspro', logType);
                        }).catch(err => {
                            log.save(String(err), logType);
                        });
                    } else
                        log.save(moName + ' not in campaign=> ' + campaignName, logType);
                }).catch(err => {
                    log.save(String(err), logType);
                });
            }).catch(err => {
                log.save(String(err), logType);
            });
        }
    },

    // moArrived_backup: mo => { //addspro check
    //     if (mo.service == 'ON') {
    //         var filter = {
    //             msisdn: mo.msisdn,
    //             shortCode: mo.shortCode,
    //             keyword: mo.keyword,
    //             postback: false
    //         };
    //         db.retrieve('addspros', filter).then(recs => {
    //             recs.forEach(addspro => {
    //                 var updatedValue = {
    //                     converted: true
    //                 };

    //                 var randomPercentage = Math.floor(Math.random() * 100) + 1;
    //                 // console.log('randomPercentage:' + randomPercentage);
    //                 // console.log('postbackPercentage:' + postbackPercentage);
    //                 var postbackRequired = (randomPercentage <= postbackPercentage);
    //                 if (postbackRequired) {
    //                     //console.log('POSTBACK');
    //                     var addsproUrlCall = urlAddspro + addspro.transId;
    //                     log.save('addspro.conversion> ' + addsproUrlCall, logType);
    //                     updatedValue.request = addsproUrlCall;
    //                     updatedValue.requestOn = new Date();
    //                     fetch(addsproUrlCall).then(result => {
    //                         updatedValue.responseOn = new Date();
    //                         result.text().then(body => {
    //                             updatedValue.response = body;
    //                             updatedValue.postback = true;
    //                             log.save('addspro.conversion< ' + body, logType);
    //                             db.update('addspros', addspro, { $set: updatedValue }).then(updated => {
    //                                 log.save('addspro transId[' + addspro.transId + '] postback/updated', logType);
    //                             }).catch(err => {
    //                                 log.save(String(err), logType);
    //                             });
    //                         }).catch(err => {
    //                             log.save(String(err), logType);
    //                         });
    //                     }).catch(err => {
    //                         log.save(String(err), logType);
    //                     });
    //                 } else {
    //                     //console.log('NO POSTBACK');
    //                     db.update('addspros', addspro, { $set: updatedValue }).then(updated => {
    //                         log.save('addspro[' + addspro.transId + '] postback/updated', logType);
    //                     }).catch(err => {
    //                         log.save(String(err), logType);
    //                     });
    //                 }
    //             });
    //         });
    //     }
    // }
};