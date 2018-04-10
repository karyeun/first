// var master = require('./lib/master');

// master.retrieveBroadcastInfo('MEXCOMM', 'enettech', '4741015').then(res => {
//     console.log(res);
// });


// broadcasting MEXCOMM/[7,8,9]/enetthree/32338/[X1,X6,X7,XX3,XX4] 
// broadcasting MEXCOMM/[7,8,9]/enetthree/32339/[HDTV,KTV,STAR,VD] 
// broadcasting MEXCOMM/[7,8,9]/enetthree/33020/[GSM,HDV,PARTY,RING,TONE] 
// broadcasting MEXCOMM/[7,8,9]/enetthree/33329/[LWK] 
// broadcasting MEXCOMM/[7,8,9]/enetthree/33391/[PARTY] 
// broadcasting MEXCOMM/[7,8,9]/enetthree/33392/[FUN] 
// broadcasting MEXCOMM/[7,8,9]/enetthree/37800/[BB,MV,NEW] 

var db = require('./lib/db');
var string = require('./lib/string');
// var schedule = {
//     telcoIds: ['7', '8', '9'],
//     keywords: ['GSM', 'HDV', 'PARTY', 'RING', 'TONE'],
//     gateway: 'MEXCOMM',
//     shortCode: '33020'
// };
var schedule = {
    telcoIds: ['7', '8', '9'],
    keywords: ['FUN'],
    gateway: 'MEXCOMM',
    shortCode: '33392'
};

var filterSubscriber = {
    telcoId: { $in: schedule.telcoIds },
    keyword: { $in: schedule.keywords },
    gateway: schedule.gateway,
    service: 'ON',
    shortCode: schedule.shortCode
};

var start = new Date();
db.retrieve('subscribers', filterSubscriber).then(subscribers => {
    var end = new Date();
    console.log((end - start) + 'ms');
    console.log('=>' + string.newLine() +
        'keywords:' + JSON.stringify(schedule.keywords) + string.newLine() +
        'subsribers:' + subscribers.length);
}).catch(err => {
    console.log(err);
});