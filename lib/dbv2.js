var nconf = require('nconf');
nconf.file('./config.json');
var mongoUrl = nconf.get('mongodb-url');
var mongoDb = nconf.get('mongodb-db');
var mongoClient = require('mongodb').MongoClient;
var dbo = null;
var conn = null;

db = {
    // var mongoOptions = { poolSize: 20, autoReconnect: true };
    // mongoClient.connect(mongoUrl, mongoOptions, function(err, dbConn) {
    //     if (err) reject(err);
    //     this.conn = dbConn;
    //     this.dbo = dbConn.db(mongoDb);
    //     console.log('db connected.');
    //     dbConn.on('close', () => { console.log('db closed.'); });
    //     dbConn.on('reconnected', () => { console.log('db reconnected.'); });
    // });

    connect: (cb) => {
        if (this.dbo == null) {
            var mongoOptions = { poolSize: 20, autoReconnect: true };
            mongoClient.connect(mongoUrl, mongoOptions, function(err, dbConn) {
                if (err) cb(err);
                conn = dbConn;
                dbo = dbConn.db(mongoDb);
                console.log('db connected.');
                dbConn.on('close', () => { console.log('db closed.'); });
                dbConn.on('reconnected', () => { console.log('db reconnected.'); });
                cb(dbo);
            });
        } else cb(dbo);
    },

    disconnect: () => {
        conn.close();
    },

    // db.retrieve = (coll, filter) => {
    //     return new Promise(function(resolve, reject) {
    //         this.dbo.collection(coll).find(filter).toArray(function(err, result) {
    //             if (err) reject(err);
    //             resolve(result);
    //         });
    //     });
    // };

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

    save: (coll, obj) => {
        return new Promise(function(resolve, reject) {
            db.connect(dbo => {
                dbo.collection(coll).insertOne(obj, function(err, result) {
                    if (err) reject(err);
                    resolve(result);
                });
            });
        });
    },

    // db.update = (coll, filter, newValues) => {
    //     return new Promise(function(resolve, reject) {
    //         dbo.collection(coll).update(filter, newValues, { multi: true }, function(err, result) {
    //             if (err) reject(err);
    //             resolve(result);
    //         });
    //     });
    // };
}

module.exports = db;


// //lets require/import the mongodb native drivers.
// var mongodb = require('mongodb');
// // Connection URL. This is where your mongodb server is running.
// var url = 'mongodb://localhost:27017/myDb';
// var connectingDb; // promise

// //We need to work with "MongoClient" interface in order to connect to a mongodb server.
// var MongoClient = mongodb.MongoClient;

// init();
// module.exports = {
//     isConnected: isConnected
// }

// // Use connect method to connect to the Server
// function init() {
//     connectingDb = new Promise(
//         function(resolve, reject) {
//             MongoClient.connect(url, function(err, db) {
//                 if (err) {
//                     console.log('Unable to connect to the mongoDB server. Error:', err);
//                     reject(err);
//                 } else {
//                     console.log('Connection established to', url);

//                     //Close connection
//                     //db.close();
//                     resolve(db);
//                 }
//             });

//         }
//     );
// }

// function getDbObject() {
//     return connectingDb().then(myDb => {
//             return {
//                 connected: true,
//                 db: myDb
//             }
//         })
//         .catch(err => {
//             return {
//                 connected: false,
//                 db: err
//             }
//         })
// }

// function isConnected() {
//     return new Promise(
//         function(resolve, reject) {
//             var obj = getDbObject();
//             if (obj.connected == true) {
//                 console.log('success');
//                 resolve(true);
//             } else {
//                 console.log('error');
//                 reject(false);
//             }
//         }
//     )

// }