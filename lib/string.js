var string = {
    isNullOrEmpty: function(s) {
        return (!s || s == undefined || s == '' || s.length == 0);
    },

    newLine: function() {
        return '\r\n';
    }
};

module.exports = string;