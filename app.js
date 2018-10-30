const express      = require("express"),
      mongoose     = require("mongoose"),
      bodyParser   = require("body-parser"),
      helper       = require("./helper"),
      timeout      = require('connect-timeout');

const app = express();

const PORT = 1984;

mongoose.connect('mongodb://localhost:27017/interview_challenge', {useNewUrlParser: true});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(timeout('10s'));


//upsert
app.post('/', (req, res) => {
    let transactions = req.body;
    if (!transactions || transactions.length === 0) {
        return;
    }
        helper.upsertDB(transactions);
        setTimeout(helper.sinceLast, 1000);
        setTimeout(helper.findRecurring, 2000);

});

//get
app.get('/', (req, res) => {
    console.log("get request send....");
    helper.getResult(req, res);
});



app.listen(PORT, () => {
    console.log(`server starting on port ${PORT}`);
});
