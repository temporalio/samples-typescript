// @ts-nocheck
// #!/usr/bin/env node
var createError = require('http-errors');
var express = require('express');
// var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var app = express();
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

var port = 4000;

/** routes */
var temporalClient = require('./temporal-client');
app.get('/api/workflow', async function (req, res) {
  try {
    const result = await temporalClient.runWorkflow().catch((err) => {
      console.error(err);
      process.exit(1);
    });
    // res.send(workflow);
    res.json({ result });
  } catch (err) {
    res.status(500).send(err);
  }
});
app.get('/api/data', function (req, res) {
  setTimeout(() => {
    // artificial server delay
    res.json({ title: 'Express' });
  }, 1000);
});

/** standard error handling */
app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

app.set('port', port);

var http = require('http');
var server = http.createServer(app);
server.listen(port);
