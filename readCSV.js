const fs = require("fs")
    mongoose     = require("mongoose"),
    Transaction  = require("./transactionSchema");


mongoose.connect('mongodb://localhost:27017/interview_challenge', {useNewUrlParser: true});


fs.readFile('test.csv',(err, bytes) => {
    if (err) {
        return console.log(err);
    }
    let data = bytes.toString();

    let arr = data.split('\r\n');

    let objArr = [];

    let headers = arr[0].split(',');

    for (let i = 1; i < arr.length; i++) {
        let record = arr[i].split(',');
        let obj = {};
        for (let j = 0; j < record.length; j++) {
            let header = headers[j].trim();
            let tmp = record[j].trim();
            if (header === 'name') {
                obj[header] = tmp;
            } else if (header === 'date') {
                obj[header] = new Date(tmp);
            } else if (header === 'amount') {
                obj[header] = Number(tmp);
            } else if (header === 'trans_id') {
                obj[header] = tmp;
            } else if (header === 'user_id') {
                obj[header] = tmp;
            }
        }
        objArr.push(obj);
    }
     //console.log(objArr);
    // console.log(objArr.length);

    //insert to database

    Transaction.create(objArr, (err) => {
    if (err) {
        console.log(err);
    }
    console.log("finishing import csv");
    });
});


// Transaction.create({
//     trans_id: "1",
//     user_id: "1",
//     name: "Comcast",
//     amount: 66.41,
//     date: new Date("2018-08-08T07:00:00.000Z"),
// }, function (err, transaction) {
//     if (err) {
//         console.log(err)
//     }
//     console.log(transaction);
// });



// for (let user of users) {
//     Transaction.distinct('company_name')
//         .then(companies => {
//             companies.sort((a, b) => {
//                 var x = a < b ? -1 : 1;
//                 return x;
//             });
//             return new Promise((resolve, reject) => {
//                 let objArr = [];
//                 for (let i = 0; i < companies.length; i++) {
//                     Transaction.find({
//                         user_id: user,
//                         company_name: companies[i],
//                         is_recurring: true
//                     }, null, {sort: {date: -1}})
//                         .then(transactions => {
//                             let obj = null;
//                             if (transactions.length > 0) {
//                                 //console.log(transactions[0].company_name);
//                                 let first_ele = transactions[0];
//                                 let newDate = new Date(Number(first_ele.date) + first_ele.period * (1000 * 3600 * 24));
//                                 //console.log(first_ele.name + " " + newDate);
//                                 let newAmount = first_ele.avg_amount;
//                                 //console.log(newAmount);
//                                 obj = {
//                                     name: first_ele.name,
//                                     //user_id: first_ele.user_id,
//                                     //next_amt: newAmount,
//                                     //next_date: newDate,
//                                     //transactions: transactions
//                                 };
//                             }
//                             if (obj) {
//                                 objArr.push(obj);
//                             }
//                             if (i === companies.length - 1) {
//                                 resolve(objArr);
//                             }
//                         })
//                 }
//             })
//
//         })
//         .then(objArr => {
//             console.log(objArr);
//         })
// }