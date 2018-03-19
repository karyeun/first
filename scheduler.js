var fetch = require('node-fetch');
var nconf = require('nconf');
nconf.file('./config.json');
var mtUrlICE = nconf.get('mt-url-ice');
var mtUrlMEXCOMM = nconf.get('mt-url-mexcomm');
var mtUrlMK = nconf.get('mt-url-mk');
var mtUrlMMP = nconf.get('mt-url-mmp');
var fs = require('fs');
var log = require('./lib/log')(fs);
var db = require('./lib/db');
var master = require('./lib/master'); //get account credentials+keywords
var string = require('./lib/string');
var parseString = require('xml2js').parseString;
var logType = 'scheduler';

module.exports = function(input, done) {
    var curr = new Date(); //server time
    var scheduleDate = new Date(curr.getFullYear(), curr.getMonth(), curr.getDate(),
        curr.getHours(), curr.getMinutes(), 0, 0);
    log.save('cron-triggered schedule time: ' + scheduleDate, logType);

    var filter = {
        'contents.date': scheduleDate
    };
    db.retrieve('schedules', filter).then(schedules => {
        log.save('ready to broadcast at ' + scheduleDate + string.newLine() +
            'schedule count: ' + schedules.length, logType); // + ', ' +
        // (schedules.length > 0 ? JSON.stringify(schedules) : ''), logType);

        if (schedules.length > 0) {
            var scheduleRan = 0;
            schedules.forEach(schedule => {
                log.save('broadcasting ' + schedule.gateway + '/' +
                    '[' + schedule.telcoIds + ']/' +
                    schedule.account + '/' +
                    schedule.shortCode + '/' +
                    '[' + schedule.keywords + ']', logType);

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

                if (content == null) done('no contents.');

                var filterSubscriber = {
                    telcoId: { $in: schedule.telcoIds },
                    keyword: { $in: schedule.keywords },
                    gateway: schedule.gateway,
                    service: 'ON',
                    shortCode: schedule.shortCode
                };

                var promises = [];
                promises.push(master.retrieveCredentials(schedule.gateway, schedule.account));
                promises.push(master.retrieveKeywords(schedule.gateway, schedule.shortCode));
                promises.push(master.retrieveMTUrl(schedule.gateway, schedule.shortCode));
                promises.push(master.retrieveMTExtraParams(schedule.gateway));
                promises.push(db.retrieve('subscribers', filterSubscriber));
                Promise.all(promises).then(res => {
                    var credentials = res[0];
                    var keywords = res[1];
                    var mtUrl = res[2];
                    var extraParams = res[3];
                    var subscribers = res[4];

                    log.save('credentials: ' + JSON.stringify(credentials) + string.newLine() +
                        'keywords:' + JSON.stringify(keywords) + string.newLine() +
                        'MTUrl: ' + mtUrl + string.newLine() +
                        'subsribers:' + subscribers.length, logType);

                    if (credentials == null) done('no credentials.');
                    else if (keywords.length == 0) done('no keywords matched.');
                    else if (subscribers.length === 0) done('no subscribers.');

                    db.save('broadcasts', {
                        on: new Date(),
                        gateway: schedule.gateway,
                        account: credentials.userName,
                        shortCode: schedule.shortCode,
                        keywords: JSON.stringify(keywords),
                        subscribers: subscribers.length,
                        content: content
                    }).then(saved => {
                        schedule.broadcastId = saved.insertedId
                    });

                    var pushes = 0;
                    var urlMT;
                    if (mtUrl == null) {
                        if (schedule.gateway == 'ICE') urlMT = mtUrlICE;
                        else if (schedule.gateway == 'MEXCOMM') urlMT = mtUrlMEXCOMM;
                        else if (schedule.gateway == 'MK') urlMT = mtUrlMK;
                        else if (schedule.gateway == 'MMP') urlMT = mtUrlMMP;
                    } else
                        urlMT = mtUrl;

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

                        if (schedule.gateway == 'ICE') {
                            // url = mtUrlICE;
                            headers = {
                                'x-premio-sms-cpid': mt.userName,
                                'x-premio-sms-password': mt.password,
                                'x-premio-sms-service': mt.keyword,
                                'x-premio-sms-oa': mt.shortCode,
                                'x-premio-sms-da': mt.msisdn,
                                'x-premio-sms-refid': '',
                                'x-premio-sms-type': 'MT_PUSH',
                                'x-premio-sms-msgdata': encodeURIComponent(mt.content),
                                'x-premio-sms-coding': '0',
                                'x-premio-sms-tariffid': mt.price,
                                'x-premio-sms-contenttype': '0'
                            };
                        } else if (schedule.gateway == 'MEXCOMM') {
                            url += 'User=' + mt.userName +
                                '&Pass=' + mt.password +
                                '&Shortcode=' + mt.shortCode +
                                '&msisdn=' + mt.msisdn +
                                '&Telcoid=' + mt.telcoId +
                                '&Keyword=' + mt.keyword +
                                '&Smstype=TEXT' +
                                '&Body=' + encodeURIComponent(mt.content) +
                                '&Price=' + mt.price; //+
                            //&Moid=                            
                        } else if (schedule.gateway == 'MK') {
                            url += ('user=' + mt.userName +
                                '&pass=' + mt.password +
                                '&type=0' +
                                '&to=' + mt.msisdn +
                                '&text=' + encodeURIComponent(mt.content) +
                                '&from=' + mt.shortCode +
                                '&telcoid=' + mt.telcoId +
                                '&keyword=' + mt.keyword +
                                '&charge=1' +
                                '&price=' + mt.price); //+
                            //'&moid=' + 'moid';
                        } else if (schedule.gateway == 'MMP') {
                            url += ('user=' + mt.userName +
                                '&pass=' + mt.password +
                                '&msisdn=' + mt.msisdn +
                                '&body=' + encodeURIComponent(mt.content) +
                                '&type=1' +
                                '&shortcode=' + mt.shortCode +
                                '&keyword=' + mt.keyword +
                                '&operator=' + mt.telcoId +
                                '&country=my' +
                                '&price=' + mt.price); //+
                            // &url=
                            // &moid=
                        }
                        var anyExtraParams = extraParams[subs.telcoId];
                        if (!string.isNullOrEmpty(anyExtraParams))
                            url += ('&' + anyExtraParams);

                        mt.gateway = schedule.gateway;
                        mt.request = url;
                        mt.on = new Date();

                        log.save('push-> (' + mt.gateway + ') ' + mt.request +
                            (schedule.gateway == 'ICE' ? JSON.stringify(headers) : ''), logType);
                        var fetchOptions = {};
                        if (schedule.gateway == 'ICE') {
                            mt.request += JSON.stringify(headers);
                            fetchOptions = { method: 'POST', headers };
                        }
                        fetch(url, fetchOptions).then(result => {
                            mt.responseOn = new Date();
                            if (mt.gateway == 'ICE') {
                                mt.response = JSON.stringify(result.headers.raw());
                                log.save('<- ' + mt.response, logType);
                                //process mtid-begin
                                for (var hkey in result.headers) {
                                    result.headers[hkey.toLowerCase()] = result.headers[hkey];
                                }
                                mt.status = result.status;
                                var headers = result.headers.raw();
                                if (mt.status == '200') mt.mtid = headers['x-premio-sms-trans-id'][0];
                                else mt.err = headers['x-premio-sms-errorcode'][0];
                                //process mtid-end
                                db.save('mt', mt).then(saved => {
                                    log.save('mt saved', logType);
                                    pushes++;
                                    if (pushes === subscribers.length) {
                                        db.update('broadcasts', { '_id': schedule.broadcastId }, {
                                            $set: {
                                                doneOn: new Date()
                                            }
                                        }).then(updated => {
                                            scheduleRan++;
                                            if (scheduleRan === schedules.length) {
                                                log.save('broadcast completed.', logType);
                                                done('schedule thread.exit() .. ');
                                            }
                                        });
                                    }
                                });
                            } else { //MEXCOMM,MK,MMP
                                result.text().then(body => {
                                    mt.response = body;
                                    log.save('<- ' + mt.response, logType);
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
                                        db.save('mt', mt).then(saved => {
                                            log.save('mt saved', logType);
                                            pushes++;
                                            if (pushes === subscribers.length) {
                                                db.update('broadcasts', { '_id': schedule.broadcastId }, {
                                                    $set: {
                                                        doneOn: new Date()
                                                    }
                                                }).then(updated => {
                                                    scheduleRan++;
                                                    if (scheduleRan === schedules.length) {
                                                        log.save('broadcast completed.', logType);
                                                        done('schedule thread.exit() .. ');
                                                    }
                                                });
                                            }
                                        });
                                    } else { //MEXCOMM
                                        parseString(body, { 'trim': true }, (err, result) => {
                                            mt.status = result.MEXCOMM.STATUS[0];
                                            if (mt.status == '0000') mt.mtid = result.MEXCOMM.MSGID[0];
                                            else mt.err = mt.status;

                                            db.save('mt', mt).then(saved => {
                                                log.save('mt saved', logType);
                                                pushes++;
                                                if (pushes === subscribers.length) {
                                                    db.update('broadcasts', { '_id': schedule.broadcastId }, {
                                                        $set: {
                                                            doneOn: new Date()
                                                        }
                                                    }).then(updated => {
                                                        scheduleRan++;
                                                        if (scheduleRan === schedules.length) {
                                                            log.save('broadcast completed.', logType);
                                                            done('schedule thread.exit() .. ');
                                                        }
                                                    });
                                                }
                                            });
                                        });
                                    }
                                    //process mtid-end                                  
                                }).catch(err => {
                                    console.log(err);
                                    log.save(String(err), logType);
                                    pushes++;
                                    if (pushes === subscribers.length) {
                                        db.update('broadcasts', { '_id': schedule.broadcastId }, {
                                            $set: {
                                                doneOn: new Date()
                                            }
                                        }).then(updated => {
                                            scheduleRan++;
                                            if (scheduleRan === schedules.length) {
                                                log.save('broadcast completed.', logType);
                                                done('schedule thread.exit() .. ');
                                            }
                                        });
                                    }
                                });
                            }
                        }).catch(err => {
                            console.log(err);
                            log.save(String(err), logType);
                            pushes++;
                            if (pushes === subscribers.length) {
                                db.update('broadcasts', { '_id': schedule.broadcastId }, {
                                    $set: {
                                        doneOn: new Date()
                                    }
                                }).then(updated => {
                                    scheduleRan++;
                                    if (scheduleRan === schedules.length) {
                                        log.save('broadcast completed.', logType);
                                        done('schedule thread.exit() .. ');
                                    }
                                });
                            }
                        });
                    });
                });
            });

        } else {
            log.save('no schedules.', logType);
            done('schedule thread.exit() .. ');
        }
    });
};