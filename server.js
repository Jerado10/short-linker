'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var dns = require('dns');

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))
  
// create db model
var schema = new mongoose.Schema({longUrl: 'string', shortUrlStub: 'string' });
var UrlPair = mongoose.model('UrlPair', schema);

// short stub creator
function createStub() {
  UrlPair.find({}).toArray(function(err, data) {
    if (err) console.log(err);
    const max = data.reduce(function(prev, current) {
      return (prev.shortUrlStub > current.shortUrlStub) ? prev : current
    })
    return max + 1
  });
};

// long url poster
app.post("/api/shorturl/new", function (req, res) {
  let longUrl = req.body.url;
  dns.lookup(longUrl, function(err, data) {
    if (err) {
      res.json({"error":"invalid URL"});
    } else {
      var pair = {longUrl: longUrl, shortUrlStub: createStub()}
      res.json(pair);
      var newUrlPair = new UrlPair(pair);
      newUrlPair.save(function(err, pair) {
        if (err) console.log(err);
        console.log("Pair saved: " + pair);
      })
    };
  })
  res.json({});
})

// short url redirecter
app.get("/api/shorturl/:end", function(req, res) {
  let par = req.params.end;
  UrlPair.findOne({shortUrlStub: req.params.end}, function(err, pair) {
    if (err) console.log(err);
    res.redirect(pair.longUrl);
  });
})

app.listen(port, function () {
  console.log('Node.js listening ...');
});