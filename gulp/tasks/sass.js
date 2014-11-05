var gulp = require('gulp');
var sass = require('gulp-sass');
var connect = require('gulp-connect');

module.exports = function() {
  gulp.task('sass', function () {
    gulp.src('src/**/*.scss')
      .pipe(sass())
      .pipe(gulp.dest('./build/'))
      .pipe(connect.reload());
  });
}