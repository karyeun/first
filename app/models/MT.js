var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MTModelSchema = new Schema({
    userName: String,
    password: String,
    shortCode: { type: String, index: true },
    msisdn: String,
    telcoId: String,
    keyword: String,
    content: String,
    price: Number,
    gateway: { type: String, index: true },
    request: String,
    status: String,
    response: String,
    mtid: String,
    occurred: { type: Date, default: Date.now, index: true },
    responseOn: { type: Date, default: Date.now, index: true },
    dnOn: { type: Date },
    dnRawStatus: String,
    dnStatus: String
});

module.exports = mongoose.model("MT", MTModelSchema);