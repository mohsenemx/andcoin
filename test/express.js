const https = require('https');
const fs = require('fs');
const express = require('express');

const app = express();
app.get('/', function(req, res){
  res.send("HELLO!");
});

const server = https.createServer({
    pfx: fs.readFileSync('./certificate.pfx'),
}, app).listen(3000, function(){
  console.log("Successfully started server on port 3000");
});