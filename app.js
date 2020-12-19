require('dotenv').config();

// Require
const express = require('express');
const methodOverride = require('method-override');
const expressSanitizer = require('express-sanitizer');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const requestIp = require('request-ip');

// Require routes
const authorizationRoutes = require('./routes/authorization');
const projectRoutes = require('./routes/project');
const userRoutes = require('./routes/userModify');
const convertedQueryRoutes = require('./routes/convertedQuery');
const searchQueryRoutes = require('./routes/searchQuery');
const publicationRoutes = require('./routes/publication');
const userProjectRequestRoutes = require('./routes/userProjectRequest');

// Application Setup
const app = express();
const serverPort = 3030;
const serverUrl = 'localhost';

// App Configurations
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(expressSanitizer());
app.use(methodOverride('_method'));
app.use(cors());
app.use(express.json());
app.use(requestIp.mw());

// Multer Configurations to upload file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads');
  },
  filename: function (req, file, cb) {
    cb(null, 'file.txt');
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, callback) {
    const ext = path.extname(file.originalname);
    if (ext !== '.txt') {
      return callback(new Error('Only text files are allowed'));
    }
    callback(null, true);
  }
}).single('txtFile');

// Routes

// Index Route
app.get('/', async function (req, res) {
  res.status(200).send('Hi from rubus-backend');
});

// Authentication routes
app.use(authorizationRoutes);

// user routes
app.use(userRoutes);

// Project routes
app.use(projectRoutes);

// Converted Query routes
app.use(convertedQueryRoutes);

// Search Query routes
app.use(searchQueryRoutes);

// Publication routes
app.use(publicationRoutes);

// User project requests routes
app.use(userProjectRequestRoutes);

// Upload a new file
app.post('/uploadFile', function (req, res) {
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
app.get('*', function (req, res) {
  res.render('notFound');
});

// Start server on specified url and port
app.listen(serverPort, serverUrl, function () {
  console.log('Application started successfully...');
  console.log(`Server can be accessed on http://${serverUrl}:${serverPort}`);
});
