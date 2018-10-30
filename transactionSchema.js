var mongoose = require("mongoose");

const transactionSchema = mongoose.Schema({
    trans_id: String,
    user_id: String,
    name: String,
    amount: Number,
    date: Date,
    is_recurring: Boolean,
    period: Number,
    company_name: String,
    since_last: Number,
    avg_amount: Number
});

module.exports = mongoose.model('Transaction', transactionSchema);