var fetch = require('node-fetch');
var nconf = require('nconf');
nconf.file('./config.json');
//var mtUrlICE = nconf.get('mt-url-ice');
var mtUrlMEXCOMM = nconf.get('mt-url-mexcomm');
var mtUrlMK = nconf.get('mt-url-mk');
var mtUrlMMP = nconf.get('mt-url-mmp');
var fetchDelay = nconf.get('fetch-delay-ms');
var fs = require('fs');
var log = require('./lib/log')(fs);
var db = require('./lib/db');
var master = require('./lib/master'); //get account credentials+keywords
var string = require('./lib/string');
var parseString = require('xml2js').parseString;
var sleep = require('system-sleep');
//var sleep = require('sleep-promise');
var logType = 'scheduler';

module.exports = {
    run: () => {
        var curr = new Date(); //server time
        var scheduleDate = new Date(curr.getFullYear(), curr.getMonth(), curr.getDate(),
            curr.getHours(), curr.getMinutes(), 0, 0);
        log.save('cron-triggered schedule time: ' + scheduleDate, logType);

        var scheduleFilter = {
            'enable': true,
            'contents.date': scheduleDate
        };
        db.retrieve('schedules', scheduleFilter).then(schedules => {
            if (schedules.length > 0) {
                log.save('schedules to broadcast:' + schedules.length, logType);
                schedules.forEach(schedule => {
                    schedule.name = schedule.gateway + '/' +
                        '[' + schedule.telcoIds + ']/' +
                        schedule.account + '/' +
                        schedule.shortCode + '/' +
                        '[' + schedule.keywords + '] ';
                    log.save('broadcasting ' + schedule.name, logType);

                    //get contents
                    var contents = schedule.contents;
                    var content = null;
                    for (c = 0; c < contents.length; c++) {
                        if (contents[c].date.getTime() === scheduleDate.getTime()) {
                            content = contents[c].content;
                            log.save('content to use> ' + content, logType);
                            break;
                        }
                    }

                    if (content == null) {
                        log.save(schedule.name + '=>no contents.', logType);
                        return;
                    }

                    sleep(1000);
                    master.retrieveBroadcastInfo(schedule.gateway, schedule.account, schedule.shortCode).then(res => {
                        console.log(res);
                        var credentials = res.credentials;
                        var keywords = res.keywords;
                        var mtUrl = res.mtUrl;
                        var extraParams = res.extraMTParams;

                        if (credentials == null) {
                            log.save(schedule.name + '=>no credentials.', logType);
                            return;
                        } else if (keywords.length == 0) {
                            log.save(schedule.name + '=>no keywords matched.', logType);
                            return;
                        }

                        var filterSubscriber = {
                            telcoId: { $in: schedule.telcoIds },
                            keyword: { $in: schedule.keywords },
                            gateway: schedule.gateway,
                            service: 'ON',
                            shortCode: schedule.shortCode
                        };
                        sleep(1000);
                        db.retrieve('subscribers', filterSubscriber).then(subscribers => {
                            log.save(schedule.name + '=>' + string.newLine() +
                                'credentials: ' + JSON.stringify(credentials) + string.newLine() +
                                'keywords:' + JSON.stringify(keywords) + string.newLine() +
                                'MTUrl: ' + mtUrl + string.newLine() +
                                'subsribers:' + subscribers.length, logType);

                            if (subscribers.length === 0) {
                                log.save(schedule.name + '=>no subscribers.', logType);
                                return;
                            }

                            db.save('broadcasts', {
                                occurred: new Date(),
                                gateway: schedule.gateway,
                                account: credentials.userName,
                                shortCode: schedule.shortCode,
                                keywords: JSON.stringify(keywords),
                                subscribers: subscribers.length,
                                content: content
                            }).then(saved => {
                                schedule.broadcastId = saved.insertedId;
                            }).catch(err => {
                                log.save(err, logType);
                            });

                            var pushes = 0;
                            var urlMT;
                            if (mtUrl == null) {
                                if (schedule.gateway == 'MEXCOMM') urlMT = mtUrlMEXCOMM;
                                else if (schedule.gateway == 'MK') urlMT = mtUrlMK;
                                else if (schedule.gateway == 'MMP') urlMT = mtUrlMMP;
                            } else
                                urlMT = mtUrl;

                            var mts = [];
                            subscribers.forEach(subs => {
                                var mt = {
                                    userName: credentials.userName,
                                    password: credentials.password,
                                    shortCode: schedule.shortCode,
                                    msisdn: subs.msisdn,
                                    telcoId: subs.telcoId,
                                    keyword: subs.keyword,
                                    content: encodeURIComponent(content),
                                    price: keywords[subs.keyword]
                                };
                                var url = urlMT;
                                var headers = {};
                                if (url.substring(url.length - 1) != '?') url += '?';
                                if (schedule.gateway == 'MEXCOMM') {
                                    url += 'User=' + mt.userName +
                                        '&Pass=' + mt.password +
                                        '&Shortcode=' + mt.shortCode +
                                        '&msisdn=' + mt.msisdn +
                                        '&Telcoid=' + mt.telcoId +
                                        '&Keyword=' + mt.keyword +
                                        '&Smstype=TEXT' +
                                        '&Body=' + mt.content +
                                        '&Price=' + mt.price;
                                } else if (schedule.gateway == 'MK') {
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
                                } else if (schedule.gateway == 'MMP') {
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
                                var anyExtraParams = extraParams[subs.telcoId];
                                if (!string.isNullOrEmpty(anyExtraParams))
                                    url += ('&' + anyExtraParams);

                                mt.gateway = schedule.gateway;
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

                                            mts.push(mt);
                                            pushes++;
                                            if (pushes === subscribers.length) {
                                                db.bulkSave('mts', mts).then(mtSaved => {
                                                    log.save(schedule.name + mts.length + ' mt saved.', logType);
                                                    db.update('broadcasts', { '_id': schedule.broadcastId }, {
                                                        $set: {
                                                            doneOn: new Date()
                                                        }
                                                    }).then(updated => {}).catch(err => {
                                                        log.save(err, logType);
                                                    });
                                                }).catch(err => {
                                                    log.save(err, logType);
                                                });
                                            }
                                        } else { //MEXCOMM
                                            parseString(body, { 'trim': true }, (err, result) => {
                                                if (err) {
                                                    log.save(err, logType);
                                                } else {
                                                    try {
                                                        mt.status = result.MEXCOMM.STATUS[0];
                                                        if (mt.status == '0000') mt.mtid = result.MEXCOMM.MSGID[0];
                                                        else mt.err = mt.status;
                                                    } catch (e) {
                                                        log.save(e, logType);
                                                    }
                                                }

                                                mts.push(mt);
                                                pushes++;
                                                if (pushes === subscribers.length) {
                                                    db.bulkSave('mts', mts).then(mtSaved => {
                                                        log.save(schedule.name + mts.length + ' mt saved.', logType);
                                                        db.update('broadcasts', { '_id': schedule.broadcastId }, {
                                                            $set: {
                                                                doneOn: new Date()
                                                            }
                                                        }).then(updated => {}).catch(err => {
                                                            log.save(err, logType);
                                                        });
                                                    }).catch(err => {
                                                        log.save(err, logType);
                                                    });
                                                }
                                            });
                                        }
                                        //process mtid-end                                  
                                    }).catch(err => {
                                        log.save(String(err), logType);

                                        pushes++;
                                        if (pushes === subscribers.length) {
                                            db.bulkSave('mts', mts).then(mtSaved => {
                                                log.save(schedule.name + mts.length + ' mt saved.', logType);
                                                db.update('broadcasts', { '_id': schedule.broadcastId }, {
                                                    $set: {
                                                        doneOn: new Date()
                                                    }
                                                }).then(updated => {}).catch(err => {
                                                    log.save(err, logType);
                                                });
                                            }).catch(err => {
                                                log.save(err, logType);
                                            });
                                        }
                                    });
                                }).catch(err => {
                                    log.save(String(err), logType);

                                    pushes++;
                                    if (pushes === subscribers.length) {
                                        db.bulkSave('mts', mts).then(mtSaved => {
                                            log.save(schedule.name + mts.length + ' mt saved.', logType);
                                            db.update('broadcasts', { '_id': schedule.broadcastId }, {
                                                $set: {
                                                    doneOn: new Date()
                                                }
                                            }).then(updated => {}).catch(err => {
                                                log.save(err, logType);
                                            });
                                        }).catch(err => {
                                            log.save(err, logType);
                                        });
                                    }
                                });
                            });
                        }).catch(err => {
                            log.save('(subscribers error)' + String(err), logType);
                        });

                    }).catch(err => {
                        log.save('(master error)' + String(err), logType);
                    });
                });
            } else {
                log.save('no schedules.', logType);
            }
        }).catch(err => {
            log.save(err, logType);
        });
    }
};