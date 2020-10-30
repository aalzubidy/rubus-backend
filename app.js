// Require
const express = require("express");
const methodOverride = require("method-override");
const expressSanitizer = require("express-sanitizer");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require('path');
const fs = require('fs');
const main = require('./src/main.js');

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
app.get("/", function (req, res) {
  res.render("index");
});

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

// Not Found Route
app.get("*", function (req, res) {
  res.render("notFound");
});

// Start server on specified url and port
app.listen(serverPort, serverUrl, function () {
  console.log('Application started successfully...');
  console.log(`Server can be accessed on http://${serverUrl}:${serverPort}`);
});
