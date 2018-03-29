var db = require('./db');
var string = require('./string');

var master = {
    retrieveCredentials: (gateway, userName) => {
        var filter = {
            'gateway': gateway,
            'accounts.userName': userName
        };

        return new Promise(function(resolve, reject) {
            db.retrieveOne('masters', filter).then(result => {
                var accounts = result.accounts;
                for (i = 0; i < accounts.length; i++) {
                    var account = accounts[i];
                    if (account.userName == userName) {

                        resolve({
                            userName: account.userName,
                            password: account.password
                        });
                        break;
                    }
                }
                reject(null);
            });
        });
    },

    retrieveKeywords: (gateway, shortCode) => {
        var filter = {
            'gateway': gateway,
            'accounts.shortCodes.shortCode': shortCode
        };

        console.log('looking keywords for ' + gateway + ',' + shortCode);
        return new Promise(function(resolve, reject) {
            db.retrieveOne('masters', filter).then(result => {
                var shortCodekeywords = {};
                if (result == null || result.accounts == null) resolve(shortCodekeywords);

                var accounts = result.accounts;
                for (i = 0; i < accounts.length; i++) {
                    var account = accounts[i];
                    //console.log('check account:' + account.userName);
                    var shortCodes = account.shortCodes;
                    for (j = 0; j < shortCodes.length; j++) {
                        if (shortCodes[j].shortCode == shortCode) {
                            var keywords = shortCodes[j].keywords;
                            for (k = 0; k < keywords.length; k++) {
                                shortCodekeywords[keywords[k].keyword] = keywords[k].price;
                            }
                        }
                    }
                }
                resolve(shortCodekeywords);
            }).catch(err => {
                reject(err);
            });
        });
    },

    retrieveMTUrl: (gateway, shortCode) => {
        var filter = {
            'gateway': gateway,
            'accounts.shortCodes.shortCode': shortCode
        };

        console.log('looking MTUrl for ' + gateway + ',' + shortCode);
        return new Promise(function(resolve, reject) {
            db.retrieveOne('masters', filter).then(result => {
                if (result == null || result.accounts == null) resolve(null);

                var accounts = result.accounts;
                for (i = 0; i < accounts.length; i++) {
                    var account = accounts[i];
                    // console.log('check account:' + account.userName);
                    var shortCodes = account.shortCodes;
                    for (j = 0; j < shortCodes.length; j++) {
                        if (shortCodes[j].shortCode == shortCode) {
                            var mtUrl = shortCodes[j].mtUrl;
                            if (string.isNullOrEmpty(mtUrl)) resolve(null);
                            resolve(mtUrl);
                        }
                    }
                }
                resolve(null);
            }).catch(err => {
                reject(err);
            });
        });
    },

    retrieveMTExtraParams: (gateway) => {
        var filter = {
            'gateway': gateway
        };

        console.log('looking MTExtraParams for ' + gateway);
        return new Promise(function(resolve, reject) {
            db.retrieveOne('masters', filter).then(result => {
                var telcoParams = {};
                if (result == null) resolve(telcoParams);

                var telcos = result.telcos;
                for (i = 0; i < telcos.length; i++) {
                    var telco = telcos[i];
                    telcoParams[telco.id] = string.isNullOrEmpty(telco.extraMTParams) ? '' : telco.extraMTParams;;
                }
                resolve(telcoParams);
            }).catch(err => {
                reject(err);
            });
        });
    }
};

module.exports = master;