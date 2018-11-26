/**
 * Part of the Hybse Depot Wallet package.
 *
 * This NodeJS server can be used to server the build/
 * files on a heroku server or locally. To serve the
 * latest file you must first build:
 * $ node node_modules/gulp/bin/gulp default
 * $ node server.js
 *
 * Heroku will handle build automatically after deploy
 * given you are pushing to the master branch. You
 * can also manually deploy the application through
 * the Heroku dashboard by selecting the branch you
 * are working on. The build process is described in
 * `package.json`.
 *
 * @package    Hybse Depot Wallet
 * @subpackage NodeJS Server
 * @version    1.3.0
 * @author     ABV Developers <abvdevelopers@protonmail.com>
 * @copyright  (c) 2015-2016, ABV
 */

// Setup
var express = require('express');
var morgan = require('morgan');
var app = express();
var http = require('http');
var bodyParser = require("body-parser");
var fs = require("fs");

// Configuration
app.use(express.static("build/"));
app.use(morgan('dev')); // log every request to the console
app.use(bodyParser.urlencoded({ extended: true })); // POST API data

// Routes
var port = process.env.PORT || 4000;
var env = process.env.APP_ENV || 'development';
require('./routes.js')(app, env); // load our routes and pass in our app

/**
 * No need for HTTPS, heroku handles that automatically by creating a
 * mirror HTTPS server of our http server.
 *
 * This means we don't need to manage certificates either.
 * The application handles all route through a middleware that
 * obligates HTTPS access and the / route serves the build/start.html
 * file.
 */
http.createServer(app).listen(port, function() {
    console.log("Hybse Depot Wallet Server listening on Port %d in %s mode", this.address().port, app.settings.env);
});

console.log('Hybse NanoWallet Server is now Online');