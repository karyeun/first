var url = require('url');
var db = require('./db');

var dn = {
    save: function(gateway, req) {
        var q = url.parse(req.url, true);
        var dn = {
            response: decodeURIComponent(q.search),
            gateway: gateway,
            on: new Date()
        };

        db.save('dn', dn).then(res => {
            console.log('dn (' + gateway + ') saved');
        });

        this.process(gateway, q.query);
    },

    process: function(gateway, query) {
        console.log('process dn for ' + gateway);
        console.log(query);
        for (var key in query) {
            query[key.toLowerCase()] = query[key];
        }


    }
};

module.exports = dn;