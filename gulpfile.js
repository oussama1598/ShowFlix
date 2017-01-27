var gulp = require('gulp'),
    sass = require('gulp-sass'),
    csso = require('gulp-csso'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    livereload = require('gulp-livereload'),
    pump = require('pump'),
    obfuscate = require('gulp-obfuscate');


// --- Basic Tasks ---
gulp.task('css', function() {
    pump([
        gulp.src('app/src/css/*.sass'),
        sass({
            includePaths: ['app/src/css/assets'],
            errLogToConsole: true
        }),
        csso(),
        gulp.dest('app/dist/css'),
        livereload()
    ]);
});

gulp.task('js', function(cb) {
    pump([
        gulp.src('app/src/js/**/*.js'),
        uglify(),
        concat('app.min.js'),
        gulp.dest('app/dist/js'),
        livereload()
    ], cb);
});

gulp.task('html', function(cb) {
    pump([
        gulp.src('app/views/*.html'),
        livereload(true)
    ], cb);
});

gulp.task('watch', function() {
    livereload.listen();
    gulp.watch('app/src/css/*.sass', ['css']);
    gulp.watch('app/src/js/**/*.js', ['js']);
    gulp.watch('app/views/*.html', ['html']);
});

// Default Task
gulp.task('default', ['js', 'css', 'watch']);
