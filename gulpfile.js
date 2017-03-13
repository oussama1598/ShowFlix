const gulp = require('gulp');
const sass = require('gulp-sass');
const csso = require('gulp-csso');
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');
const livereload = require('gulp-livereload');
const pump = require('pump');
const htmlmin = require('gulp-htmlmin');

// --- Basic Tasks ---
gulp.task('css', () => {
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

gulp.task('js', cb => {
    pump([
        gulp.src('app/src/js/**/*.js'),
        uglify(),
        concat('app.min.js'),
        gulp.dest('app/dist/js'),
        livereload()
    ], cb);
});

gulp.task('html', cb => {
    pump([
        gulp.src('app/src/views/*.html'),
        htmlmin({ collapseWhitespace: true }),
        gulp.dest('app/views'),
        livereload(true)
    ], cb);
});

gulp.task('watch', () => {
    livereload.listen();
    gulp.watch('app/src/css/*.sass', ['css']);
    gulp.watch('app/src/js/**/*.js', ['js']);
    gulp.watch('app/src/views/*.html', ['html']);
});

// Default Task
gulp.task('default', ['js', 'css', 'html', 'watch']);
