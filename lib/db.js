var nconf = require('nconf');
nconf.file('./config.json');
var mongoUrl = nconf.get('mongodb-url');
var mongoDb = nconf.get('mongodb-db');
var mongoClient = require('mongodb').MongoClient;

var db = {
    retrieveOne: (coll, filter) => {
        return new Promise(function(resolve, reject) {
            mongoClient.connect(mongoUrl, function(err, db) {
                if (err) reject(err);
                var dbo = db.db(mongoDb);

                dbo.collection(coll).findOne(filter, function(err, result) {
                    if (err) reject(err);
                    db.close();

                    resolve(result);
                });
            });
        });
    },

    retrieve: (coll, filter) => {
        return new Promise(function(resolve, reject) {
            mongoClient.connect(mongoUrl, function(err, db) {
                if (err) reject(err);
                var dbo = db.db(mongoDb);

                dbo.collection(coll).find(filter).toArray(function(err, result) {
                    if (err) reject(err);
                    db.close();

                    resolve(result);
                });
            });
        });
    },

    any: (coll, filter) => {
        return new Promise(function(resolve, reject) {
            mongoClient.connect(mongoUrl, function(err, db) {
                if (err) reject(err);
                var dbo = db.db(mongoDb);

                dbo.collection(coll).findOne(filter, function(err, result) {
                    if (err) reject(err);
                    db.close();

                    resolve(result ? true : false);
                });
            });
        });

    },

    save: (coll, obj) => {
        return new Promise(function(resolve, reject) {
            mongoClient.connect(mongoUrl, function(err, db) {
                if (err) reject(err);
                var dbo = db.db(mongoDb);

                dbo.collection(coll).insertOne(obj, function(err, result) {
                    if (err) reject(err);
                    db.close();

                    resolve(result);
                });
            });
        });
    },

    bulkSave: (coll, objs) => {
        return new Promise(function(resolve, reject) {
            mongoClient.connect(mongoUrl, function(err, db) {
                if (err) reject(err);
                var dbo = db.db(mongoDb);

                var col = dbo.collection(coll);
                var batch = col.initializeOrderedBulkOp();
                objs.forEach(obj => {
                    batch.insert(obj);
                });
                batch.execute(function(err, result) {
                    db.close();
                    resolve(result);
                });

            });
        });
    },

    update: (coll, filter, newValues) => {
        return new Promise(function(resolve, reject) {
            mongoClient.connect(mongoUrl, function(err, db) {
                if (err) reject(err);
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