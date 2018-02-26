var func = require('./lib/functions.js');
var cron = require('node-cron');

//console.log('hi');
//console.log(func.f1(99));
//console.log(func.f2());

//func.crn(cron);

var Worker = require('webworker-threads').Worker;
// var w = new Worker('worker.js'); // Standard API

// You may also pass in a function:
var worker = new Worker(function() {
    //postMessage("I'm working before postMessage('ali').");
    this.onmessage = function(event) {
        //postMessage('Hi ' + event.data);
        postMessage("count to " + event.data);
        for (var i = 0; i < event.data; i++) {
            //postMessage('sleep');
            //sleep.sleep(1);
            //postMessage('done sleep');
            console.log(i);
            postMessage(i);
        }

        console.log('ready to close at ..');
        self.close();

    };
});
worker.onmessage = function(event) {
    console.log("Worker said : " + event.data);
};
worker.postMessage(10);

func.crn(cron);

//worker.postMessage('betty');
//worker.postMessage('cathryn');
/*
cron.schedule('*2 * * * *', function() {
    console.log('[' + new Date().toString() + '] running a task every 2 minutes');

});
*/