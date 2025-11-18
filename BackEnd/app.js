const express = require('express')
const path = require('path')


const {db, createTable} = require('./DBclient')
const { stringify } = require('querystring')


const app = express()

app.use(express.json())

app.use(express.static(path.join(__dirname, '../')))