const   mongoose     = require("mongoose"),
        Transaction  = require("./transactionSchema");
        bodyParser   = require("body-parser");

mongoose.connect('mongodb://localhost:27017/interview_challenge', {useNewUrlParser: true});



// helper function
let threshold = 0.2,
    since_last_thresh = 0.2,
    amount_thresh = 0.4;


function upsertDB(transactions) {
    for (let transaction of transactions) {
        //console.log(typeof transaction);
        let name = transaction.name;
        let name_arr = name.split(' ');
        let last_ele = name_arr[name_arr.length - 1];
        let company_name = '';
        if (hasNumber(last_ele)) {
            name_arr.pop();
            company_name = name_arr.join(' ');
        } else {
            company_name = name;
        }
        transaction.company_name = company_name;
        Transaction.findOneAndUpdate({ trans_id: transaction.trans_id }, transaction, { upsert: true },
            (err, doc) => {
                if (err) {
                    console.log(err);
                }
            });
    }
}



// update the since_last of every transaction
function sinceLast() {
    //
    Transaction.distinct('company_name', (err, companies) => {
        for (let company of companies) {
            Transaction.find({company_name: company}, null, {sort: {date:-1}},
                (err, transactions) => {
                    let lastDate = null;
                    for (let transaction of transactions) {
                        if (lastDate === null) {
                            lastDate = transaction.date;
                        } else {
                            // count days
                            let sinceLastTrans = Math.round((lastDate - transaction.date) / (1000 * 3600 * 24));
                            transaction.since_last = sinceLastTrans;
                            Transaction.findOneAndUpdate({ trans_id: transaction.trans_id }, transaction,
                                (err) => {
                                    if (err) {
                                        console.log(err);
                                    }
                                });
                            lastDate = transaction.date;
                        }
                    }
                });
        }
    });
}


// find recurring trans
function findRecurring() {
    Transaction.distinct('company_name', (err, companies) => {
        for (let company of companies) {
            Transaction.find({company_name : company}, null, {sort: {date:-1}},
                (err, transactions) => {
                    // get avg sinceLast and avg amount
                    let is_recurring = false,
                        totalSincelast = [],
                        totalAmount = [];
                    for (let transaction of transactions) {
                        if (transaction.since_last) {
                            totalSincelast.push(transaction.since_last);
                        }
                        totalAmount.push(transaction.amount);
                    }

                    let avg_sinceLast = average(totalSincelast);
                    let avg_amount = average(totalAmount);

                    // check recurring, 1. count < 0.2  since and amount < 0.2
                    if (totalSincelast.length > 0) {
                        let countSince = 0,
                            countAmount = 0;
                        for (let transaction of transactions) {
                            if (diff(transaction.since_last, avg_sinceLast) > threshold) {
                                countSince = countSince + 1;
                            }
                            if (diff(transaction.amount, avg_amount) > threshold) {
                                countAmount = countAmount + 1;
                            }
                        }

                        if (countSince / totalSincelast.length < since_last_thresh &&
                            countAmount/ totalAmount.length < amount_thresh) {
                            is_recurring = true;
                        }
                    }


                    // get period and avg amount
                    for (let transaction of transactions) {
                        transaction.is_recurring = is_recurring;
                        if (transaction.is_recurring) {
                            transaction.period = Math.round(avg_sinceLast);
                            transaction.avg_amount = avg_amount;
                        }
                        Transaction.findOneAndUpdate({ trans_id: transaction.trans_id }, transaction,
                            (err) => {
                                if (err) {
                                    console.log(err);
                                }
                            });
                    }
                    // if is_recurring, need to find noise
                    if (is_recurring) {
                        let period = Math.round(avg_sinceLast);
                        let avgAmount = avg_amount;
                        let initDate = transactions[0].date;
                        for (let i = 1; i < transactions.length; i++) {
                            let is_recurring = true;
                            let cur = transactions[i];
                            let diffDate = (initDate - cur.date) / (1000 * 3600 * 24);
                            let amount = cur.amount;
                            if (diff(diffDate, period) > 0.3 || diff(amount, avgAmount) > 0.3) {
                                is_recurring = false;
                            }
                            if (!is_recurring) {
                                transactions[i].is_recurring = false;
                                Transaction.findOneAndUpdate({ trans_id: cur.trans_id }, cur,
                                    (err) => {
                                        if (err) {
                                            console.log(err);
                                        }
                                    });
                            } else {
                                initDate = cur.date;
                            }

                        }
                    }

                });

        }
    });
}

function getResult(req, res) {
    Transaction.distinct('user_id')
        .then(users => {
            return new Promise((resolve, reject) => {
                let ret = [];
                for (let i = 0; i < users.length; i++) {
                    let user = users[i];
                        Transaction.distinct('company_name')
                            .then(companies => {
                                companies.sort((a, b) => {
                                    var x = a < b ? -1 : 1;
                                    return x;
                                });
                                return new Promise((resolve, reject) => {
                                    let objArr = [];
                                    for (let j = 0; j < companies.length; j++) {
                                        Transaction.find({
                                            user_id: user,
                                            company_name: companies[j],
                                            is_recurring: true
                                        }, null, {sort: {date: -1}})
                                            .then(transactions => {
                                                let obj = null;
                                                if (transactions.length > 0) {
                                                    //console.log(transactions[0].company_name);
                                                    let first_ele = transactions[0];
                                                    let newDate = new Date(Number(first_ele.date) + first_ele.period * (1000 * 3600 * 24));
                                                    //console.log(first_ele.name + " " + newDate);
                                                    let newAmount = first_ele.avg_amount;
                                                    //console.log(newAmount);
                                                    obj = {
                                                        name: first_ele.name,
                                                        user_id: first_ele.user_id,
                                                        next_amt: newAmount,
                                                        next_date: newDate,
                                                        transactions: transactions
                                                    };
                                                }
                                                if (obj) {
                                                    objArr.push(obj);
                                                }
                                                if (j === companies.length - 1) {
                                                    resolve(objArr);
                                                }
                                            })
                                    }
                                })
                            })
                            .then(objArr => {
                                //console.log(objArr);
                                //console.log("companies:::::" + objArr.length)
                                if (objArr.length > 0) {
                                    ret.push(objArr);
                                }
                                if (i === users.length - 1) {
                                    //console.log(ret);
                                    resolve(ret);
                                }
                            });


                }
            });
        })
        .then(ret => {
            res.send(ret);
        });
}


// some helper functions to process


function hasNumber(s) {
    return /\d/.test(s);
}

function average(arr) {
    let sum = 0;
    let count = 0;
    for (let element of arr) {
        sum = sum + element;
        count = count + 1;
    }
    return sum / count;
}

function diff(num1, num2) {
    return Math.abs(num1 - num2) / num2;
}


module.exports.upsertDB = upsertDB;
module.exports.sinceLast = sinceLast;
module.exports.findRecurring = findRecurring;
module.exports.getResult = getResult;
