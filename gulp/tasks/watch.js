var gulp = require('gulp');
var connect = require('gulp-connect');

module.exports = function() {
  
  gulp.watch(['./src/**/*.js'], ['browserify', 'jshint'])

  gulp.watch('src/**/*.scss', ['sass']);

  gulp.watch(['./index.html', 'src/**/*.html'], ['html']);

}