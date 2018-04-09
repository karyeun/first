var url = require('url');
var db = require('./db');
var fs = require('fs');
var log = require('./log')(fs);
var string = require('./string');
var logType = 'dn';

module.exports = {
    save: function(gateway, req) {
        var dn = {
            gateway: gateway,
            occurred: new Date()
        };

        if ('ICE,MEXCOMM,MK,MMP'.indexOf(gateway) >= 0) {
            if ('MEXCOMM,MK,MMP'.indexOf(gateway) >= 0) {
                req.url = req.url.replace('??', '?');
                var q = url.parse(req.url, true);
                dn.response = decodeURIComponent(q.search);

                for (var key in q.query) {
                    q.query[key.toLowerCase()] = q.query[key];
                }

                var query = q.query;
                dn.mtid = query.mtid;
                if ('MK,MMP'.indexOf(gateway) >= 0) dn.status = query.status;
                else dn.status = query.errorcode; //MEXCOMM

            }
            // else { //ICE
            //     dn.response = JSON.stringify(req.headers);

            //     for (var hkey in req.headers) {
            //         req.headers[hkey.toLowerCase()] = req.headers[hkey];
            //     }

            //     dn.mtid = req.headers['x-premio-sms-refid'];
            //     dn.status = req.headers['x-premio-sms-errorcode'];
            // }

            db.save('dns', dn).then(res => {
                log.save('dn (' + gateway + ') mt[' + dn.mtid + '] saved', logType);
            }).catch(err => {
                log.save(err, logType);
            });;
        } else {
            log.save('unhandled gateway (' + gateway + ')', logType);
            return;
        }

        this.process(gateway, dn);
    },

    process: function(gateway, dn) {
        if (string.isNullOrEmpty(dn.mtid) ||
            string.isNullOrEmpty(dn.status)) {
            log.save('unexpected dn (' + gateway + ') ' + JSON.stringify(dn), logType);
            return;
        }

        var filterMT = {
            gateway: gateway,
            mtid: dn.mtid
        };

        var dnStatus = 'failed';
        if (gateway == 'ICE') {
            //000,010,015
            if (dn.status.substring(0, 1) == '0') dnStatus = 'success';
        } else if (gateway == 'MEXCOMM') {
            if (dn.status == '1') dnStatus = 'success';
        } else if (gateway == 'MK') {
            if (dn.status == 'DELIVRD') dnStatus = 'success';
        } else if (gateway == 'MMP') {
            if (dn.status == '1') dnStatus = 'success';
        }

        var updateMT = {
            $set: {
                dnOn: new Date(),
                dnRawStatus: dn.status,
                dnStatus: dnStatus
            }
        };

        db.update('mts', filterMT, updateMT).then(result => {
            log.save('Update mt[' + filterMT.mtid + '] with dn', logType);
        }).catch(err => {
            log.save(err, logType);
        });
    }
};