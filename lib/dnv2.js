var url = require('url');
var fs = require('fs');
var log = require('./log')(fs);
var string = require('./string');
var logType = 'dn';
var dnModel = require('../app/models/DN');
var mtModel = require('../app/models/MT');

module.exports = {
    save: function(gateway, req) {
        return new Promise(function(resolve, reject) {
            var dn = {
                gateway: gateway,
                occurred: new Date()
            };

            if ('MEXCOMM,MK,MMP,'.indexOf(gateway + ',') >= 0) {
                req.url = req.url.replace('??', '?');
                var q = url.parse(req.url, true);
                dn.response = decodeURIComponent(q.search);

                for (var key in q.query) {
                    q.query[key.toLowerCase()] = q.query[key];
                }

                var query = q.query;
                dn.mtid = query.mtid;
                if ('MK,MMP,'.indexOf(gateway + ',') >= 0) dn.status = query.status;
                else dn.status = query.errorcode; //MEXCOMM
            }

            var dns = dnModel(dn);
            dns.save(function(err) {
                if (err) log.save(err, logType);
                // this.process(gateway, dn).then(processed => {
                //     resolve();
                // }).catch(err => {
                //     log.save(String(err), logType);
                //     reject(err);
                // });

                if (string.isNullOrEmpty(dn.mtid) ||
                    string.isNullOrEmpty(dn.status)) {
                    log.save('unexpected dn (' + gateway + ') ' + JSON.stringify(dn), logType);
                    reject();
                }

                var filterMT = {
                    gateway: gateway,
                    mtid: dn.mtid
                };

                var dnStatus = 'failed';
                if (gateway == 'MEXCOMM') {
                    if (dn.status == '1') dnStatus = 'success';
                } else if (gateway == 'MK') {
                    if (dn.status == '1') dnStatus = 'success';
                } else if (gateway == 'MMP') {
                    if (dn.status == '1') dnStatus = 'success';
                }

                var updateMT = {
                    dnOn: new Date(),
                    dnRawStatus: dn.status,
                    dnStatus: dnStatus
                };
                mtModel.findOneAndUpdate(filterMT, updateMT, function(err, mt) {
                    if (err) {
                        log.save(err, logType);
                        reject();
                    } else {
                        log.save('(' + gateway + ') update mt[' + filterMT.mtid + '] with dnv2', logType);
                        resolve();
                    }
                });
            });
        });
    }

    // process: function(gateway, dn) {
    //     return new Promise(function(resolve, reject) {
    //         if (string.isNullOrEmpty(dn.mtid) ||
    //             string.isNullOrEmpty(dn.status)) {
    //             log.save('unexpected dn (' + gateway + ') ' + JSON.stringify(dn), logType);
    //             reject();
    //         }

    //         var filterMT = {
    //             gateway: gateway,
    //             mtid: dn.mtid
    //         };

    //         var dnStatus = 'failed';
    //         if (gateway == 'MEXCOMM') {
    //             if (dn.status == '1') dnStatus = 'success';
    //         } else if (gateway == 'MK') {
    //             if (dn.status == '1') dnStatus = 'success';
    //         } else if (gateway == 'MMP') {
    //             if (dn.status == '1') dnStatus = 'success';
    //         }

    //         var updateMT = {
    //             dnOn: new Date(),
    //             dnRawStatus: dn.status,
    //             dnStatus: dnStatus
    //         };
    //         mtModel.findOneAndUpdate(filterMT, updateMT, function(err, mt) {
    //             if (err) {
    //                 log.save(err, logType);
    //                 reject();
    //             } else {
    //                 log.save('(' + gateway + ') update mt[' + filterMT.mtid + '] with dnv2', logType);
    //                 resolve();
    //             }
    //         });
    //     });
    // }
};