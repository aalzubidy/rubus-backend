require('dotenv').config();

// Require
const express = require("express");
const methodOverride = require("method-override");
const expressSanitizer = require("express-sanitizer");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require('path');
const cors = require("cors");
const fs = require('fs');
const main = require('./src/main.js');
const db = require('./db/db.js');
const bcrypt = require('bcrypt');
const moment = require('moment');
const requestIp = require('request-ip');

// Require routes
const authorizationRoutes = require('./routes/authorization');

// Application Setup
const app = express();
const serverPort = 3030;
const serverUrl = "localhost";

// App Configurations
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(expressSanitizer());
app.use(methodOverride("_method"));
app.use(cors());
app.use(express.json());
app.use(requestIp.mw());

// Multer Configurations to upload file
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, "file.txt");
  }
});

var upload = multer({
  storage: storage,
  fileFilter: function (req, file, callback) {
    var ext = path.extname(file.originalname);
    if (ext !== '.txt') {
      return callback(new Error('Only text files are allowed'))
    }
    callback(null, true)
  }
}).single("txtFile");

// Routes

// Index Route
app.get("/", async function (req, res) {
  console.log(await db.query('select * from testTable'));
  res.render("index");
});

// Authentication routes
app.use(authorizationRoutes);

// Upload a new file
app.post("/uploadFile", function (req, res) {
  upload(req, res, function (err) {
    if (err) {
      const errMsg = `Could not upload text file ${JSON.stringify(err)} ${err}`;
      console.log(errMsg);
      res.send(errMsg);
    } else {
      console.log('File uploaded successfully!');
      res.send('File uploaded successfully!');
    }
  });
});

//Register route
app.post('/register', async (req, res) => {
  try {
    const {
      password,
      email,
      name,
      organization
    } = req.body.user;

    //hashing the password
    const hash = await bcrypt.hash(password, 12);

    // date
    const createDate = moment().format('MM/DD/YYYY');

    //creating a user
    await db.query('INSERT INTO users(email, password, name, organization, register_ip, create_date) VALUES($1, $2, $3, $4, $5, $6)', [email, hash, name, organization, req.clientIp, createDate]);
    
    res.status(201).send('Added a user to DB');
  } catch (err) {
    const userMsg = `Could not register user ${err}`;
    console.log(userMsg);
    res.status(500).send(userMsg);
  }
});


// Not Found Route
app.get("*", function (req, res) {
  res.render("notFound");
});

// Start server on specified url and port
app.listen(serverPort, serverUrl, function () {
  console.log('Application started successfully...');
  console.log(`Server can be accessed on http://${serverUrl}:${serverPort}`);
});