module.exports = (function () {
    var express = require('express');        // call express
    // define our app using express
    var config = require('../config.js');
    var r = require('rethinkdb');
    var co = require('co');
    var fs = require('fs');
    var im = require('imagemagick');
    var easyimage = require('easyimage');

  
    var router = express.Router();
    function decodeBase64Image(dataString) {
        var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
            response = {};
        
        if (matches.length !== 3) {
            return new Error('Invalid input string');
        }
        
        response.type = matches[1];
        response.data = new Buffer(matches[2], 'base64');
        
        return response;
    }
    router.use(function (req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
        r.connect({ host: config.rethinkdb_host, port: config.rethinkdb_port }, function (err, conn) {
            
            if (err)
                throw err;
            
            req.db_connection = conn;
            next();
        });
        
    });
    router.route('/init')
    .get(
        
        function (req, res, next) {
            var tempRes = {};
            var async = require('async');
            async.parallel(
                [
                    function (callback) {
                        r.db('imagePocket')
                        .table('pages')
                        .run(req.db_connection, function (err, cursor) {
                            if (err) {
                                res.send(err);
                                callback();
                                return;
                            }
                            cursor.toArray(function (err, result) {
                                
                                if (err) {
                                    res.send(err);
                                }
                                else {
                                    tempRes.pages = result;
                                }
                                
                                callback();

                            });

                        });
                    },
                    function (callback) {
                        r.db('imagePocket')
                        .table('tags')
                        .run(req.db_connection, function (err, cursor) {
                            if (err) {
                                res.send(err);
                                callback();
                                return;
                            }
                            cursor.toArray(function (err, result) {
                                
                                if (err) {
                                    res.send(err);
                                }
                                else {
                                    tempRes.tags = result;
                                }
                                
                                callback();

                            });

                        });
                    }
                ],
            function () {
                    res.json(tempRes);
                    next();
                }
            );
        }
    );
    router.route('/filters')
        .get(function (req, res, next) {
        
        var arr = req.query.filters;
        if (!arr) {
            r.db('imagePocket')
                .table('pages')
                .pluck('id')
                .run(req.db_connection, function (err, cursor) {
                if (err) {
                    res.send(err);
                    next();
                }
                cursor.toArray(function (err, result) {
                    
                    if (err) {
                        res.send(err);
                        next();
                    }
                    res.json(result);
                    next();
                });
            });

        }
        else {
            r.db('imagePocket')
                    .table('tags_pages_connection')
                    .filter(function (doc) {
                return r.expr(arr).contains(doc('tag_id'));
            })
            .map(function (val) { return { id: val('paste_id') }; })
            .run(req.db_connection, function (err, cursor) {
                if (err) {
                    res.send(err);
                    next();
                }
                cursor.toArray(function (err, result) {
                    
                    if (err) {
                        res.send(err);
                        next();
                    }
                    res.json(result);
                    next();
                });
            });
        }
        
        
        
        
    });
    router.route('/pages')
    .post(function (req, res, next) {
        
        
        var bitmap = new Buffer(req.body.data.replace(/^data:;base64,/, ''), 'base64');
        var bitmapImage = decodeBase64Image(req.body.screenshot).data;
        var filename = config.pagesPath + req.body.name;
        // write buffer to file
        fs.writeFileSync(filename + ".mht", bitmap);
        fs.writeFileSync(filename + ".png", bitmapImage);
        easyimage.thumbnail({ src: filename + ".png", dst: filename + "_prev.png", width: 300, height: 150 })
        .done(function () {
                var tags = req.body.tags.split(',');
                for (var i = 0; i < tags.length; ++i) {
                    tags[i] = tags[i].trim();
                }
                r.db('imagePocket')
            .table('pages')
            .insert({ name: req.body.name, file: req.body.name + ".mht", preview: req.body.name + "_prev.png", date: new Date() })
            .run(req.db_connection, function (err, result1) {
                    r.db('imagePocket')
                .table('tags')
                .insert(
                        r.expr(tags)
                    .filter(function (item) {
                            return item.ne("");
                        })
                    .filter(r.db('imagePocket')
                        .table('tags').
                        getAll(r.row, { index : 'name' })
                        .count()
                        .eq(0))
                        .map({ name: r.row })
                    )
                .run(req.db_connection, function (err, result2) {
                        r.db('imagePocket')
                    .table("tags_pages_connection")
                    .insert(
                            r.db('imagePocket')
                            .table('tags')
                            .getAll(r.args(tags), { index: 'name' })
                            .map({ tag_id: r.row('id'), paste_id: result1.generated_keys[0] })
                        )
                    .run(req.db_connection, function (result) {
                            res.status(200).end();
                            next();
                        }
                        );
                    }
                    );
      

                });
        });
      
    }
    )
    .get(function (req, res, next) {
        
        
        r.db('imagePocket')
        .table('pages')
        .run(req.db_connection, function (err, cursor) {
            if (err) {
                res.send(err);
                next();
            }
            
            cursor.toArray(function (err, result) {
                
                if (err) {
                    res.send(err);
                }
                else {
                    
                    res.json(result);
                }
                next();

            });

        });


    });
    
    
    
    

    
    
    
    
    
    router.use(function (req, res, next) {
        req.db_connection.close();
    }
    );
    return router;
})();