var nconf = require('nconf');
nconf.file('./config.json');
var mongoUrl = nconf.get('mongodb-url');
var mongoDb = nconf.get('mongodb-db');
var mongoClient = require('mongodb').MongoClient;

function db() {
    var db = {};

    this.conn = null;
    this.dbo = null;

    var mongoOptions = { poolSize: 20, autoReconnect: true };
    mongoClient.connect(mongoUrl, mongoOptions, function(err, dbConn) {
        if (err) reject(err);
        this.conn = dbConn;
        this.dbo = dbConn.db(mongoDb);
        console.log('db connected.');
        dbConn.on('close', () => { console.log('db closed.'); });
        dbConn.on('reconnected', () => { console.log('db reconnected.'); });
    });

    db.disconnect = () => {
        this.conn.close();
    };

    db.retrieve = (coll, filter) => {
        return new Promise(function(resolve, reject) {
            this.dbo.collection(coll).find(filter).toArray(function(err, result) {
                if (err) reject(err);
                resolve(result);
            });
        });
    };

    // db.bulkSave = (coll, objs) => {
    //     return new Promise(function(resolve, reject) {
    //         var col = dbo.collection(coll);
    //         var batch = col.initializeOrderedBulkOp();
    //         objs.forEach(obj => {
    //             batch.insert(obj);
    //         });
    //         batch.execute(function(err, result) {
    //             resolve(result);
    //         });
    //     });
    // };

    // db.save = (coll, obj) => {
    //     return new Promise(function(resolve, reject) {
    //         dbo.collection(coll).insertOne(obj, function(err, result) {
    //             if (err) reject(err);
    //             resolve(result);
    //         });
    //     });
    // };

    // db.update = (coll, filter, newValues) => {
    //     return new Promise(function(resolve, reject) {
    //         dbo.collection(coll).update(filter, newValues, { multi: true }, function(err, result) {
    //             if (err) reject(err);
    //             resolve(result);
    //         });
    //     });
    // };

    return db;
}

module.exports = db;