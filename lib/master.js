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
    }
};

module.exports = master;