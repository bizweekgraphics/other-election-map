var gulp = require('gulp');
var connect = require('gulp-connect');

module.exports = function() {
  gulp.task('html', function() {
    gulp.src(['./index.html'])
      .pipe(connect.reload());
  });  
};

