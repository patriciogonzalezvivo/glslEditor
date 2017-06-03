'use strict';

var gulp = require('gulp');
// var gutil = require('gulp-util');
var derequire = require('gulp-derequire');
var livereload = require('gulp-livereload');
var plumber = require('gulp-plumber');
var sourcemaps = require('gulp-sourcemaps');
var electron = require('electron-connect').server.create();

var paths = {
    styles: 'src/css/**/*.css',
    scripts: 'src/js/**/*.js'
};

// Build stylesheets
gulp.task('css', function () {
    var postcss = require('gulp-postcss');
    var autoprefixer = require('autoprefixer');
    var cssimport = require('postcss-import');
    var nested = require('postcss-nested');
    var customProperties = require('postcss-custom-properties');
    var colorHexAlpha = require('postcss-color-hex-alpha');
    var csswring = require('csswring');
    var reporter = require('postcss-reporter');

    var plugins = [
        cssimport,
        nested,
        customProperties(),
        colorHexAlpha(),
        autoprefixer({ browsers: ['last 2 versions', 'IE >= 11'] }),
        // preserveHacks is true because NOT preserving them doesn't mean
        // delete the hack, it means turn it into real CSS. Which is not
        // what we want!
        csswring({ removeAllComments: true, preserveHacks: true }),
        reporter()
    ];

    return gulp.src('./src/css/glslEditor.css')
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(postcss(plugins))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./build'))
        .pipe(livereload());
});

// Build Javascripts
gulp.task('js', function () {
    var browserify = require('browserify');
    var shim = require('browserify-shim');
    var babelify = require('babelify');
    var source = require('vinyl-source-stream');
    var buffer = require('vinyl-buffer');
    var uglify = require('gulp-uglify');
    var rename = require('gulp-rename');

    var bundle = browserify({
        entries: 'src/js/GlslEditor.js',
        standalone: 'GlslEditor',
        debug: true,
        transform: [
            babelify.configure({ optional: ['runtime'] }),
            shim
        ]
    });

    return bundle.bundle()
        .pipe(plumber())
        .pipe(source('glslEditor.js'))
        .pipe(derequire())
        .pipe(buffer())
        // .pipe(sourcemaps.init({ loadMaps: true }))
            // Add transformation tasks to the pipeline here.
            // .on('error', gutil.log)
        // .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./build'))
        .pipe(uglify())
        .pipe(rename({ extname: '.min.js' }))
        .pipe(gulp.dest('./build'));
});

// Rerun the task when a file changes
gulp.task('watch', function () {
    livereload.listen();
    gulp.watch(paths.styles, ['css']);
    gulp.watch(paths.scripts, ['js']);
});

gulp.task('run', function () {
    // Start browser process
    electron.start();
    // Reload browser process
    gulp.watch(['build/glslEditor.css', 'build/glslEditor.js','src/index.html'], electron.reload);
    gulp.watch(['src/main.js'], electron.restart);
});

// Build files, do not watch
gulp.task('build', ['css', 'js']);

gulp.task('electron', ['css', 'js', 'watch', 'run']);

// The default task (called when you run `gulp` from cli)
gulp.task('default', ['css', 'js', 'watch']);
