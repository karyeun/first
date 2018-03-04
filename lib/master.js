var db = require('./db');

var master = {
    retrieveCredentials: (gateway, userName) => {
        var filter = {
            'gateway': gateway,
            'accounts.userName': userName
        };

        return new Promise(function(resolve, reject) {
            db.retrieveOne('master', filter).then(result => {
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

    retriveKeywords: (gateway, shortCode) => {
        var filter = {
            'gateway': gateway,
            'accounts.shortCodes.shortCode': shortCode
        };

        console.log('look for ' + gateway + ',' + shortCode);
        return new Promise(function(resolve, reject) {
            db.retrieveOne('master', filter).then(result => {
                var shortCodekeywords = {};
                var accounts = result.accounts;
                for (i = 0; i < accounts.length; i++) {
                    var account = accounts[i];
                    console.log('check account:' + account.userName);
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
    }
};

module.exports = master;