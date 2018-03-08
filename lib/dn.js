var url = require('url');
var db = require('./db');
var fs = require('fs');
var log = require('./log')(fs);
var logType = 'dn';

module.exports = {
    save: function(gateway, req) {
        var rawDN = {
            gateway: gateway,
            on: new Date()
        };

        if ('ICE,MEXCOMM,MK,MMP'.indexOf(gateway) >= 0) {
            if ('MEXCOMM,MK,MMP'.indexOf(gateway) >= 0) {
                var q = url.parse(req.url, true);
                rawDN.response = decodeURIComponent(q.search);
            } else { //ICE
                rawDN.response = JSON.stringify(req.headers);
            }

            db.save('dn', rawDN).then(res => {
                console.log('dn (' + gateway + ') saved');
            });
        } else {
            log.save('unhandled gateway (' + gateway + ')', logType);
            return;
        }

        //this.process(gateway, dn);
    },

    process: function(gateway, dn) {
        // console.log('process dn for ' + gateway);
        // console.log(query);
        // for (var key in query) {
        //     query[key.toLowerCase()] = query[key];
        // }
    }
};