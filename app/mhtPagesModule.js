module.exports = (function () {
    var express = require('express');        // call express
    // define our app using express
    var config = require('../config.js');
    var r = require('rethinkdb');
    var co = require('co');
    var fs = require('fs');
    
    var router = express.Router();
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
    router.route('/pages')
    .post(function (req, res, next) {
        
        
        var bitmap = new Buffer(req.body.data.replace(/^data:;base64,/, ''), 'base64');
        var filename = config.pagesPath + req.body.name + ".mht";
        // write buffer to file
        fs.writeFileSync(filename, bitmap);
        var tags = req.body.tags.split(',');
        for (var i = 0; i < tags.length; ++i) {
            tags[i] = tags[i].trim();
        }
        r.db('imagePocket')
        .table('pages')
        .insert({ name: req.body.name, file: req.body.name + ".mht", date: new Date() })
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