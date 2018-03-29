var url = require('url');
var db = require('./db');
var string = require('./string');
var fs = require('fs');
var log = require('./log')(fs);
var logType = 'mo';

module.exports = {
    save: function(gateway, req) {
        var mo = {
            gateway: gateway,
            occurred: new Date()
        };

        //var mo = {}; //forming general mo structure
        if ('ICE,MEXCOMM,MK,MMP'.indexOf(gateway) >= 0) {
            if ('MEXCOMM,MK,MMP'.indexOf(gateway) >= 0) {
                var q = url.parse(req.url, true);
                mo.response = decodeURIComponent(q.search);

                for (var key in q.query) {
                    q.query[key.toLowerCase()] = q.query[key];
                }

                var query = q.query; //return {key:value, ..}
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
                mo.response = JSON.stringify(req.headers);

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
            mo.telcoId = mo.telcoId.toUpperCase(); //ensure telcoId is capital letter

            var body = mo.body.trim().toUpperCase().replace('  ', ' '); //ensure SERVICE/KEYWORD are capital letter
            var reply = body.split(' ');
            if (reply.length === 2) {
                mo.service = reply[0]; //should be ON, OUT, STOP
                mo.keyword = reply[1];
            }

            db.save('mos', mo).then(result => {
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
            string.isNullOrEmpty(mo.service) ||
            string.isNullOrEmpty(mo.keyword) ||
            string.isNullOrEmpty(mo.moid) ||
            string.isNullOrEmpty(mo.shortCode) ||
            string.isNullOrEmpty(mo.telcoId) ||
            string.isNullOrEmpty(mo.time)) {
            log.save('unexpected mo (' + gateway + ') ' + JSON.stringify(mo), logType);
            return;
        }

        if (mo.service == 'ON' || mo.service == 'OUT' || mo.service == 'STOP' ||
            (mo.service == 'STOP' && mo.keyword == 'ALL')) {
            var filterSubscriber = {
                gateway: gateway,
                msisdn: mo.msisdn,
                shortCode: mo.shortCode,
                telcoId: mo.telcoId
            };
            if (!(mo.service == 'STOP' && mo.keyword == 'ALL' ||
                    mo.service == 'OUT' && mo.keyword == 'ALL'))
                filterSubscriber.keyword = mo.keyword;

            db.any('subscribers', filterSubscriber).then(exists => {
                if (exists) {
                    var updateSubscriber = {
                        $set: {
                            service: mo.service //could b ON, OUT or STOP
                        }
                    };

                    db.update('subscribers', filterSubscriber, updateSubscriber).then(result => {
                        console.log('Update subscriber [' + mo.service + ']' +
                            filterSubscriber.msisdn + '/' +
                            filterSubscriber.shortCode + '/' +
                            (filterSubscriber.keyword ? filterSubscriber.keyword : '*'));
                    });

                } else {
                    var newSubscriber = {
                        gateway: gateway,
                        msisdn: mo.msisdn,
                        shortCode: mo.shortCode,
                        keyword: mo.keyword,
                        telcoId: mo.telcoId,
                        service: mo.service,
                        subscribeOn: new Date()
                    };
                    db.save('subscribers', newSubscriber).then(result => {
                        console.log('New subscriber [' + mo.service + ']' +
                            newSubscriber.msisdn + '/' +
                            newSubscriber.shortCode + '/' +
                            newSubscriber.keyword);
                    });
                }
            });
        } else {
            log.save('unexpected mo-reply (' + gateway + ') ' + JSON.stringify(mo), logType);
        }
    }
};