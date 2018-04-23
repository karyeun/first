var addspro = require('./lib/addspro');
var db = require('./lib/db');
var mo = {
    shortCode: '32066',
    keyword: 'BABY'
};

var filter = {
    shortCode: mo.shortCode,
    keyword: mo.keyword,
    converted: false
};
db.latest('addspros', filter).then(addspro => {
    if (addspro) {
        var addsproName = 'addspro transId[' + addspro.transId + '] ';
        console.log(addsproName);
    } else
        console.log('no addspro');
});