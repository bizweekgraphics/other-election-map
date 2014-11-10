var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var libs = require('../utils/libs.js').libs;
var deamdify = require('deamdify');
var uglify = require('gulp-uglify');
var gStreamify = require('gulp-streamify');

module.exports = function() {

  gulp.task('vendor', function() {
    var opts = {
      debug: true
    }

    var bundle = browserify(opts)
      .transform({global: true}, deamdify)

    libs.forEach(function(lib) {
      bundle.require(lib)
    })

    return bundle
      .bundle()
      .pipe(source('vendor.js'))
      .pipe((gStreamify(uglify())))
      .pipe(gulp.dest('./public/build/scripts'))
  })

}
