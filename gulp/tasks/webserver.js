var gulp = require('gulp');
var connect = require('gulp-connect');

module.exports = function() {
  gulp.task('webserver', function() {
    connect.server({
      root: './',
      livereload: true
    });
  });
}