var url = require('url');
var db = require('./db');
var string = require('./string');
var fs = require('fs');
var log = require('./log')(fs);
var logType = 'mo';

module.exports = {
    save: function(gateway, req) {
        var rawMO = {
            gateway: gateway,
            on: new Date()
        };

        var mo = {}; //forming general mo structure
        if ('ICE,MEXCOMM,MK,MMP'.indexOf(gateway) >= 0) {
            if ('MEXCOMM,MK,MMP'.indexOf(gateway) >= 0) {
                var q = url.parse(req.url, true);
                rawMO.response = decodeURIComponent(q.search);

                for (var key in query) {
                    query[key.toLowerCase()] = query[key];
                }

                var query = q.query;
                if (gateway == 'MEXCOMM') {
                    mo.msisdn = query.msisdn;
                    mo.body = query.body;
                    mo.moid = query.moid;
                    mo.shortCode = query.shortcode;
                    mo.telcoId = query.telcoid;
                    mo.time = query.time;
                } else if (gateway == 'MMP') {
                    mo.msisdn = query.msisdn;
                    mo.body = query.body;
                    mo.moid = query.moid;
                    mo.shortCode = query.shortcode;
                    mo.telcoId = query.operator;
                    mo.time = query.time;
                } else if (gateway == 'MK') {
                    mo.msisdn = query.from;
                    mo.body = query.text;
                    mo.moid = query.moid;
                    mo.shortCode = query.shortcode;
                    mo.telcoId = query.telcoid;
                    mo.time = query.time;
                }
            } else { //ICE
                rawMO.response = JSON.stringify(req.headers);

                for (var hkey in req.headers) {
                    req.headers[hkey.toLowerCase()] = req.headers[hkey];
                }

                mo.msisdn = req.headers['x-premio-sms-oa'];
                mo.body = req.headers['x-premio-sms-msgdata'];
                mo.moid = req.headers['x-premio-sms-id'];
                mo.shortCode = req.headers['x-premio-sms-da'];
                mo.telcoId = req.headers['x-premio-sms-service'];
                mo.time = new Date().toString();
            }

            db.save('mo', rawMO).then(result => {
                console.log('mo (' + gateway + ') saved');
            });

            this.process(gateway, mo);
        } else {
            log.save('unhandled gateway: (' + gateway + ')', logType);
            return;
        }
    },

    process: function(gateway, mo) { //subsriber update
        if (string.isNullOrEmpty(mo.msisdn) ||
            string.isNullOrEmpty(mo.body) ||
            string.isNullOrEmpty(mo.moid) ||
            string.isNullOrEmpty(mo.shortCode) ||
            string.isNullOrEmpty(mo.telcoId) ||
            string.isNullOrEmpty(mo.time)) {
            log.save('unexpected mo (' + gateway + ') ' + JSON.stringify(mo), logType);
            return;
        }

        var body = mo.body.trim().toUpperCase().replace('  ', ' ');
        var reply = body.split(' ');
        if (reply.length === 2) {
            var service = reply[0]; //should be ON, OUT, STOP
            var keyword = reply[1];

            if (service == 'ON' || service == 'OUT' || service == 'STOP' ||
                (service == 'STOP' && keyword == 'ALL')) {
                var filterSubscriber = {
                    gateway: gateway,
                    msisdn: mo.msisdn,
                    shortCode: mo.shortCode,
                    telcoId: mo.telcoId
                };
                if (!(service == 'STOP' && keyword == 'ALL' ||
                        service == 'OUT' && keyword == 'ALL'))
                    filterSubscriber.keyword = keyword;

                db.any('subscribers', filterSubscriber).then(exists => {
                    if (exists) {
                        var updateSubscriber = {
                            $set: {
                                service: service //could b ON, OUT or STOP
                            }
                        };

                        db.update('subscribers', filterSubscriber, updateSubscriber).then(result => {
                            console.log('Update subscriber [' + service + ']' +
                                filterSubscriber.msisdn + '/' +
                                filterSubscriber.shortCode + '/' +
                                (filterSubscriber.keyword ? filterSubscriber.keyword : '*'));
                        });

                    } else {
                        var newSubscriber = {
                            gateway: gateway,
                            msisdn: mo.msisdn,
                            shortCode: mo.shortCode,
                            keyword: keyword,
                            telcoId: mo.telcoId,
                            service: service,
                            subscribeOn: new Date()
                        };
                        db.save('subscribers', newSubscriber).then(result => {
                            console.log('New subscriber [' + service + ']' +
                                newSubscriber.msisdn + '/' +
                                newSubscriber.shortCode + '/' +
                                newSubscriber.keyword);
                        });
                    }
                });
            } else
                log.save('unexpected mo-reply (' + gateway + ') ' + JSON.stringify(mo), logType);
        } else {
            log.save('unexpected mo-reply (' + gateway + ') ' + JSON.stringify(mo), logType);
        }
    }
};