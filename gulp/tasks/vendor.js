var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var libs = require('../utils/libs.js').libs;
var deamdify = require('deamdify');

module.exports = function() {

  gulp.task('vendor', function() {
    var opts = {
      debug: true
    }

    var bundle = browserify(opts)
      .transform({global: true}, deamdify);

    libs.forEach(function(lib) {
      bundle.require(lib)
    })

    return bundle
      .transform({global: true}, deamdify)
      .bundle()
      .pipe(source('vendor.js'))
      .pipe(gulp.dest('./build/scripts'));
  })

}
