/**
 * Part of the Hybse Depot Wallet package.
 *
 * This file describes the ROUTES of the NodeJS
 * server in `server.js`.
 *
 * Basically only one route is defined that will
 * serve the Wallet's build/start.html file (and
 * subsequent build/ files requests).
 *
 * @package    Hybse Depot Wallet
 * @subpackage NodeJS Server
 * @version    1.3.0
 * @author     ABV Developers <abvdevelopers@protonmail.com>
 * @copyright  (c) 2015-2016, ABV
 */

var _mg_depotwallet_APIKEY = process.env.MG_APIKEY || "";
var _mg_depotwallet_DOMAIN = process.env.MG_DOMAIN || "";
var _s2g_depotwallet_UNAME = "dim.depotwallet@protonmail.com";
var _s2g_depotwallet_PWORD = "l9Yh92BDsBi2";
var _s2g_depotwallet_HOST = "mail.smtp2go.com";
var _s2g_depotwallet_PORT = 465;

var validator = require("validator");
var nodemailer = require('nodemailer');

module.exports = function(app, environment) {

    app.get('/favicon.ico', function(req, res) {
        res.sendFile(__dirname + '/build/favicon.ico');
    });

    app.get('/robots.txt', function(req, res) {
        res.sendFile(__dirname + '/robots.txt');
    });

    /**
     * Serve static resources files. Only if available.
     */
    app.get('/resources/:file', function(req, res) {
        if (! fs.fileExistsSync(__dirname + '/resources/' + req.params.file)
            || ! req.params.file.match(/^[a-z0-9\-\._]+/i)) {
            res.status(404).send(JSON.stringify({ "status": "error", "message": "File not found." }));
        }

        res.sendFile(__dirname + '/resources/' + req.params.file);
    });

    app.post("/vip/subscribe", function(req, res) {
        res.setHeader('Content-Type', 'application/json');

        var email = validator.normalizeEmail(req.body.email);
        console.log("[DEBUG] Now sending VIP Wallet Subscription mail to: " + email);

        if (!validator.isEmail(email)) {
            return res.status(403).send(JSON.stringify({ "status": "error", "message": "Incorrect email provided." }));
        }

        var smtp = {
            username: _s2g_depotwallet_UNAME,
            password: _s2g_depotwallet_PWORD,
            host: _s2g_depotwallet_HOST,
            port: _s2g_depotwallet_PORT
        };

        var transporter = nodemailer.createTransport({
            host: smtp.host,
            port: smtp.port,
            secure: true,
            auth: {
                user: smtp.username,
                pass: smtp.password
            },
            logger: false,
            debug: false 
        }, {
            from: 'Team Depotwallet <support@depotwallet.com>',
            headers: {}
        });

        var message = {
            to: email,
            subject: 'VIP Wallet (Auto response e-mail)',
            text: 'Your request has been sent! A representative will contact you shortly with further information about your wallet. Thank you for contacting DEPOTWALLET!',
            html: 'Your request has been sent!<br />A representative will contact you shortly with further information about your wallet.<br />Thank you for contacting DEPOTWALLET!'
        };

        var supportMsg = {
            to: 'support@depotwallet.com',
            subject: 'VIP Wallet Subscription',
            text: 'VIP Wallet Subscription from E-Mail: ' + email + '.',
            html: 'VIP Wallet Subscription from E-Mail: ' + email + '.'
        };

        transporter.sendMail(message, function(error, info) {
        transporter.sendMail(supportMsg, function(error2, info2) {
            transporter.close();

            if (error) {
                console.log("[ERROR] SMTP2Go Send Error: " + error);
                return res.status(500).send(JSON.stringify({ "status": "error", "message": "An error occured." }));
            }

            return res.status(200).send(JSON.stringify({ "status": "ok" }));
        });
        });
    });

    app.post("/vip/subscribe/mailgun", function(req, res) {
        res.setHeader('Content-Type', 'application/json');

        if (!_mg_depotwallet_APIKEY.length || !_mg_depotwallet_DOMAIN.length) {
            return res.status(501).send(JSON.stringify({ "status": "error", "message": "Mailer currently not available." }));
        }

        var email = validator.normalizeEmail(req.body.email);

        console.log("[DEBUG] Now sending mail to: " + email + " using Mailgun domain: " + _mg_depotwallet_DOMAIN);

        if (!validator.isEmail(email)) {
            return res.status(403).send(JSON.stringify({ "status": "error", "message": "Incorrect email provided." }));
        }

        var mailgun = require("mailgun-js")({ apiKey: _mg_depotwallet_APIKEY, domain: _mg_depotwallet_DOMAIN });
        var composer = require("mailcomposer");

        var mail = composer({
            from: 'Team Depotwallet <info@depotwallet.com>',
            to: email,
            subject: 'VIP Wallet (Auto response e-mail)',
            text: 'Your request has been sent! A representative will contact you shortly with further information about your wallet. Thank you for contacting DEPOTWALLET!',
            html: 'Your request has been sent!<br />A representative will contact you shortly with further information about your wallet.<br />Thank you for contacting DEPOTWALLET!'
        });

        mail.build(function(cError, message) {
            var data = {
                to: email,
                message: message.toString("ascii")
            };

            mailgun.messages().sendMime(data, function(sError, body) {
                if (sError) {
                    console.log("Mailgun Send Error: " + sError);
                    return res.status(500).send(JSON.stringify({ "status": "error", "message": "An error occured." }));
                }

                return res.status(200).send(JSON.stringify({ "status": "ok" }));
            });
        });
    });

    // =====================================
    // Serve the Wallet built HTML ========
    // =====================================
    app.get('/', function(req, res) {
        //console.log("[DEBUG] __dirname is " + __dirname);
        res.sendFile(__dirname + '/build/start.html');
    });

    // =====================================
    // 404 Route ===========================
    // =====================================
    app.get('*', function(req, res) {
        res.redirect('/');
    });

}