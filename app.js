'use strict';
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const port = process.env.PORT || '3002'
const stat = () => console.log(`listening on ${port}`);
const scripts = require('./scripts')

app.disable('x-powered-by')
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}))

app.listen(port, stat)

module.exports = app;
