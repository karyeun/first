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
var master = require('./lib/master'); //get account credentials
var string = require('./lib/string');
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
            'schedule count: ' + schedules.length + ', ' +
            (schedules.length > 0 ? JSON.stringify(schedules) : ''), logType);

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
                var content;
                for (c = 0; c < contents.length; c++) {
                    if (contents[c].date.getTime() === scheduleDate.getTime()) {
                        content = contents[c].content;
                        log.save('content to use> ' + content, logType);
                        break;
                    }
                }

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
                promises.push(db.retrive('subscribers', filterSubscriber));
                Promise.all(promises).then(res => {
                    var credentials = res[0];
                    var keywords = res[1];
                    var subscribers = res[2];
                    log.save('credentials: ' + JSON.stringify(credentials) + string.newLine() +
                        'subsribers:' + subscribers.length, logType);
                    var pushes = 0;
                    var urlMT;
                    if (schedule.gateway == 'ICE') urlMT = mtUrlICE;
                    else if (schedule.gateway == 'MEXCOMM') urlMT = mtUrlMEXCOMM;
                    else if (schedule.gateway == 'MK') urlMT = mtUrlMK;
                    else if (schedule.gateway == 'MMP') urlMT = mtUrlMMP;
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
                        if (url.substring(url.length - 1) != '?') url += '?';

                        if (schedule.gateway == 'ICE') {
                            url = mtUrlICE;
                        } else if (schedule.gateway == 'MEXCOMM') {
                            url += 'User=' + mt.userName +
                                '&Pass=' + mt.password +
                                '&Shortcode=' + mt.shortCode +
                                '&Msisdn=' + mt.msisdn +
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
                                '&type=1 ' +
                                '&shortcode=' + mt.shortCode +
                                '&keyword=' + mt.keyword +
                                '&operator=' + mt.telcoId +
                                '&country=my' +
                                '&price=' + mt.price); //+
                            // &url=
                            // &moid=
                        }

                        var newMT = {
                            gateway: schedule.gateway,
                            request: url,
                            on: new Date()
                        };

                        log.save('push-> (' + schedule.gateway + ') ' + url, logType);
                        fetch(url).then(result => {
                            newMT.responseOn = new Date();
                            result.text().then(body => {
                                newMT.response = body;
                                log.save('<- ' + body, logType);
                                db.save('mt', newMT).then(saved => {
                                    log.save('mt saved', logType);
                                    pushes++;
                                    if (pushes === subscribers.length) {
                                        scheduleRan++;
                                        if (scheduleRan === schedules.length) {
                                            log.save('broadcast completed.', logType);
                                            done('schedule thread.exit() .. ');
                                        }
                                    }
                                });
                            });
                        });

                    });
                });
            });

        } else {
            log.save('no schedules to broadcast.', logType);
            done('schedule thread.exit() .. ');
        }

        // if (schedule.gateway == 'MK') {
        //     //get account credentials
        //     var credential = {
        //         user: 'starnet',
        //         pass: 'starnet123'
        //     };

        //     //get contents
        //     var content;
        //     for (c = 0; c < schedule.contents.length; c++) {
        //         if (schedule.contents[c].date == input.scheduleDate) {
        //             content = schedule.contents[c];
        //             break;
        //         }
        //     }
        // }

        // //get subscribers
        // var filterSubscriber = {
        //     telcoId: { $in: [schedule.telcoIds] },
        //     keyword: { $in: [schedule.keywords] },
        //     gateway: schedule.gateway,
        //     service: 'ON',
        //     shortCode: schedule.shortCode
        // };
        // var fetch = require('node-fetch');
        // var subscriber = require('./subscriber');
        // subscriber.retrive(filterSubscriber).then(subscribers => {
        //     for (j = 0; j < subscribers.length; j++) {
        //         var subs = subscribers[j];
        //         var url = '';
        //         url += 'user=' + credential.user +
        //             '&pass=' + credential.pass +
        //             '&type=0' +
        //             '&to=' + subs.msisdn +
        //             '&text=' + encodeURIComponent(content.content) +
        //             '&from=' + schedule.shortCode +
        //             '&telcoid=' + subs.telcoId +
        //             '&keyword=' + subs.keyword +
        //             '&charge=1' +
        //             '&price=' + schedule.price +
        //             '&moid=' + 'moid';

        //         mt.push(fetch, schedule.gateway, url);
        //     }
        // });
        //}


    });
};