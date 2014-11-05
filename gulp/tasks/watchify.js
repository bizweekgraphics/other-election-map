var gulp = require('gulp');
var source = require('vinyl-source-stream');
var watchify = require('watchify');
var browserify = require('browserify');
var connect = require('gulp-connect');

module.exports = function() {
  var opts = {
    debug: true
  }

  gulp.task('watchify', function() {
    var bundler = watchify(browserify('./src/app.js', opts));

    bundler
    .bundle()
    .pipe(source('./src/app.js'))
    .pipe(gulp.dest('./build/scripts'));

    bundler.on('update', rebundle);

    bundler.on('log', function(msg) {
      console.log(msg)
    })

    function rebundle() {
      console.log('rebundling');
      return bundler.bundle()
        .pipe(source('./src/app.js'))
        .pipe(gulp.dest('./build/scripts'))
        .pipe(connect.reload());
    }

    return rebundle();    
  });
}