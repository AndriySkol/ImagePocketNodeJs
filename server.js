// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
var bodyParser = require('body-parser');
var path = require('path');
var config = require('./config.js');

var async = require('async');
app.use(express.static(path.join(__dirname, 'public'))); 
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.json({ limit: '50mb' }));




var port = config.port || process.env.PORT;

app.route('/')
.get(function (req, res) {
    res.sendfile(path.join(__dirname, '/public/views/main.html'));
});
app.route('/pastes')
.get(function (req, res) {
    res.sendfile(path.join(__dirname, '/public/views/Paste.html'));
});
app.route('/pages')
.get(function (req, res) {
    res.sendfile(path.join(__dirname, '/public/views/pages.html'));
});
// set our port

// ROUTES FOR OUR API
// =============================================================================
var router = require("./app/pasteApiModule.js");
var pagesRouter = require("./app/mhtPagesModule.js")
app.use('/api', router);
app.use('/apiPages', pagesRouter);
// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);

//Create the database
var r = require('rethinkdb');
r.connect({ host: config.rethinkdb_host, port: config.rethinkdb_port }, function (err, connection) {
    var rdb;
    if (err)
        throw err;
    async.waterfall([
        function createDatabase(callback) {
          
        r.dbCreate(config.rethinkdb_name)
                .run(connection, function (err) {
                rdb = r.db(config.rethinkdb_name);
                callback();
            });
        },
        function createTable(callback) {
            //Create the table if needed.
           
            rdb.tableCreate('tags')
            .run(connection, function (err) {
                rdb.tableCreate('pastes')
                .run(connection, function (err) {
                    rdb.tableCreate('tags_pastes_connection')
                     .run(connection, function (err) {
                        callback();
                    });
                });
        
            });
        },
        function createIndex(callback) {
       
            rdb.table('tags').indexCreate('name')
            
            .run(connection, function (err) {
                rdb.table('pastes').indexCreate('name')
            
                .run(connection, function (err) {
                    rdb.table('tags_pastes_connection').indexCreate('tag_id')
                    .run(connection, function (err) {
                        rdb.table('tags_pastes_connection').indexCreate('paste_id')
                             .run(connection, function (err) {
                                rdb.table("tags_pastes_connection").indexCreate(
                                    "connection", [r.row("tag_id"), r.row("paste_id")]
                                )

                                .run(connection, function (err) {
                                     callback();
                                 });
         
                              });
                        });
         
                });
         
                
            });
         
        },
        function waitForIndex(callback) {
            //Wait for the index to be ready.
            rdb.table('tags_pastes_connection').indexWait().run(connection, function (err, result) {
                callback();
            });
        }
    ], function () {
        connection.close();
    });
    

});
