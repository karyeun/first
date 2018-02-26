var url = require('url');
var db = require('./db');
var string = require('./string');
var fs = require('fs');
var log = require('./log')(fs);
var logType = 'mo';

module.exports = {
    save: function(gateway, req) {
        var q = url.parse(req.url, true);
        var mo = {
            response: decodeURIComponent(q.search),
            gateway: gateway,
            on: new Date()
        };

        db.save('mo', mo).then(result => {
            console.log('mo (' + gateway + ') saved');
        });

        // for (var key in q.query) {
        //     q.query[key.toLowerCase()] = q.query[key];
        // }

        this.process(gateway, q.query);
    },

    process: function(gateway, query) {
        console.log('process mo for ' + gateway);
        console.log(query);
        for (var key in query) {
            query[key.toLowerCase()] = query[key];
        }

        var mo = {}; //forming general mo structure
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
        } else {
            log.save('unhandled gateway: (' + gateway + ')', logType);
            return;
        }

        //check in general structure
        if (string.isNullOrEmpty(mo.msisdn) ||
            string.isNullOrEmpty(mo.body) ||
            string.isNullOrEmpty(mo.moid) ||
            string.isNullOrEmpty(mo.shortCode) ||
            string.isNullOrEmpty(mo.telcoId) ||
            string.isNullOrEmpty(mo.time)) {
            log.save('unexpected mo (' + gateway + ') ' + JSON.stringify(query), logType);
            return;
        }

        var body = mo.body.trim().toUpperCase().replace('  ', ' ');
        var reply = body.split(' ');
        if (reply.length === 2) {
            var service = reply[0]; //should be ON, OUT, STOP
            var keyword = reply[1];

            if (service == 'ON' || service == 'OUT' ||
                (service == 'STOP' && keyword == 'ALL')) {
                var filterSubscriber = {
                    gateway: gateway,
                    msisdn: mo.msisdn,
                    shortCode: mo.shortCode,
                    telcoId: mo.telcoId
                };
                if (!(service == 'STOP' && keyword == 'ALL'))
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