var url = require('url');
var db = require('./db');
var string = require('./string');
var fs = require('fs');
var log = require('./log')(fs);
var logType = 'addspro';
var fetch = require('node-fetch');
var urlAddspro = 'https://re.mengine.me/conversion.php?transaction_id=';

module.exports = {
    postback: req => {
        var q = url.parse(req.url, true);
        var query = q.query;
        var addsproUrlCall = urlAddspro + query.trans_id;
        fetch(addsproUrlCall).then(result => {
            console.log('postback');
            result.text().then(body => {}).catch(err => {
                log.save(err, logType);
            });
        }).catch(err => {
            log.save(err, logType);
        });
    },

    save: req => {
        var addspro = {
            occurred: new Date(),
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
            log.save('addspro\'s query saved.', logType);
        });
    },

    // landed: currentUrl => {
    //     var addsprolanded = {
    //         occurred: new Date(),
    //         url: currentUrl
    //     };

    //     db.save('addsproslanded', addsprolanded).then(result => {
    //         log.save('addspro landed.', logType);
    //     });
    // },

    landed: req => {
        var addsprolanded = {
            occurred: new Date(),
        };

        var q = url.parse(req.url, true);
        addsprolanded.query = decodeURIComponent(q.search);

        db.save('addsproslanded', addsprolanded).then(result => {
            log.save('addspro landed.', logType);
        });
    },

    moArrived: mo => { //addspro check
        if (mo.service == 'ON') {
            var filter = {
                msisdn: mo.msisdn,
                shortCode: mo.shortCode,
                keyword: mo.keyword,
                postback: false
            };
            db.retrieve('addspros', filter).then(recs => {
                recs.forEach(addspro => {
                    var addsproUrlCall = urlAddspro + addspro.transId;
                    log.save('addspro > ' + addsproUrlCall, logType);
                    var updatedValue = {
                        request: addsproUrlCall,
                        requestOn: new Date()
                    };
                    fetch(addsproUrlCall).then(result => {
                        updatedValue.responseOn = new Date();
                        result.text().then(body => {
                            updatedValue.response = body;
                            updatedValue.postback = true;
                            log.save('addspro < ' + body, logType);
                            db.update('addspros', addspro, { $set: updatedValue }).then(updated => {
                                log.save('addspro(' + addspro.transId + ') postback/updated', logType);
                            });
                        }).catch(err => {
                            log.save(String(err), logType);
                        });
                    }).catch(err => {
                        log.save(String(err), logType);
                    });
                });
            });
        }
    }
};