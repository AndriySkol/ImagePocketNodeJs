
(function () {
    'use strict';
    
    /* Gulp plugin includes */
    
    var gulp = require('gulp');
    var angularFileSort = require('gulp-angular-filesort');
    var bower = require('gulp-bower');
    var concat = require('gulp-concat');
    var concatCss = require('gulp-concat-css');
    var gulpFilter = require('gulp-filter');
    var gulpif = require('gulp-if');
    var jshint = require('gulp-jsh-html');
    var less = require('gulp-less');
    var uglify = require('gulp-uglify');
    var uglifycss = require('gulp-uglifycss');
    var fs = require('fs');
    var jshintStyle = require('jsh-stlsh-html');
    var mainBowerFiles = require('main-bower-files');
    var merge = require('merge-stream');
    var sourcemaps = require('gulp-sourcemaps');
    
    /* Pathing-related constants */
    
    var ngPath = 'public/client/app';
    var ngAllPath = ngPath + '/**/*.js';
    var distPath = 'public/dist';
    
    /*
        Function that sorts, concatenates and minifies (opt.) JavaScript files.
        filePath - location for JavaScript files
        outputName - name to assign to resulting file
        outputPath - path the resulting file will be copied to
        doMinify - specifies whether minification should be performed
    */

    var concatAndMinify = function (filePath, outputName, outputPath, doMinify) {
        return gulp.src(filePath)
            .pipe(gulpif(!doMinify, sourcemaps.init()))
            .pipe(angularFileSort())
            .pipe(concat(outputName))
            .pipe(gulpif(!doMinify, sourcemaps.write()))
            .pipe(gulp.dest(outputPath));
    }
    
    /* Build and minimize specific Angular JS files */    
    
    gulp.task('default', function () { });
    
    gulp.task('ng-all-concat-min', function () {
        concatAndMinify(ngAllPath, 'imagePocket-ng.min.js', distPath, true);
    });
    /* Build specific Angular JS files without minimization */
    
    gulp.task('ng-all-concat-dev', function () {
        concatAndMinify(ngAllPath, 'imagePocket-ng.min.js', distPath, false);
    });
    
    /* Build CSS libraries */
    /* TODO: fix bower install so that CSS path hacks aren't necessary. Seriously, why. */
    
    gulp.task('bower-css-concat-min', function () {
        var cssFilter = gulpFilter('*.css');
        
        var cssStream = gulp.src(mainBowerFiles())
            .pipe(cssFilter);
        
        var lessFilter = gulpFilter(['*.less']);
        
        var lessStream = gulp.src(mainBowerFiles())
            .pipe(lessFilter)
            .pipe(less());
        
        return merge(cssStream, lessStream)
            .pipe(concatCss('bower-style.min.css'))
            .pipe(uglifycss())
            .pipe(gulp.dest(distPath));
    });
    
    /* Install Bower packages */
    
    gulp.task('bower-install-packages', function () {
        return bower('./bower_components');
    });
    
    /* Concatenate and minimize all bower components (fetched from the packages' main arguments) */
    
    gulp.task('bower-js-concat-min', ['bower-install-packages'], function () {
        var jsFilter = gulpFilter('*.js');
        return gulp.src(mainBowerFiles())
            .pipe(jsFilter)
            .pipe(concat('bower-libs.min.js'))
            .pipe(uglify())
            .pipe(gulp.dest(distPath));
    });
    
    gulp.task('bower-js-concat-dev', ['bower-install-packages'], function () {
        var jsFilter = gulpFilter('*.js');
        return gulp.src(mainBowerFiles())
            .pipe(jsFilter)
            .pipe(concat('bower-libs.min.js'))
            .pipe(gulp.dest(distPath));
    });
    
    
    
    
    gulp.task('do-all',
    [
        'ng-all-concat-min',
        'bower-css-concat-min',
        'bower-js-concat-min'
    ]);
})();