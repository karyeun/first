var express = require('express');
var app = express();
var nconf = require('nconf');
nconf.file('./config.json');
var mongoUrl = nconf.get('mongodb-url');
// var mongoDb = nconf.get('mongodb-db');
// var interval = nconf.get('schedule-interval');
var mongoose = require('mongoose');
var mo = require('./lib/mo');
//var dn = require('./lib/dn');
var dn = require('./lib/dnv2');
var fs = require('fs');
var log = require('./lib/log')(fs);
// var scheduler = require('./scheduler_noThread');
// var addspro = require('./lib/addspro');

var options = {
    //useMongoClient: true,
    autoIndex: false, // Don't build indexes
    reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
    reconnectInterval: 1000, // Reconnect every 500ms
    poolSize: 10, // Maintain up to 10 socket connections
    // If not connected, return errors immediately rather than waiting for reconnect
    bufferMaxEntries: 0
};

mongoose.connect(mongoUrl, options);

mongoose.connection.on('error', function(e) {
    console.log("db: mongodb error " + e);
});

mongoose.connection.on('connected', function(e) {
    console.log('db: mongodb is connected: ' + mongoUrl);
});

mongoose.connection.on('disconnecting', function() {
    console.log('db: mongodb is disconnecting!!!');
});

mongoose.connection.on('disconnected', function() {
    console.log('db: mongodb is disconnected!!!');
});

mongoose.connection.on('reconnected', function() {
    console.log('db: mongodb is reconnected: ' + mongoUrl);
});

mongoose.connection.on('timeout', function(e) {
    console.log("db: mongodb timeout " + e);
});

mongoose.connection.on('close', function() {
    console.log('db: mongodb connection closed');
});

app.get('/', function(req, res) {
    res.send('funnet ready to serve MMP MO/DN.');
});

//MO
app.get('/mo/mmp', function(req, res) {
    mo.save('MMP', req);
    res.send('200');
});

//DN
app.get('/dn/mmp', function(req, res) {
    dn.save('MMP', req).then(saved => { res.send('200'); }).catch(err => { res.send('200'); });
});

var port = process.port || 8872;
app.listen(port, function() {
    console.log('[' + new Date() + '] funnet-MMP MO/DN listening at port ' + port);
});