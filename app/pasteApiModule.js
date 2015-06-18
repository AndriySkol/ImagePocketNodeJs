module.exports = (function () {
    
    var express = require('express');        // call express
    // define our app using express
    var config = require('../config.js');
    var r = require('rethinkdb');
    var co = require('co');
    
      
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
    router.route('/pastes').get(function (req, res, next) {
        
        
        r.db('imagePocket')
        .table('pastes')
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


    })
    .post(function (req, res, next) {

        var tags = req.body.tags.split(',');
        for (var i = 0; i < tags.length; ++i) {
            tags[i] = tags[i].trim();
        }
        r.db('imagePocket')
        .table('pastes')
        .insert({ name: req.body.name, data: req.body.data, date: new Date() })
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
                    .map({name: r.row})
            )
            .run(req.db_connection, function (err, result2) {
                r.db('imagePocket')
                .table("tags_pastes_connection")
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
    );
    router.route('/init')
    .get(
        
            function (req, res, next) {
            var tempRes = {};
            var async = require('async');
            async.parallel(
                [
                    function (callback) {
                        r.db('imagePocket')
                        .table('pastes')
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
                                    tempRes.pastes = result;
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
    router.route('/pastes/:id')
        .get(function (req, res, next) {
        
        r.db('imagePocket')
            .table('pastes')
            .get(req.params.id)
            .run(req.db_connection, function (err, result) {
            
            if (err || !result) {
                res.send("");
              
            }
            else {   
                res.send(result.data);
            }
            next();
        });
    })
    .delete(function (req, res, next) {
        r.db('imagePocket')
            .table('pastes')
            .get(req.params.id)
            .delete()
            .run(req.db_connection, function (err, result) {
            
            if (err) {
                res.send(err);
                next();
                
            }
            else {
                r.db('imagePocket')
                .table("tags_pastes_connection")
                .getAll(req.params.id, { index: 'paste_id' })
                .delete()
                .run(req.db_connection, function (err, result) {
                    deleteNotUsed(req, res, next);
                    res.json({ message: 'Successfully deleted' });
                });

                
            }
            
        });
    })

    .put(function (req, res, next) {
 
        r.db('imagePocket')
                .table('pastes')
                .get(req.params.id)
                .update(req.body)
                .run(req.db_connection, function (err, result) {
        
            if (err) {
                res.send(err);
                
            }
            else {
                res.json({ message: 'Successfully updated' });
            }
            next();
        });
    });




    
    
    function insertPasteTagConnection(pasteId, tagId, conn)
    {
        return r.db('imagePocket').table('tags_pastes_connection')
                        .insert({ paste_id : pasteId, tag_id: tagId }, { conflict : 'replace' })
                        .run(conn);
    }
    
    router.route('/updateTagPaste/:id')
        .post(co.wrap(function* (req, res, next) {
        var arr = req.body;
        var x;
        
        for (var i = 0; i < arr.length; ++i) {
            if (arr[i].id) {
                var checkAlreadyExists =  yield r.db('imagePocket').table('tags')
                .get(arr[i].id)
                .run(req.db_connection); 
              
                if (checkAlreadyExists) {
                   
                    var checkerForConn = yield r.db('imagePocket')
                    .table("tags_pastes_connection")
                    .getAll([checkAlreadyExists.id, req.params.id], { index: "connection" })
                    .count()
                    .run(req.db_connection);
                    if (checkerForConn == 0) {
                         x = yield insertPasteTagConnection(req.params.id, arr[i].id, req.db_connection);
                    }
                }
                else {
                    var insertResult = yield r.db('imagePocket').table('tags')
                    .insert({ name: req.body.name })
                    .run(req.db_connection);
                    yield insertPasteTagConnection(req.params.id, insertResult.generated_keys[0], req.db_connection);
                      
                    
                   
                }
            }
            else {
                var insertResult = yield r.db('imagePocket').table('tags')
                    .insert({ name: arr[i].name })
                    .run(req.db_connection);
                yield insertPasteTagConnection(req.params.id, insertResult.generated_keys[0], req.db_connection);
            }
        }
        res.send("request was received");
        next();

        }
    ));
    router.route('/tags')
            .get(function (req, res, next) {
                r.db('imagePocket').table('tags').run(req.db_connection, function(err, cursor) {
                    if (err) {
                        res.send(err);
                        next();
                    }
                    cursor.toArray(function(err, result) {

                    if (err) {
                        res.send(err);
                    }
                    else {
                        res.json(result);
                    }
                    next();

                });
                ;
          });
    });
    router.route("/tags/names")
    .get(function (req, res, next) {
        r.db('imagePocket').table('tags').map(function (item) {
            return item("name");
        })
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
    router.route("/tagsToPaste")
        .get(function (req, res, next) {
        var id = req.query.id;
        if (id) {
r.db('imagePocket')
.table('tags_pastes_connection')
            .getAll(id, { index: 'paste_id' })
            .eqJoin("tag_id", r.db('imagePocket').table('tags'))
            .zip()
            .pluck('id', 'name')
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

        }
        else {
            res.sendStatus(404);
        }
    });
    router.route('/filters')
        .get(function (req, res, next) {
        
        var arr = req.query.filters;
        if (!arr) {
            r.db('imagePocket')
                .table('pastes')
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
                    .table('tags_pastes_connection')
                    .filter(function (doc) {
                return r.expr(arr).contains(doc('tag_id'));
            })
            .map(function(val) { return { id: val('paste_id') };})
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
    router.route("/tagsByPaste/:id")
    .get(function (req, res, next) {
        var arr = req.query.filters;
        if (!arr) {
            r.db('imagePocket')
                .table('tags_pastes_connection')
                .pluck('paste_id')
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

        }
        else {
            res.status(404).end();
            next();
        }
    }
     
    );
    router.route("/deleteTagConnections")
    .post(function (req, res, next) {
     
        r.db('imagePocket')
        .table('tags_pastes_connection')
        .getAll(r.args(req.body), { index : 'tag_id' })
        .delete()
        .run(req.db_connection, function (result) {
          
            deleteNotUsed(req, res, next)
        });
    }
    );
    router.use(function (req, res, next) {
        req.db_connection.close();
    }
    );
    function deleteNotUsed(req, res, next)
    {
        r.db("imagePocket")
        .table('tags')
        .filter(function (row) {
            
            return r.db("imagePocket")
            .table('tags_pastes_connection')
            .getAll(row('id'), { index : 'tag_id' })
            .count()
            .eq(0);

        })
        .delete()
        .run(req.db_connection,
            function (result) {
            res.status(200).end();
            next();
        });


    }

                        
                     
       return router;

})();