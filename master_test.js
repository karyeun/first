var master = require('./lib/master');

master.retrieveBroadcastInfo('MEXCOMM', 'enettech', '4741015').then(res => {
    console.log(res);
});