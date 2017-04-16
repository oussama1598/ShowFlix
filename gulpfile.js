const gulp = require('gulp');
const pump = require('pump');
const browserify = require('browserify');
const babelify = require('babelify');
const vinylSourceStream = require('vinyl-source-stream');
const vinylBuffer = require('vinyl-buffer');
const path = require('path');

const plugins = require('gulp-load-plugins')();

// --- Basic Tasks ---
gulp.task('css', () => {
  pump([
    gulp.src('app/src/css/*.sass'),
    plugins.sass({
      includePaths: ['app/src/css/assets'],
      errLogToConsole: true,
    }),
    plugins.csso(),
    gulp.dest('app/dist/css'),
    plugins.livereload(),
  ]);
});

gulp.task('js', () => {
  const sources = browserify({
      entries: './app/src/js/app.js',
      debug: true, // Build source maps
    })
    .transform(babelify.configure({
      presets: ['es2015'],
    }));

  return sources.bundle()
    .pipe(vinylSourceStream('app.min.js'))
    .pipe(vinylBuffer())
    .pipe(plugins.sourcemaps.init({
      loadMaps: true, // Load the sourcemaps browserify already generated
    }))
    .pipe(plugins.ngAnnotate())
    .pipe(plugins.uglify())
    .pipe(plugins.sourcemaps.write('./', {
      includeContent: true,
    }))
    .pipe(gulp.dest('app/dist/js'))
    .pipe(plugins.livereload());
});

gulp.task('html', (cb) => {
  pump([
    gulp.src('app/src/views/*.html'),
    plugins.htmlmin({
      collapseWhitespace: true,
    }),
    gulp.dest('app/views'),
    plugins.livereload(true),
  ], cb);
});

gulp.task('bower', () => {
  gulp.src('./app/src/index.html')
    .pipe(plugins.wiredep({
      fileTypes: {
        html: {
          block: /(([ \t]*)<!--\s*bower:*(\S*)\s*-->)(\n|\r|.)*?(<!--\s*endbower\s*-->)/gi,
          detect: {
            js: /<script.*src=['"]([^'"]+)/gi,
            css: /<link.*href=['"]([^'"]+)/gi,
          },
          replace: {
            js: filePath => `<script src="${path.join('dir', filePath)}"></script>`,
            css: filePath => `<link rel="stylesheet" href="${path.join('dir', filePath)}" />`,
          },
        },
      },
    }))
    .pipe(gulp.dest('./app'));
});

gulp.task('usemin', () => gulp.src('./app/index.html')
  .pipe(plugins.usemin({
    css: [plugins.rev()],
    js: [plugins.uglify(), plugins.rev()],
  }))
  .pipe(gulp.dest('./app')));

gulp.task('watch', () => {
  plugins.livereload.listen();
  gulp.watch('app/src/css/*.sass', ['css']);
  gulp.watch('app/src/js/**/*.js', ['js']);
  gulp.watch('app/src/views/*.html', ['html']);
});


// Default Task
gulp.task('default', ['js', 'css', 'html', 'watch']);
