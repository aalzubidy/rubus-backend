require('dotenv').config();

// SuperTokens
const { verifySession } = require('supertokens-node/recipe/session/framework/express');
const supertokens = require('supertokens-node');
const Session = require('supertokens-node/recipe/session');
const EmailPassword = require('supertokens-node/recipe/emailpassword');
const { middleware: stMiddleware } = require('supertokens-node/framework/express');
const { errorHandler: stErrorHandler } = require('supertokens-node/framework/express');

// Require
const express = require('express');
const methodOverride = require('method-override');
const expressSanitizer = require('express-sanitizer');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const requestIp = require('request-ip');
const cookieParser = require('cookie-parser');
const { logger } = require('./utils/logger');
const { routesLogger } = require('./utils/routesLogger');
const { signUpHandler, signInHandler } = require('./utils/superTokens');

// Require routes
const projectRoutes = require('./routes/project');
const userRoutes = require('./routes/userModify');
const convertedQueryRoutes = require('./routes/convertedQuery');
const searchQueryRoutes = require('./routes/searchQuery');
const publicationRoutes = require('./routes/publication');
const userProjectRequestRoutes = require('./routes/userProjectRequest');
const dbRoutes = require('./routes/db');

// SuperTokens Setup
supertokens.init({
  framework: 'express',
  supertokens: {
    // These are the connection details of the app you created on supertokens.com
    connectionURI: process.env.RUBUS_ST_CONNECTION_URI,
    apiKey: process.env.RUBUS_ST_API_KEY,
  },
  appInfo: {
    // learn more about this on https://supertokens.com/docs/session/appinfo
    appName: 'rubus',
    apiDomain: process.env.RUBUS_SERVER_URI,
    websiteDomain: process.env.RUBUS_FRONTEND_URI,
    apiBasePath: '/auth',
    websiteBasePath: '/auth',
  },
  recipeList: [
    EmailPassword.init({
      signUpFeature: {
        formFields: [{
          id: 'name'
        }, {
          id: 'organization'
        }]
      },
      override: {
        apis: (originalImplementation) => {
          return {
            ...originalImplementation,
            signUpPOST: async function (input) {
              // await supertokens.deleteUser('2c0e2633-92a9-4105-a9e4-3bd3b3a9157d');

              if (originalImplementation.signUpPOST === undefined) {
                throw Error('Should never come here');
              }

              // First we call the original implementation of signUpPOST.
              const response = await originalImplementation.signUpPOST(input);

              // Post sign up response, we check if it was successful
              if (response.status === 'OK') {
                const { id } = response.user;

                // // These are the input form fields values that the user used while signing up
                const formFields = input.formFields;

                await signUpHandler(id, formFields);

                // await supertokens.deleteUser(id);
              }
              return response;
            },
            signInPOST: async function (input) {
              if (originalImplementation.signInPOST === undefined) {
                throw Error('Should never come here');
              }

              // First we call the original implementation of signInPOST.
              const response = await originalImplementation.signInPOST(input);

              // Post sign up response, we check if it was successful
              if (response.status === 'OK') {
                const { id } = response.user;

                await signInHandler(id);
              }
              return response;
            }
          };
        }
      }
    }), // initializes signin / sign up features
    Session.init() // initializes session features
  ]
});

// Application Setup
const app = express();
const serverUrl = process.env.RUBUS_SERVER_URL;
const serverPort = process.env.RUBUS_SERVER_PORT;

// App Configurations
app.use(cors({ credentials: true, origin: process.env.RUBUS_FRONTEND_URI, allowedHeaders: ['content-type', ...supertokens.getAllCORSHeaders()] }));
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(expressSanitizer());
app.use(methodOverride('_method'));
app.use(express.json());
app.use(requestIp.mw());
app.use(cookieParser());
app.use(routesLogger);
app.use(stMiddleware());

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
  res.render('index');
});

// Get session's user id
app.get('/auth/sessionUserId', verifySession(), async (req, res) => {
  const userId = req.session?.getUserId();
  res.send({
    userId
  });
});

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

// DB routes
app.use(dbRoutes);

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

// Add this AFTER all your routes
app.use(stErrorHandler());

// Start server on specified url and port
app.listen(serverPort, serverUrl, function () {
  logger.info('Application started successfully...');
  logger.info(`Server can be accessed on http://${serverUrl}:${serverPort}`);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(reason);
  logger.error(promise);
});

process.on('uncaughtException', (reason) => {
  logger.error(reason);
});
