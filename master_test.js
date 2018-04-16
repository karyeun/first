var automt = require('./lib/autoMT');

automt.retrieveBroadcastInfo('MK', '1', '32616', 'APP').then(broadcastInfo => {
    console.log(broadcastInfo);
}).catch(err => {
    console.log(err);
});

console.log(Math.floor(Math.random() * 2));