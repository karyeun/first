function log(fs, daily, dir) {
    var log = {};

    this.fs = fs;
    this.daily = (daily !== false);
    this.dir = dir || ('./log');

    if (!this.fs.existsSync(this.dir)) {
        this.fs.mkdirSync(this.dir);
    }

    log.save = (msg, type) => {
        type = type || '';
        type += 'log';

        var curr = new Date();
        var fileName = this.dir + '/' + type +
            curr.getFullYear() + '-' +
            (curr.getMonth() + 1) +
            (this.daily ? ('-' + curr.getDate()) : '') +
            '.txt';
        var time = '[' + (this.daily ? '' : (curr.getMonth() + '/' + curr.getDate() + ' ')) +
            curr.getHours() + ':' +
            curr.getMinutes() + ':' +
            curr.getSeconds() + '.' +
            curr.getMilliseconds() + ']';

        msg = time + '  ' + msg + '\r\n';
        console.log(msg);
        this.fs.appendFile(fileName, msg, function(err) {
            if (err) console.log(err);
        });
    };

    return log;
}

module.exports = log;