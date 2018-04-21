var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var DNModelSchema = new Schema({
	gateway : String,
	response : String,
	occurred : { type: Date, default: Date.now, index: true }
});

module.exports = mongoose.model("DN", DNModelSchema);