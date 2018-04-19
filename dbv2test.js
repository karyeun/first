var db = require('./lib/dbv2');

var arr = ['alex', 'betty', 'cat'];
arr.forEach(name => {
    db.save('test', { 'name': name }).then(saved => {
        console.log('saved');
        db.disconnect();
    }).catch(err => {
        console.log(err);
    });
});