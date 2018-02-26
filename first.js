console.log('hello world');
console.log('ok');
for (var i = 0; i < 5; i++)
    console.log('counting ' + i);

console.log('ends ..');

var express = require('express');
var http = require('http');
http.createServer(function(req, res) {
    //console.log(req);

    var obj = {
        name: 'eric',
        age: 35
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(obj));
}).listen(3001);
console.log('Server running at http://localhost:3001/');