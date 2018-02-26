// //var MongoClient = require('mongodb').mongoClient;

// function db() { //mongoUrl, mongoDb) {
//     var db = {};
//     // db.mongoUrl = mongoUrl;
//     // db.mongoDb = mongoDb;

//     function privateFunction() {
//         return false;
//     }

//     db.retrieveOne = function(coll, filter) {
//         var MongoClient = require('mongodb').MongoClient;
//         var mongoUrl = 'mongodb://sa:1@ds035485.mlab.com:35485/first-mongo';

//         return new Promise(function(resolve, reject) {
//             MongoClient.connect(mongoUrl, function(err, db) {
//                 if (err) reject(err);
//                 var dbo = db.db("first-mongo");

//                 dbo.collection(coll).findOne(filter, function(err, result) {
//                     if (err) reject(err);
//                     db.close();

//                     resolve(result);
//                 });
//             });
//         });
//     };

//     db.retrieve = function(coll, filter) {
//         var MongoClient = require('mongodb').MongoClient;
//         var mongoUrl = 'mongodb://sa:1@ds035485.mlab.com:35485/first-mongo';

//         return new Promise(function(resolve, reject) {
//             MongoClient.connect(mongoUrl, function(err, db) {
//                 if (err) reject(err);
//                 var dbo = db.db("first-mongo");

//                 dbo.collection(coll).find(filter).toArray(function(err, result) {
//                     if (err) reject(err);
//                     db.close();

//                     resolve(result);
//                 });
//             });
//         });
//     };

//     db.any = function(coll, filter) {
//         var MongoClient = require('mongodb').MongoClient;
//         var mongoUrl = 'mongodb://sa:1@ds035485.mlab.com:35485/first-mongo';

//         return new Promise(function(resolve, reject) {
//             MongoClient.connect(mongoUrl, function(err, db) {
//                 if (err) reject(err);
//                 var dbo = db.db("first-mongo");

//                 dbo.collection(coll).findOne(filter, function(err, result) {
//                     if (err) reject(err);
//                     db.close();

//                     resolve(result ? true : false);
//                 });
//             });
//         });

//     };

//     db.save = function(coll, obj) {
//         var MongoClient = require('mongodb').MongoClient;
//         var mongoUrl = 'mongodb://sa:1@ds035485.mlab.com:35485/first-mongo';

//         return new Promise(function(resolve, reject) {
//             MongoClient.connect(mongoUrl, function(err, db) {
//                 if (err) reject(err);
//                 var dbo = db.db("first-mongo");

//                 dbo.collection(coll).insertOne(obj, function(err, result) {
//                     if (err) reject(err);
//                     db.close();

//                     resolve(result);
//                 });
//             });
//         });
//     };

//     db.update = function(coll, filter, newValues) {
//         var MongoClient = require('mongodb').MongoClient;
//         var mongoUrl = 'mongodb://sa:1@ds035485.mlab.com:35485/first-mongo';

//         return new Promise(function(resolve, reject) {
//             MongoClient.connect(mongoUrl, function(err, db) {
//                 if (err) reject(err);
//                 var dbo = db.db("first-mongo");

//                 dbo.collection(coll).update(filter, newValues, { multi: true }, function(err, result) {
//                     if (err) reject(err);
//                     db.close();

//                     resolve(result);
//                 });
//             });
//         });
//     };

//     return db;
// }

var nconf = require('nconf');
nconf.file('./config.json');
var mongoUrl = nconf.get('mongodb-url');
var mongoDb = nconf.get('mongodb-db');
var mongoClient = require('mongodb').MongoClient;

var db = {
    retrieveOne: function(coll, filter) {
        //var MongoClient = require('mongodb').MongoClient;
        //var urlMongo = 'mongodb://sa:1@ds035485.mlab.com:35485/first-mongo';

        return new Promise(function(resolve, reject) {
            mongoClient.connect(mongoUrl, function(err, db) {
                if (err) reject(err);
                //var dbo = db.db("first-mongo");
                var dbo = db.db(mongoDb);

                dbo.collection(coll).findOne(filter, function(err, result) {
                    if (err) reject(err);
                    db.close();

                    resolve(result);
                });
            });
        });
    },

    retrieve: function(coll, filter) {
        //var MongoClient = require('mongodb').MongoClient;
        //var urlMongo = 'mongodb://sa:1@ds035485.mlab.com:35485/first-mongo';

        return new Promise(function(resolve, reject) {
            mongoClient.connect(mongoUrl, function(err, db) {
                if (err) reject(err);
                //var dbo = db.db("first-mongo");
                var dbo = db.db(mongoDb);

                dbo.collection(coll).find(filter).toArray(function(err, result) {
                    if (err) reject(err);
                    db.close();

                    resolve(result);
                });
            });
        });
    },

    any: function(coll, filter) {
        // var MongoClient = require('mongodb').MongoClient;
        // var urlMongo = 'mongodb://sa:1@ds035485.mlab.com:35485/first-mongo';

        return new Promise(function(resolve, reject) {
            mongoClient.connect(mongoUrl, function(err, db) {
                if (err) reject(err);
                //var dbo = db.db("first-mongo");
                var dbo = db.db(mongoDb);

                dbo.collection(coll).findOne(filter, function(err, result) {
                    if (err) reject(err);
                    db.close();

                    resolve(result ? true : false);
                });
            });
        });

    },

    save: function(coll, obj) {
        // var MongoClient = require('mongodb').MongoClient;
        // var urlMongo = 'mongodb://sa:1@ds035485.mlab.com:35485/first-mongo';

        return new Promise(function(resolve, reject) {
            mongoClient.connect(mongoUrl, function(err, db) {
                if (err) reject(err);
                //var dbo = db.db("first-mongo");
                var dbo = db.db(mongoDb);

                dbo.collection(coll).insertOne(obj, function(err, result) {
                    if (err) reject(err);
                    db.close();

                    resolve(result);
                });
            });
        });
    },

    update: function(coll, filter, newValues) {
        // var MongoClient = require('mongodb').MongoClient;
        // var urlMongo = 'mongodb://sa:1@ds035485.mlab.com:35485/first-mongo';

        return new Promise(function(resolve, reject) {
            mongoClient.connect(mongoUrl, function(err, db) {
                if (err) reject(err);
                //var dbo = db.db("first-mongo");
                var dbo = db.db(mongoDb);

                dbo.collection(coll).update(filter, newValues, { multi: true }, function(err, result) {
                    if (err) reject(err);
                    db.close();

                    resolve(result);
                });
            });
        });
    },
};

module.exports = db;